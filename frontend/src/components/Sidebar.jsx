import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
    { key: 'nav.dashboard', path: '/dashboard' },
    { key: 'nav.learn', path: '/learn' },
    { key: 'nav.library', path: '/library' },
    { key: 'nav.aiTutor', path: '/ai-tutor' },
    { key: 'nav.history', path: '/history' },
    { key: 'nav.achievements', path: '/achievements' },
    { key: 'nav.notifications', path: '/notifications' },
    { key: 'nav.admin', path: '/admin' },
    { key: 'nav.favorites', path: '/favorites' },
    { key: 'nav.notes', path: '/notes' },
    { key: 'nav.profile', path: '/profile' },
    { key: 'nav.settings', path: '/settings' },
];

const Sidebar = () => {
    const { t } = useTranslation();
    const { user } = useAuth();

    return (
        <aside className="sidebar-scroll-container flex h-full w-72 shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-slate-200 bg-slate-950 px-6 py-8 text-slate-200">
            <div className="mb-10">
                <h2 className="text-2xl font-semibold text-white">{t('brand.name')}</h2>
                <p className="mt-2 text-sm text-slate-400">{t('brand.tagline')}</p>
            </div>
            <nav className="space-y-2">
                {navigation.filter((item) => item.path !== '/admin' || user?.role === 'admin').map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center rounded-lg px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
                        }
                    >
                        {t(item.key)}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
