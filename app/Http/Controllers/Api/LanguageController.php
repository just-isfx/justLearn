<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LanguageController extends Controller
{
    public function updateLanguage(Request $request)
    {
        $validated = $request->validate([
            'language' => ['required', 'string', Rule::in(config('languages.supported'))],
        ]);

        $user = $request->user();
        $user->preferred_language = $validated['language'];
        $user->save();

        return response()->json([
            'message' => 'Language preference updated.',
            'user' => $user->fresh()->toAuthArray(),
        ]);
    }

    public function updateSpeechSettings(Request $request)
    {
        $validated = $request->validate([
            'speech_rate' => ['required', 'numeric', 'min:0.5', 'max:2'],
        ]);

        $user = $request->user();
        $user->speech_rate = round((float) $validated['speech_rate'], 2);
        $user->save();

        return response()->json([
            'message' => 'Speech settings updated.',
            'user' => $user->fresh()->toAuthArray(),
        ]);
    }

    public function updateThemePreference(Request $request)
    {
        $validated = $request->validate([
            'theme_preference' => ['required', 'string', Rule::in(['light', 'dark', 'system'])],
        ]);

        $user = $request->user();
        $user->theme_preference = $validated['theme_preference'];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Theme preference updated.',
            'theme_preference' => $user->theme_preference,
            'user' => $user->fresh()->toAuthArray(),
        ]);
    }
}
