import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/engagementService';

const NotificationsPage = () => {
    const { t } = useTranslation(); const [items, setItems] = useState([]); const [unread, setUnread] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
    const load = () => { setLoading(true); getNotifications().then((data) => { setItems(data.data); setUnread(data.unread_count); }).catch(() => setError(t('engagement.notificationsError'))).finally(() => setLoading(false)); };
    useEffect(load, [t]);
    const read = async (id) => { await markNotificationRead(id); setItems((old) => old.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item)); setUnread((old) => Math.max(0, old - 1)); };
    const readAll = async () => { await markAllNotificationsRead(); setItems((old) => old.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))); setUnread(0); };
    const remove = async (id) => { await deleteNotification(id); setItems((old) => old.filter((item) => item.id !== id)); };
    return <PageContainer><div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{t('engagement.notificationsEyebrow')}</p><h2 className="mt-2 text-3xl font-semibold text-slate-900">{t('engagement.notifications')}</h2></div>{unread > 0 && <button type="button" onClick={readAll} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">{t('engagement.markAllRead')}</button>}</div>{error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}{loading ? <p className="mt-8 text-slate-500">{t('common.loading')}</p> : items.length === 0 ? <p className="mt-8 text-slate-500">{t('engagement.noNotifications')}</p> : <div className="mt-8 space-y-3">{items.map((item) => <div key={item.id} className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${item.read_at ? 'border-slate-200' : 'border-sky-200 bg-sky-50/50'}`}><div><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p></div><div className="flex shrink-0 gap-2"><button type="button" disabled={!!item.read_at} onClick={() => read(item.id)} className="text-xs font-medium text-sky-700 disabled:text-slate-400">{t('engagement.markRead')}</button><button type="button" onClick={() => remove(item.id)} className="text-xs font-medium text-rose-700">{t('common.delete')}</button></div></div>)}</div>}</div></PageContainer>;
};
export default NotificationsPage;
