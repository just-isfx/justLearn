<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Services\AiTutorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiTutorController extends Controller
{
    public function __construct(private readonly AiTutorService $aiService) {}

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/ai/conversations
    // ─────────────────────────────────────────────────────────────────────

    public function listConversations()
    {
        $conversations = AiConversation::forUser(Auth::id())
            ->orderByDesc('updated_at')
            ->get(['id', 'title', 'created_at', 'updated_at']);

        return response()->json(['data' => $conversations]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/ai/conversations
    // Create a new empty conversation.
    // ─────────────────────────────────────────────────────────────────────

    public function createConversation()
    {
        $conversation = AiConversation::create([
            'user_id' => Auth::id(),
            'title'   => 'New Conversation',
        ]);

        return response()->json([
            'id'         => $conversation->id,
            'title'      => $conversation->title,
            'messages'   => [],
            'created_at' => $conversation->created_at,
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/ai/conversations/{conversation}
    // Load a conversation and its full message history.
    // ─────────────────────────────────────────────────────────────────────

    public function showConversation(AiConversation $conversation)
    {
        $this->authorise($conversation);

        $messages = $conversation->messages()
            ->get(['id', 'role', 'content', 'created_at']);

        return response()->json([
            'id'         => $conversation->id,
            'title'      => $conversation->title,
            'messages'   => $messages,
            'created_at' => $conversation->created_at,
            'updated_at' => $conversation->updated_at,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/ai/conversations/{conversation}/messages
    // Send a user message; get an AI reply; persist both.
    // ─────────────────────────────────────────────────────────────────────

    public function sendMessage(Request $request, AiConversation $conversation)
    {
        $this->authorise($conversation);

        $validated = $request->validate([
            'message'          => ['required', 'string', 'min:1', 'max:2000'],
            'learning_context' => ['nullable', 'string', 'max:2000'],
        ]);

        $userMessage = trim($validated['message']);

        // ── Persist user message ──────────────────────────────────────────
        AiMessage::create([
            'conversation_id' => $conversation->id,
            'role'            => 'user',
            'content'         => $userMessage,
        ]);

        // ── Auto-title the conversation on the first message ──────────────
        if ($conversation->title === 'New Conversation') {
            $conversation->update([
                'title' => AiConversation::titleFromMessage($userMessage),
            ]);
        }

        // ── Build history for the AI (last 20 messages to limit token use) ──
        $history = AiMessage::where('conversation_id', $conversation->id)
            ->orderBy('created_at')
            ->get(['role', 'content'])
            ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])
            ->toArray();

        // Keep only the most recent 20 exchanges to stay within token limits
        if (count($history) > 20) {
            $history = array_slice($history, -20);
        }

        // ── Call the AI service ───────────────────────────────────────────
        try {
            $aiReply = $this->aiService->chat(
                $history,
                $validated['learning_context'] ?? null
            );
        } catch (\RuntimeException $e) {
            // API key not configured
            return response()->json([
                'error' => 'AI Tutor is not configured. Please contact the administrator.',
            ], 503);
        } catch (\Exception $e) {
            return match ($e->getMessage()) {
                'authentication_error' => response()->json([
                    'error' => 'The AI Tutor authentication failed. Please contact the administrator.',
                ], 503),
                'insufficient_quota' => response()->json([
                    'error' => 'The AI Tutor is temporarily unavailable because its usage credits are exhausted.',
                ], 503),
                'rate_limit' => response()->json([
                    'error' => 'The AI Tutor is receiving too many requests right now. Please wait a moment and try again.',
                ], 429),
                'connection_error' => response()->json([
                    'error' => 'The AI Tutor could not connect to the provider. Please try again in a moment.',
                ], 503),
                default => response()->json([
                    'error' => 'The AI Tutor is temporarily unavailable. Please try again in a moment.',
                ], 503),
            };
        }

        // ── Persist AI response ───────────────────────────────────────────
        $assistantMessage = AiMessage::create([
            'conversation_id' => $conversation->id,
            'role'            => 'assistant',
            'content'         => $aiReply,
        ]);

        // Touch conversation so it bubbles to the top of the list
        $conversation->touch();

        return response()->json([
            'message' => [
                'id'         => $assistantMessage->id,
                'role'       => 'assistant',
                'content'    => $aiReply,
                'created_at' => $assistantMessage->created_at,
            ],
            'conversation_title' => $conversation->fresh()->title,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE /api/ai/conversations/{conversation}
    // ─────────────────────────────────────────────────────────────────────

    public function deleteConversation(AiConversation $conversation)
    {
        $this->authorise($conversation);
        $conversation->delete(); // cascades to ai_messages via FK
        return response()->json(['message' => 'Conversation deleted.']);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────

    private function authorise(AiConversation $conversation): void
    {
        if ($conversation->user_id !== Auth::id()) {
            abort(403, 'Unauthorised.');
        }
    }
}
