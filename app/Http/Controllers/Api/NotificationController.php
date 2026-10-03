<?php

namespace App\Http\Controllers\Api;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController
{
    public function index(Request $request)
    {
        $notifications = $request->user()->notifications()->latest()->paginate(20);
        return response()->json([
            'data' => $notifications->map(fn (Notification $notification) => [
                'id' => $notification->id, 'type' => $notification->type,
                'title' => $notification->title, 'message' => $notification->message,
                'read_at' => $notification->read_at, 'created_at' => $notification->created_at,
            ]),
            'unread_count' => $request->user()->notifications()->whereNull('read_at')->count(),
            'pagination' => ['current_page' => $notifications->currentPage(), 'last_page' => $notifications->lastPage(), 'total' => $notifications->total()],
        ]);
    }

    public function read(Notification $notification, Request $request)
    {
        abort_unless($notification->user_id === $request->user()->id, 404);
        $notification->update(['read_at' => now()]);
        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function readAll(Request $request)
    {
        $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['message' => 'Notifications marked as read.']);
    }

    public function destroy(Notification $notification, Request $request)
    {
        abort_unless($notification->user_id === $request->user()->id, 404);
        $notification->delete();
        return response()->noContent();
    }
}
