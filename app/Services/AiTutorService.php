<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AiTutorService
 *
 * Handles all communication with the OpenRouter Chat Completions API.
 * Controllers never call the AI provider directly — they go through this service.
 *
 * Features:
 * - Enforces plain-text conceptual guidance first.
 * - Encourages Socratic problem solving without code in the primary explanation.
 * - Wraps the executable code answer inside <solution> tags at the very end.
 * - Sanitises response to ensure no code leaks into the primary explanation area.
 * - Supports multi-language output (English, French, Spanish).
 */
class AiTutorService
{
    // ── System prompt ──────────────────────────────────────────────────────
    // Authoritative server-side instructions for the LLM.

    private const SYSTEM_PROMPT = <<<'PROMPT'
You are the justLearnCode AI Tutor — a patient, encouraging programming teacher.

Your primary goal is to TEACH users how to think through programming problems rather than immediately giving them answers.

Response Structure Requirements:
Every response to a programming or coding question MUST be split into two sections:

SECTION 1: CONCEPTUAL GUIDANCE (Always visible to the user)
- Explain what the problem is asking in clear, plain language.
- Identify the core programming concept (e.g., loops, arrays, recursion).
- Break down the step-by-step logic in plain words without using code or backticks.
- Ask a guiding question to help the user think through the logic.
- NEVER use code blocks (``` or ~~~), inline code (using backticks), variable declarations, or actual syntax expressions in this section.

SECTION 2: CODE SOLUTION (Hidden inside a solution block)
- At the very end of your response, wrap the exact code solution inside <solution> and </solution> tags.
- Inside the <solution> tags, you may provide clear, well-commented code blocks.
- NEVER put code blocks (```) or syntax outside of the <solution> tags.

Example Format:
---
To solve this, you need to look through every element in your list and check if it matches your condition...

1. Start at the first item.
2. Compare it to your target value.
3. Keep track of how many matches you find.

What loop structure in your language allows you to look through every item one by one?

<solution>
```python
def count_matches(items, target):
    count = 0
    for item in items:
        if item == target:
            count += 1
    return count
PROMPT;
// ── Code-detection patterns ────────────────────────────────────────────
// Used to catch code-rule violations in the primary guidance area.

private const CODE_PATTERNS = [
    '/\bdef\s+\w+\s*\(.*?\):/',              // Python function definition
    '/\bfunction\s+\w+\s*\(.*?\)/i',          // JS/PHP function definition
    '/\bvoid\s+\w+\s*\(.*?\)/i',              // Java/C void method
    '/\bpublic\s+(static\s+)?\w+\s+\w+\s*\(/i',// Method signature
    '/\bfor\s*\(\s*(let|var|int)?\s*\w+/',    // C/JS for loop
    '/\bwhile\s*\([^)]+\)/',                  // While loop syntax
    '/\bimport\s+[\w\{\}\s,]+\s+from/i',       // JS import statement
    '/\bimport\s+\w+/i',                       // Python import statement
    '/\binclude\s*<[^>]+>/',                   // C/C++ include statement
    '/<\?php/i',                               // PHP opening tag
    '/console\.log\s*\(/i',                    // JS console log
    '/System\.out\.print(ln)?\s*\(/i',         // Java System.out
    '/\bprint\s*\([\'"][^\n]*[\'"]\)/i',       // Python print with quotes
    '/\b(var|let|const)\s+\w+\s*=/i',          // JS variable declaration
    '/\$\w+\s*=\s*/',                          // PHP variable assignment
    '/\bnew\s+[A-Z]\w*\s*\([^)]*\)/',          // Object instantiation
    '/SELECT\s+.+?\s+FROM\s+\w+/i',           // SQL SELECT statement
];

// ── Safe fallback response ─────────────────────────────────────────────

private const SAFE_FALLBACK = "I want to make sure I'm helping you learn effectively. Let me guide you through the concept in words first. Could you tell me which specific part of the problem you're finding most challenging?";

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Send a conversation to the AI and return the assistant's reply.
 *
 * @param  array        $history         Array of ['role' => ..., 'content' => ...] objects
 * @param  string|null  $learningContext Optional plain-text context about current lesson/course
 * @param  string       $language        Target response language ('English', 'French', 'Spanish')
 *
 * @return string  The assistant's formatted response
 *
 * @throws \RuntimeException  When the API key is not configured
 * @throws \Exception         On network/provider failure
 */
public function chat(array $history, ?string $learningContext = null, string $language = 'English'): string
{
    $apiKey = config('ai.api_key');

    if (empty($apiKey)) {
        throw new \RuntimeException('AI_OPENROUTER_KEY is not configured.');
    }

    $systemContent = self::SYSTEM_PROMPT;

    if ($language && strtolower($language) !== 'english') {
        $systemContent .= "\n\nCRITICAL LANGUAGE INSTRUCTION: You MUST write your conceptual guidance in " . $language . ".";
    }

    if ($learningContext) {
        $systemContent .= "\n\nCurrent learning context for this user:\n" . $learningContext;
    }

    $messages = array_merge(
        [['role' => 'system', 'content' => $systemContent]],
        $history
    );

    try {
        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->retry(2, 100)
            ->connectTimeout(10)
            ->timeout(30)
            ->post(config('ai.base_url') . '/chat/completions', [
                'model'       => config('ai.model', 'poolside/laguna-xs-2.1'),
                'messages'    => $messages,
                'max_tokens'  => config('ai.max_tokens', 1200),
                'temperature' => 0.7,
            ]);
    } catch (ConnectionException $e) {
        Log::error('AiTutorService: OpenRouter connection failed', [
            'message' => $e->getMessage(),
        ]);

        throw new \Exception('connection_error', 0, $e);
    }

    if ($response->failed()) {
        $status = $response->status();
        Log::error('AiTutorService: OpenRouter request failed', [
            'status' => $status,
            'body'   => $response->body(),
        ]);

        throw new \Exception(match ($status) {
            401, 403 => 'authentication_error',
            402      => 'insufficient_quota',
            429      => 'rate_limit',
            default  => $status >= 500 ? 'provider_error' : 'request_error',
        });
    }

    $content = $response->json('choices.0.message.content', '');

    return $this->sanitiseResponse($content);
}

// ── Private helpers ────────────────────────────────────────────────────

/**
 * Inspects the response to ensure code syntax is not leaked in the
 * primary guidance section outside of <solution> tags.
 */
private function sanitiseResponse(string $content): string
{
    $content = trim($content);

    if (empty($content)) {
        return self::SAFE_FALLBACK;
    }

    // Separate the conceptual text from the solution block
    $parts = explode('<solution>', $content, 2);
    $guidancePart = $parts[0];

    // Ensure no code patterns leaked into the main conceptual guidance
    foreach (self::CODE_PATTERNS as $pattern) {
        if (preg_match($pattern, $guidancePart)) {
            Log::warning('AiTutorService: Response failed safety check — code leaked in guidance area', [
                'pattern' => $pattern,
                'preview' => mb_substr($guidancePart, 0, 200),
            ]);
            return self::SAFE_FALLBACK;
        }
    }

    return $content;
}
}