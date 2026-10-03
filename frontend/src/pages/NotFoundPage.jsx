import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';

const NotFoundPage = () => {
    const { t } = useTranslation();
    return <PageContainer><div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"><p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">404</p><h1 className="mt-3 text-3xl font-semibold text-slate-900">{t('common.notFound')}</h1><p className="mt-2 text-slate-600">{t('common.notFoundMessage')}</p><Link to="/dashboard" className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{t('common.backDashboard')}</Link></div></PageContainer>;
};
export default NotFoundPage;