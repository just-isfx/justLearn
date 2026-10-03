import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate } from '../utils/formatLocale';

const typeKey = { course: 'notes.typeCourse', lesson: 'notes.typeLesson', article: 'notes.typeArticle' };

const NoteCard = ({ note, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const { language } = useLanguage();

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <h4 className="truncate text-base font-semibold text-slate-900">{note.title}</h4>

                    {note.content_preview && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">
                            {note.content_preview}
                            {note.content_preview.length >= 150 ? '…' : ''}
                        </p>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        {note.related_label && (
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 font-medium">
                                {t(typeKey[note.related_type] || 'notes.typeArticle')}: {note.related_label}
                            </span>
                        )}
                        <span>{formatDate(note.updated_at, language, t, 'updated')}</span>
                    </div>
                </div>

                <div className="flex shrink-0 gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(note)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        {t('notes.edit')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(note)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                        {t('notes.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoteCard;
