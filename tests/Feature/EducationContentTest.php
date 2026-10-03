<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LibraryArticle;
use App\Models\LibraryCategory;
use App\Models\ProgrammingLanguage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EducationContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_programming_languages_and_courses_can_be_retrieved(): void
    {
        $language = ProgrammingLanguage::create([
            'name' => 'JavaScript',
            'slug' => 'javascript',
            'description' => 'Interactive web programming',
        ]);

        Course::create([
            'programming_language_id' => $language->id,
            'title' => 'JavaScript Fundamentals',
            'slug' => 'javascript-fundamentals',
            'description' => 'Learn the basics',
            'level' => 'Beginner',
            'estimated_duration' => '4 weeks',
        ]);

        $response = $this->getJson('/api/programming-languages');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $courseResponse = $this->getJson('/api/programming-languages/javascript/courses');

        $courseResponse->assertStatus(200)
            ->assertJsonPath('data.0.title', 'JavaScript Fundamentals');
    }

    public function test_programming_languages_are_returned_in_custom_learn_order(): void
    {
        ProgrammingLanguage::create(['name' => 'Python', 'slug' => 'python', 'sort_order' => 11]);
        ProgrammingLanguage::create(['name' => 'HTML', 'slug' => 'html', 'sort_order' => 1]);
        ProgrammingLanguage::create(['name' => 'CSS', 'slug' => 'css', 'sort_order' => 2]);
        ProgrammingLanguage::create(['name' => 'JavaScript', 'slug' => 'javascript', 'sort_order' => 3]);

        $this->getJson('/api/programming-languages')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'html')
            ->assertJsonPath('data.1.slug', 'css')
            ->assertJsonPath('data.2.slug', 'javascript')
            ->assertJsonPath('data.3.slug', 'python');
    }

    public function test_lessons_can_be_retrieved_in_order_with_navigation(): void
    {
        $language = ProgrammingLanguage::create([
            'name' => 'Python',
            'slug' => 'python',
            'description' => 'General purpose programming',
        ]);
        $course = Course::create([
            'programming_language_id' => $language->id,
            'title' => 'Python Basics',
            'slug' => 'python-basics',
            'description' => 'Core Python concepts',
            'level' => 'Beginner',
            'estimated_duration' => '3 weeks',
        ]);

        Lesson::create([
            'course_id' => $course->id,
            'title' => 'Introduction',
            'slug' => 'introduction',
            'description' => 'Getting started',
            'content' => '<h2>Intro</h2><p>Welcome</p>',
            'lesson_order' => 1,
            'estimated_minutes' => 10,
        ]);

        Lesson::create([
            'course_id' => $course->id,
            'title' => 'Variables',
            'slug' => 'variables',
            'description' => 'Store values',
            'content' => '<h2>Variables</h2>',
            'lesson_order' => 2,
            'estimated_minutes' => 12,
        ]);

        $lessonResponse = $this->getJson('/api/lessons/introduction');
        $lessonResponse->assertStatus(200)
            ->assertJsonPath('data.title', 'Introduction')
            ->assertJsonPath('data.course.programming_language.slug', 'python')
            ->assertJsonPath('data.course.lessons.0.slug', 'introduction')
            ->assertJsonPath('data.course.lessons.1.slug', 'variables');

        $nextLessonResponse = $this->getJson('/api/lessons/variables');
        $nextLessonResponse->assertStatus(200)
            ->assertJsonPath('data.title', 'Variables');
    }

    public function test_library_categories_articles_and_search_work(): void
    {
        $category = LibraryCategory::create([
            'name' => 'JavaScript',
            'slug' => 'javascript',
            'description' => 'JavaScript topics',
        ]);

        LibraryArticle::create([
            'category_id' => $category->id,
            'title' => 'Understanding Variables',
            'slug' => 'understanding-variables',
            'summary' => 'Learn about variables',
            'content' => '<h2>Variables</h2><p>Variables store data.</p>',
        ]);

        $categoriesResponse = $this->getJson('/api/library/categories');
        $categoriesResponse->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $searchResponse = $this->getJson('/api/library/search?q=variables');
        $searchResponse->assertStatus(200)
            ->assertJsonPath('data.0.title', 'Understanding Variables');
    }
}
