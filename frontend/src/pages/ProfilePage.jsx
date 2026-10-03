import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import { useAuth } from '../contexts/AuthContext';
import { getDashboard } from '../services/progressService';
import api from '../services/api';
import UserAvatar from '../components/UserAvatar';

const ProfilePage = () => {
    const { t } = useTranslation();
    const { user, updateProfile, updatePassword, applyUser } = useAuth();
    const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
    const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [profileMessage, setProfileMessage] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [profileError, setProfileError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [learningStats, setLearningStats] = useState(null);
    const [pictureError, setPictureError] = useState('');
    const [pictureMessage, setPictureMessage] = useState('');
    const [pictureLoading, setPictureLoading] = useState(false);

    useEffect(() => { getDashboard().then(setLearningStats).catch(() => {}); }, []);

    const handleProfileSubmit = async (event) => {
        event.preventDefault();
        setProfileError('');
        setProfileMessage('');
        try {
            const response = await updateProfile(profileForm);
            setProfileMessage(response.message || t('profile.saveChanges'));
        } catch (error) {
            setProfileError(error?.response?.data?.message || t('profile.updateError'));
        }
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        setPasswordError('');
        setPasswordMessage('');
        try {
            const response = await updatePassword(passwordForm);
            setPasswordMessage(response.message || t('profile.changePassword'));
            setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
        } catch (error) {
            setPasswordError(error?.response?.data?.message || t('profile.passwordError'));
        }
    };

    const handlePicture = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setPictureError(''); setPictureMessage('');
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setPictureError('Please choose a JPG, PNG, or WEBP image.');
            event.target.value = '';
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setPictureError('Profile pictures must be 2 MB or smaller.');
            event.target.value = '';
            return;
        }
        setPictureLoading(true);
        try {
            const formData = new FormData(); formData.append('profile_picture', file);
            const response = await api.post('/profile/picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            applyUser(response.data.user);
            setPictureMessage(response.data.message || t('profile.pictureUpdated'));
        } catch (error) { setPictureError(error?.response?.data?.message || t('profile.pictureError')); }
        finally { setPictureLoading(false); event.target.value = ''; }
    };

    const deletePicture = async () => {
        setPictureError(''); setPictureMessage(''); setPictureLoading(true);
        try { const response = await api.delete('/profile/picture'); applyUser(response.data.user); setPictureMessage(response.data.message || t('profile.pictureRemoved')); }
        catch { setPictureError(t('profile.pictureError')); }
        finally { setPictureLoading(false); }
    };

    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-3xl font-semibold text-slate-900">{t('profile.title')}</h2>
                <p className="mt-2 text-slate-600">{t('profile.intro')}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                    <UserAvatar user={user} size="lg" />
                    <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">{t('profile.changePicture')}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePicture} disabled={pictureLoading} /></label>
                    {user?.profile_picture_url && <button type="button" onClick={deletePicture} disabled={pictureLoading} className="text-sm font-medium text-rose-700 disabled:opacity-50">{pictureLoading ? t('common.saving') : t('profile.deletePicture')}</button>}
                    {pictureLoading && <p className="text-sm text-slate-500">{t('common.saving')}</p>}
                    {pictureMessage && <p className="basis-full text-sm font-medium text-emerald-600">{pictureMessage}</p>}
                    {pictureError && <p className="basis-full text-sm text-rose-600">{pictureError}</p>}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{t('profile.lessonsCompleted')}</p><p className="mt-1 text-xl font-semibold">{learningStats?.statistics?.lessons_completed ?? '—'}</p></div>
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{t('profile.currentStreak')}</p><p className="mt-1 text-xl font-semibold">{learningStats?.streak?.current_streak ?? 0}</p></div>
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{t('profile.longestStreak')}</p><p className="mt-1 text-xl font-semibold">{learningStats?.streak?.longest_streak ?? 0}</p></div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <form onSubmit={handleProfileSubmit} className="space-y-4 rounded-2xl border border-slate-200 p-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="name">{t('profile.name')}</label>
                            <input id="name" value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">{t('profile.email')}</label>
                            <input id="email" type="email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3" />
                        </div>
                        {profileMessage && <p className="text-sm font-medium text-emerald-600">{profileMessage}</p>}
                        {profileError && <p className="text-sm font-medium text-rose-600">{profileError}</p>}
                        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">{t('profile.saveChanges')}</button>
                    </form>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-900">{t('profile.changePassword')}</h3>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="current_password">{t('profile.currentPassword')}</label>
                            <input id="current_password" type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm({ ...passwordForm, current_password: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">{t('profile.newPassword')}</label>
                            <input id="password" type="password" value={passwordForm.password} onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password_confirmation">{t('profile.confirmPassword')}</label>
                            <input id="password_confirmation" type="password" value={passwordForm.password_confirmation} onChange={(event) => setPasswordForm({ ...passwordForm, password_confirmation: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3" />
                        </div>
                        {passwordMessage && <p className="text-sm font-medium text-emerald-600">{passwordMessage}</p>}
                        {passwordError && <p className="text-sm font-medium text-rose-600">{passwordError}</p>}
                        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">{t('profile.changePassword')}</button>
                    </form>
                </div>
            </div>
        </PageContainer>
    );
};

export default ProfilePage;
