<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NoteController extends Controller
{
    // ── Allowed notable types ──────────────────────────────────────────────
    private const NOTABLE_TYPES = ['course', 'lesson', 'article'];

    // ── Shared formatting ──────────────────────────────────────────────────

    private function format(Note $note): array
    {
        return [
            'id'               => $note->id,
            'title'            => $note->title,
            'content'          => $note->content,
            'content_preview'  => mb_substr(strip_tags($note->content), 0, 150),
            'related_type'     => $note->relatedTypeName(),
            'related_id'       => $note->notable_id,
            'related_label'    => $note->relatedLabel(),
            'created_at'       => $note->created_at,
            'updated_at'       => $note->updated_at,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/notes
    // ─────────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $userId  = Auth::id();
        $search  = trim($request->get('search', ''));
        $perPage = min((int) $request->get('per_page', 20), 50);

        $query = Note::with('notable')
            ->forUser($userId)
            ->orderByDesc('updated_at');

        if ($search !== '') {
            $query->search($search);
        }

        $notes = $query->paginate($perPage);

        return response()->json([
            'data' => $notes->map(fn ($n) => $this->format($n)),
            'pagination' => [
                'current_page' => $notes->currentPage(),
                'per_page'     => $notes->perPage(),
                'total'        => $notes->total(),
                'last_page'    => $notes->lastPage(),
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/notes
    // ─────────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'content'      => ['required', 'string', 'max:10000'],
            'related_type' => ['nullable', 'string', 'in:' . implode(',', self::NOTABLE_TYPES)],
            'related_id'   => ['nullable', 'integer', 'min:1'],
        ]);

        [$notableType, $notableId] = $this->resolveNotable(
            $validated['related_type'] ?? null,
            $validated['related_id']   ?? null
        );

        $note = Note::create([
            'user_id'      => Auth::id(),
            'title'        => $validated['title'],
            'content'      => $validated['content'],
            'notable_type' => $notableType,
            'notable_id'   => $notableId,
        ]);

        $note->load('notable');

        return response()->json($this->format($note), 201);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/notes/{note}
    // ─────────────────────────────────────────────────────────────────────

    public function show(Note $note)
    {
        $this->authorise($note);
        $note->load('notable');
        return response()->json($this->format($note));
    }

    // ─────────────────────────────────────────────────────────────────────
    // PUT /api/notes/{note}
    // ─────────────────────────────────────────────────────────────────────

    public function update(Request $request, Note $note)
    {
        $this->authorise($note);

        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'content'      => ['required', 'string', 'max:10000'],
            'related_type' => ['nullable', 'string', 'in:' . implode(',', self::NOTABLE_TYPES)],
            'related_id'   => ['nullable', 'integer', 'min:1'],
        ]);

        [$notableType, $notableId] = $this->resolveNotable(
            $validated['related_type'] ?? null,
            $validated['related_id']   ?? null
        );

        $note->update([
            'title'        => $validated['title'],
            'content'      => $validated['content'],
            'notable_type' => $notableType,
            'notable_id'   => $notableId,
        ]);

        $note->load('notable');

        return response()->json($this->format($note));
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE /api/notes/{note}
    // ─────────────────────────────────────────────────────────────────────

    public function destroy(Note $note)
    {
        $this->authorise($note);
        $note->delete();
        return response()->json(['message' => 'Note deleted.']);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Abort 403 if the note does not belong to the authenticated user.
     */
    private function authorise(Note $note): void
    {
        if ($note->user_id !== Auth::id()) {
            abort(403, 'Unauthorised.');
        }
    }

    /**
     * Resolve a short type name + ID into the fully-qualified model class + ID.
     * Validates that the referenced record actually exists.
     * Returns [null, null] if no related item was supplied.
     */
    private function resolveNotable(?string $type, ?int $id): array
    {
        if (!$type || !$id) {
            return [null, null];
        }

        $modelClass = Favorite::resolveModelClass($type); // reuse helper from Favorite
        $item = $modelClass::find($id);

        if (!$item) {
            abort(422, "The referenced {$type} does not exist.");
        }

        return [$modelClass, $id];
    }
}
