import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import api from '../services/api';

const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/forgot-password', { email });
            setSuccess(response.data.message || t('auth.resetLinkSent'));
        } catch (err) {
            setError(err?.response?.data?.message || t('auth.unableToComplete'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">{t('auth.forgotPasswordTitle')}</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">{t('auth.forgotPasswordIntro')}</p>
                <form className="mt-8 space-y-5" onSubmit={submit}>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="forgot-email">{t('auth.email')}</label>
                        <input id="forgot-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" required autoComplete="email" />
                    </div>
                    {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
                    {success && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</p>}
                    <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
                        {loading ? t('auth.pleaseWait') : t('auth.sendResetLink')}
                    </button>
                    <Link to="/auth" className="block text-center text-sm font-medium text-sky-700 hover:text-sky-900">{t('auth.backToLogin')}</Link>
                </form>
            </div>
        </PageContainer>
    );
};

export default ForgotPasswordPage;