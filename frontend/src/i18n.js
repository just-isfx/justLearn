import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';
import es from './locales/es/translation.json';
import { DEFAULT_LANGUAGE } from './services/languageService';

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        fr: { translation: fr },
        es: { translation: es },
    },
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
        escapeValue: false,
    },
    returnNull: false,
    returnEmptyString: false,
});

if (typeof document !== 'undefined') {
    document.documentElement.lang = DEFAULT_LANGUAGE;
}

export default i18n;
