<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

abstract class LanguageLessonsSeeder extends Seeder
{
    abstract protected function languageId(): int;

    abstract protected function languageSlug(): string;

    abstract protected function courseIds(): array;

    public function run(): void
    {
        $courseIds = $this->courseIds();
        $courses = DB::table('courses')
            ->whereIn('id', array_keys($courseIds))
            ->get(['id', 'programming_language_id', 'title', 'slug'])
            ->keyBy('id');

        if ($courses->count() !== count($courseIds)) {
            $missing = array_diff(array_keys($courseIds), $courses->keys()->all());
            throw new RuntimeException('Missing expected course IDs for ' . $this->languageSlug() . ': ' . implode(', ', $missing));
        }

        foreach ($courses as $course) {
            if ((int) $course->programming_language_id !== $this->languageId()) {
                throw new RuntimeException("Course {$course->id} is not assigned to {$this->languageSlug()}.");
            }
        }

        $profile = $this->profile();
        $now = now();
        $records = [];

        foreach ($courseIds as $courseId => $expectedSlug) {
            $course = $courses->get($courseId);
            if ($course->slug !== $expectedSlug) {
                throw new RuntimeException("Course {$courseId} slug changed: expected {$expectedSlug}, found {$course->slug}.");
            }

            foreach ($this->blueprints() as $index => $blueprint) {
                $slug = Str::slug($course->slug . '-' . $blueprint['slug']);
                $records[] = [
                    'course_id' => $courseId,
                    'title' => $course->title . ': ' . $blueprint['title'],
                    'slug' => $slug,
                    'description' => "Study {$blueprint['focus']} through practical " . $profile['name'] . ' exercises in ' . $course->title . '.',
                    'content' => $this->content($profile, $course->title, $blueprint),
                    'lesson_order' => $index + 1,
                    'estimated_minutes' => 18 + ($index % 5) * 2,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (count($records) !== count($courseIds) * 8) {
            throw new RuntimeException('Every mapped course must receive exactly eight lessons.');
        }

        foreach (array_chunk($records, 100) as $batch) {
            DB::table('lessons')->upsert(
                $batch,
                ['slug'],
                ['course_id', 'title', 'description', 'content', 'lesson_order', 'estimated_minutes', 'updated_at']
            );
        }
    }

    private function content(array $profile, string $courseTitle, array $blueprint): string
    {
        $tools = $this->listItems($profile['tools']);
        $objectives = $this->listItems($blueprint['objectives']);
        $practices = $this->listItems($profile['practices']);
        $pitfalls = $this->listItems($profile['pitfalls']);
        $example = htmlspecialchars($profile['examples'][$blueprint['example']], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $focus = $this->escape($blueprint['focus']);
        $course = $this->escape($courseTitle);

        return '<h3>Requirements &amp; Tools</h3>'
            . '<p>Prepare the development environment for ' . $this->escape($profile['name']) . '. Use the listed editor, runtime or compiler, and command-line tools in a dedicated project folder. Run each small example using the workflow for this language and inspect compiler, runtime, or browser feedback before continuing.</p>'
            . '<ul class="list-disc pl-5">' . $tools . '</ul>'
            . '<h3>Lesson Objectives</h3><ul class="list-disc pl-5">' . $objectives . '</ul>'
            . '<h3>Main Lesson Content</h3>'
            . '<h4>Concept and course context</h4>'
            . '<p>This lesson applies ' . $focus . ' to the course topic ' . $course . '. Begin with the problem the program or interface must solve, identify the data and responsibilities involved, and then choose the smallest language construct that represents them accurately. Keep the code readable enough that another developer can trace inputs, transformations, and results.</p>'
            . '<p>' . $this->escape($blueprint['explanation']) . '</p>'
            . '<h4>Practical Example</h4><p>Use this compact example as a starting point. Trace each statement, run it in the configured environment, and change one input to observe how behavior changes.</p>'
            . '<pre><code>' . $example . '</code></pre>'
            . '<h4>Best Practices</h4><ul class="list-disc pl-5">' . $practices . '</ul>'
            . '<h4>Common Pitfalls</h4><ul class="list-disc pl-5">' . $pitfalls . '</ul>'
            . '<h4>Hands-on Practice</h4><p>' . $this->escape($blueprint['practice']) . ' Record the expected result first, implement the change in small steps, and verify the final behavior with at least one normal and one edge-case input.</p>';
    }

    private function listItems(array $items): string
    {
        return implode('', array_map(fn (string $item): string => '<li>' . $this->escape($item) . '</li>', $items));
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function blueprints(): array
    {
        return [
            [
                'title' => 'Foundations and Mental Models', 'slug' => 'foundations', 'focus' => 'the core mental model and vocabulary', 'example' => 0,
                'explanation' => 'Establish the vocabulary used throughout the unit. Separate the language construct from the problem it expresses, and make the relationship between source code and observable output explicit. A dependable foundation helps you recognize which behavior belongs in the current layer and which belongs in a library, framework, database, or platform API.',
                'objectives' => ['Explain the central concepts behind the course topic.', 'Identify the inputs, outputs, and responsibilities in a small example.', 'Set up and run a minimal project in the chosen language.'],
                'practice' => 'Create a small first exercise in this course topic, annotate the purpose of its main parts, and describe what a successful run should produce.',
            ],
            [
                'title' => 'Workspace, Toolchain, and Feedback', 'slug' => 'workspace-toolchain', 'focus' => 'project setup and the development feedback loop', 'example' => 1,
                'explanation' => 'A useful workspace has a repeatable way to edit, run, inspect, and validate changes. Keep source files separate from generated output, record the runtime or compiler version when it affects results, and use the project toolchain instead of relying on undocumented machine-specific settings. Fast feedback makes defects smaller and easier to understand.',
                'objectives' => ['Configure the editor, runtime or compiler, and project files.', 'Run and interpret the normal development workflow.', 'Distinguish source files, dependencies, and generated artifacts.'],
                'practice' => 'Create a clean project folder, add the smallest runnable example for this topic, and document the exact command or browser workflow used to verify it.',
            ],
            [
                'title' => 'Syntax, Structure, and Composition', 'slug' => 'syntax-structure', 'focus' => 'syntax, source organization, and composition', 'example' => 2,
                'explanation' => 'Syntax defines which arrangements the language accepts; structure determines whether a reader can follow them. Group related declarations, use names that communicate intent, and make dependencies visible. When a construct has nested parts, format and order them so the scope and execution sequence are immediately clear.',
                'objectives' => ['Read and write the principal syntax used in this course.', 'Organize a short source file into understandable sections.', 'Compose a larger expression or component from smaller parts.'],
                'practice' => 'Refactor a single dense example into clearly named declarations or sections without changing its observable result.',
            ],
            [
                'title' => 'Values, Data, and State', 'slug' => 'values-data-state', 'focus' => 'representing values and managing changing state', 'example' => 3,
                'explanation' => 'Programs and interfaces transform information. Choose representations that preserve the meaning and valid range of each value, make ownership or mutation rules explicit, and keep derived data derived rather than storing inconsistent copies. Data shape should make invalid states difficult to express and easy to detect.',
                'objectives' => ['Choose suitable types or structures for course data.', 'Trace how values move through the example.', 'Recognize where mutation, immutability, or state ownership matters.'],
                'practice' => 'Model a small real-world record from this course topic, validate its important fields, and show how one update changes the resulting output.',
            ],
            [
                'title' => 'Control Flow and Edge Cases', 'slug' => 'control-flow-edge-cases', 'focus' => 'decisions, iteration, and boundary behavior', 'example' => 4,
                'explanation' => 'Real inputs vary. Use conditions to make alternate paths explicit, loops or declarative transformations to handle collections, and early validation to keep later logic simple. Check empty, missing, duplicate, and boundary values rather than designing only for the happy path.',
                'objectives' => ['Express a decision or repeated operation clearly.', 'Predict behavior for representative and boundary inputs.', 'Avoid hidden fall-through or unbounded work.'],
                'practice' => 'Extend the exercise to handle an empty collection, a boundary value, and an invalid input, then explain each expected result.',
            ],
            [
                'title' => 'Reusable Abstractions and APIs', 'slug' => 'reusable-abstractions', 'focus' => 'encapsulation, reusable operations, and stable interfaces', 'example' => 5,
                'explanation' => 'An abstraction should hide an implementation detail while exposing a small, predictable contract. Keep each function, component, type, or query focused; define inputs and outputs; and make errors or side effects clear at the boundary. Reuse is valuable when it removes meaningful duplication without obscuring the domain.',
                'objectives' => ['Extract a focused reusable operation or component.', 'Define a clear input/output contract.', 'Separate responsibilities so changes remain local.'],
                'practice' => 'Turn a repeated operation from an earlier exercise into a reusable abstraction and demonstrate it with two different inputs.',
            ],
            [
                'title' => 'Reliability, Security, and Testing', 'slug' => 'reliability-security-testing', 'focus' => 'correctness, safety, and verification', 'example' => 6,
                'explanation' => 'Correctness requires evidence. Validate data at trust boundaries, handle failures deliberately, avoid unsafe evaluation or interpolation, and test both expected behavior and failure cases. Prefer deterministic checks and meaningful assertions; logging and diagnostics should help explain failure without exposing secrets or personal data.',
                'objectives' => ['Identify trust boundaries and likely failure modes.', 'Add validation or error handling appropriate to the language.', 'Create focused checks for normal and invalid behavior.'],
                'practice' => 'Write or perform a verification plan with one normal case, one malformed input, and one boundary case; record the actual versus expected result.',
            ],
            [
                'title' => 'Applied Course Project', 'slug' => 'applied-project', 'focus' => 'integrating the course concepts in a realistic deliverable', 'example' => 7,
                'explanation' => 'A small project tests whether concepts work together. Define a user-facing outcome, split it into reviewable tasks, implement the simplest complete path, and then improve validation, accessibility, performance, or maintainability as the course topic requires. Keep the final structure easy to run and explain.',
                'objectives' => ['Plan a coherent deliverable using the course concepts.', 'Integrate syntax, data, control flow, and reusable structure.', 'Review the result against functional and quality criteria.'],
                'practice' => 'Build a compact feature related to this course, include a clear success and failure state, and submit a short checklist describing how you tested it.',
            ],
        ];
    }

    private function profile(): array
    {
        $profiles = [
            'css' => [
                'name' => 'CSS', 'tools' => ['Visual Studio Code with CSS language support.', 'A modern browser with DevTools and its computed-style/layout inspectors.', 'A project stylesheet linked to a small HTML test page.'],
                'practices' => ['Keep selectors purposeful and avoid unnecessary specificity.', 'Use design tokens and responsive constraints rather than scattered magic values.', 'Test keyboard focus, contrast, and narrow viewport behavior.'],
                'pitfalls' => ['Do not use !important as a routine cascade strategy.', 'Do not rely on a single viewport or mouse hover.', 'Remember that CSS controls presentation; preserve meaningful HTML structure.'],
                'examples' => [
                    <<<'CODE'
:root { --space: 1rem; --ink: #18313b; }
.lesson-card { color: var(--ink); padding: var(--space); }
CODE,
                    <<<'CODE'
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; }
CODE,
                    <<<'CODE'
.page-title { font-size: clamp(1.8rem, 4vw, 3rem); }
.page-title > span { color: #087e8b; }
CODE,
                    <<<'CODE'
.layout { display: grid; grid-template-columns: 16rem 1fr; gap: 1.5rem; }
.content { min-width: 0; }
CODE,
                    <<<'CODE'
@media (max-width: 48rem) {
  .layout { grid-template-columns: 1fr; }
}
CODE,
                    <<<'CODE'
.button { transition: background-color 160ms ease, transform 160ms ease; }
.button:hover { transform: translateY(-1px); }
CODE,
                    <<<'CODE'
.button:focus-visible { outline: 3px solid #087e8b; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; } }
CODE,
                    <<<'CODE'
.card { display: grid; gap: 1rem; max-width: 42rem; padding: clamp(1rem, 4vw, 2rem); border: 1px solid #cbd5dc; border-radius: .5rem; }
CODE,
                ],
            ],
            'php' => [
                'name' => 'PHP', 'tools' => ['Visual Studio Code with PHP language support.', 'PHP 8.2 or newer and the PHP CLI.', 'Composer for project dependencies and PHPUnit or Pest for tests.'],
                'practices' => ['Use strict types where appropriate and follow PSR coding standards.', 'Validate input and use parameterized database queries.', 'Keep secrets in environment configuration, not source files.'],
                'pitfalls' => ['Do not concatenate untrusted data into SQL or HTML.', 'Do not confuse a missing array key with a valid empty value.', 'Do not suppress errors instead of handling them.'],
                'examples' => [
                    <<<'CODE'
<?php
declare(strict_types=1);

$course = 'PHP';
echo "Learning {$course}";
CODE,
                    <<<'CODE'
<?php
function lessonLabel(string $title): string
{
    return trim($title);
}
CODE,
                    <<<'CODE'
<?php
$score = 82;
$result = $score >= 70 ? 'pass' : 'practice';
CODE,
                    <<<'CODE'
<?php
$lesson = ['title' => 'Arrays', 'minutes' => 20];
foreach ($lesson as $key => $value) { echo "$key: $value\n"; }
CODE,
                    <<<'CODE'
<?php
final class Lesson
{
    public function __construct(public string $title) {}
}
CODE,
                    <<<'CODE'
<?php
function percentage(int $earned, int $total): float
{
    if ($total <= 0) throw new InvalidArgumentException('Total must be positive');
    return ($earned / $total) * 100;
}
CODE,
                    <<<'CODE'
<?php
$statement = $pdo->prepare('SELECT title FROM lessons WHERE course_id = :course');
$statement->execute(['course' => $courseId]);
$titles = $statement->fetchAll(PDO::FETCH_COLUMN);
CODE,
                    <<<'CODE'
<?php
declare(strict_types=1);
$lessons = array_map(fn (array $row): string => htmlspecialchars($row['title'], ENT_QUOTES, 'UTF-8'), $rows);
CODE,
                ],
            ],
            'python' => [
                'name' => 'Python', 'tools' => ['Visual Studio Code with the Python extension.', 'Python 3.11 or newer and a project virtual environment.', 'pip, pytest, and a terminal for running modules and tests.'],
                'practices' => ['Use descriptive names and small functions with one responsibility.', 'Create a virtual environment and declare dependencies.', 'Use context managers for files and explicit exceptions for failures.'],
                'pitfalls' => ['Avoid mutable default arguments.', 'Do not catch every exception without handling or reporting it.', 'Do not assume a relative file path starts in the source file directory.'],
                'examples' => [
                    <<<'CODE'
course = "Python"
minutes = 20
print(f"{course}: {minutes} minutes")
CODE,
                    <<<'CODE'
def lesson_label(title: str) -> str:
    return title.strip()

print(lesson_label("  Lists  "))
CODE,
                    <<<'CODE'
score = 82
result = "pass" if score >= 70 else "practice"
CODE,
                    <<<'CODE'
lesson = {"title": "Dictionaries", "minutes": 20}
for key, value in lesson.items():
    print(f"{key}: {value}")
CODE,
                    <<<'CODE'
class Lesson:
    def __init__(self, title: str) -> None:
        self.title = title

lesson = Lesson("Classes")
CODE,
                    <<<'CODE'
def percentage(earned: int, total: int) -> float:
    if total <= 0:
        raise ValueError("total must be positive")
    return earned / total * 100
CODE,
                    <<<'CODE'
from pathlib import Path

text = Path("notes.txt").read_text(encoding="utf-8")
print(len(text.splitlines()))
CODE,
                    <<<'CODE'
def summarize(items: list[str]) -> dict[str, int]:
    return {"count": len(items), "characters": sum(map(len, items))}

print(summarize(["Markup", "Styles"]))
CODE,
                ],
            ],
            'react' => [
                'name' => 'React', 'tools' => ['Visual Studio Code with JavaScript/TypeScript support.', 'Node.js LTS, npm, and a Vite React project.', 'React DevTools and a modern browser.'],
                'practices' => ['Keep components focused and derive values rather than duplicating state.', 'Use stable keys for rendered collections.', 'Keep effects for synchronization with external systems.'],
                'pitfalls' => ['Do not mutate state objects or arrays in place.', 'Do not call hooks conditionally.', 'Do not use array indexes as keys for reorderable data.'],
                'examples' => [
                    <<<'CODE'
const course = { title: 'React', lessons: 8 };
export default function App() {
  return <h1>{course.title}: {course.lessons} lessons</h1>;
}
CODE,
                    <<<'CODE'
function LessonCard({ title, minutes }) {
  return <article><h2>{title}</h2><p>{minutes} min</p></article>;
}
CODE,
                    <<<'CODE'
function Score({ value }) {
  return <p>{value >= 70 ? 'Passed' : 'Keep practicing'}</p>;
}
CODE,
                    <<<'CODE'
const lessons = ['JSX', 'Props', 'State'];
return <ul>{lessons.map((title) => <li key={title}>{title}</li>)}</ul>;
CODE,
                    <<<'CODE'
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((value) => value + 1)}>{count}</button>;
}
CODE,
                    <<<'CODE'
import { useEffect, useState } from 'react';

useEffect(() => {
  const controller = new AbortController();
  loadData({ signal: controller.signal });
  return () => controller.abort();
}, []);
CODE,
                    <<<'CODE'
function Status({ error, loading }) {
  if (loading) return <p role="status">Loading...</p>;
  if (error) return <p role="alert">Unable to load lessons.</p>;
  return null;
}
CODE,
                    <<<'CODE'
function LessonList({ lessons }) {
  return <main><h1>Lessons</h1>{lessons.map((lesson) => <LessonCard key={lesson.id} {...lesson} />)}</main>;
}
CODE,
                ],
            ],
            'csharp' => [
                'name' => 'C#', 'tools' => ['Visual Studio or Visual Studio Code with C# Dev Kit.', '.NET 8 SDK or a newer supported SDK.', 'dotnet CLI and xUnit or NUnit for tests.'],
                'practices' => ['Use nullable reference types and explicit access modifiers.', 'Prefer immutable records or focused classes for domain data.', 'Use async APIs for I/O and propagate cancellation tokens.'],
                'pitfalls' => ['Do not block asynchronous work with .Result or .Wait().', 'Do not swallow exceptions or expose sensitive details.', 'Do not confuse value equality and reference identity.'],
                'examples' => [
                    <<<'CODE'
var course = "C#";
var minutes = 20;
Console.WriteLine($"{course}: {minutes} minutes");
CODE,
                    <<<'CODE'
static string LessonLabel(string title) => title.Trim();
CODE,
                    <<<'CODE'
int score = 82;
string result = score >= 70 ? "pass" : "practice";
CODE,
                    <<<'CODE'
var lessons = new[] { "Types", "Methods", "Classes" };
foreach (var lesson in lessons) Console.WriteLine(lesson);
CODE,
                    <<<'CODE'
public sealed record Lesson(string Title, int Minutes);
var lesson = new Lesson("Records", 20);
CODE,
                    <<<'CODE'
static double Percentage(int earned, int total)
{
    ArgumentOutOfRangeException.ThrowIfNegativeOrZero(total);
    return (double)earned / total * 100;
}
CODE,
                    <<<'CODE'
try { Console.WriteLine(File.ReadAllText("notes.txt")); }
catch (IOException ex) { Console.Error.WriteLine(ex.Message); }
CODE,
                    <<<'CODE'
var lessons = new[] { new Lesson("LINQ", 20), new Lesson("Testing", 25) };
var shortLessons = lessons.Where(item => item.Minutes < 25).ToArray();
CODE,
                ],
            ],
            'javascript' => [
                'name' => 'JavaScript', 'tools' => ['Visual Studio Code with JavaScript support.', 'Node.js LTS and npm for scripts and packages.', 'A modern browser with DevTools for DOM and network inspection.'],
                'practices' => ['Use const by default and small named functions.', 'Validate external data and handle rejected promises.', 'Use semantic HTML and safe DOM APIs for browser output.'],
                'pitfalls' => ['Do not compare values with loose equality unintentionally.', 'Do not assume asynchronous work has completed immediately.', 'Do not insert untrusted strings through innerHTML.'],
                'examples' => [
                    <<<'CODE'
const course = 'JavaScript';
const minutes = 20;
console.log(`${course}: ${minutes} minutes`);
CODE,
                    <<<'CODE'
function lessonLabel(title) {
  return title.trim();
}
CODE,
                    <<<'CODE'
const score = 82;
const result = score >= 70 ? 'pass' : 'practice';
CODE,
                    <<<'CODE'
const lessons = ['DOM', 'Events', 'Modules'];
for (const lesson of lessons) console.log(lesson);
CODE,
                    <<<'CODE'
const lesson = { title: 'Objects', minutes: 20 };
const updated = { ...lesson, minutes: 25 };
CODE,
                    <<<'CODE'
async function loadLessons(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
CODE,
                    <<<'CODE'
const button = document.querySelector('[data-action="save"]');
button?.addEventListener('click', () => console.log('Saved'));
CODE,
                    <<<'CODE'
export function summarize(items) {
  return { count: items.length, titles: items.map((item) => item.title) };
}
CODE,
                ],
            ],
            'java' => [
                'name' => 'Java', 'tools' => ['Visual Studio Code with Java Extension Pack or IntelliJ IDEA.', 'JDK 21 or a newer supported JDK.', 'Maven or Gradle and JUnit for testing.'],
                'practices' => ['Use encapsulated types and meaningful method names.', 'Prefer generics and immutable values where suitable.', 'Use try-with-resources for closeable I/O.'],
                'pitfalls' => ['Do not compare strings with == when value equality is intended.', 'Do not catch exceptions without recovery or useful propagation.', 'Do not expose mutable collections from domain objects.'],
                'examples' => [
                    <<<'CODE'
String course = "Java";
int minutes = 20;
System.out.printf("%s: %d minutes%n", course, minutes);
CODE,
                    <<<'CODE'
static String lessonLabel(String title) {
    return title.strip();
}
CODE,
                    <<<'CODE'
int score = 82;
String result = score >= 70 ? "pass" : "practice";
CODE,
                    <<<'CODE'
List<String> lessons = List.of("Classes", "Interfaces", "Records");
lessons.forEach(System.out::println);
CODE,
                    <<<'CODE'
record Lesson(String title, int minutes) {}
Lesson lesson = new Lesson("Records", 20);
CODE,
                    <<<'CODE'
static double percentage(int earned, int total) {
    if (total <= 0) throw new IllegalArgumentException("total must be positive");
    return (double) earned / total * 100;
}
CODE,
                    <<<'CODE'
try (var reader = Files.newBufferedReader(Path.of("notes.txt"))) {
    System.out.println(reader.readLine());
}
CODE,
                    <<<'CODE'
var titles = lessons.stream().map(Lesson::title).sorted().toList();
System.out.println(titles);
CODE,
                ],
            ],
            'cpp' => [
                'name' => 'C++', 'tools' => ['Visual Studio Code with C/C++ extension or Visual Studio.', 'A C++20-capable compiler such as MSVC, Clang, or GCC.', 'CMake or a documented compiler command and a debugger.'],
                'practices' => ['Prefer RAII and standard-library containers.', 'Use const references for read-only nontrivial inputs.', 'Compile with warnings and test ownership boundaries.'],
                'pitfalls' => ['Avoid raw owning pointers and manual delete where RAII fits.', 'Check bounds and lifetime assumptions.', 'Do not ignore compiler warnings about conversions or uninitialized values.'],
                'examples' => [
                    <<<'CODE'
#include <iostream>
#include <string>
int main() { std::string course = "C++"; std::cout << course << '\n'; }
CODE,
                    <<<'CODE'
#include <string>
std::string lessonLabel(const std::string& title) { return title; }
CODE,
                    <<<'CODE'
int score = 82;
const char* result = score >= 70 ? "pass" : "practice";
CODE,
                    <<<'CODE'
#include <vector>
std::vector<int> minutes{18, 20, 24};
for (int value : minutes) std::cout << value << '\n';
CODE,
                    <<<'CODE'
struct Lesson { std::string title; int minutes; };
Lesson lesson{"Structs", 20};
CODE,
                    <<<'CODE'
#include <stdexcept>
double percentage(int earned, int total) {
    if (total <= 0) throw std::invalid_argument("total must be positive");
    return 100.0 * earned / total;
}
CODE,
                    <<<'CODE'
#include <memory>
auto values = std::make_unique<std::vector<int>>(std::initializer_list<int>{1, 2, 3});
std::cout << values->size();
CODE,
                    <<<'CODE'
#include <algorithm>
std::ranges::sort(minutes);
for (const auto value : minutes) std::cout << value << ' ';
CODE,
                ],
            ],
            'sql' => [
                'name' => 'SQL', 'tools' => ['Visual Studio Code with SQL support.', 'A local SQLite, PostgreSQL, or MySQL database and client.', 'A disposable practice database with documented schema and seed data.'],
                'practices' => ['Select only required columns and qualify ambiguous names.', 'Use parameters for values supplied by applications.', 'Inspect query plans and use transactions for related changes.'],
                'pitfalls' => ['Do not concatenate user input into SQL strings.', 'Do not use SELECT * in stable application queries.', 'Remember NULL requires IS NULL rather than equality comparison.'],
                'examples' => [
                    <<<'CODE'
CREATE TABLE courses (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL
);
CODE,
                    <<<'CODE'
SELECT id, title
FROM courses
WHERE published = TRUE
ORDER BY title;
CODE,
                    <<<'CODE'
SELECT course_id, COUNT(*) AS lesson_count
FROM lessons
GROUP BY course_id
HAVING COUNT(*) >= 8;
CODE,
                    <<<'CODE'
SELECT c.title, l.title AS lesson_title
FROM courses AS c
JOIN lessons AS l ON l.course_id = c.id;
CODE,
                    <<<'CODE'
SELECT title, lesson_order
FROM lessons
WHERE course_id = :course_id
ORDER BY lesson_order
LIMIT 5;
CODE,
                    <<<'CODE'
BEGIN;
UPDATE lessons SET estimated_minutes = 20 WHERE id = :lesson_id;
COMMIT;
CODE,
                    <<<'CODE'
SELECT c.title, COUNT(l.id) AS lesson_count
FROM courses AS c
LEFT JOIN lessons AS l ON l.course_id = c.id
GROUP BY c.id, c.title;
CODE,
                    <<<'CODE'
WITH lesson_totals AS (
  SELECT course_id, COUNT(*) AS total FROM lessons GROUP BY course_id
)
SELECT course_id, total FROM lesson_totals WHERE total >= 8;
CODE,
                ],
            ],
            'pascal' => [
                'name' => 'Pascal', 'tools' => ['Visual Studio Code with Pascal syntax support or Lazarus IDE.', 'Free Pascal Compiler (FPC) and its command-line compiler.', 'A terminal for compiling with warnings and running the generated program.'],
                'practices' => ['Declare clear types and initialize variables before use.', 'Keep procedures focused and pass values with intentional modes.', 'Compile frequently and read the first diagnostic carefully.'],
                'pitfalls' => ['Do not assume identifiers are case-sensitive in the same way as all languages.', 'Check array bounds and file status explicitly.', 'Do not leave a block without its matching begin/end structure.'],
                'examples' => [
                    <<<'CODE'
program HelloCourse;
begin
  Writeln('Pascal fundamentals');
end.
CODE,
                    <<<'CODE'
function LessonLabel(title: string): string;
begin
  LessonLabel := Trim(title);
end;
CODE,
                    <<<'CODE'
var score: Integer;
begin
  score := 82;
  if score >= 70 then Writeln('pass') else Writeln('practice');
end.
CODE,
                    <<<'CODE'
var minutes: array[1..3] of Integer;
begin
  minutes[1] := 18; minutes[2] := 20; minutes[3] := 24;
end.
CODE,
                    <<<'CODE'
type TLesson = record
  Title: string;
  Minutes: Integer;
end;
CODE,
                    <<<'CODE'
function Percentage(earned, total: Integer): Real;
begin
  if total <= 0 then Halt(1);
  Percentage := earned / total * 100;
end;
CODE,
                    <<<'CODE'
var inputFile: TextFile;
begin
  AssignFile(inputFile, 'notes.txt');
  Reset(inputFile);
  CloseFile(inputFile);
end.
CODE,
                    <<<'CODE'
program LessonSummary;
var count: Integer;
begin
  count := 0;
  Writeln('Lessons counted: ', count);
end.
CODE,
                ],
            ],
            'rust' => [
                'name' => 'Rust', 'tools' => ['Visual Studio Code with rust-analyzer.', 'A current stable Rust toolchain installed with rustup.', 'Cargo for project, dependency, test, and formatting workflows.'],
                'practices' => ['Let ownership and borrowing express resource lifetimes.', 'Prefer Result and Option over panics for expected failures.', 'Run cargo fmt, cargo clippy, and cargo test regularly.'],
                'pitfalls' => ['Do not clone values reflexively to silence borrow-checker errors.', 'Do not unwrap fallible external input in production paths.', 'Understand whether a type is Copy, borrowed, or moved.'],
                'examples' => [
                    <<<'CODE'
fn main() {
    let course = "Rust";
    println!("Learning {course}");
}
CODE,
                    <<<'CODE'
fn lesson_label(title: &str) -> String {
    title.trim().to_owned()
}
CODE,
                    <<<'CODE'
let score = 82;
let result = if score >= 70 { "pass" } else { "practice" };
CODE,
                    <<<'CODE'
let lessons = vec!["Ownership", "Enums", "Results"];
for lesson in &lessons { println!("{lesson}"); }
CODE,
                    <<<'CODE'
struct Lesson { title: String, minutes: u32 }
let lesson = Lesson { title: "Structs".into(), minutes: 20 };
CODE,
                    <<<'CODE'
fn percentage(earned: u32, total: u32) -> Result<f64, &'static str> {
    if total == 0 { return Err("total must be positive"); }
    Ok(f64::from(earned) / f64::from(total) * 100.0)
}
CODE,
                    <<<'CODE'
let content = std::fs::read_to_string("notes.txt")?;
println!("{} lines", content.lines().count());
CODE,
                    <<<'CODE'
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    println!("{}", args.get(1).map(String::as_str).unwrap_or("lessons"));
    Ok(())
}
CODE,
                ],
            ],
            'swift' => [
                'name' => 'Swift', 'tools' => ['Xcode or Visual Studio Code with Swift support.', 'A current Swift toolchain and Swift Package Manager.', 'The Swift REPL or swift run/test commands for feedback.'],
                'practices' => ['Use value types by default and model optional values explicitly.', 'Handle errors with throws and do/catch at meaningful boundaries.', 'Keep UI and domain logic separated in app projects.'],
                'pitfalls' => ['Do not force-unwrap values from uncertain input.', 'Do not retain UI state in unrelated global variables.', 'Respect value semantics when copying collections or structures.'],
                'examples' => [
                    <<<'CODE'
let course = "Swift"
let minutes = 20
print("\(course): \(minutes) minutes")
CODE,
                    <<<'CODE'
func lessonLabel(_ title: String) -> String {
    title.trimmingCharacters(in: .whitespaces)
}
CODE,
                    <<<'CODE'
let score = 82
let result = score >= 70 ? "pass" : "practice"
CODE,
                    <<<'CODE'
let lessons = ["Optionals", "Structs", "Protocols"]
for lesson in lessons { print(lesson) }
CODE,
                    <<<'CODE'
struct Lesson {
    let title: String
    var minutes: Int
}
CODE,
                    <<<'CODE'
enum LessonError: Error { case invalidTotal }
func percentage(_ earned: Int, of total: Int) throws -> Double {
    guard total > 0 else { throw LessonError.invalidTotal }
    return Double(earned) / Double(total) * 100
}
CODE,
                    <<<'CODE'
if let text = try? String(contentsOfFile: "notes.txt", encoding: .utf8) {
    print(text.count)
}
CODE,
                    <<<'CODE'
let titles = lessons.map { $0.uppercased() }.sorted()
print(titles)
CODE,
                ],
            ],
            'typescript' => [
                'name' => 'TypeScript', 'tools' => ['Visual Studio Code with TypeScript language services.', 'Node.js LTS and npm.', 'TypeScript compiler (tsc), a strict tsconfig, and a test runner.'],
                'practices' => ['Enable strict compiler checks and model unknown data safely.', 'Prefer discriminated unions for finite state variants.', 'Keep runtime validation for data arriving from outside the type system.'],
                'pitfalls' => ['Types disappear at runtime and do not validate network responses.', 'Avoid any when unknown or a precise type is possible.', 'Do not use non-null assertions to conceal uncertain control flow.'],
                'examples' => [
                    <<<'CODE'
const course: string = 'TypeScript';
const minutes: number = 20;
console.log(`${course}: ${minutes} minutes`);
CODE,
                    <<<'CODE'
function lessonLabel(title: string): string {
  return title.trim();
}
CODE,
                    <<<'CODE'
type Result = 'pass' | 'practice';
const result: Result = score >= 70 ? 'pass' : 'practice';
CODE,
                    <<<'CODE'
interface Lesson { id: number; title: string; minutes: number }
const lessons: Lesson[] = [{ id: 1, title: 'Types', minutes: 20 }];
CODE,
                    <<<'CODE'
type LoadState<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; message: string };
CODE,
                    <<<'CODE'
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}
CODE,
                    <<<'CODE'
async function getLesson(id: number): Promise<unknown> {
  const response = await fetch(`/api/lessons/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
CODE,
                    <<<'CODE'
function summarize(lessons: readonly Lesson[]) {
  return lessons.map(({ id, title }) => ({ id, title }));
}
CODE,
                ],
            ],
            'react-native' => [
                'name' => 'React Native', 'tools' => ['Visual Studio Code with React Native Tools.', 'Node.js LTS, npm, and Expo or the React Native CLI.', 'Android Studio emulator or Xcode Simulator and a device for testing.'],
                'practices' => ['Use accessible labels and touch targets sized for fingers.', 'Handle loading, offline, and permission-denied states.', 'Test on both platforms and on physical devices when possible.'],
                'pitfalls' => ['Do not assume browser DOM elements exist in native views.', 'Do not request device permissions without explaining the benefit.', 'Do not block the UI thread with expensive synchronous work.'],
                'examples' => [
                    <<<'CODE'
import { Text, View } from 'react-native';
export default function App() {
  return <View><Text>React Native lessons</Text></View>;
}
CODE,
                    <<<'CODE'
function LessonCard({ title }) {
  return <View accessible><Text>{title}</Text></View>;
}
CODE,
                    <<<'CODE'
const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 8, backgroundColor: '#ffffff' },
});
CODE,
                    <<<'CODE'
const [selected, setSelected] = useState('');
<Pressable onPress={() => setSelected('forms')}><Text>{selected || 'Choose a topic'}</Text></Pressable>
CODE,
                    <<<'CODE'
<FlatList data={lessons} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <LessonCard title={item.title} />} />
CODE,
                    <<<'CODE'
useEffect(() => {
  const controller = new AbortController();
  loadLessons({ signal: controller.signal });
  return () => controller.abort();
}, []);
CODE,
                    <<<'CODE'
<Pressable accessibilityRole="button" accessibilityLabel="Save lesson" onPress={saveLesson}>
  <Text>Save</Text>
</Pressable>
CODE,
                    <<<'CODE'
function LessonScreen({ route }) {
  return <SafeAreaView><ScrollView><Text>{route.params.courseTitle}</Text><LessonList /></ScrollView></SafeAreaView>;
}
CODE,
                ],
            ],
        ];

        $profileSlug = $this->languageSlug() === 'c++' ? 'cpp' : $this->languageSlug();

        if (! isset($profiles[$profileSlug])) {
            throw new RuntimeException('No lesson profile is configured for ' . $this->languageSlug() . '.');
        }

        return $profiles[$profileSlug];
    }
}