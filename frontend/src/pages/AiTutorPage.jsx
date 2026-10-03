import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import ConversationList from '../components/ConversationList';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import {
    getConversations,
    createConversation,
    getConversation,
    deleteConversation,
    sendMessage,
} from '../services/aiService';

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => {
    const { t } = useTranslation();
    return (
    <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700" aria-hidden="true">
            AI
        </div>
        <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-1" aria-label={t('ai.thinking')}>
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-slate-400"
                        style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                        aria-hidden="true"
                    />
                ))}
                <style>{`@keyframes bounce { 0%,80%,100% { transform: scale(0.7); opacity: 0.5 } 40% { transform: scale(1); opacity: 1 } }`}</style>
            </div>
        </div>
    </div>
    );
};

// ─── Welcome screen (no active conversation) ──────────────────────────────────
const WelcomeScreen = ({ onNew }) => {
    const { t } = useTranslation();
    return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-2xl font-bold text-sky-700">
            AI
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-slate-900">
            {t('ai.heading')}
        </h2>
        <p className="mt-3 max-w-md text-sm text-slate-600">
            {t('ai.intro')}
        </p>
        <button
            type="button"
            onClick={onNew}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
            {t('ai.startConversation')}
        </button>
    </div>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const AiTutorPage = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    // Conversation list
    const [conversations,     setConversations]     = useState([]);
    const [convsLoading,      setConvsLoading]      = useState(true);

    // Active conversation
    const [activeId,          setActiveId]          = useState(null);
    const [activeTitle,       setActiveTitle]       = useState('');
    const [messages,          setMessages]          = useState([]);
    const [convLoading,       setConvLoading]       = useState(false);

    // Input + sending
    const [input,             setInput]             = useState('');
    const [sending,           setSending]           = useState(false);
    const [error,             setError]             = useState('');
    const [highlightedContext, setHighlightedContext] = useState(null);

    // Scroll anchor
    const bottomRef = useRef(null);
    const handledSelectionRef = useRef(null);
    const autoPromptTimerRef = useRef(null);
    const autoPromptedSelectionRef = useRef(null);

    // Auto-scroll whenever messages change or AI is typing
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    // ── Load conversation list ─────────────────────────────────────────────
    const loadConversations = useCallback(async () => {
        setConvsLoading(true);
        try {
            const data = await getConversations();
            setConversations(data);
        } catch {
            // Non-fatal — sidebar just stays empty
        } finally {
            setConvsLoading(false);
        }
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    // ── Open a conversation ────────────────────────────────────────────────
    const handleSelectConversation = useCallback(async (id) => {
        if (id === activeId) return;
        setConvLoading(true);
        setError('');
        setMessages([]);
        setActiveId(id);
        setActiveTitle('');
        try {
            const data = await getConversation(id);
            setMessages(data.messages ?? []);
            setActiveTitle(data.title ?? '');
        } catch {
            setError(t('ai.loadError'));
        } finally {
            setConvLoading(false);
        }
    }, [activeId]);

    // ── New conversation ───────────────────────────────────────────────────
    const handleNew = useCallback(async () => {
        setError('');
        try {
            const conv = await createConversation();
            setConversations((prev) => [conv, ...prev]);
            setActiveId(conv.id);
            setActiveTitle(conv.title);
            setMessages([]);
        } catch {
            setError(t('ai.createError'));
        }
    }, []);

    // A lesson selection arrives through router state so the existing tutor
    // conversation and message API remain the only AI integration.
    useEffect(() => {
        const selectedText = location.state?.highlightedContext?.trim();
        if (!selectedText || handledSelectionRef.current === selectedText) return;

        handledSelectionRef.current = selectedText;
        autoPromptedSelectionRef.current = null;
        setInput('');
        setHighlightedContext(selectedText);
        navigate(location.pathname, { replace: true, state: null });

        if (!activeId) {
            handleNew();
        }
    }, [location, activeId, handleNew, navigate, t]);

    // ── Delete conversation ────────────────────────────────────────────────
    const handleDelete = useCallback(async (id) => {
        await deleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeId === id) {
            setActiveId(null);
            setActiveTitle('');
            setMessages([]);
        }
    }, [activeId]);

    // ── Send message ───────────────────────────────────────────────────────
    const handleSend = useCallback(async () => {
        const text = input.trim();
        const context = highlightedContext?.trim();
        if ((!text && !context) || sending || !activeId) return;

        const message = text || `Please explain this selected code/text: ${context}`;

        setInput('');
        setError('');
        setSending(true);

        // Optimistically append user message
        const tempUserMsg = {
            id:         `temp-${Date.now()}`,
            role:       'user',
            content:    message,
            created_at: new Date().toISOString(),
            isNew:      true,
        };
        setMessages((prev) => [...prev, tempUserMsg]);

        try {
            const result = await sendMessage(activeId, message, context);

            // Update title if the conversation was auto-titled
            if (result.conversation_title) {
                setActiveTitle(result.conversation_title);
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === activeId
                            ? { ...c, title: result.conversation_title, updated_at: new Date().toISOString() }
                            : c
                    )
                );
            }

            // Append AI reply
            setMessages((prev) => [
                ...prev,
                { ...result.message, isNew: true },
            ]);
            setHighlightedContext(null);
            handledSelectionRef.current = null;
            autoPromptedSelectionRef.current = null;
        } catch (err) {
            const msg = err?.response?.data?.error
                || t('ai.unavailable');
            setError(msg);
            // Remove optimistic user message on failure
            setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
            setInput(text); // restore input so the user doesn't lose their message
        } finally {
            setSending(false);
        }
    }, [input, sending, activeId, highlightedContext]);

    useEffect(() => {
        if (!highlightedContext || !activeId || input.trim() || sending || convLoading
            || autoPromptedSelectionRef.current === highlightedContext) {
            if (autoPromptTimerRef.current) {
                window.clearTimeout(autoPromptTimerRef.current);
                autoPromptTimerRef.current = null;
            }
            return undefined;
        }

        autoPromptTimerRef.current = window.setTimeout(() => {
            autoPromptTimerRef.current = null;
            autoPromptedSelectionRef.current = highlightedContext;
            handleSend();
        }, 900);

        return () => {
            if (autoPromptTimerRef.current) {
                window.clearTimeout(autoPromptTimerRef.current);
                autoPromptTimerRef.current = null;
            }
        };
    }, [highlightedContext, activeId, input, sending, convLoading, handleSend]);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <PageContainer>
            <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                {/* ── Sidebar ── */}
                <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-950 p-4">
                    <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            {t('ai.title')}
                        </p>
                    </div>
                    <ConversationList
                        conversations={conversations}
                        activeId={activeId}
                        onSelect={handleSelectConversation}
                        onNew={handleNew}
                        onDelete={handleDelete}
                        loading={convsLoading}
                    />
                </aside>

                {/* ── Main chat area ── */}
                <div className="flex flex-1 flex-col overflow-hidden">

                    {/* Header */}
                    {activeId && (
                        <div className="shrink-0 border-b border-slate-200 px-6 py-4">
                            <h3 className="truncate text-base font-semibold text-slate-900">
                                {activeTitle || t('ai.newConversation')}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {t('ai.guided')}
                            </p>
                        </div>
                    )}

                    {/* Messages area */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {!activeId && (
                            <WelcomeScreen onNew={handleNew} />
                        )}

                        {activeId && convLoading && (
                            <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                                {t('ai.loadingConversation')}
                            </div>
                        )}

                        {activeId && !convLoading && messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-sm font-medium text-slate-700">
                                    {t('ai.emptyPrompt')}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    {t('ai.emptyHint')}
                                </p>
                            </div>
                        )}

                        {activeId && !convLoading && messages.length > 0 && (
                            <div className="space-y-5">
                                {messages.map((msg) => (
                                    <ChatMessage
                                        key={msg.id}
                                        role={msg.role}
                                        content={msg.content}
                                        isNew={msg.isNew ?? false}
                                    />
                                ))}
                                {sending && <TypingIndicator />}
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="shrink-0 border-t border-rose-100 bg-rose-50 px-6 py-3 text-sm text-rose-700">
                            {error}
                            <button
                                type="button"
                                onClick={() => setError('')}
                                className="ml-3 text-xs font-medium underline"
                            >
                                {t('common.dismiss')}
                            </button>
                        </div>
                    )}

                    {/* Input */}
                    {activeId && (
                        <div className="shrink-0 border-t border-slate-200 p-4">
                            {sending && (
                                <p className="mb-2 text-center text-xs text-slate-400">
                                    {t('ai.thinkingEllipsis')}
                                </p>
                            )}
                            {highlightedContext && (
                                <div className="mb-2 flex max-w-full items-center gap-2 rounded-lg border border-sky-200 bg-sky-100 px-3 py-2 text-sm text-sky-700">
                                    <span className="min-w-0 flex-1 truncate">
                                        ({highlightedContext.replace(/\s+/g, ' ').slice(0, 15)}...)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHighlightedContext(null);
                                            handledSelectionRef.current = null;
                                        }}
                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-sky-700 transition hover:bg-sky-100 hover:text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        aria-label="Clear highlighted context"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            <ChatInput
                                value={input}
                                onChange={setInput}
                                onSubmit={handleSend}
                                allowEmptySubmit={!!highlightedContext}
                                disabled={sending || convLoading}
                                placeholder={t('ai.placeholder')}
                            />
                            <p className="mt-2 text-center text-xs text-slate-400">
                                {t('ai.footer')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default AiTutorPage;