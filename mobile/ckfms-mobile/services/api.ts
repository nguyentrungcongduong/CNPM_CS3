import axios from 'axios';
import { tokenStorage } from './token.storage';

// ===== CẤU HÌNH BASE URL =====
// Thay đổi URL này khi chạy với backend thật.
// Khi dùng Expo Go + máy tính cùng mạng WiFi:
//   → Thay "localhost" bằng IP máy tính (VD: http://192.168.1.100:8000/api/v1)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

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
