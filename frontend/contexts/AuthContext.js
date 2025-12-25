import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load tokens on mount
    useEffect(() => {
        loadTokens();
    }, []);

    const loadTokens = async () => {
        try {
            const storedAccessToken = await AsyncStorage.getItem('accessToken');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedAccessToken && storedUser) {
                setAccessToken(storedAccessToken);
                setUser(JSON.parse(storedUser));

                // Set authorization header
                api.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
            }
        } catch (error) {
            console.error('Load tokens error:', error);
        } finally {
            setLoading(false);
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

                // Store token and user
                await AsyncStorage.setItem('accessToken', token);
                await AsyncStorage.setItem('user', JSON.stringify(user));

                setAccessToken(token);
                setUser(user);

                // Set authorization header
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const signup = async (name, email, mobile, password, branch, deviceId) => {
        try {
            const response = await api.post('/auth/signup', {
                name,
                email,
                mobile,
                password,
                branch,
                role: 'agent',
                deviceId
            });

            if (response.data.success) {
                const { user, token } = response.data.data;

                // Store token and user
                await AsyncStorage.setItem('accessToken', token);
                await AsyncStorage.setItem('user', JSON.stringify(user));

                setAccessToken(token);
                setUser(user);

                // Set authorization header
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Signup failed'
            };
        }
    };

    const logout = async () => {
        try {
            // Call logout API
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear storage regardless of API call result
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('user');

            // Clear state
            setAccessToken(null);
            setUser(null);

            // Remove authorization header
            delete api.defaults.headers.common['Authorization'];
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                loading,
                login,
                signup,
                logout,
                isAuthenticated: !!user
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