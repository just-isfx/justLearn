<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\ProgrammingLanguage;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Quiz;

class CloudSyncService
{
    /**
     * Endpoint serving cloud curriculum data
     */
    protected string $syncUrl = 'https://justlearncode.com.ng/api/v1/sync/full';

    /**
     * Execute full sync with cloud server
     */
    public function syncNow(): array
    {
        try {
            // 1. Fetch payload from web server with 15s timeout
            $response = Http::timeout(15)->get($this->syncUrl);

            if ($response->failed()) {
                return [
                    'status' => 'failed',
                    'message' => 'Cloud server returned error code ' . $response->status(),
                ];
            }

            $data = $response->json();
            $payload = $data['payload'] ?? [];

            $counts = [
                'languages' => 0,
                'courses'   => 0,
                'lessons'   => 0,
                'quizzes'   => 0,
            ];

            DB::transaction(function () use ($payload, &$counts) {
                // 2. Sync Languages
                foreach ($payload['languages'] ?? [] as $lang) {
                    ProgrammingLanguage::updateOrCreate(
                        ['id' => $lang['id']],
                        [
                            'name' => $lang['name'],
                            'slug' => $lang['slug'],
                            'icon' => $lang['icon'] ?? null,
                        ]
                    );
                    $counts['languages']++;
                }

                // 3. Sync Courses
                foreach ($payload['courses'] ?? [] as $course) {
                    Course::updateOrCreate(
                        ['id' => $course['id']],
                        [
                            'programming_language_id' => $course['programming_language_id'] ?? 1,
                            'title'                   => $course['title'],
                            'slug'                    => $course['slug'],
                            'description'             => $course['description'] ?? null,
                            'level'                   => $course['level'] ?? 'Beginner',
                        ]
                    );
                    $counts['courses']++;
                }

                // 4. Sync Lessons
                foreach ($payload['lessons'] ?? [] as $lesson) {
                    Lesson::updateOrCreate(
                        ['id' => $lesson['id']],
                        [
                            'course_id' => $lesson['course_id'],
                            'title'     => $lesson['title'],
                            'slug'      => $lesson['slug'],
                            'content'   => $lesson['content'] ?? '',
                        ]
                    );
                    $counts['lessons']++;
                }

                // 5. Sync Quizzes
                foreach ($payload['quizzes'] ?? [] as $quiz) {
                    Quiz::updateOrCreate(
                        ['id' => $quiz['id']],
                        [
                            'lesson_id'      => $quiz['lesson_id'] ?? null,
                            'question'       => $quiz['question'] ?? $quiz['title'],
                            'option_a'       => $quiz['option_a'] ?? '',
                            'option_b'       => $quiz['option_b'] ?? '',
                            'option_c'       => $quiz['option_c'] ?? null,
                            'option_d'       => $quiz['option_d'] ?? null,
                            'correct_answer' => $quiz['correct_answer'] ?? 'A',
                        ]
                    );
                    $counts['quizzes']++;
                }
            });

            return [
                'status'  => 'success',
                'message' => 'Sync completed successfully.',
                'counts'  => $counts,
            ];

        } catch (\Throwable $e) {
            // Graceful fallback when offline
            return [
                'status'  => 'offline',
                'message' => 'App running in offline mode: ' . $e->getMessage(),
            ];
        }
    }
}
