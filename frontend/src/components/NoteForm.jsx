import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * NoteForm — create or edit a note.
 *
 * Props:
 *   initialNote      existing note object for editing, or null for create
 *   context          optional { type: 'lesson'|'course'|'article', id, label }
 *                    pre-fills the related item when opened from a content page
 *   onSave           (payload) => Promise<void>   called with validated form data
 *   onCancel         () => void
 *   saving           boolean  — disables form while request is in-flight
 *   serverError      string   — error message from the API
 */
const NoteForm = ({ initialNote = null, context = null, onSave, onCancel, saving = false, serverError = '' }) => {
    const { t } = useTranslation();
    const [content, setContent] = useState(initialNote?.content ?? '');
    const [errors,  setErrors]  = useState({});

    const contentRef = useRef(null);

    useEffect(() => { contentRef.current?.focus(); }, []);

    const validate = () => {
        const e = {};
        if (!content.trim()) e.content = t('notes.contentRequired');
        if (content.length > 10_000) e.content = t('notes.contentTooLong');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const bodyText = content.trim();
        const firstSentenceOrLine = bodyText.split(/[.\n]/, 1)[0].trim();
        const titleSource = firstSentenceOrLine || bodyText;
        const maxTitleLength = 60;
        const title = !titleSource
            ? 'Untitled Note'
            : titleSource.length > maxTitleLength
                ? `${titleSource.slice(0, maxTitleLength - 3).trimEnd()}...`
                : titleSource;
        const payload = { title, content: bodyText };

        // Attach context (related item) if provided and not already overridden
        if (context?.type && context?.id) {
            payload.related_type = context.type;
            payload.related_id   = context.id;
        } else if (initialNote?.related_type && initialNote?.related_id) {
            payload.related_type = initialNote.related_type;
            payload.related_id   = initialNote.related_id;
        }

        onSave(payload);
    };

    const isEdit = !!initialNote;

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5">

                {/* Context badge */}
                {context?.label && (
                    <div className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
                        {t('notes.linkedTo', { label: context.label })}
                    </div>
                )}

                {/* Server error */}
                {serverError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        {serverError}
                    </div>
                )}

                {/* Content */}
                <div>
                    <label htmlFor="note-content" className="block text-sm font-medium text-slate-700">
                        {t('notes.contentLabel')} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                        ref={contentRef}
                        id="note-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        maxLength={10_000}
                        rows={6}
                        placeholder={t('notes.contentPlaceholder')}
                        className={`mt-1.5 w-full resize-y rounded-xl border px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-sky-500 ${
                            errors.content ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
                        }`}
                    />
                    <div className="mt-1 flex items-start justify-between">
                        {errors.content
                            ? <p className="text-xs text-rose-600">{errors.content}</p>
                            : <span />
                        }
                        <p className="text-xs text-slate-400">{content.length} / 10,000</p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        {t('notes.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                    >
                        {saving ? t('common.saving') : isEdit ? t('notes.saveChanges') : t('notes.saveNote')}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default NoteForm;
