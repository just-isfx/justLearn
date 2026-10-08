import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { saveThemePreference } from '../services/preferenceService';

export const THEME_MODES = ['light', 'dark'];
const THEME_STORAGE_KEY = 'justlearncode_theme';
const PENDING_THEME_STORAGE_KEY = 'justlearncode_theme_pending';

const ThemeContext = createContext(null);

const isThemeMode = (value) => THEME_MODES.includes(value);

const readStoredTheme = () => {
    try {
        const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        return isThemeMode(storedTheme) ? storedTheme : 'light';
    } catch {
        return 'light';
    }
};

export const ThemeProvider = ({ children }) => {
    const { user, loading: authLoading, applyUser } = useAuth();
    const [themePreference, setThemePreference] = useState(readStoredTheme);
    const [savingTheme, setSavingTheme] = useState(false);
    const [themeError, setThemeError] = useState(false);
    const activeTheme = themePreference;

    useEffect(() => {
        if (authLoading || !user) return undefined;

        let pendingTheme;
        try {
            pendingTheme = window.localStorage.getItem(PENDING_THEME_STORAGE_KEY);
        } catch {
            pendingTheme = null;
        }

        if (isThemeMode(pendingTheme)) {
            setThemePreference(pendingTheme);
            saveThemePreference(pendingTheme).then((data) => {
                try {
                    window.localStorage.removeItem(PENDING_THEME_STORAGE_KEY);
                } catch {
                    // Account sync succeeded even if local cleanup is unavailable.
                }
                setThemeError(false);
                applyUser(data.user);
            }).catch(() => setThemeError(true));
            return undefined;
        }

        if (isThemeMode(user.theme_preference)) {
            setThemePreference(user.theme_preference);
        }
        return undefined;
    }, [authLoading, user, applyUser]);

    useEffect(() => {
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
        } catch {
            // Theme remains available for the current session when storage is blocked.
        }
    }, [themePreference]);

    useLayoutEffect(() => {
        document.documentElement.dataset.theme = activeTheme;
        document.documentElement.style.colorScheme = activeTheme;
    }, [activeTheme]);

    const changeTheme = useCallback(async (nextTheme) => {
        if (!isThemeMode(nextTheme) || nextTheme === themePreference) return;

        setThemeError(false);
        setThemePreference(nextTheme);

        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
            if (user) window.localStorage.setItem(PENDING_THEME_STORAGE_KEY, nextTheme);
        } catch {
            // Keep the immediate in-memory theme even when storage is unavailable.
        }

        if (!user) return;

        setSavingTheme(true);
        try {
            const data = await saveThemePreference(nextTheme);
            try {
                window.localStorage.removeItem(PENDING_THEME_STORAGE_KEY);
            } catch {
                // The server is authoritative after a successful save.
            }
            applyUser(data.user);
        } catch {
            setThemeError(true);
        } finally {
            setSavingTheme(false);
        }
    }, [applyUser, themePreference, user]);

    const value = useMemo(() => ({
        themePreference,
        activeTheme,
        changeTheme,
        savingTheme,
        themeError,
    }), [themePreference, activeTheme, changeTheme, savingTheme, themeError]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};