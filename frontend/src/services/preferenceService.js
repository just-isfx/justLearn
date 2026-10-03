import api from './api';
import { clampSpeechRate, normalizeLanguage } from './languageService';

export async function saveLanguagePreference(language) {
    const response = await api.put('/user/language', {
        language: normalizeLanguage(language),
    });
    return response.data;
}

export async function saveSpeechSettings(speechRate) {
    const response = await api.put('/user/speech-settings', {
        speech_rate: clampSpeechRate(speechRate),
    });
    return response.data;
}

export async function saveThemePreference(themePreference) {
    const response = await api.put('/user/theme-preference', {
        theme_preference: themePreference,
    });
    return response.data;
}
