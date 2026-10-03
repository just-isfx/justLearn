import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageContainer from '../../components/PageContainer';
import LanguageCard from '../../components/LanguageCard';
import { getLanguages } from '../../services/contentService';

const LearnPage = () => {
    const { t } = useTranslation();
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadLanguages = async () => {
            try {
                const data = await getLanguages();
                setLanguages(data);
            } catch {
                setError(t('learn.loadLanguagesError'));
            } finally {
                setLoading(false);
            }
        };

        loadLanguages();
    }, [t]);

    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="max-w-3xl">
                    <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{t('learn.eyebrow')}</p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">{t('learn.chooseLanguage')}</h2>
                    <p className="mt-3 text-lg text-slate-600">{t('learn.intro')}</p>
                </div>

                {loading && <div className="mt-8 text-slate-600">{t('learn.loadingLanguages')}</div>}
                {error && <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

                {!loading && !error && languages.length === 0 && (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-6 text-slate-600">{t('learn.noLanguages')}</div>
                )}

                {!loading && !error && languages.length > 0 && (
                    <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {languages.map((language) => (
                            <LanguageCard key={language.id} language={language} />
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    );
};

export default LearnPage;
