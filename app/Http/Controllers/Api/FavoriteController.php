<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FavoriteController extends Controller
{
    // ── Shared formatting ──────────────────────────────────────────────────

    private function format(Favorite $fav): array
    {
        $item = $fav->favoritable;

        // Build item-specific display data
        $title      = $item?->title ?? '(deleted)';
        $slug       = $item?->slug  ?? null;
        $type       = $fav->itemTypeName();
        $parentName = null;
        $parentSlug = null;

        if ($type === 'lesson' && $item) {
            $parentName = $item->course?->title;
            $parentSlug = $item->course?->slug;
        } elseif ($type === 'course' && $item) {
            $parentName = $item->programmingLanguage?->name;
        } elseif ($type === 'article' && $item) {
            $parentName = $item->category?->name;
        }

        return [
            'id'           => $fav->id,
            'type'         => $type,
            'title'        => $title,
            'slug'         => $slug,
            'parent_name'  => $parentName,
            'parent_slug'  => $parentSlug,
            'created_at'   => $fav->created_at,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/favorites
    // ─────────────────────────────────────────────────────────────────────

    public function index()
    {
        $userId = Auth::id();

        $favorites = Favorite::with([
                'favoritable',
                'favoritable.course',               // Lesson → course
                'favoritable.programmingLanguage',  // Course → language
                'favoritable.category',             // Article → category
                'favoritable.course.programmingLanguage', // Lesson → course → language (not always needed but harmless)
            ])
            ->forUser($userId)
            ->orderByDesc('created_at')
            ->get();

        // Group by type
        $grouped = [
            'courses'  => [],
            'lessons'  => [],
            'articles' => [],
        ];

        foreach ($favorites as $fav) {
            $formatted = $this->format($fav);
            match ($formatted['type']) {
                'course'  => $grouped['courses'][]  = $formatted,
                'lesson'  => $grouped['lessons'][]  = $formatted,
                'article' => $grouped['articles'][] = $formatted,
                default   => null,
            };
        }

        return response()->json([
            'data'  => $favorites->map(fn ($f) => $this->format($f))->values(),
            'grouped' => $grouped,
            'total' => $favorites->count(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/favorites
    // Toggle: creates if absent, removes if present
    // ─────────────────────────────────────────────────────────────────────

    public function toggle(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:course,lesson,article'],
            'id'   => ['required', 'integer', 'min:1'],
        ]);

        $userId      = Auth::id();
        $type        = $validated['type'];
        $itemId      = (int) $validated['id'];
        $modelClass  = Favorite::resolveModelClass($type);

        // Verify the item actually exists
        if (!$modelClass::find($itemId)) {
            return response()->json(['message' => "The {$type} does not exist."], 422);
        }

        $favoritableType = $modelClass;

        // Check if already favorited
        $existing = Favorite::where('user_id', $userId)
            ->where('favoritable_type', $favoritableType)
            ->where('favoritable_id', $itemId)
            ->first();

        if ($existing) {
            // Remove
            $existing->delete();
            return response()->json([
                'favorited' => false,
                'message'   => 'Removed from favorites.',
            ]);
        }

        // Add — handle rare race-condition duplicate gracefully
        try {
            $fav = Favorite::create([
                'user_id'          => $userId,
                'favoritable_type' => $favoritableType,
                'favoritable_id'   => $itemId,
            ]);

            $fav->load([
                'favoritable',
                'favoritable.course',
                'favoritable.programmingLanguage',
                'favoritable.category',
            ]);

            return response()->json([
                'favorited' => true,
                'message'   => 'Added to favorites.',
                'favorite'  => $this->format($fav),
            ], 201);
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'favorited' => true,
                'message'   => 'Already in favorites.',
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/favorites/status
    // Check whether a specific item is favorited by the current user.
    // Query params: type, id
    // ─────────────────────────────────────────────────────────────────────

    public function status(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:course,lesson,article'],
            'id'   => ['required', 'integer', 'min:1'],
        ]);

        $modelClass = Favorite::resolveModelClass($validated['type']);
        $userId     = Auth::id();

        $favorite = Favorite::where('user_id', $userId)
            ->where('favoritable_type', $modelClass)
            ->where('favoritable_id', (int) $validated['id'])
            ->first();

        return response()->json([
            'favorited'   => $favorite !== null,
            'favorite_id' => $favorite?->id,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE /api/favorites/{favorite}
    // ─────────────────────────────────────────────────────────────────────

    public function destroy(Favorite $favorite)
    {
        if ($favorite->user_id !== Auth::id()) {
            abort(403, 'Unauthorised.');
        }

        $favorite->delete();

        return response()->json(['message' => 'Removed from favorites.']);
    }
}
