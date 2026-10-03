import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../../components/PageContainer';
import FavoriteButton from '../../components/FavoriteButton';
import TextToSpeechControls from '../../components/TextToSpeechControls';
import { getLibraryArticleBySlug } from '../../services/contentService';
import { combineSpeakableParts } from '../../utils/speechText';

const LibraryArticlePage = () => {
    const { slug } = useParams();
    const { t } = useTranslation();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadArticle = async () => {
            try {
                const data = await getLibraryArticleBySlug(slug);
                setArticle(data);
            } catch {
                setError(t('library.loadArticleError'));
            } finally {
                setLoading(false);
            }
        };

        loadArticle();
    }, [slug, t]);

    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                {loading && <div className="text-slate-600">{t('library.loadingArticle')}</div>}
                {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

                {!loading && !error && article && (
                    <>
                        <div className="max-w-3xl">
                            <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{article.category?.name || t('library.title')}</p>
                            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{article.title}</h2>
                            <p className="mt-3 text-lg text-slate-600">{article.summary}</p>
                            {article.id && (
                                <div className="mt-4">
                                    <FavoriteButton type="article" id={article.id} />
                                </div>
                            )}
                            <TextToSpeechControls
                                text={combineSpeakableParts([
                                    article.title,
                                    article.summary,
                                    article.content,
                                ])}
                            />
                        </div>

                        <article className="prose prose-slate mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />

                        <div className="mt-10 border-t border-slate-200 pt-6">
                            <Link to="/library" className="text-sm font-medium text-sky-700">← {t('library.backToLibrary')}</Link>
                        </div>
                    </>
                )}
            </div>
        </PageContainer>
    );
};

export default LibraryArticlePage;
