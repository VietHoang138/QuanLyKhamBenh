import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const res = await authService.getProfile();
                    setUser(res.data);
                } catch (err) {
                    console.error('Failed to load user profile, logging out:', err);
                    logout();
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [token]);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const res = await authService.login(email, password);
            const { token: receivedToken, user: userData } = res.data;
            // Normalize: đảm bảo luôn có cả role (lowercase) và Role (uppercase)
            const normalizedUser = {
                ...userData,
                Role: userData.Role || userData.role,
                FullName: userData.FullName || userData.fullName,
            };
            sessionStorage.setItem('token', receivedToken);
            setToken(receivedToken);
            setUser(normalizedUser);
            return { success: true, role: normalizedUser.Role };
        } catch (err) {
            console.error('Login error:', err);
            return {
                success: false,
                error: err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.'
            };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        try {
            await authService.register(userData);
            return { success: true };
        } catch (err) {
            console.error('Registration error:', err);
            return {
                success: false,
                error: err.response?.data?.message || 'Registration failed. Please try again.'
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const updateProfile = async (profileData) => {
        try {
            await authService.updateProfile(profileData);
            // Reload user details
            const res = await authService.getProfile();
            setUser(res.data);
            return { success: true };
        } catch (err) {
            console.error('Update profile error:', err);
            return {
                success: false,
                error: err.response?.data?.message || 'Failed to update profile.'
            };
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
