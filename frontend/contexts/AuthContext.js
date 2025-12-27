import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import api from '../services/api';
import { tokenService } from '../services/tokenService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        loadTokens();
    }, []);

    useEffect(() => {
        if (accessToken && user) {
            verifyToken();

            const interval = setInterval(() => {
                verifyToken();
            }, 5 * 60 * 1000);

            return () => clearInterval(interval);
        }
    }, [accessToken, user]);

    const loadTokens = async () => {
        try {
            const storedToken = await tokenService.getToken();
            const storedUser = await tokenService.getUser();

            if (storedToken && storedUser) {
                setAccessToken(storedToken);
                setUser(storedUser);
                await verifyToken(storedToken);
            }
        } catch (error) {
            await clearAuth();
        } finally {
            setLoading(false);
        }
    };

    const verifyToken = async (token = accessToken) => {
        if (!token || isVerifying) return;

        try {
            setIsVerifying(true);
            const response = await api.post('/auth/verify-token', { token });

            if (!response.data.success || !response.data.valid) {
                await handleInvalidToken(response.data.message);
            }
        } catch (error) {
            if (error.response?.status === 401 || error.response?.data?.expired) {
                await handleInvalidToken('Your session has expired. Please login again.');
            } else if (error.response?.status === 403) {
                await handleInvalidToken('Your account is deactivated. Please contact administrator.');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleInvalidToken = async (message) => {
        await clearAuth();
        Alert.alert(
            'Session Expired',
            message || 'Your session has expired. Please login again.',
            [{ text: 'OK' }],
            { cancelable: false }
        );
    };

    const clearAuth = async () => {
        try {
            await tokenService.clearTokens();
            setAccessToken(null);
            setUser(null);
        } catch (error) {
            return;
        }
    };

    const login = async (email, password, deviceId) => {
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
                deviceId
            });

            if (response.data.success) {
                const { user, token } = response.data.data;

                await tokenService.setToken(token);
                await tokenService.setUser(user);

                setAccessToken(token);
                setUser(user);

                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            if (error.response?.status === 429) {
                const remainingTime = error.response.data.remainingTime;
                return {
                    success: false,
                    message: `Too many login attempts. Please try again after ${remainingTime} minutes.`,
                    rateLimited: true,
                    remainingTime
                };
            }

            if (error.response?.data?.deviceBound) {
                return {
                    success: false,
                    message: error.response.data.message,
                    deviceBound: true
                };
            }

            return {
                success: false,
                message: error.response?.data?.message || 'Login failed. Please try again.'
            };
        }
    };

    const signup = async (name, email, mobile, password, branch) => {
        try {
            const response = await api.post('/auth/signup', {
                name,
                email,
                mobile,
                password,
                branch,
                role: 'agent'
            });

            if (response.data.success) {
                const { user, token } = response.data.data;

                await tokenService.setToken(token);
                await tokenService.setUser(user);

                setAccessToken(token);
                setUser(user);

                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Signup failed. Please try again.'
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            return;
        } finally {
            await clearAuth();
        }
    };

    const updateProfile = async (updates) => {
        try {
            const response = await api.put('/auth/update-profile', updates);

            if (response.data.success) {
                const updatedUser = response.data.data.user;
                await tokenService.setUser(updatedUser);
                setUser(updatedUser);

                return { success: true, message: 'Profile updated successfully' };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update profile'
            };
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const response = await api.put('/auth/change-password', {
                currentPassword,
                newPassword
            });

            if (response.data.success) {
                return { success: true, message: 'Password changed successfully' };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to change password'
            };
        }
    };

    const refreshUserData = async () => {
        try {
            const response = await api.get('/auth/me');

            if (response.data.success) {
                const updatedUser = response.data.data.user;
                await tokenService.setUser(updatedUser);
                setUser(updatedUser);

                return { success: true };
            }
            return { success: false };
        } catch (error) {
            if (error.response?.status === 401) {
                await handleInvalidToken('Your session has expired. Please login again.');
            }
            return { success: false };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                loading,
                isVerifying,
                login,
                signup,
                logout,
                updateProfile,
                changePassword,
                refreshUserData,
                isAuthenticated: !!user && !!accessToken
            }}
        >
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
