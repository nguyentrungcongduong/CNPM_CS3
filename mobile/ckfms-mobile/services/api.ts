import axios from 'axios';
import { tokenStorage } from './token.storage';

// ===== CẤU HÌNH BASE URL =====
// Dùng biến môi trường từ file `.env` (không đưa lên Git) cho bảo mật
// IP máy tính: 10.195.242.159 (4G) - Port 8001
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.195.242.159:8001/api').trim();

console.log('[API] Base URL:', BASE_URL);

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// ============================
// REQUEST INTERCEPTOR
// Tự động đính kèm Bearer Token vào mọi request
// ============================
api.interceptors.request.use(
    async (config) => {
        const token = await tokenStorage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================
// RESPONSE INTERCEPTOR
// Tự động handle lỗi 401 (token hết hạn)
// ============================
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu 401 và chưa retry → xóa token, buộc đăng nhập lại
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            await tokenStorage.clearTokens();
            // Có thể emit event tại đây để navigate về /login
        }

        return Promise.reject(error);
    }
);

export default api;
