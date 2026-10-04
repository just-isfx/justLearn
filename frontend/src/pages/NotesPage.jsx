import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import NoteCard from '../components/NoteCard';
import NoteForm from '../components/NoteForm';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { getNotes, createNote, updateNote, deleteNote } from '../services/noteService';

// ─── Skeleton row ──────────────────────────────────────────────────────────────
const RowSkeleton = () => (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
                <div className="h-5 w-48 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-200" />
                <div className="h-3 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-24 rounded bg-slate-200" />
            </div>
            <div className="flex gap-2">
                <div className="h-7 w-12 rounded-lg bg-slate-200" />
                <div className="h-7 w-14 rounded-lg bg-slate-200" />
            </div>
        </div>
    </div>
);

// ─── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ hasSearch, onClear, onCreate }) => {
    const { t } = useTranslation();
    return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-8 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-2xl">
            📝
        </div>
        {hasSearch ? (
            <>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">{t('notes.noSearchTitle')}</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-600">
                    {t('notes.noSearchBody')}
                </p>
                <button
                    type="button"
                    onClick={onClear}
                    className="mt-6 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                    {t('notes.clearSearch')}
                </button>
            </>
        ) : (
            <>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">{t('notes.emptyTitle')}</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-600">
                    {t('notes.emptyBody')}
                </p>
                <button
                    type="button"
                    onClick={onCreate}
                    className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                    {t('notes.createFirst')}
                </button>
            </>
        )}
    </div>
    );
};

// ─── Inline modal overlay ──────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => {
    const { t } = useTranslation();
    // Prevent background scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-modal-title"
        >
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                    <h3 id="note-modal-title" className="text-lg font-semibold text-slate-900">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                        aria-label={t('common.close')}
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// ─── Main page ─────────────────────────────────────────────────────────────────
const NotesPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [notes,       setNotes]       = useState([]);
    const [pagination,  setPagination]  = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pageNum,     setPageNum]     = useState(1);
    const [error,       setError]       = useState('');

    // Search
    const [searchInput,  setSearchInput]  = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const searchTimeout = useRef(null);

    // Modal state
    const [mode,         setMode]         = useState(null); // 'create' | 'edit' | null
    const [editingNote,  setEditingNote]  = useState(null);
    const [saving,       setSaving]       = useState(false);
    const [saveError,    setSaveError]    = useState('');

    // Delete state
    const [deleteTarget,  setDeleteTarget]  = useState(null);
    const [deleting,      setDeleting]      = useState(false);

    // Success banner
    const [successMsg, setSuccessMsg] = useState('');
    const successTimeout = useRef(null);

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        clearTimeout(successTimeout.current);
        successTimeout.current = setTimeout(() => setSuccessMsg(''), 3000);
    };

    // ── Data loading ───────────────────────────────────────────────────────
    const loadNotes = useCallback(async (search, page, append = false) => {
        if (page === 1) setLoading(true);
        else setLoadingMore(true);
        setError('');

        try {
            const result = await getNotes({ search, page, perPage: 20 });
            setNotes((prev) => append ? [...prev, ...result.data] : result.data);
            setPagination(result.pagination);
        } catch {
            setError(t('notes.loadError'));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    // Initial load
    useEffect(() => { loadNotes('', 1, false); }, [loadNotes]);

    // Debounced search
    useEffect(() => {
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setActiveSearch(searchInput);
            setPageNum(1);
            loadNotes(searchInput, 1, false);
        }, 350);
        return () => clearTimeout(searchTimeout.current);
    }, [searchInput, loadNotes]);

    const handleLoadMore = () => {
        const next = pageNum + 1;
        setPageNum(next);
        loadNotes(activeSearch, next, true);
    };

    // ── CRUD handlers ──────────────────────────────────────────────────────
    const openCreate = useCallback(() => { setSaveError(''); setEditingNote(null); setMode('create'); }, []);
    const openEdit   = (note) => { setSaveError(''); setEditingNote(note); setMode('edit'); };
    const closeModal = () => { setMode(null); setEditingNote(null); setSaveError(''); };

    useEffect(() => {
        if (searchParams.get('create') !== '1') return;

        openCreate();
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.delete('create');
        setSearchParams(nextSearchParams, { replace: true });
    }, [openCreate, searchParams, setSearchParams]);

    const handleSave = async (payload) => {
        setSaving(true);
        setSaveError('');
        try {
            if (mode === 'edit') {
                const updated = await updateNote(editingNote.id, payload);
                setNotes((prev) => prev.map((n) => n.id === updated.id ? updated : n));
                showSuccess(t('notes.updated'));
            } else {
                const created = await createNote(payload);
                setNotes((prev) => [created, ...prev]);
                if (pagination) setPagination((p) => ({ ...p, total: p.total + 1 }));
                showSuccess(t('notes.saved'));
            }
            closeModal();
        } catch (err) {
            const msg = err?.response?.data?.message
                || Object.values(err?.response?.data?.errors ?? {})[0]?.[0]
                || t('notes.saveError');
            setSaveError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (note) => setDeleteTarget(note);
    const handleDeleteCancel = () => setDeleteTarget(null);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteNote(deleteTarget.id);
            setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
            if (pagination) setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
            showSuccess(t('notes.deleted'));
        } catch {
            setError(t('notes.deleteError'));
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const hasMore = pagination && pagination.current_page < pagination.last_page;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

                {/* Header row */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">
                            {t('notes.eyebrow')}
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">{t('notes.title')}</h2>
                        {pagination && (
                            <p className="mt-1 text-sm text-slate-500">
                                {t('notes.count', { count: pagination.total })}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                        + {t('notes.newNote')}
                    </button>
                </div>

                {/* Search */}
                <div className="mt-6">
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder={t('notes.searchPlaceholder')}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 sm:max-w-sm"
                    />
                </div>

                {/* Success banner */}
                {successMsg && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                        {successMsg}
                    </div>
                )}

                {/* Error banner */}
                {error && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {/* Content */}
                <div className="mt-8">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => <RowSkeleton key={i} />)}
                        </div>
                    ) : notes.length === 0 ? (
                        <EmptyState
                            hasSearch={!!activeSearch}
                            onClear={() => setSearchInput('')}
                            onCreate={openCreate}
                        />
                    ) : (
                        <>
                            <div className="space-y-4">
                                {notes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        onEdit={openEdit}
                                        onDelete={handleDeleteClick}
                                    />
                                ))}
                            </div>

                            {hasMore && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        {loadingMore ? t('common.loading') : t('common.loadMore')}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Create / Edit modal */}
            {mode && (
                <Modal
                    title={mode === 'edit' ? t('notes.editNote') : t('notes.newNote')}
                    onClose={closeModal}
                >
                    <NoteForm
                        initialNote={mode === 'edit' ? editingNote : null}
                        onSave={handleSave}
                        onCancel={closeModal}
                        saving={saving}
                        serverError={saveError}
                    />
                </Modal>
            )}

            {/* Delete confirmation */}
            {deleteTarget && (
                <DeleteConfirmModal
                    title={t('notes.deleteTitle')}
                    message={t('notes.deleteMessage', { title: deleteTarget.title })}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    confirming={deleting}
                />
            )}
        </PageContainer>
    );
};

export default NotesPage;
