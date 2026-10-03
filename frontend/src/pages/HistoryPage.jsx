import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import ProgressBar from '../components/ProgressBar';
import { getHistory } from '../services/progressService';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate, formatDuration } from '../utils/formatLocale';

const RowSkeleton = () => (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-slate-200" />
                <div className="h-5 w-56 rounded bg-slate-200" />
                <div className="h-3 w-40 rounded bg-slate-200" />
            </div>
            <div className="h-8 w-20 rounded-lg bg-slate-200" />
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-200" />
    </div>
);

// ─── History row ───────────────────────────────────────────────────────────────

const HistoryRow = ({ item }) => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">
                    {item.course_title}
                </p>
                <h4 className="mt-1 truncate text-base font-semibold text-slate-900">
                    {item.lesson_title}
                </h4>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    {item.is_completed ? (
                        <span className="font-medium text-emerald-600">✓ {t('dashboard.completed')}</span>
                    ) : (
                        <span>{t('dashboard.percentComplete', { percent: item.progress_percentage })}</span>
                    )}
                    {item.time_spent_seconds > 0 && (
                        <>
                            <span>·</span>
                            <span>{t('time.spent', { time: formatDuration(item.time_spent_seconds, t) })}</span>
                        </>
                    )}
                    <span>·</span>
                    <span>{formatDate(item.last_accessed_at, language, t, 'relative')}</span>
                </div>
            </div>
            <Link
                to={`/courses/${item.course_slug}/lessons/${item.lesson_slug}`}
                className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
                {item.is_completed ? t('dashboard.review') : t('dashboard.continue')}
            </Link>
        </div>
        <div className="mt-4">
            <ProgressBar percentage={item.progress_percentage} size="sm" showLabel={false} />
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
            📖
        </div>
        <h3 className="mt-5 text-xl font-semibold text-slate-900">
            {t('history.emptyTitle')}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-600">
            {t('history.emptyBody')}
        </p>
        <Link
            to="/learn"
            className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
            {t('dashboard.browseCourses')}
        </Link>
    </div>
    );
};

// ─── Main page ─────────────────────────────────────────────────────────────────

const HistoryPage = () => {
    const { t } = useTranslation();
    const [items,      setItems]      = useState([]);
    const [pagination, setPagination] = useState(null);
    const [page,       setPage]       = useState(1);
    const [loading,    setLoading]    = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error,      setError]      = useState('');

    const load = useCallback(async (pageNum, append = false) => {
        if (pageNum === 1) setLoading(true);
        else               setLoadingMore(true);
        setError('');

        try {
            const result = await getHistory(pageNum, 15);
            setItems((prev) => append ? [...prev, ...result.data] : result.data);
            setPagination(result.pagination);
        } catch {
            setError(t('history.loadError'));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        load(1, false);
    }, [load]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        load(nextPage, true);
    };

    const hasMore = pagination && pagination.current_page < pagination.last_page;

    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

                {/* Page header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">
                            {t('history.eyebrow')}
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">{t('history.title')}</h2>
                        {pagination && pagination.total > 0 && (
                            <p className="mt-1 text-sm text-slate-500">
                                {t('history.count', { count: pagination.total })}
                            </p>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {/* Content */}
                <div className="mt-8">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <RowSkeleton key={i} />)}
                        </div>
                    ) : items.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <>
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <HistoryRow key={item.id} item={item} />
                                ))}
                            </div>

                            {/* Load more */}
                            {hasMore && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        {loadingMore ? t('common.loading') : t('common.loadMore')}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>
        </PageContainer>
    );
};

export default HistoryPage;
