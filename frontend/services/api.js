import axios from 'axios';
import { tokenService } from './tokenService';

const API_BASE_URL = 'https://pos-api.ott-tube.in/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await tokenService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            await tokenService.clearTokens();
        }

        if (error.response?.status === 403) {
            await tokenService.clearTokens();
        }

        return Promise.reject(error);
    }
);

export default api;
