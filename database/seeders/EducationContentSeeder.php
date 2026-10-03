<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LibraryArticle;
use App\Models\LibraryCategory;
use App\Models\ProgrammingLanguage;
use Illuminate\Database\Seeder;

class EducationContentSeeder extends Seeder
{
    public function run(): void
    {
        $languages = [
            ['name' => 'HTML', 'slug' => 'html', 'description' => 'Structure the content of the web.'],
            ['name' => 'CSS', 'slug' => 'css', 'description' => 'Style modern websites.'],
            ['name' => 'JavaScript', 'slug' => 'javascript', 'description' => 'Build interactive front-end experiences.'],
            ['name' => 'Python', 'slug' => 'python', 'description' => 'Write clear and versatile applications.'],
            ['name' => 'PHP', 'slug' => 'php', 'description' => 'Create server-side web applications.'],
            ['name' => 'React', 'slug' => 'react', 'description' => 'Build component-driven user interfaces.'],
            ['name' => 'React Native', 'slug' => 'react-native', 'description' => 'Ship mobile apps with shared logic.'],
            ['name' => 'Next.js', 'slug' => 'next-js', 'description' => 'Create production-ready React applications.'],
            ['name' => 'C++', 'slug' => 'c-plus-plus', 'description' => 'Work with systems and performance-focused code.'],
            ['name' => 'Angular', 'slug' => 'angular', 'description' => 'Build structured web applications.'],
        ];

        foreach ($languages as $languageData) {
            ProgrammingLanguage::firstOrCreate(
                ['slug' => $languageData['slug']],
                $languageData
            );
        }

        $courseBlueprints = [
            ['languageSlug' => 'javascript', 'title' => 'JavaScript Fundamentals', 'slug' => 'javascript-fundamentals', 'description' => 'Learn the core building blocks of JavaScript.', 'level' => 'Beginner', 'estimated_duration' => '4 weeks'],
            ['languageSlug' => 'python', 'title' => 'Python Basics', 'slug' => 'python-basics', 'description' => 'Explore Python syntax and everyday programming patterns.', 'level' => 'Beginner', 'estimated_duration' => '3 weeks'],
            ['languageSlug' => 'php', 'title' => 'PHP Essentials', 'slug' => 'php-essentials', 'description' => 'Build dynamic server-side applications with confidence.', 'level' => 'Beginner', 'estimated_duration' => '4 weeks'],
        ];

        foreach ($courseBlueprints as $courseData) {
            $language = ProgrammingLanguage::where('slug', $courseData['languageSlug'])->first();
            if (! $language) {
                continue;
            }

            $course = Course::firstOrCreate(
                ['slug' => $courseData['slug']],
                [
                    'programming_language_id' => $language->id,
                    'title' => $courseData['title'],
                    'description' => $courseData['description'],
                    'level' => $courseData['level'],
                    'estimated_duration' => $courseData['estimated_duration'],
                ]
            );

            $lessons = [
                ['title' => 'Introduction', 'slug' => 'introduction', 'description' => 'Welcome to the course.', 'content' => '<h2>Introduction</h2><p>Start by understanding the goals of the course.</p>', 'estimated_minutes' => 8],
                ['title' => 'Variables', 'slug' => 'variables', 'description' => 'Store and reuse values.', 'content' => '<h2>Variables</h2><p>Variables let you keep values for later use.</p>', 'estimated_minutes' => 10],
                ['title' => 'Data Types', 'slug' => 'data-types', 'description' => 'Understand the foundational data kinds.', 'content' => '<h2>Data Types</h2><p>Data types describe the structure of information.</p>', 'estimated_minutes' => 10],
                ['title' => 'Operators', 'slug' => 'operators', 'description' => 'Combine and compare values.', 'content' => '<h2>Operators</h2><p>Operators help you transform and compare data.</p>', 'estimated_minutes' => 9],
            ];

            foreach ($lessons as $index => $lessonData) {
                Lesson::firstOrCreate(
                    ['slug' => $lessonData['slug']],
                    [
                        'course_id' => $course->id,
                        'title' => $lessonData['title'],
                        'description' => $lessonData['description'],
                        'content' => $lessonData['content'],
                        'lesson_order' => $index + 1,
                        'estimated_minutes' => $lessonData['estimated_minutes'],
                    ]
                );
            }
        }

        $categories = [
            ['name' => 'Programming Concepts', 'slug' => 'programming-concepts', 'description' => 'Core ideas behind software development.'],
            ['name' => 'Web Development', 'slug' => 'web-development', 'description' => 'Everything related to building for the web.'],
            ['name' => 'JavaScript', 'slug' => 'javascript-library', 'description' => 'Helpful JavaScript references and patterns.'],
        ];

        foreach ($categories as $categoryData) {
            $category = LibraryCategory::firstOrCreate(
                ['slug' => $categoryData['slug']],
                $categoryData
            );

            $articles = [
                ['title' => 'Understanding Variables', 'slug' => 'understanding-variables', 'summary' => 'Variables store information for later use.', 'content' => '<h2>Understanding Variables</h2><p>Variables are containers for values used by your program.</p>'],
                ['title' => 'Functions and Reuse', 'slug' => 'functions-and-reuse', 'summary' => 'Functions allow you to organize logic.', 'content' => '<h2>Functions and Reuse</h2><p>Functions help break complex tasks into smaller steps.</p>'],
            ];

            foreach ($articles as $articleData) {
                LibraryArticle::firstOrCreate(
                    ['slug' => $articleData['slug']],
                    [
                        'category_id' => $category->id,
                        'title' => $articleData['title'],
                        'summary' => $articleData['summary'],
                        'content' => $articleData['content'],
                    ]
                );
            }
        }
    }
}
