<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonProgress extends Model
{
    use HasFactory;

    protected $table = 'lesson_progress';

    protected $fillable = [
        'user_id',
        'lesson_id',
        'progress_percentage',
        'last_score',
        'time_spent_seconds',
        'completed_at',
        'last_position',
        'last_accessed_at',
    ];

    protected $casts = [
        'progress_percentage' => 'integer',
        'last_score' => 'integer',
        'time_spent_seconds' => 'integer',
        'last_position' => 'integer',
        'completed_at' => 'datetime',
        'last_accessed_at' => 'datetime',
    ];

    /**
     * Get the user that owns this progress record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the lesson this progress is for.
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Scope to get progress for a specific user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get incomplete progress.
     */
    public function scopeIncomplete($query)
    {
        return $query->whereNull('completed_at');
    }

    /**
     * Scope to get completed progress.
     */
    public function scopeCompleted($query)
    {
        return $query->whereNotNull('completed_at');
    }

    /**
     * Check if the lesson is completed.
     */
    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    /**
     * Mark progress as complete.
     */
    public function markComplete(): void
    {
        $this->progress_percentage = 100;
        $this->completed_at = now();
        $this->save();
    }

    /**
     * Format time spent for display.
     */
    public function formattedTimeSpent(): string
    {
        $hours = intdiv($this->time_spent_seconds, 3600);
        $minutes = intdiv($this->time_spent_seconds % 3600, 60);

        if ($hours > 0) {
            return "{$hours}h {$minutes}m";
        }

        return "{$minutes}m";
    }
}
