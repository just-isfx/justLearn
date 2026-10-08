<?php

namespace App\Providers;

use Native\Desktop\Facades\Menu;
use Native\Desktop\Facades\Window;
use Native\Desktop\Contracts\ProvidesPhpIni;

class NativeAppServiceProvider implements ProvidesPhpIni
{
    /**
     * Executed once the native application has been booted.
     */
    public function boot(): void
    {
        // 1. Clear top application menu bar (File, Edit, View, Window, Help)
        Menu::clear();

        // 2. Open main window maximized by default with standard controls
        Window::open()
            ->titleBarHidden()
            ->maximized()
            ->rememberState();
    }

    /**
     * Return an array of php.ini directives to be set.
     */
    public function phpIni(): array
    {
        return [
            //
        ];
    }
}
