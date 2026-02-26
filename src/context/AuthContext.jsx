import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const API = process.env.NODE_ENV === 'production' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:3001/api');

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem('access_token'));
    const [loading, setLoading] = useState(true);

    // Chama /auth/refresh para renovar access token via cookie httpOnly
    const refresh = useCallback(async () => {
        try {
            const r = await fetch(`${API}/auth/refresh`, {
                method: 'POST', credentials: 'include',
            });
            if (r.ok) {
                const d = await r.json();
                setUser(d.user);
                setAccessToken(d.accessToken);
                sessionStorage.setItem('access_token', d.accessToken);
                return d.accessToken;
            }
        } catch { /* offline */ }
        setUser(null);
        setAccessToken(null);
        sessionStorage.removeItem('access_token');
        return null;
    }, []);

    // Ao montar, tenta renovar via refresh token (cookie)
    useEffect(() => {
        refresh().finally(() => setLoading(false));
    }, [refresh]);

    const login = async (email, password) => {
        try {
            const r = await fetch(`${API}/auth/login`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.message || 'Erro ao fazer login.');
            setUser(d.user);
            setAccessToken(d.accessToken);
            sessionStorage.setItem('access_token', d.accessToken);
            return d;
        } catch (e) {
            console.error('[Auth Login Error]', e);
            throw e;
        }
    };

    const register = async (name, email, password) => {
        try {
            const r = await fetch(`${API}/auth/register`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.message || 'Erro ao criar conta.');
            setUser(d.user);
            setAccessToken(d.accessToken);
            sessionStorage.setItem('access_token', d.accessToken);
            return d;
        } catch (e) {
            console.error('[Auth Register Error]', e);
            throw e;
        }
    };

    const logout = async () => {
        await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => { });
        setUser(null);
        setAccessToken(null);
        sessionStorage.removeItem('access_token');
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
