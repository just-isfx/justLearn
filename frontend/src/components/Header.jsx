import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';

const Header = ({ titleKey }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    return (
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
            <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-600">{t('brand.name')}</p>
                <h1 className="text-2xl font-semibold text-slate-900">{t(titleKey)}</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                    {user?.name || t('header.studentWorkspace')}
                </div>
                <UserAvatar user={user} />
                <button type="button" onClick={handleLogout} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    {t('auth.logout')}
                </button>
            </div>
        </header>
    );
};

export default Header;
