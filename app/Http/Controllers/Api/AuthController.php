<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'preferred_language' => config('languages.default', 'en'),
            'speech_rate' => 1.0,
        ]);

        Auth::login($user);

        return response()->json([
            'message' => 'Registered successfully.',
            'user' => $user->toAuthArray(),
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($validated)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $request->session()->regenerate();

        $user = Auth::user();

        return response()->json([
            'message' => 'Logged in successfully.',
            'user' => $user->toAuthArray(),
        ]);
    }

    public function sendResetLink(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        Password::sendResetLink(['email' => $validated['email']]);

        return response()->json([
            'message' => 'If an account exists for that email, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $status = Password::reset(
            $validated,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => match ($status) {
                    Password::INVALID_TOKEN => 'This password reset link is invalid or has expired.',
                    Password::INVALID_USER => 'This password reset link is invalid or has expired.',
                    default => 'Unable to reset the password. Please request a new reset link.',
                },
            ], 422);
        }

        return response()->json([
            'message' => 'Your password has been reset successfully.',
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()?->toAuthArray(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->forceFill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ])->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh()->toAuthArray(),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $request->user()->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function updateProfilePicture(Request $request)
    {
        $request->validate(['profile_picture' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048']]);
        $user = $request->user();
        if ($user->profile_picture_path) Storage::disk('public')->delete($user->profile_picture_path);
        $user->profile_picture_path = $request->file('profile_picture')->store('profile-pictures', 'public');
        $user->save();
        return response()->json(['message' => 'Profile picture updated successfully.', 'user' => $user->fresh()->toAuthArray()]);
    }

    public function deleteProfilePicture(Request $request)
    {
        $user = $request->user();
        if ($user->profile_picture_path) Storage::disk('public')->delete($user->profile_picture_path);
        $user->forceFill(['profile_picture_path' => null])->save();
        return response()->json(['message' => 'Profile picture deleted successfully.', 'user' => $user->fresh()->toAuthArray()]);
    }
}
