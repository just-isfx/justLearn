<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'preferred_language',
        'speech_rate',
        'theme_preference',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'speech_rate' => 'float',
        ];
    }

    /**
     * Return the user fields shared by authentication and preference responses.
     */
    public function toAuthArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role ?: 'user',
            'profile_picture_url' => $this->profile_picture_path ? Storage::url($this->profile_picture_path) : null,
            'preferred_language' => $this->preferred_language ?: config('languages.default', 'en'),
            'speech_rate' => $this->speech_rate ?? 1.0,
            'theme_preference' => in_array($this->theme_preference, ['light', 'dark'], true)
                ? $this->theme_preference
                : 'light',
        ];
    }

    /**
     * Get all lesson progress records for this user.
     */
    public function lessonProgress()
    {
        return $this->hasMany(LessonProgress::class);
    }

    /**
     * Get all watch history records for this user.
     */
    public function watchHistory()
    {
        return $this->hasMany(WatchHistory::class);
    }

    public function quizAttempts(): HasMany { return $this->hasMany(QuizAttempt::class); }
    public function achievements(): HasMany { return $this->hasMany(UserAchievement::class); }
    public function learningStreak(): HasOne { return $this->hasOne(LearningStreak::class); }
    public function notifications(): HasMany { return $this->hasMany(Notification::class); }
}
