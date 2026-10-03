import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { speechLocaleFor } from '../services/languageService';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

const TextToSpeechControls = ({ text, language: languageOverride, compact = false }) => {
    const { t } = useTranslation();
    const { language, speechRate, voiceURI } = useLanguage();
    const resolvedLanguage = languageOverride || language;
    const { supported, status, notice, play, pause, resume, stop } = useSpeechSynthesis({
        language: speechLocaleFor(resolvedLanguage),
        rate: speechRate,
        voiceURI,
    });

    const noticeMessage = {
        unsupported: t('tts.unsupported'),
        noVoices: t('tts.noVoices'),
        empty: t('tts.empty'),
        failed: t('tts.failed'),
        fallbackVoice: t('tts.fallbackVoice'),
    }[notice] || '';

    const btn = (active) =>
        `rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
            active
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
        }`;

    return (
        <div className={compact ? 'mt-2' : 'mt-4'}>
            <p className={`mb-2 font-medium text-slate-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                {t('tts.label')}
            </p>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('tts.label')}>
                <button
                    type="button"
                    className={btn(status === 'playing')}
                    onClick={() => play(text)}
                    disabled={!supported && notice === 'unsupported'}
                >
                    {t('tts.play')}
                </button>
                <button
                    type="button"
                    className={btn(false)}
                    onClick={pause}
                    disabled={status !== 'playing'}
                >
                    {t('tts.pause')}
                </button>
                <button
                    type="button"
                    className={btn(false)}
                    onClick={resume}
                    disabled={status !== 'paused'}
                >
                    {t('tts.resume')}
                </button>
                <button
                    type="button"
                    className={btn(false)}
                    onClick={stop}
                    disabled={status === 'idle'}
                >
                    {t('tts.stop')}
                </button>
            </div>
            {noticeMessage && (
                <p className="mt-2 text-xs text-slate-500" role="status">{noticeMessage}</p>
            )}
        </div>
    );
};

export default TextToSpeechControls;
