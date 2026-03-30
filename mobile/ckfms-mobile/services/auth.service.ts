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
     * Đăng nhập – gọi POST /api/login
     * Tự động lưu token vào SecureStore / LocalStorage sau khi thành công
     */
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        console.log('[Auth] Đang đăng nhập với:', credentials.username);
        console.log('[Auth] API URL:', api.defaults.baseURL);
        
        try {
            const response = await api.post<{ access_token: string; user: any }>(
                '/login',
                credentials
            );
            console.log('[Auth] Login thành công:', response.data);
            
            const token = response.data.access_token;
            const user = response.data.user;

            await tokenStorage.saveToken(token);

            return {
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role?.code || 'GUEST',
                }
            };
        } catch (error: any) {
            console.error('[Auth] Login lỗi:', error.message);
            console.error('[Auth] Response:', error.response?.data);
            console.error('[Auth] Status:', error.response?.status);
            throw error;
        }
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
