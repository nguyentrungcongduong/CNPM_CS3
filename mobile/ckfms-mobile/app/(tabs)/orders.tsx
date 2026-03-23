import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';

export default function OrdersScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/store/orders');
            // Assuming response is paginated: response.data.data
            const ordersData = response.data?.data?.data || response.data?.data || [];
            setOrders(ordersData);
        } catch (error: any) {
            console.error('Lỗi khi tải danh sách đơn hàng:', error);
            // Optionally show alert or a fallback state
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
    }, []);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DRAFT': return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Bản Nháp' };
            case 'SUBMITTED': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Chờ Xác Nhận' };
            case 'CONFIRMED': return { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Đã Duyệt' };
            case 'READY': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Sẵn Sàng Giao' };
            case 'DELIVERING': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Đang Giao' };
            case 'DELIVERED': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã Nhận' };
            case 'CANCELLED': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã Hủy' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
        }
    };

    const submitOrder = async (orderId: number) => {
        try {
            const res = await api.put(`/store/orders/${orderId}/submit`);
            if (res.data.success) {
                Alert.alert('Thành công', 'Đã chuyển đơn hàng thành công!');
                onRefresh();
            }
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Lỗi gửi đơn');
        }
    };

    const cancelOrder = async (orderId: number) => {
        Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hủy đơn này?', [
            { text: 'Không', style: 'cancel' },
            { 
                text: 'Hủy Đơn', style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await api.put(`/store/orders/${orderId}/cancel`);
                        if (res.data.success) {
                            Alert.alert('Thành công', 'Đã hủy đơn hàng!');
                            onRefresh();
                        }
                    } catch (error: any) {
                        Alert.alert('Lỗi', error.response?.data?.message || 'Lỗi hủy đơn');
                    }
                }
            }
        ]);
    };

    const renderOrderItem = ({ item }: { item: any }) => {
        const statusObj = getStatusStyle(item.status);
        
        return (
            <View className="bg-white p-4 mx-4 mb-3 rounded-xl shadow-sm border border-slate-100">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-slate-800 text-lg">{item.order_code}</Text>
                    <View className={`px-2 py-1 rounded-md ${statusObj.bg}`}>
                        <Text className={`text-xs font-semibold ${statusObj.text}`}>
                            {statusObj.label}
                        </Text>
                    </View>
                </View>

                <Text className="text-sm text-slate-500 mb-1">📅 Ngày cần: {item.required_date?.substring(0, 10)}</Text>
                <Text className="text-sm text-slate-500 mb-3">📦 Số món: {item.items?.length || 0}</Text>

                {item.note && (
                    <Text className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg mb-3 italic">
                        "{item.note}"
                    </Text>
                )}

                <View className="flex-row gap-2 mt-2">
                    {/* store details view button - can be expanded to new page */}
                    <Pressable 
                        className="flex-1 bg-slate-100 py-2 rounded-lg items-center"
                        onPress={() => Alert.alert('Chi tiết', 'Giả lập xem chi tiết. ' + item.items.map((i: any) => i.item?.name).join(', '))}
                    >
                        <Text className="text-slate-700 font-medium">Chi tiết</Text>
                    </Pressable>

                    {item.status === 'DRAFT' && (
                        <Pressable 
                            className="flex-1 bg-blue-600 py-2 rounded-lg items-center"
                            onPress={() => submitOrder(item.id)}
                        >
                            <Text className="text-white font-medium">Gửi Đơn</Text>
                        </Pressable>
                    )}

                    {(item.status === 'DRAFT' || item.status === 'SUBMITTED') && (
                        <Pressable 
                            className="flex-1 bg-red-100 py-2 rounded-lg items-center"
                            onPress={() => cancelOrder(item.id)}
                        >
                            <Text className="text-red-600 font-medium">Hủy đơn</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            <View className="pt-12 pb-4 px-4 bg-blue-700 drop-shadow-md flex-row justify-between items-center">
                <Text className="text-white text-xl font-bold">Lịch Sử Đặt Hàng</Text>
                <Pressable onPress={() => router.push('/create-order')} className="bg-white/20 px-3 py-1.5 rounded-full">
                    <Text className="text-white font-semibold flex-row items-center">+ Tạo đơn</Text>
                </Pressable>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#1d4ed8" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderOrderItem}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1d4ed8']} />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center p-10">
                            <Text className="text-4xl mb-4">📝</Text>
                            <Text className="text-slate-500 font-medium text-center mb-4">
                                Bạn chưa có đơn đặt hàng nào trong cửa hàng.
                            </Text>
                            <Pressable 
                                className="bg-blue-600 px-6 py-3 rounded-xl"
                                onPress={() => router.push('/create-order')}
                            >
                                <Text className="text-white font-bold">Tạo đơn đặt đầu tiên</Text>
                            </Pressable>
                        </View>
                    }
                />
            )}
        </View>
    );
}
