<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" type="image/png" href="{{ asset('icon.png') }}">
    <title>justLearnCode</title>
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="min-h-screen bg-slate-900 text-white antialiased">
    <div id="app" class="flex flex-col min-h-screen">
        
        <!-- Top Navigation Bar -->
        <header class="bg-slate-800 border-b border-slate-700 px-6 py-3 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <span class="text-xl font-bold text-indigo-400">⚡ justLearnCode</span>
            </div>

            <!-- Sync Button -->
            <div>
                <button id="sync-btn" onclick="triggerDesktopSync()" 
                        class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md">
                    🔄 Sync Curriculum
                </button>
            </div>
        </header>

        <!-- Main Content Area -->
        <main class="flex-1 p-6">
            @yield('content')
        </main>

    </div>

    <!-- Frontend Sync Script -->
    <script>
    async function triggerDesktopSync() {
        const btn = document.getElementById('sync-btn');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Syncing...";
        btn.disabled = true;

        try {
            const response = await fetch('/desktop/sync', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                alert(`🎉 Sync Complete!\n\nUpdated:\n- ${data.counts.languages} Languages\n- ${data.counts.courses} Courses\n- ${data.counts.lessons} Lessons\n- ${data.counts.quizzes} Quizzes`);
                window.location.reload();
            } else {
                alert(`Offline Mode: ${data.message || 'Using local database cache.'}`);
            }
        } catch (error) {
            console.error("Sync error:", error);
            alert("Unable to reach cloud server. Running in offline mode with local database cache.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
    </script>
</body>
</html>
