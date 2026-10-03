import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import PasswordField from '../components/PasswordField';
import api from '../services/api';

const ResetPasswordPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({
        email: searchParams.get('email') || '',
        password: '',
        password_confirmation: '',
    });
    const token = searchParams.get('token') || '';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setError('');

        if (!token) {
            setError(t('auth.resetTokenMissing'));
            return;
        }
        if (form.password !== form.password_confirmation) {
            setError(t('auth.passwordsDoNotMatch'));
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/reset-password', { ...form, token });
            setSuccess(response.data.message || t('auth.passwordResetSuccess'));
            window.setTimeout(() => navigate('/auth', { state: { message: t('auth.passwordResetSuccess') } }), 1500);
        } catch (err) {
            const validationError = Object.values(err?.response?.data?.errors || {})[0]?.[0];
            setError(validationError || err?.response?.data?.message || t('auth.unableToComplete'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">{t('auth.resetPasswordTitle')}</h1>
                <form className="mt-8 space-y-5" onSubmit={submit}>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="reset-email">{t('auth.email')}</label>
                        <input id="reset-email" name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3" required autoComplete="email" />
                    </div>
                    <PasswordField id="password" label={t('auth.newPassword')} value={form.password} onChange={handleChange} autoComplete="new-password" />
                    <PasswordField id="password_confirmation" label={t('auth.confirmPassword')} value={form.password_confirmation} onChange={handleChange} autoComplete="new-password" />
                    {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
                    {success && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</p>}
                    <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
                        {loading ? t('auth.pleaseWait') : t('auth.resetPasswordButton')}
                    </button>
                    <Link to="/auth" className="block text-center text-sm font-medium text-sky-700 hover:text-sky-900">{t('auth.backToLogin')}</Link>
                </form>
            </div>
        </PageContainer>
    );
};

export default ResetPasswordPage;