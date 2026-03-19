import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'ckfms_access_token';
const REFRESH_TOKEN_KEY = 'ckfms_refresh_token';

export const tokenStorage = {
    async saveToken(token: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            await SecureStore.setItemAsync(TOKEN_KEY, token);
        }
    },

    async getToken(): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(TOKEN_KEY);
        }
        return await SecureStore.getItemAsync(TOKEN_KEY);
    },

    async saveRefreshToken(token: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.setItem(REFRESH_TOKEN_KEY, token);
        } else {
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
        }
    },

    async getRefreshToken(): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(REFRESH_TOKEN_KEY);
        }
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    },

    async clearTokens(): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        } else {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        }
    },
};
