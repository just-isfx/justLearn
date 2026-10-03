<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiConversation extends Model
{
    use HasFactory;

    protected $table = 'ai_conversations';

    protected $fillable = [
        'user_id',
        'title',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AiMessage::class, 'conversation_id')
                    ->orderBy('created_at');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Generate a clean conversation title from the first user message.
     * Capitalises and trims to 80 characters.
     */
    public static function titleFromMessage(string $message): string
    {
        $clean = preg_replace('/\s+/', ' ', trim($message));
        $title = mb_substr($clean, 0, 80);

        // If the message is very long, end cleanly at a word boundary
        if (mb_strlen($clean) > 80) {
            $title = mb_substr($title, 0, mb_strrpos($title, ' ') ?: 80);
            $title .= '…';
        }

        return $title ?: 'New Conversation';
    }
}
