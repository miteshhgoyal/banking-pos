import AsyncStorage from '@react-native-async-storage/async-storage';

export const tokenService = {
    getToken: async () => {
        try {
            return await AsyncStorage.getItem('accessToken');
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    },

    setToken: async (token) => {
        try {
            await AsyncStorage.setItem('accessToken', token);
        } catch (error) {
            console.error('Error setting access token:', error);
        }
    },

    getUser: async () => {
        try {
            const userString = await AsyncStorage.getItem('user');
            return userString ? JSON.parse(userString) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    setUser: async (user) => {
        try {
            await AsyncStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
            console.error('Error setting user:', error);
        }
    },

    clearTokens: async () => {
        try {
            await AsyncStorage.multiRemove(['accessToken', 'user']);
        } catch (error) {
            console.error('Error clearing tokens:', error);
        }
    }
};