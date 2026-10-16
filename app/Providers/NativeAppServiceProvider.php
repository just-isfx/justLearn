<?php

namespace App\Providers;

use Native\Desktop\Facades\Window;
use Native\Desktop\Contracts\ProvidesPhpIni;

class NativeAppServiceProvider implements ProvidesPhpIni
{
    public function boot(): void
{
    Window::open()
        ->width(1050)
        ->height(750)
        ->center()
        ->titleBarHidden()
        ->rememberState();
}

    public function phpIni(): array
    {
        return [];
    }
}
