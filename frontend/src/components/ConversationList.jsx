import DeleteConfirmModal from './DeleteConfirmModal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate as formatLocalizedDate } from '../utils/formatLocale';

/**
 * ConversationList — sidebar list of past AI Tutor conversations.
 *
 * Props:
 *   conversations   [{ id, title, updated_at }]
 *   activeId        number | null
 *   onSelect        (id) => void
 *   onNew           () => void
 *   onDelete        (id) => void
 *   loading         boolean
 */
const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const diffDays = Math.floor((new Date() - d) / 86_400_000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const ConversationList = ({
    conversations = [],
    activeId      = null,
    onSelect,
    onNew,
    onDelete,
    loading       = false,
}) => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting]     = useState(false);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await onDelete(deleteTarget.id);
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    return (
        <>
            <div className="flex flex-col h-full">
                {/* New conversation button */}
                <button
                    type="button"
                    onClick={onNew}
                    className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                >
                    <span aria-hidden="true">+</span>
                    {t('ai.newConversation')}
                </button>

                {/* List */}
                <div className="mt-4 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                            ))}
                        </div>
                    ) : conversations.length === 0 ? (
                        <p className="mt-4 text-xs text-slate-400">
                            {t('ai.noConversations')}
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {conversations.map((conv) => (
                                <li key={conv.id} className="group flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onSelect(conv.id)}
                                        className={`flex-1 min-w-0 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                                            activeId === conv.id
                                                ? 'bg-slate-800 text-white'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                    >
                                        <p className="truncate font-medium leading-tight">
                                            {conv.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {formatLocalizedDate(conv.updated_at, language, t, 'relative')}
                                        </p>
                                    </button>

                                    {/* Delete button — visible on hover */}
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(conv)}
                                        className="shrink-0 rounded-lg p-1 text-slate-600 opacity-0 transition hover:text-rose-400 group-hover:opacity-100 focus:opacity-100"
                                        aria-label={t('ai.deleteAria', { title: conv.title })}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                                            <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.36 15h5.28a1.5 1.5 0 0 0 1.495-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.712Z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {deleteTarget && (
                <DeleteConfirmModal
                    title={t('ai.deleteTitle')}
                    message={t('ai.deleteMessage', { title: deleteTarget.title })}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                    confirming={deleting}
                />
            )}
        </>
    );
};

export default ConversationList;
