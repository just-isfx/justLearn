import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LibraryCard = ({ article }) => {
    const { t } = useTranslation();
    return (
        <Link to={`/library/${article.slug}`} className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">{article.category?.name || t('library.title')}</p>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">{article.title}</h3>
            <p className="mt-3 text-sm text-slate-600">{article.summary}</p>
        </Link>
    );
};

export default LibraryCard;
