<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\ProgrammingLanguage;
use App\Models\Quiz;
use Illuminate\Database\Seeder;

class QuizSeeder extends Seeder
{
    public function run(): void
    {
        $blueprints = [
            'html' => [
                'title' => 'HTML Basics Quiz',
                'description' => 'Practice choosing the right structure for common web content.',
                'questions' => [
                    ['question' => 'Which HTML element is intended for the main heading of a page?', 'options' => ['<h1>', '<title>', '<header>', '<strong>'], 'correct' => 0],
                    ['question' => 'A page needs a link to another document. Which element expresses that relationship?', 'options' => ['<a>', '<link>', '<route>', '<nav-item>'], 'correct' => 0],
                    ['question' => 'Which element is the best choice for a standalone article such as a news story?', 'options' => ['<article>', '<span>', '<br>', '<meta>'], 'correct' => 0],
                    ['question' => 'You need to collect a user email address. Which input type communicates that purpose?', 'options' => ['email', 'text-only', 'address', 'mailbox'], 'correct' => 0],
                ],
            ],
            'css' => [
                'title' => 'CSS Fundamentals Quiz',
                'description' => 'Reason about selectors, layout, and visual presentation.',
                'questions' => [
                    ['question' => 'Which CSS property changes the space inside an element border?', 'options' => ['padding', 'margin', 'gap', 'inset'], 'correct' => 0],
                    ['question' => 'A layout should place items in a row and distribute free space. Which tool is a strong fit?', 'options' => ['Flexbox', 'Float only', 'Text transform', 'Z-index'], 'correct' => 0],
                    ['question' => 'Which selector targets every paragraph inside a card with class card?', 'options' => ['.card p', '.card + p', 'card.p', '#card > all'], 'correct' => 0],
                    ['question' => 'Why would you use a media query?', 'options' => ['To adapt styles to conditions such as viewport width', 'To import a video', 'To validate HTML', 'To run JavaScript'], 'correct' => 0],
                ],
            ],
            'javascript' => [
                'title' => 'JavaScript Fundamentals Quiz',
                'description' => 'Test your understanding of values, decisions, and reusable logic.',
                'questions' => [
                    ['question' => 'What is the purpose of a variable?', 'options' => ['To store a value for later use', 'To create a webpage', 'To connect to the internet', 'To turn off a computer'], 'correct' => 0],
                    ['question' => 'A program must repeat an action until a condition changes. What concept should you use?', 'options' => ['A loop', 'A comment', 'A stylesheet', 'An import path'], 'correct' => 0],
                    ['question' => 'What does a function provide?', 'options' => ['A reusable block of behavior', 'A database table', 'A browser tab', 'A CSS color'], 'correct' => 0],
                    ['question' => 'If x is 3, what value does x + 2 produce?', 'options' => ['5', '32', '2', 'undefined'], 'correct' => 0],
                ],
            ],
            'python' => [
                'title' => 'Python Fundamentals Quiz',
                'description' => 'Practice Python concepts through beginner-friendly scenarios.',
                'questions' => [
                    ['question' => 'Which structure is useful for storing an ordered collection that may change?', 'options' => ['A list', 'A comment', 'A module name', 'A Boolean literal'], 'correct' => 0],
                    ['question' => 'What does an if statement help a program do?', 'options' => ['Choose behavior based on a condition', 'Repeat forever automatically', 'Style a webpage', 'Install Python'], 'correct' => 0],
                    ['question' => 'What is the result of len([10, 20, 30])?', 'options' => ['3', '30', '2', '0'], 'correct' => 0],
                    ['question' => 'Why define a function?', 'options' => ['To name reusable steps and accept inputs', 'To hide all errors', 'To create a CSS rule', 'To replace every variable'], 'correct' => 0],
                ],
            ],
        ];

        foreach ($blueprints as $languageSlug => $blueprint) {
            $language = ProgrammingLanguage::where('slug', $languageSlug)->first();
            if (! $language) {
                continue;
            }

            $course = Course::firstOrCreate(
                ['slug' => $languageSlug . '-practice'],
                [
                    'programming_language_id' => $language->id,
                    'title' => $language->name . ' Practice',
                    'description' => 'Build confidence with practical ' . $language->name . ' questions.',
                    'level' => 'Beginner',
                    'estimated_duration' => 'Self-paced',
                ]
            );

            $quiz = Quiz::updateOrCreate(
                ['course_id' => $course->id, 'title' => $blueprint['title']],
                ['description' => $blueprint['description'], 'passing_score' => 70]
            );

            foreach ($blueprint['questions'] as $order => $questionData) {
                $question = $quiz->questions()->updateOrCreate(
                    ['question_order' => $order + 1],
                    ['question' => $questionData['question'], 'question_type' => 'multiple_choice', 'points' => 1]
                );

                foreach ($questionData['options'] as $optionOrder => $optionText) {
                    $question->options()->updateOrCreate(
                        ['option_order' => $optionOrder + 1],
                        ['option_text' => $optionText, 'is_correct' => $optionOrder === $questionData['correct']]
                    );
                }
            }
        }
    }
}
