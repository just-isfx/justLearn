<?php

namespace App\Models;

use App\Models\Concerns\HasContentTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    use HasFactory, HasContentTranslations;

    protected $fillable = [
        'programming_language_id',
        'title',
        'slug',
        'description',
        'thumbnail',
        'level',
        'estimated_duration',
    ];

    public function programmingLanguage(): BelongsTo
    {
        return $this->belongsTo(ProgrammingLanguage::class);
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('lesson_order');
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    /**
     * Calculate course progress for a specific user.
     * Returns the percentage of completed lessons.
     */
    public function getProgressForUser($userId): int
    {
        $totalLessons = $this->lessons()->count();

        if ($totalLessons === 0) {
            return 0;
        }

        $completedLessons = $this->lessons()
            ->whereHas('progress', function ($query) use ($userId) {
                $query->where('user_id', $userId)->whereNotNull('completed_at');
            })
            ->count();

        return (int) ceil(($completedLessons / $totalLessons) * 100);
    }

    /**
     * Get the count of lessons in this course.
     */
    public function getLessonCount(): int
    {
        return $this->lessons()->count();
    }

    /**
     * Get the count of completed lessons for a specific user.
     */
    public function getCompletedLessonsForUser($userId): int
    {
        return $this->lessons()
            ->whereHas('progress', function ($query) use ($userId) {
                $query->where('user_id', $userId)->whereNotNull('completed_at');
            })
            ->count();
    }
}
