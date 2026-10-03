import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import {
    DEFAULT_LANGUAGE,
    DEFAULT_SPEECH_RATE,
    LANGUAGE_OPTIONS,
    clampSpeechRate,
    normalizeLanguage,
} from '../services/languageService';
import { readStoredVoiceUri, writeStoredVoiceUri } from '../utils/speechEngine';
import { saveLanguagePreference, saveSpeechSettings } from '../services/preferenceService';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const { i18n } = useTranslation();
    const { user, loading: authLoading, applyUser } = useAuth();
    const [speechRate, setSpeechRate] = useState(DEFAULT_SPEECH_RATE);
    const [voiceURI, setVoiceURIState] = useState('');
    const [languageError, setLanguageError] = useState('');
    const [speechError, setSpeechError] = useState('');
    const [savingLanguage, setSavingLanguage] = useState(false);
    const [savingSpeech, setSavingSpeech] = useState(false);

    const language = normalizeLanguage(i18n.language);

    useEffect(() => {
        setVoiceURIState(readStoredVoiceUri() || '');
    }, []);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            i18n.changeLanguage(DEFAULT_LANGUAGE);
            document.documentElement.lang = DEFAULT_LANGUAGE;
            setSpeechRate(DEFAULT_SPEECH_RATE);
            return;
        }

        const nextLang = normalizeLanguage(user.preferred_language);
        i18n.changeLanguage(nextLang);
        document.documentElement.lang = nextLang;
        setSpeechRate(clampSpeechRate(user.speech_rate));
    }, [user, authLoading, i18n]);

    const changeLanguage = useCallback(async (code) => {
        const next = normalizeLanguage(code);
        const previous = normalizeLanguage(i18n.language);
        setLanguageError('');
        await i18n.changeLanguage(next);
        document.documentElement.lang = next;

        if (!user) return;

        setSavingLanguage(true);
        try {
            const data = await saveLanguagePreference(next);
            applyUser(data.user);
        } catch {
            await i18n.changeLanguage(previous);
            document.documentElement.lang = previous;
            setLanguageError('saveFailed');
            throw new Error('language-save-failed');
        } finally {
            setSavingLanguage(false);
        }
    }, [applyUser, i18n, user]);

    const changeSpeechRate = useCallback(async (value) => {
        const next = clampSpeechRate(value);
        const previous = speechRate;
        setSpeechError('');
        setSpeechRate(next);
        if (!user) return;

        setSavingSpeech(true);
        try {
            const data = await saveSpeechSettings(next);
            applyUser(data.user);
        } catch {
            setSpeechRate(previous);
            setSpeechError('saveFailed');
            throw new Error('speech-save-failed');
        } finally {
            setSavingSpeech(false);
        }
    }, [applyUser, speechRate, user]);

    const changeVoiceURI = useCallback((uri) => {
        setVoiceURIState(uri);
        writeStoredVoiceUri(uri);
    }, []);

    const value = useMemo(() => ({
        language,
        speechRate,
        voiceURI,
        languageOptions: LANGUAGE_OPTIONS,
        languageError,
        speechError,
        savingLanguage,
        savingSpeech,
        changeLanguage,
        changeSpeechRate,
        changeVoiceURI,
        clearLanguageError: () => setLanguageError(''),
        clearSpeechError: () => setSpeechError(''),
    }), [
        language,
        speechRate,
        voiceURI,
        languageError,
        speechError,
        savingLanguage,
        savingSpeech,
        changeLanguage,
        changeSpeechRate,
        changeVoiceURI,
    ]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
