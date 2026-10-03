import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { getFavorites, removeFavorite } from '../services/favoriteService';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate } from '../utils/formatLocale';

const itemUrl = (fav) => {
    if (fav.type === 'course')  return `/courses/${fav.slug}`;
    if (fav.type === 'lesson')  return `/courses/${fav.parent_slug}/lessons/${fav.slug}`;
    if (fav.type === 'article') return `/library/${fav.slug}`;
    return '#';
};

const pillColors = {
    course:  'bg-sky-50 text-sky-700',
    lesson:  'bg-violet-50 text-violet-700',
    article: 'bg-emerald-50 text-emerald-700',
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const RowSkeleton = () => (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
                <div className="h-3 w-20 rounded bg-slate-200" />
                <div className="h-5 w-56 rounded bg-slate-200" />
                <div className="h-3 w-32 rounded bg-slate-200" />
            </div>
            <div className="h-7 w-16 rounded-lg bg-slate-200" />
        </div>
    </div>
);

// ─── Single favorite row ───────────────────────────────────────────────────────
const FavoriteRow = ({ fav, onRemove }) => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const typePill = { course: t('favorites.typeCourse'), lesson: t('favorites.typeLesson'), article: t('favorites.typeArticle') };

    return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
        <Link to={itemUrl(fav)} className="group min-w-0 flex-1">
            <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pillColors[fav.type] ?? 'bg-slate-100 text-slate-600'}`}>
                    {typePill[fav.type] ?? fav.type}
                </span>
                {fav.parent_name && (
                    <span className="truncate text-xs text-slate-400">{fav.parent_name}</span>
                )}
            </div>
            <p className="mt-1.5 truncate font-semibold text-slate-900 group-hover:text-sky-700 transition">
                {fav.title}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{formatDate(fav.created_at, language, t, 'added')}</p>
        </Link>

        <button
            type="button"
            onClick={() => onRemove(fav)}
            className="shrink-0 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
        >
            {t('favorites.remove')}
        </button>
    </div>
    );
};

// ─── Section block ─────────────────────────────────────────────────────────────
const Section = ({ title, items, onRemove }) => {
    if (items.length === 0) return null;
    return (
        <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {title}
            </h3>
            <div className="space-y-3">
                {items.map((fav) => (
                    <FavoriteRow key={fav.id} fav={fav} onRemove={onRemove} />
                ))}
            </div>
        </div>
    );
};

// ─── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = () => {
    const { t } = useTranslation();
    return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-8 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-2xl">
            ★
        </div>
        <h3 className="mt-5 text-xl font-semibold text-slate-900">{t('favorites.emptyTitle')}</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-600">
            {t('favorites.emptyBody')}
        </p>
        <Link
            to="/learn"
            className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
            {t('favorites.explore')}
        </Link>
    </div>
    );
};

// ─── Main page ─────────────────────────────────────────────────────────────────
const FavoritesPage = () => {
    const { t } = useTranslation();
    const [grouped,  setGrouped]  = useState({ courses: [], lessons: [], articles: [] });
    const [total,    setTotal]    = useState(0);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState('');

    // Remove flow
    const [removeTarget,  setRemoveTarget]  = useState(null);
    const [removing,      setRemoving]      = useState(false);

    // Success banner
    const [successMsg, setSuccessMsg] = useState('');
    const successTimeout = useRef(null);

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        clearTimeout(successTimeout.current);
        successTimeout.current = setTimeout(() => setSuccessMsg(''), 3000);
    };

    // ── Load favorites ─────────────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getFavorites();
            setGrouped(result.grouped);
            setTotal(result.total);
        } catch {
            setError(t('favorites.loadError'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── Remove ─────────────────────────────────────────────────────────────
    const handleRemoveClick  = (fav) => setRemoveTarget(fav);
    const handleRemoveCancel = () => setRemoveTarget(null);

    const handleRemoveConfirm = async () => {
        if (!removeTarget) return;
        setRemoving(true);
        try {
            await removeFavorite(removeTarget.id);

            // Remove from local state
            setGrouped((prev) => {
                const key = removeTarget.type === 'article' ? 'articles'
                    : removeTarget.type === 'course' ? 'courses' : 'lessons';
                return { ...prev, [key]: prev[key].filter((f) => f.id !== removeTarget.id) };
            });
            setTotal((t) => Math.max(0, t - 1));
            showSuccess(t('favorites.removed'));
        } catch {
            setError(t('favorites.removeError'));
        } finally {
            setRemoving(false);
            setRemoveTarget(null);
        }
    };

    const isEmpty = !loading && total === 0;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

                {/* Header */}
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">
                        {t('favorites.eyebrow')}
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">{t('favorites.title')}</h2>
                    {!loading && total > 0 && (
                        <p className="mt-1 text-sm text-slate-500">
                            {t('favorites.savedCount', { count: total })}
                        </p>
                    )}
                </div>

                {/* Success banner */}
                {successMsg && (
                    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                        {successMsg}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {/* Content */}
                <div className="mt-8">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <RowSkeleton key={i} />)}
                        </div>
                    ) : isEmpty ? (
                        <EmptyState />
                    ) : (
                        <div className="space-y-8">
                            <Section
                                title={t('favorites.courses')}
                                items={grouped.courses}
                                onRemove={handleRemoveClick}
                            />
                            <Section
                                title={t('favorites.lessons')}
                                items={grouped.lessons}
                                onRemove={handleRemoveClick}
                            />
                            <Section
                                title={t('favorites.libraryArticles')}
                                items={grouped.articles}
                                onRemove={handleRemoveClick}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Remove confirmation */}
            {removeTarget && (
                <DeleteConfirmModal
                    title={t('favorites.removeTitle')}
                    message={t('favorites.removeMessage', { title: removeTarget.title })}
                    onConfirm={handleRemoveConfirm}
                    onCancel={handleRemoveCancel}
                    confirming={removing}
                />
            )}
        </PageContainer>
    );
};

export default FavoritesPage;
