import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';

const Header = ({ titleKey }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const [logoutError, setLogoutError] = useState('');
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLogoutError('');
        setLoggingOut(true);
        try {
            await logout();
            navigate('/auth');
        } catch {
            setLogoutError(t('auth.logoutError'));
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
            <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{t('brand.name')}</p>
                <h1 className="text-2xl font-semibold text-slate-900">{t(titleKey)}</h1>
            </div>
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => navigate('/notes?create=1')}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100"
                    aria-label={t('header.addNote')}
                    title={t('header.addNote')}
                >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6M12 18v-6m-3 3h6" />
                    </svg>
                </button>
                <UserAvatar user={user} />
                <div className="text-right">
                    <button type="button" onClick={handleLogout} disabled={loggingOut} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                        {loggingOut ? t('auth.pleaseWait') : t('auth.logout')}
                    </button>
                    {logoutError && <p role="alert" className="mt-1 text-xs text-rose-600">{logoutError}</p>}
                </div>
            </div>
        </header>
    );
};

export default Header;
