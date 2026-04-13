import '../global.css';

import { Slot, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import type * as Notifications from 'expo-notifications';
import { notificationService } from '@/services/notification.service';
import { tokenStorage } from '@/services/token.storage';

export default function RootLayout() {
    const router = useRouter();
    const pathname = usePathname();
    const notificationListener = useRef<Notifications.Subscription | undefined | any>(undefined);
    const responseListener = useRef<Notifications.Subscription | undefined | any>(undefined);

    const notificationSetupDone = useRef(false);

    useEffect(() => {
        // Chỉ setup 1 lần sau khi đăng nhập
        if (notificationSetupDone.current) return;
        setupNotifications();
    }, [pathname]);

    useEffect(() => {
        // Listener: notification đến khi app đang mở (foreground)
        notificationListener.current = notificationService.onNotificationReceived(
            (notification) => {
                console.log('[Notification] Nhận được notification:', notification);
            }
        );

        // Listener: user tap vào notification (từ notification tray)
        responseListener.current = notificationService.onNotificationTapped(
            (response) => {
                const data = response.notification.request.content.data as Record<string, unknown>;
                console.log('[Notification] User tap:', data);

                // Navigate theo loại notification
                handleNotificationTap(data);
            }
        );

        return () => {
            // Cleanup listeners khi unmount
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    async function setupNotifications() {
        // Chỉ setup khi đã đăng nhập
        const token = await tokenStorage.getToken();
        if (!token) return;

        const expoPushToken = await notificationService.registerForPushNotifications();
        if (expoPushToken) {
            await notificationService.savePushTokenToServer(expoPushToken);
            notificationSetupDone.current = true; // đánh dấu đã setup xong
        }
    }

    function handleNotificationTap(data: Record<string, unknown>) {
        const type = data?.type as string;
        const orderId = data?.order_id as number | undefined;

        switch (type) {
            case 'NEW_ORDER':
            case 'ORDER_STATUS':
                if (orderId) {
                    // Navigate tới màn hình đơn hàng
                    router.push('/(tabs)/orders');
                }
                break;
            case 'LATE_DELIVERY':
                router.push('/(tabs)/orders');
                break;
            default:
                break;
        }
    }

    return (
        <>
            <StatusBar style="auto" />
            <Slot />
        </>
    );
}
