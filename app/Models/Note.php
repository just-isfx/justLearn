<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Note extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'content',
        'notable_type',
        'notable_id',
    ];

    protected $casts = [
        'notable_id' => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Polymorphic relation — the course, lesson, or article this note is about.
     */
    public function notable(): MorphTo
    {
        return $this->morphTo();
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'like', '%' . $term . '%')
              ->orWhere('content', 'like', '%' . $term . '%');
        });
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Human-readable label for the related item.
     */
    public function relatedLabel(): ?string
    {
        if (!$this->notable_type || !$this->notable_id) {
            return null;
        }

        return match ($this->notable_type) {
            'App\\Models\\Course'         => $this->notable?->title,
            'App\\Models\\Lesson'         => $this->notable?->title,
            'App\\Models\\LibraryArticle' => $this->notable?->title,
            default                        => null,
        };
    }

    /**
     * Short readable type name for the API response.
     */
    public function relatedTypeName(): ?string
    {
        return match ($this->notable_type) {
            'App\\Models\\Course'         => 'course',
            'App\\Models\\Lesson'         => 'lesson',
            'App\\Models\\LibraryArticle' => 'article',
            default                        => null,
        };
    }
}
