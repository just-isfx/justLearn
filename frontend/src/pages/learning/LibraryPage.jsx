import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageContainer from '../../components/PageContainer';
import LibraryCard from '../../components/LibraryCard';
import SearchBar from '../../components/SearchBar';
import { getLibraryArticles } from '../../services/contentService';

const LibraryPage = () => {
    const { t } = useTranslation();
    const [articles, setArticles] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const data = await getLibraryArticles(query);
                setArticles(data);
            } catch {
                setError(t('library.loadError'));
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [query, t]);

    const emptyState = useMemo(() => query.trim() === '', [query]);

    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="max-w-3xl">
                    <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{t('library.eyebrow')}</p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">{t('library.heading')}</h2>
                    <p className="mt-3 text-lg text-slate-600">{t('library.intro')}</p>
                </div>

                <div className="mt-8">
                    <SearchBar
                        value={query}
                        onChange={setQuery}
                        loading={loading}
                        placeholder={t('library.searchPlaceholder')}
                    />
                </div>

                {loading && <div className="mt-8 text-slate-600">{t('library.loading')}</div>}
                {error && <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

                {!loading && !error && articles.length === 0 && (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-6 text-slate-600">
                        {emptyState ? t('library.noArticles') : t('library.noSearchResults')}
                    </div>
                )}

                {!loading && !error && articles.length > 0 && (
                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        {articles.map((article) => (
                            <LibraryCard key={article.id} article={article} />
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    );
};

export default LibraryPage;
