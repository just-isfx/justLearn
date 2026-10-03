import { useTranslation } from 'react-i18next';
import { THEME_MODES, useTheme } from '../contexts/ThemeContext';

const icons = {
    light: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    dark: <path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z" />,
    system: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
};

const ThemeToggle = ({ className = '' }) => {
    const { t } = useTranslation();
    const { themePreference, changeTheme, savingTheme } = useTheme();

    return (
        <div className={`theme-toggle ${className}`} role="group" aria-label={t('settings.themePreference')}>
            {THEME_MODES.map((mode) => (
                <button
                    key={mode}
                    type="button"
                    className={`theme-toggle__option${themePreference === mode ? ' is-active' : ''}`}
                    aria-label={t(`settings.theme.${mode}`)}
                    aria-pressed={themePreference === mode}
                    title={t(`settings.theme.${mode}`)}
                    disabled={savingTheme}
                    onClick={() => changeTheme(mode).catch(() => {})}
                >
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {icons[mode]}
                    </svg>
                    <span>{t(`settings.theme.${mode}`)}</span>
                </button>
            ))}
        </div>
    );
};

export default ThemeToggle;