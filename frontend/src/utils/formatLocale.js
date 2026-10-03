import { bcp47Locale, normalizeLanguage } from '../services/languageService';

export function formatDate(iso, language, t, kind = 'absolute') {
    if (!iso) return '';

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    const locale = bcp47Locale(language);
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
    const diffSeconds = Math.floor(diffMs / 1000);

    if (kind === 'relative' || kind === 'updated' || kind === 'added') {
        if (diffSeconds < 60 && kind === 'relative') {
            return t('dates.justNow');
        }
        if (diffDays === 0) {
            if (kind === 'updated') return t('dates.updatedToday');
            if (kind === 'added') return t('dates.addedToday');
            return t('dates.today');
        }
        if (diffDays === 1) {
            if (kind === 'updated') return t('dates.updatedYesterday');
            if (kind === 'added') return t('dates.addedYesterday');
            return t('dates.yesterday');
        }
        if (diffDays < 7) {
            if (kind === 'updated') return t('dates.updatedDaysAgo', { count: diffDays });
            if (kind === 'added') return t('dates.addedDaysAgo', { count: diffDays });
            return t('dates.daysAgo', { count: diffDays });
        }
    }

    return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatNumber(value, language) {
    const locale = bcp47Locale(language);
    return new Intl.NumberFormat(locale).format(Number(value) || 0);
}

export function formatDuration(seconds, t) {
    const total = Math.max(0, Number(seconds) || 0);
    if (total === 0) return t('time.zeroMin');

    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);

    if (hours > 0 && minutes > 0) {
        return t('time.hoursMinutes', { hours, minutes });
    }
    if (hours > 0) {
        return t('time.hours', { count: hours });
    }
    return t('time.minutes', { count: minutes || 1 });
}

export function currentLanguageFromI18n(i18nLanguage) {
    return normalizeLanguage(i18nLanguage);
}
