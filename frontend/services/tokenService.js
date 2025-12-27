import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

export const tokenService = {
    getToken: async () => {
        try {
            return await AsyncStorage.getItem(TOKEN_KEY);
        } catch (error) {
            return null;
        }
    },

    setToken: async (token) => {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
            return true;
        } catch (error) {
            return false;
        }
    },

    getUser: async () => {
        try {
            const userJson = await AsyncStorage.getItem(USER_KEY);
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            return null;
        }
    },

    setUser: async (user) => {
        try {
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
            return true;
        } catch (error) {
            return false;
        }
    },

    clearTokens: async () => {
        try {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
            return true;
        } catch (error) {
            return false;
        }
    },

    hasToken: async () => {
        try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            return !!token;
        } catch (error) {
            return false;
        }
    }
};
