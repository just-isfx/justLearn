export const SUPPORTED_LANGUAGES = ['en', 'fr', 'es'];
export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_OPTIONS = [
    { code: 'en', nativeLabel: 'English' },
    { code: 'fr', nativeLabel: 'Français' },
    { code: 'es', nativeLabel: 'Español' },
];

export const SPEECH_LOCALES = {
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
};

export const DEFAULT_SPEECH_RATE = 1;
export const MIN_SPEECH_RATE = 0.5;
export const MAX_SPEECH_RATE = 2;

export const VOICE_STORAGE_KEY = 'justlearn.tts.voiceURI';

export function normalizeLanguage(code) {
    if (!code || typeof code !== 'string') {
        return DEFAULT_LANGUAGE;
    }

    const base = code.toLowerCase().split('-')[0];
    return SUPPORTED_LANGUAGES.includes(base) ? base : DEFAULT_LANGUAGE;
}

export function speechLocaleFor(code) {
    return SPEECH_LOCALES[normalizeLanguage(code)] || SPEECH_LOCALES.en;
}

export function bcp47Locale(code) {
    const map = { en: 'en-US', fr: 'fr-FR', es: 'es-ES' };
    return map[normalizeLanguage(code)] || 'en-US';
}

export function clampSpeechRate(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return DEFAULT_SPEECH_RATE;
    return Math.min(MAX_SPEECH_RATE, Math.max(MIN_SPEECH_RATE, n));
}
