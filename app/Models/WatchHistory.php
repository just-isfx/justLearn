<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WatchHistory extends Model
{
    use HasFactory;

    protected $table = 'watch_history';

    protected $fillable = [
        'user_id',
        'lesson_id',
        'progress_percentage',
        'time_spent_seconds',
        'last_accessed_at',
    ];

    protected $casts = [
        'progress_percentage' => 'integer',
        'time_spent_seconds' => 'integer',
        'last_accessed_at' => 'datetime',
    ];

    /**
     * Get the user that owns this history record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the lesson this history is for.
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Scope to get history for a specific user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
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
