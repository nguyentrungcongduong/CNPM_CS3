import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: '#1d4ed8' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                tabBarActiveTintColor: '#1d4ed8',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    borderTopColor: '#e2e8f0',
                    backgroundColor: '#fff',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color }) => (
                        <Text style={{ color, fontSize: 20 }}>🏠</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Đơn hàng',
                    tabBarIcon: ({ color }) => (
                        <Text style={{ color, fontSize: 20 }}>📋</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Cá nhân',
                    tabBarIcon: ({ color }) => (
                        <Text style={{ color, fontSize: 20 }}>👤</Text>
                    ),
                }}
            />
        </Tabs>
    );
}
