import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LanguageCard = ({ language }) => {
    const { t } = useTranslation();
    return (
        <Link to={`/learn/${language.slug}`} className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-slate-900">{language.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{language.description}</p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">{t('learn.learnCta')}</span>
            </div>
        </Link>
    );
};

export default LanguageCard;
