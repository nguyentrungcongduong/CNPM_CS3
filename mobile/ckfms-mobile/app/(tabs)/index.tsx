import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { tokenStorage } from '@/services/token.storage';

export default function HomeScreen() {
    const [userInfo, setUserInfo] = useState<string | null>(null);

    useEffect(() => {
        tokenStorage.getToken().then((token) => {
            if (token) setUserInfo('Đã xác thực');
        });
    }, []);

    return (
        <ScrollView className="flex-1 bg-slate-50">
            <View className="p-5">
                {/* Welcome Banner */}
                <View className="bg-blue-700 rounded-2xl p-5 mb-5 shadow-md">
                    <Text className="text-white text-lg font-bold">
                        Xin chào, nhân viên! 👋
                    </Text>
                    <Text className="text-blue-200 text-sm mt-1">
                        Hệ thống quản lý CKFMS
                    </Text>
                </View>

                {/* Quick Actions */}
                <Text className="text-slate-700 font-semibold text-base mb-3">
                    Thao tác nhanh
                </Text>
                <View className="flex-row gap-3 mb-5">
                    <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-100 items-center">
                        <Text className="text-2xl mb-1">📦</Text>
                        <Text className="text-slate-600 text-sm font-medium text-center">
                            Nhận hàng
                        </Text>
                    </View>
                    <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-100 items-center">
                        <Text className="text-2xl mb-1">📋</Text>
                        <Text className="text-slate-600 text-sm font-medium text-center">
                            Đặt hàng
                        </Text>
                    </View>
                    <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-100 items-center">
                        <Text className="text-2xl mb-1">📊</Text>
                        <Text className="text-slate-600 text-sm font-medium text-center">
                            Tồn kho
                        </Text>
                    </View>
                </View>

                {/* Status */}
                <View className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <Text className="text-slate-500 text-xs mb-2 font-medium uppercase tracking-wider">
                        Trạng thái kết nối
                    </Text>
                    <View className="flex-row items-center gap-2">
                        <View className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <Text className="text-slate-700 text-sm">
                            {userInfo ?? 'Đang kiểm tra...'}
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
