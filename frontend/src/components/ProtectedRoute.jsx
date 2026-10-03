import { Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const { t } = useTranslation();

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-slate-600">{t('common.loadingWorkspace')}</div>;
    }

    return user ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
