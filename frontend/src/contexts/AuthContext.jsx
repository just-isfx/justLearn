import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const RETURNING_USER_STORAGE_KEY = 'justlearncode_returning_user';

const getReturningUser = () => {
    try {
        const stored = JSON.parse(window.localStorage.getItem(RETURNING_USER_STORAGE_KEY) || 'null');
        if (typeof stored?.name !== 'string' || typeof stored?.email !== 'string') return null;

        return {
            name: stored.name,
            email: stored.email,
            avatarUrl: typeof stored.avatarUrl === 'string' ? stored.avatarUrl : null,
        };
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState(false);
    const [returningUser, setReturningUser] = useState(getReturningUser);

    const rememberUser = useCallback((nextUser) => {
        if (!nextUser || typeof nextUser.name !== 'string' || typeof nextUser.email !== 'string') return;

        const cachedUser = {
            name: nextUser.name,
            email: nextUser.email,
            avatarUrl: typeof nextUser.profile_picture_url === 'string' ? nextUser.profile_picture_url : null,
        };

        try {
            window.localStorage.setItem(RETURNING_USER_STORAGE_KEY, JSON.stringify(cachedUser));
        } catch {
            // Authentication remains available when local storage is disabled.
        }
        setReturningUser(cachedUser);
    }, []);

    useEffect(() => {
        const getSession = async () => {
            try {
                const response = await api.get('/me');
                setUser(response.data.user);
                rememberUser(response.data.user);
            } catch (error) {
                setUser(null);
                if (error?.response?.status !== 401) {
                    setSessionError(true);
                }
            } finally {
                setLoading(false);
            }
        };

        getSession();
    }, [rememberUser]);

    const register = async (payload) => {
        setSessionError('');
        const response = await api.post('/register', payload);
        setUser(response.data.user);
        rememberUser(response.data.user);
        return response.data;
    };

    const login = async (payload) => {
        setSessionError('');
        const response = await api.post('/login', payload);
        setUser(response.data.user);
        rememberUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        await api.post('/logout');
        setUser(null);
    };

    const updateProfile = async (payload) => {
        const response = await api.put('/profile', payload);
        setUser(response.data.user);
        rememberUser(response.data.user);
        return response.data;
    };

    const updatePassword = async (payload) => {
        const response = await api.put('/password', payload);
        return response.data;
    };

    const applyUser = useCallback((nextUser) => {
        setUser(nextUser);
        rememberUser(nextUser);
    }, [rememberUser]);

    const value = useMemo(() => ({
        user,
        loading,
        sessionError,
        returningUser,
        register,
        login,
        logout,
        updateProfile,
        updatePassword,
        applyUser,
    }), [user, loading, sessionError, returningUser, applyUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};
