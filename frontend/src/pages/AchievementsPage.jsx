import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import { getAchievements } from '../services/engagementService';

const AchievementsPage = () => {
    const { t } = useTranslation(); const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
    useEffect(() => { getAchievements().then(setItems).catch(() => setError(t('engagement.achievementsError'))).finally(() => setLoading(false)); }, [t]);
    return <PageContainer><div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{t('engagement.achievementsEyebrow')}</p><h2 className="mt-2 text-3xl font-semibold text-slate-900">{t('engagement.achievements')}</h2>{error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}{loading ? <p className="mt-8 text-slate-500">{t('common.loading')}</p> : items.length === 0 ? <p className="mt-8 text-slate-500">{t('engagement.noAchievements')}</p> : <div className="mt-8 grid gap-4 md:grid-cols-2">{items.map((item) => <div key={item.id} className={`rounded-2xl border p-5 ${item.unlocked ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'}`}><div className="flex gap-3"><span className="text-2xl" aria-hidden="true">{item.unlocked ? '✓' : '🔒'}</span><div><h3 className="font-semibold text-slate-900">{item.name}</h3><p className="mt-1 text-sm text-slate-600">{item.description}</p>{item.unlocked ? <p className="mt-3 text-xs font-medium text-emerald-700">{t('engagement.unlocked')}</p> : <p className="mt-3 text-xs text-slate-500">{t('engagement.progress', { current: item.progress, total: item.requirement })}</p>}</div></div></div>)}</div>}</div></PageContainer>;
};
export default AchievementsPage;
