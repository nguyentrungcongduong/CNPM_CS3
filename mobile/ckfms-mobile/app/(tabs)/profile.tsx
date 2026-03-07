import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';

export default function ProfileScreen() {
    const handleLogout = async () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất',
                style: 'destructive',
                onPress: async () => {
                    await authService.logout();
                    router.replace('/login');
                },
            },
        ]);
    };

    return (
        <View className="flex-1 bg-slate-50 p-5">
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
                <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-3">
                    <Text className="text-3xl">👤</Text>
                </View>
                <Text className="text-slate-800 font-bold text-lg">Nhân viên CKFMS</Text>
                <Text className="text-slate-400 text-sm">Đã đăng nhập</Text>
            </View>

            <TouchableOpacity
                className="bg-red-50 border border-red-200 rounded-xl p-4 items-center"
                onPress={handleLogout}
            >
                <Text className="text-red-600 font-semibold">Đăng xuất</Text>
            </TouchableOpacity>
        </View>
    );
}
