import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ChatInput — message composer for the AI Tutor.
 *
 * Props:
 *   value       string
 *   onChange    (value) => void
 *   onSubmit    () => void
 *   disabled    boolean   — prevents sending while AI is thinking
 *   allowEmptySubmit boolean — allows sending context without typed text
 *   placeholder string
 */
const ChatInput = ({
    value       = '',
    onChange,
    onSubmit,
    disabled    = false,
    allowEmptySubmit = false,
    placeholder,
}) => {
    const { t } = useTranslation();
    const resolvedPlaceholder = placeholder || t('ai.typeQuestion');
    const textareaRef = useRef(null);
    const canSubmit = value.trim() || allowEmptySubmit;

    // Auto-resize textarea as content grows
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [value]);

    const handleKeyDown = (e) => {
        // Enter sends; Shift+Enter inserts a newline
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && canSubmit) onSubmit();
        }
    };

    return (
        <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
            <textarea
                ref={textareaRef}
                rows={1}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={resolvedPlaceholder}
                className="flex-1 resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
                aria-label="Message input"
                aria-multiline="true"
            />
            <button
                type="button"
                onClick={onSubmit}
                disabled={disabled || !canSubmit}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-700 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
                aria-label={t('ai.send')}
            >
                {/* Send arrow icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
                </svg>
            </button>
        </div>
    );
};

export default ChatInput;
