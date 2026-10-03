<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Favorite extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'favoritable_type',
        'favoritable_id',
    ];

    protected $casts = [
        'favoritable_id' => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The favorited item — Course, Lesson, or LibraryArticle.
     */
    public function favoritable(): MorphTo
    {
        return $this->morphTo();
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Short readable type name used in API responses and frontend logic.
     */
    public function itemTypeName(): string
    {
        return match ($this->favoritable_type) {
            'App\\Models\\Course'         => 'course',
            'App\\Models\\Lesson'         => 'lesson',
            'App\\Models\\LibraryArticle' => 'article',
            default                        => 'unknown',
        };
    }

    /**
     * Resolve the fully-qualified model class from a short type name.
     * Throws \InvalidArgumentException for unknown types.
     */
    public static function resolveModelClass(string $type): string
    {
        return match ($type) {
            'course'  => Course::class,
            'lesson'  => Lesson::class,
            'article' => LibraryArticle::class,
            default   => throw new \InvalidArgumentException("Unknown favoritable type: {$type}"),
        };
    }
}
