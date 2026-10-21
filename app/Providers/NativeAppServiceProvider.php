<?php
namespace App\Providers;

use Illuminate\Support\Facades\Artisan;
use Native\Laravel\Contracts\ProvidesUninstall;
use Native\Laravel\Facades\Window;
use App\Services\ContentSyncService;


class NativeAppServiceProvider implements ProvidesNativeApplication
{
    public function boot(): void
    {
        Window::open()
            ->title('justLearnCode')
            ->width(1200)
            ->height(800)
            ->resizable();
    }
}
