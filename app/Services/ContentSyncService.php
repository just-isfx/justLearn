namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Quiz;

class ContentSyncService
{
    public static function syncFromServer()
    {
        try {
            // 1. Fetch Courses
            $coursesResponse = Http::timeout(5)->get('https://justlearncode.com.ng/export_courses.json');
            if ($coursesResponse->successful()) {
                foreach ($coursesResponse->json() as $courseData) {
                    Course::updateOrCreate(['id' => $courseData['id']], $courseData);
                }
            }

            // 2. Fetch Lessons
            $lessonsResponse = Http::timeout(5)->get('https://justlearncode.com.ng/export_lessons.json');
            if ($lessonsResponse->successful()) {
                foreach ($lessonsResponse->json() as $lessonData) {
                    Lesson::updateOrCreate(['id' => $lessonData['id']], $lessonData);
                }
            }

            // 3. Fetch Quizzes
            $quizzesResponse = Http::timeout(5)->get('https://justlearncode.com.ng/export_quizzes.json');
            if ($quizzesResponse->successful()) {
                foreach ($quizzesResponse->json() as $quizData) {
                    Quiz::updateOrCreate(['id' => $quizData['id']], $quizData);
                }
            }

            return true;
        } catch (\Exception $e) {
            // User is offline; app runs smoothly using offline SQLite data
            return false;
        }
    }
}
