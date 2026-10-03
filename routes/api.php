<?php

use App\Http\Controllers\Api\AiTutorController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EducationController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\LanguageController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\AchievementController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AdminController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'index']);

// Public education content routes
Route::get('/programming-languages', [EducationController::class, 'languages']);
Route::get('/programming-languages/{slug}', [EducationController::class, 'showLanguage']);
Route::get('/programming-languages/{slug}/courses', [EducationController::class, 'coursesByLanguage']);
Route::get('/courses/{slug}', [EducationController::class, 'showCourse']);
Route::get('/courses/{slug}/lessons', [EducationController::class, 'lessonsByCourse']);
Route::get('/lessons/{slug}', [EducationController::class, 'showLesson']);
Route::get('/library/categories', [EducationController::class, 'libraryCategories']);
Route::get('/library/categories/{slug}', [EducationController::class, 'showLibraryCategory']);
Route::get('/library/articles', [EducationController::class, 'libraryArticles']);
Route::get('/library/articles/{slug}', [EducationController::class, 'showLibraryArticle']);
Route::get('/library/search', [EducationController::class, 'search']);

// Auth + authenticated routes (session-based, requires web middleware for CSRF/session)
Route::middleware('web')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'sendResetLink']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth');
    Route::put('/profile', [AuthController::class, 'updateProfile'])->middleware('auth');
    Route::put('/password', [AuthController::class, 'updatePassword'])->middleware('auth');
    Route::post('/profile/picture', [AuthController::class, 'updateProfilePicture'])->middleware('auth');
    Route::delete('/profile/picture', [AuthController::class, 'deleteProfilePicture'])->middleware('auth');

    Route::middleware('auth')->group(function () {
        // Dashboard & progress
        Route::get('/my/dashboard', [DashboardController::class, 'getData']);
        Route::get('/my/history', [ProgressController::class, 'getHistory']);
        Route::get('/my/courses/{slug}/progress', [EducationController::class, 'courseProgress']);

        Route::get('/courses/{courseId}/continue', [EducationController::class, 'continueCourse']);

        Route::get('/lessons/{lessonId}/progress', [ProgressController::class, 'getProgress']);
        Route::post('/lessons/{lessonId}/progress', [ProgressController::class, 'upsertProgress']);
        Route::put('/lessons/{lessonId}/time', [ProgressController::class, 'updateTimeSpent']);
        Route::get('/lessons/{lessonId}/quiz', [QuizController::class, 'lessonQuiz']);
        Route::post('/lessons/{lessonId}/quiz/submit', [QuizController::class, 'submitLessonQuiz']);

        // Notes — full CRUD + search via ?search= query param
        Route::get('/notes', [NoteController::class, 'index']);
        Route::post('/notes', [NoteController::class, 'store']);
        Route::get('/notes/{note}', [NoteController::class, 'show']);
        Route::put('/notes/{note}', [NoteController::class, 'update']);
        Route::delete('/notes/{note}', [NoteController::class, 'destroy']);

        // Favorites
        Route::get('/favorites', [FavoriteController::class, 'index']);
        Route::post('/favorites', [FavoriteController::class, 'toggle']);
        Route::get('/favorites/status', [FavoriteController::class, 'status']);
        Route::delete('/favorites/{favorite}', [FavoriteController::class, 'destroy']);

        // AI Tutor — conversation management (no special rate limit needed)
        Route::get('/ai/conversations', [AiTutorController::class, 'listConversations']);
        Route::post('/ai/conversations', [AiTutorController::class, 'createConversation']);
        Route::get('/ai/conversations/{conversation}', [AiTutorController::class, 'showConversation']);
        Route::delete('/ai/conversations/{conversation}', [AiTutorController::class, 'deleteConversation']);

        // AI Tutor — send message (rate-limited: AI_RATE_LIMIT per minute per user)
        Route::post(
            '/ai/conversations/{conversation}/messages',
            [AiTutorController::class, 'sendMessage']
        )->middleware('throttle:' . config('ai.rate_limit_per_minute', 10) . ',1');

        Route::put('/user/language', [LanguageController::class, 'updateLanguage']);
        Route::put('/user/speech-settings', [LanguageController::class, 'updateSpeechSettings']);
        Route::put('/user/theme-preference', [LanguageController::class, 'updateThemePreference']);

        // Quizzes are authenticated so attempts and best scores stay private.
        Route::get('/quizzes', [QuizController::class, 'index']);
        Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);
        Route::post('/quizzes/{quiz}/attempts', [QuizController::class, 'submit']);
        Route::get('/quiz-attempts', [QuizController::class, 'attempts']);
        Route::get('/quiz-attempts/{attempt}', [QuizController::class, 'showAttempt']);
        Route::get('/achievements', [AchievementController::class, 'index']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::put('/notifications/{notification}/read', [NotificationController::class, 'read']);
        Route::put('/notifications/read-all', [NotificationController::class, 'readAll']);
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('/dashboard', [AdminController::class, 'dashboard']);
            Route::get('/users', [AdminController::class, 'users']);
            Route::put('/users/{user}/role', [AdminController::class, 'updateUserRole']);
            Route::get('/{resource}', [AdminController::class, 'index']);
            Route::post('/{resource}', [AdminController::class, 'store']);
            Route::put('/{resource}/{id}', [AdminController::class, 'update']);
            Route::delete('/{resource}/{id}', [AdminController::class, 'destroy']);
        });
    });
});
