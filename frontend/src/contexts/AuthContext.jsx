import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            try {
                const response = await api.get('/me');
                setUser(response.data.user);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getSession();
    }, []);

    const register = async (payload) => {
        const response = await api.post('/register', payload);
        setUser(response.data.user);
        return response.data;
    };

    const login = async (payload) => {
        const response = await api.post('/login', payload);
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        await api.post('/logout');
        setUser(null);
    };

    const updateProfile = async (payload) => {
        const response = await api.put('/profile', payload);
        setUser(response.data.user);
        return response.data;
    };

    const updatePassword = async (payload) => {
        const response = await api.put('/password', payload);
        return response.data;
    };

    const applyUser = useCallback((nextUser) => {
        setUser(nextUser);
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        register,
        login,
        logout,
        updateProfile,
        updatePassword,
        applyUser,
    }), [user, loading, applyUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};
