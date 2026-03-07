import { View, Text } from 'react-native';

export default function OrdersScreen() {
    return (
        <View className="flex-1 bg-slate-50 items-center justify-center">
            <Text className="text-2xl mb-2">📋</Text>
            <Text className="text-slate-600 font-medium">Danh sách đơn hàng</Text>
            <Text className="text-slate-400 text-sm mt-1">Sắp ra mắt...</Text>
        </View>
    );
}
