import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/PageContainer';
import { useLanguage } from '../contexts/LanguageContext';
import { getVoicesSafe, isSpeechSupported } from '../utils/speechEngine';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { savingTheme, themeError } = useTheme();
    const {
        language,
        languageOptions,
        speechRate,
        voiceURI,
        changeLanguage,
        changeSpeechRate,
        changeVoiceURI,
        languageError,
        speechError,
        savingLanguage,
        savingSpeech,
    } = useLanguage();

    const [rateDraft, setRateDraft] = useState(speechRate);
    const [voices, setVoices] = useState([]);
    const [languageSuccess, setLanguageSuccess] = useState('');
    const [speechSuccess, setSpeechSuccess] = useState('');
    const supported = isSpeechSupported();

    useEffect(() => {
        setRateDraft(speechRate);
    }, [speechRate]);

    useEffect(() => {
        if (!supported) return undefined;
        const load = () => setVoices(getVoicesSafe());
        load();
        window.speechSynthesis.addEventListener?.('voiceschanged', load);
        const timer = window.setTimeout(load, 300);
        return () => {
            window.speechSynthesis.removeEventListener?.('voiceschanged', load);
            window.clearTimeout(timer);
        };
    }, [supported]);

    const handleLanguageChange = async (event) => {
        setLanguageSuccess('');
        try {
            await changeLanguage(event.target.value);
            setLanguageSuccess(t('settings.languageSaved'));
        } catch {
            // Error banner is set in LanguageProvider.
        }
    };

    const commitRate = async () => {
        if (Number(rateDraft) === Number(speechRate)) return;
        setSpeechSuccess('');
        try {
            await changeSpeechRate(rateDraft);
            setSpeechSuccess(t('settings.speechSaved'));
        } catch {
            // Error banner is set in LanguageProvider.
        }
    };

    return (
        <PageContainer>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-3xl font-semibold text-slate-900">{t('settings.title')}</h2>
                <p className="mt-2 text-slate-600">{t('settings.intro')}</p>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <section className="space-y-4 rounded-2xl border border-slate-200 p-6 lg:col-span-2">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-slate-700">{t('settings.appearance')}</h3>
                                <p className="mt-1 text-sm text-slate-500">{t('settings.themeHelp')}</p>
                            </div>
                            <ThemeToggle />
                        </div>
                        {savingTheme && <p className="text-sm text-slate-500">{t('settings.saving')}</p>}
                        {themeError && <p className="text-sm font-medium text-rose-600">{t('settings.themeSaveError')}</p>}
                        {!themeError && <p className="text-sm text-slate-500">{t(user ? 'settings.themeHelpAccount' : 'settings.themeHelpDevice')}</p>}
                    </section>
                    <section className="space-y-4 rounded-2xl border border-slate-200 p-6">
                        <div>
                            <label htmlFor="app-language" className="mb-2 block text-sm font-medium text-slate-700">
                                {t('settings.language')}
                            </label>
                            <select
                                id="app-language"
                                value={language}
                                onChange={handleLanguageChange}
                                disabled={savingLanguage}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                            >
                                {languageOptions.map((option) => (
                                    <option key={option.code} value={option.code}>
                                        {option.nativeLabel}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-2 text-xs text-slate-500">{t('settings.languageHelp')}</p>
                            {savingLanguage && <p className="mt-2 text-sm text-slate-500">{t('settings.saving')}</p>}
                            {languageSuccess && <p className="mt-2 text-sm font-medium text-emerald-600">{languageSuccess}</p>}
                            {languageError && (
                                <p className="mt-2 text-sm font-medium text-rose-600">{t('settings.saveLanguageError')}</p>
                            )}
                        </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-sm font-medium text-slate-700">{t('settings.textToSpeech')}</h3>

                        <div>
                            <label htmlFor="speech-rate" className="mb-2 block text-sm font-medium text-slate-700">
                                {t('settings.speechRate')}: {Number(rateDraft).toFixed(2)}
                            </label>
                            <input
                                id="speech-rate"
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={rateDraft}
                                onChange={(event) => setRateDraft(event.target.value)}
                                onMouseUp={commitRate}
                                onTouchEnd={commitRate}
                                onKeyUp={commitRate}
                                disabled={savingSpeech}
                                className="w-full"
                            />
                            {savingSpeech && <p className="mt-2 text-sm text-slate-500">{t('settings.saving')}</p>}
                            {speechSuccess && <p className="mt-2 text-sm font-medium text-emerald-600">{speechSuccess}</p>}
                            {speechError && (
                                <p className="mt-2 text-sm font-medium text-rose-600">{t('settings.saveSpeechError')}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="speech-voice" className="mb-2 block text-sm font-medium text-slate-700">
                                {t('settings.voice')}
                            </label>
                            <select
                                id="speech-voice"
                                value={voiceURI}
                                onChange={(event) => changeVoiceURI(event.target.value)}
                                disabled={!supported}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                            >
                                <option value="">{t('settings.voiceDefault')}</option>
                                {voices.map((voice) => (
                                    <option key={voice.voiceURI} value={voice.voiceURI}>
                                        {voice.name} ({voice.lang})
                                    </option>
                                ))}
                            </select>
                            <p className="mt-2 text-xs text-slate-500">{t('settings.voiceHelp')}</p>
                            {!supported && (
                                <p className="mt-2 text-sm text-slate-500">{t('tts.unsupported')}</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </PageContainer>
    );
};

export default SettingsPage;
