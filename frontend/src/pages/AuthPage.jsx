import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import PageContainer from '../components/PageContainer';
import PasswordField from '../components/PasswordField';
import ThemeToggle from '../components/ThemeToggle';

const initialState = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
};

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { login, register } = useAuth();
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState(initialState);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState(location.state?.message || '');

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (mode === 'register') {
                await register(form);
            } else {
                await login({ email: form.email, password: form.password });
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err?.response?.data?.message || t('auth.unableToComplete'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
                    </h1>
                    <ThemeToggle className="theme-toggle--compact" />
                </div>
                <div className="flex gap-2 rounded-full bg-slate-100 p-1">
                    <button type="button" className={`rounded-full px-4 py-2 text-sm font-medium ${mode === 'login' ? 'bg-slate-900 text-white' : 'text-slate-600'}`} onClick={() => setMode('login')}>
                        {t('auth.login')}
                    </button>
                    <button type="button" className={`rounded-full px-4 py-2 text-sm font-medium ${mode === 'register' ? 'bg-slate-900 text-white' : 'text-slate-600'}`} onClick={() => setMode('register')}>
                        {t('auth.register')}
                    </button>
                </div>

                <form className="mt-8 space-y-4" onSubmit={submit}>
                    {mode === 'register' && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="name">{t('auth.name')}</label>
                            <input id="name" name="name" value={form.name} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3" required />
                        </div>
                    )}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">{t('auth.email')}</label>
                        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3" required />
                    </div>
                    <div>
                        <PasswordField
                            id="password"
                            label={t('auth.password')}
                            value={form.password}
                            onChange={handleChange}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                    </div>
                    {mode === 'register' && (
                        <div>
                            <PasswordField
                                id="password_confirmation"
                                label={t('auth.confirmPassword')}
                                value={form.password_confirmation}
                                onChange={handleChange}
                                autoComplete="new-password"
                            />
                        </div>
                    )}
                    {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</p>}
                    {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
                    <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white" disabled={loading}>
                        {loading ? t('auth.pleaseWait') : mode === 'login' ? t('auth.login') : t('auth.createAccount')}
                    </button>
                    {mode === 'login' && (
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1 text-sm">
                            <button type="button" className="font-medium text-sky-700 hover:text-sky-900" onClick={() => navigate('/forgot-password')}>
                                {t('auth.forgotPassword')}
                            </button>
                            <button type="button" className="font-medium text-sky-700 hover:text-sky-900" onClick={() => setMode('register')}>
                                Create an account
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </PageContainer>
    );
};

export default AuthPage;
