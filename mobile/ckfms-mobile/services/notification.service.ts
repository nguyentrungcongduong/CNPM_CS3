import type * as NotificationsType from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

/**
 * Tránh lỗi crash trên Expo Go app từ SDK 53 bằng cách chỉ require module
 * 'expo-notifications' nếu dang chạy Dev Client hoặc Production Config.
 */
let Notifications: typeof NotificationsType | null = null;
const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (!isExpoGo) {
    try {
        Notifications = require('expo-notifications');
        Notifications?.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    } catch (e) {
        console.warn('Lỗi Khởi tạo Expo Notifications', e);
    }
}

export const notificationService = {
    /**
     * Xin quyền notification và lấy Expo Push Token
     */
    async registerForPushNotifications(): Promise<string | null> {
        if (isExpoGo) {
            console.warn(
                '[Notification] Không thể lấy Expo Push Token vì bạn đang chạy bằng Expo Go (bị loại bỏ từ SDK 53). Vui lòng dùng thư mục Development Build nếu muốn test tính năng này.'
            );
            return null;
        }

        if (!Device.isDevice) {
            console.log('[Notification] Push notifications chỉ hoạt động trên thiết bị thật');
            return null;
        }

        if (!Notifications) return null;

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notification] Người dùng từ chối quyền notification');
            return null;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('ckfms-orders', {
                name: 'Đơn hàng CKFMS',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#1d4ed8',
                sound: 'default',
            });
        }

        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
            });
            const expoPushToken = tokenData.data;
            console.log('[Notification] Expo Push Token:', expoPushToken);
            return expoPushToken;
        } catch (err) {
            console.error('[Notification] Lỗi lấy push token:', err);
            return null;
        }
    },

    async savePushTokenToServer(expoPushToken: string): Promise<void> {
        try {
            await api.post('/push-token', { expo_push_token: expoPushToken });
            console.log('[Notification] Đã lưu push token lên server');
        } catch (err) {
            console.error('[Notification] Không thể lưu push token:', err);
        }
    },

    async removePushTokenFromServer(): Promise<void> {
        try {
            await api.delete('/push-token');
            console.log('[Notification] Đã xóa push token trên server');
        } catch {}
    },

    onNotificationReceived(handler: (notification: NotificationsType.Notification) => void) {
        if (isExpoGo || !Notifications) return null;
        return Notifications.addNotificationReceivedListener(handler);
    },

    onNotificationTapped(handler: (response: NotificationsType.NotificationResponse) => void) {
        if (isExpoGo || !Notifications) return null;
        return Notifications.addNotificationResponseReceivedListener(handler);
    },
};
