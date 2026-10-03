import { useCallback, useEffect, useRef, useState } from 'react';
import { clampSpeechRate } from '../services/languageService';
import { extractSpeakableText } from '../utils/speechText';
import {
    cancelSpeech,
    getVoicesSafe,
    isSpeechSupported,
    pickVoice,
} from '../utils/speechEngine';

/**
 * Browser SpeechSynthesis controller. Cancels speech on unmount.
 */
export const useSpeechSynthesis = ({ language, rate = 1, voiceURI = '' }) => {
    const [status, setStatus] = useState('idle');
    const [voices, setVoices] = useState([]);
    const [notice, setNotice] = useState('');
    const utteranceRef = useRef(null);
    const supported = isSpeechSupported();

    const refreshVoices = useCallback(() => {
        setVoices(getVoicesSafe());
    }, []);

    useEffect(() => {
        if (!supported) return undefined;
        refreshVoices();
        const synth = window.speechSynthesis;
        const onVoices = () => refreshVoices();
        synth.addEventListener?.('voiceschanged', onVoices);
        // Chrome often populates voices asynchronously.
        const timer = window.setTimeout(refreshVoices, 250);
        return () => {
            synth.removeEventListener?.('voiceschanged', onVoices);
            window.clearTimeout(timer);
        };
    }, [supported, refreshVoices]);

    const stop = useCallback(() => {
        cancelSpeech();
        utteranceRef.current = null;
        setStatus('idle');
    }, []);

    useEffect(() => () => {
        cancelSpeech();
        utteranceRef.current = null;
    }, []);

    const play = useCallback((rawText) => {
        setNotice('');
        const text = extractSpeakableText(rawText);
        if (!text) {
            setNotice('empty');
            return;
        }
        if (!supported) {
            setNotice('unsupported');
            return;
        }

        cancelSpeech();

        const available = getVoicesSafe();
        const { voice, usedFallback } = pickVoice(available, language, voiceURI || null);

        if (!voice && available.length === 0) {
            setNotice('noVoices');
            setStatus('idle');
            return;
        }

        try {
            const utterance = new window.SpeechSynthesisUtterance(text);
            utterance.lang = voice?.lang || language || 'en-US';
            utterance.rate = clampSpeechRate(rate);
            if (voice) utterance.voice = voice;
            utterance.onstart = () => setStatus('playing');
            utterance.onend = () => {
                utteranceRef.current = null;
                setStatus('idle');
            };
            utterance.onerror = () => {
                utteranceRef.current = null;
                setStatus('idle');
                setNotice('failed');
            };
            utteranceRef.current = utterance;
            if (usedFallback) setNotice('fallbackVoice');
            window.speechSynthesis.speak(utterance);
            setStatus('playing');
        } catch {
            setNotice('failed');
            setStatus('idle');
        }
    }, [language, rate, voiceURI, supported]);

    const pause = useCallback(() => {
        if (!supported || status !== 'playing') return;
        try {
            window.speechSynthesis.pause();
            setStatus('paused');
        } catch {
            setNotice('failed');
        }
    }, [supported, status]);

    const resume = useCallback(() => {
        if (!supported || status !== 'paused') return;
        try {
            window.speechSynthesis.resume();
            setStatus('playing');
        } catch {
            setNotice('failed');
        }
    }, [supported, status]);

    return {
        supported,
        status,
        voices,
        notice,
        play,
        pause,
        resume,
        stop,
        setNotice,
    };
};

export default useSpeechSynthesis;
