<?php

namespace App\Models;

use App\Models\Concerns\HasContentTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    use HasFactory, HasContentTranslations;

    protected $fillable = [
        'course_id',
        'title',
        'slug',
        'description',
        'content',
        'lesson_order',
        'estimated_minutes',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    /**
     * Get all progress records for this lesson.
     */
    public function progress()
    {
        return $this->hasMany(LessonProgress::class);
    }

    /**
     * Get all watch history records for this lesson.
     */
    public function watchHistory()
    {
        return $this->hasMany(WatchHistory::class);
    }
}
