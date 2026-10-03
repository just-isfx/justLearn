import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * DeleteConfirmModal — generic confirmation dialog.
 *
 * Props:
 *   title       string   heading text
 *   message     string   body text
 *   onConfirm   () => void
 *   onCancel    () => void
 *   confirming  boolean  — disables buttons while request is in-flight
 */
const DeleteConfirmModal = ({
    title      = 'Delete?',
    message    = 'This action cannot be undone.',
    onConfirm,
    onCancel,
    confirming = false,
}) => {
    const { t } = useTranslation();
    const cancelRef = useRef(null);

    // Focus cancel button on open (safer default action)
    useEffect(() => { cancelRef.current?.focus(); }, []);

    // Close on Escape key
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onCancel]);

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dcm-title"
        >
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
                <h3 id="dcm-title" className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{message}</p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onCancel}
                        disabled={confirming}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={confirming}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                    >
                        {confirming ? t('common.deleting') : t('common.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
