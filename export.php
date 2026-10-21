<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Course;
use App\Models\Quiz;

$courses = Course::with('lessons')->get()->toArray();
$quizzes = class_exists(Quiz::class) ? Quiz::all()->toArray() : [];

$data = [
    'courses' => $courses,
    'quizzes' => $quizzes,
];

file_put_contents('justlearncode_backup.json', json_encode($data, JSON_PRETTY_PRINT));

echo "\n==========================================\n";
echo "🎉 EXPORT SUCCESSFUL!\n";
echo "Total Courses Exported: " . count($courses) . "\n";
echo "Saved to: " . __DIR__ . "\justlearncode_backup.json\n";
echo "==========================================\n\n";