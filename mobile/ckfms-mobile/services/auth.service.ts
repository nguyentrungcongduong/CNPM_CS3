import api from './api';
import { tokenStorage } from './token.storage';

interface LoginCredentials {
    username: string;
    password: string;
}

interface LoginResponse {
    token: string;
    refreshToken?: string;
    user: {
        id: number;
        username: string;
        role: string;
    };
}

export const authService = {
    /**
     * Đăng nhập – gọi POST /api/v1/auth/login
     * Tự động lưu token vào SecureStore sau khi thành công
     */
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await api.post<{ success: boolean; data: LoginResponse }>(
            '/auth/login',
            credentials
        );
        const { token, refreshToken } = response.data.data;

        await tokenStorage.saveToken(token);
        if (refreshToken) {
            await tokenStorage.saveRefreshToken(refreshToken);
        }

        return response.data.data;
    },

    /**
     * Đăng xuất – xóa token local
     * Gọi logout API nếu backend hỗ trợ
     */
    async logout(): Promise<void> {
        try {
            await api.post('/auth/logout');
        } catch {
            // Bỏ qua lỗi nếu token đã expired
        } finally {
            await tokenStorage.clearTokens();
        }
    },

    /**
     * Lấy thông tin user đang đăng nhập
     */
    async getMe() {
        const response = await api.get('/users/me');
        return response.data.data;
    },
};
