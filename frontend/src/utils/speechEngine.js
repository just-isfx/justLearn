import { speechLocaleFor, VOICE_STORAGE_KEY } from '../services/languageService.js';

export function isSpeechSupported() {
    return typeof window !== 'undefined'
        && typeof window.speechSynthesis !== 'undefined'
        && typeof window.SpeechSynthesisUtterance !== 'undefined';
}

export function getVoicesSafe() {
    if (!isSpeechSupported()) return [];
    try {
        return window.speechSynthesis.getVoices() || [];
    } catch {
        return [];
    }
}

export function pickVoice(voices, languageCode, preferredUri = null) {
    if (!voices.length) return { voice: null, usedFallback: false };

    if (preferredUri) {
        const stored = voices.find((v) => v.voiceURI === preferredUri);
        if (stored) return { voice: stored, usedFallback: false };
    }

    const locale = speechLocaleFor(languageCode).toLowerCase();
    const prefix = (languageCode || 'en').toLowerCase().slice(0, 2);

    const exact = voices.find((v) => (v.lang || '').toLowerCase() === locale);
    if (exact) return { voice: exact, usedFallback: false };

    const prefixMatch = voices.find((v) => (v.lang || '').toLowerCase().startsWith(prefix));
    if (prefixMatch) return { voice: prefixMatch, usedFallback: false };

    return { voice: voices[0], usedFallback: true };
}

export function readStoredVoiceUri() {
    try {
        return localStorage.getItem(VOICE_STORAGE_KEY) || '';
    } catch {
        return '';
    }
}

export function writeStoredVoiceUri(uri) {
    try {
        if (!uri) {
            localStorage.removeItem(VOICE_STORAGE_KEY);
            return;
        }
        localStorage.setItem(VOICE_STORAGE_KEY, uri);
    } catch {
        // Device storage may be unavailable.
    }
}

export function cancelSpeech() {
    if (!isSpeechSupported()) return;
    try {
        window.speechSynthesis.cancel();
    } catch {
        // Ignore synthesis errors during cleanup.
    }
}
