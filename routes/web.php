<?php

use Illuminate\Support\Facades\Route;
use App\Services\CloudSyncService;

// 1. CSRF Token Endpoint for SPA / Fetch Requests
Route::get('/csrf-token', function () {
    return response()->json(['token' => csrf_token()]);
});

// 2. Desktop Manual Cloud Sync Endpoint
Route::post('/desktop/sync', function (CloudSyncService $syncService) {
    return response()->json($syncService->syncNow());
});

// 3. Secret Admin Panel Route (if accessed locally)
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/ajshsh', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('admin.dashboard');
});

// 4. Main App Root
Route::get('/', function () {
    return view('app');
});

// 5. Catch-all SPA Route (MUST remain at the very bottom)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
