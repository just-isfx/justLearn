<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Tutor Configuration
    |--------------------------------------------------------------------------
    |
    | Set AI_OPENROUTER_KEY in your .env file to enable the AI Tutor.
    | The key is read server-side only — it is never sent to the frontend.
    |
    */

    'api_key' => env('AI_OPENROUTER_KEY', ''),

    'base_url' => rtrim(env('AI_BASE_URL', 'https://openrouter.ai/api/v1'), '/'),

    // Kept for compatibility while migrating away from the previous provider.
    'openai_api_key' => env('AI_OPENAI_KEY', ''),

    /*
    | Which OpenRouter model to use.
    */
    'model' => env('AI_MODEL', 'poolside/laguna-xs-2.1'),

    /*
    | Maximum tokens the AI may return per response.
    | 800 is sufficient for detailed conceptual guidance.
    */
    'max_tokens' => (int) env('AI_MAX_TOKENS', 800),

    /*
    | Rate limiting — maximum AI message requests per user per minute.
    | Enforced at the route level via Laravel's throttle middleware.
    */
    'rate_limit_per_minute' => (int) env('AI_RATE_LIMIT', 10),
];
