<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\CloudSyncService;

class AppServiceProvider extends ServiceProvider
{
    public function boot(CloudSyncService $syncService): void
    {
        // Only run sync in non-console web/desktop runtime
        if (!app()->runningInConsole()) {
            try {
                $syncService->syncNow();
            } catch (\Throwable $e) {
                // Silently fallback to offline SQLite storage
            }
        }
    }
}
