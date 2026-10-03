import TextToSpeechControls from './TextToSpeechControls';
import UserAvatar from './UserAvatar';
import { AiMessage } from './chat/AiMessage';
import { useAuth } from '../contexts/AuthContext';

/**
 * ChatMessage — renders a single message bubble in the AI Tutor chat.
 *
 * Props:
 *   role      'user' | 'assistant'
 *   content   string   plain text (never raw HTML from AI)
 *   isNew     boolean  play subtle entrance animation
 */

/**
 * Simple plain-text renderer.
 * Splits on blank lines for paragraphs; handles numbered lists and bullet lists.
 * NO dangerouslySetInnerHTML — AI content is always treated as plain text.
 */
const renderContent = (text) => {
    const paragraphs = text.split(/\n{2,}/).filter(Boolean);

    return paragraphs.map((para, i) => {
        const lines = para.split('\n').filter(Boolean);

        // Detect numbered list: starts with "1." / "2." etc.
        const isNumbered = lines.every((l) => /^\d+[\.\)]\s/.test(l));
        // Detect bullet list: starts with "-", "•", "*"
        const isBullet   = lines.every((l) => /^[-•*]\s/.test(l));

        if (isNumbered) {
            return (
                <ol key={i} className="mt-2 list-decimal space-y-1 pl-5 first:mt-0">
                    {lines.map((line, j) => (
                        <li key={j}>{line.replace(/^\d+[\.\)]\s/, '')}</li>
                    ))}
                </ol>
            );
        }

        if (isBullet) {
            return (
                <ul key={i} className="mt-2 list-disc space-y-1 pl-5 first:mt-0">
                    {lines.map((line, j) => (
                        <li key={j}>{line.replace(/^[-•*]\s/, '')}</li>
                    ))}
                </ul>
            );
        }

        // Multi-line paragraph — join with spaces
        return (
            <p key={i} className="mt-2 first:mt-0">
                {lines.join(' ')}
            </p>
        );
    });
};

const ChatMessage = ({ role, content, isNew = false }) => {
    const { user } = useAuth();
    const isUser      = role === 'user';
    const isAssistant = role === 'assistant';

    return (
        <div
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isNew ? 'animate-fade-in' : ''}`}
        >
            {/* Avatar — assistant only */}
            {isAssistant && (
                <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700" aria-hidden="true">
                    AI
                </div>
            )}

            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                        ? 'rounded-br-sm bg-slate-900 text-white'
                        : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'
                }`}
            >
                {isAssistant ? <AiMessage content={content} /> : renderContent(content)}
                {isAssistant && <TextToSpeechControls text={content} compact />}
            </div>

            {/* Avatar — user only */}
            {isUser && (
                <UserAvatar user={user} size="sm" className="ml-3 mt-1" />
            )}
        </div>
    );
};

export default ChatMessage;