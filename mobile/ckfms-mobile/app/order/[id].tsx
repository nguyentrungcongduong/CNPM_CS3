import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/services/api';

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const fetchOrderDetail = async () => {
        try {
            const response = await api.get(`/store/orders/${id}`);
            setOrder(response.data?.data);
        } catch (error: any) {
            console.error('Lỗi khi tải chi tiết đơn hàng:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrderDetail();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrderDetail();
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DRAFT': return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Bản Nháp', icon: '📝' };
            case 'SUBMITTED': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Chờ Xác Nhận', icon: '📤' };
            case 'CONFIRMED': return { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Đã Duyệt', icon: '✅' };
            case 'IN_PRODUCTION': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Đang Sản Xuất', icon: '👨‍🍳' };
            case 'READY': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Sẵn Sàng Giao', icon: '📦' };
            case 'IN_DELIVERY': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Đang Giao', icon: '🚚' };
            case 'DELIVERED': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã Giao', icon: '📬' };
            case 'COMPLETED': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Hoàn Thành', icon: '🎉' };
            case 'CANCELLED': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã Hủy', icon: '❌' };
            case 'REJECTED': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã Từ Chối', icon: '🚫' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600', label: status, icon: '📋' };
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Xác nhận hủy đơn',
            'Bạn có chắc chắn muốn hủy đơn hàng này?',
            [
                { text: 'Không', style: 'cancel' },
                {
                    text: 'Hủy đơn',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(true);
                        try {
                            const res = await api.put(`/store/orders/${id}/cancel`);
                            if (res.data.success) {
                                Alert.alert('Thành công', 'Đã hủy đơn hàng!');
                                fetchOrderDetail();
                            }
                        } catch (error: any) {
                            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy đơn hàng');
                        } finally {
                            setCancelling(false);
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50">
                <ActivityIndicator size="large" color="#1d4ed8" />
                <Text className="mt-4 text-slate-500">Đang tải thông tin đơn hàng...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50">
                <Text className="text-slate-500">Không tìm thấy đơn hàng</Text>
                <Pressable onPress={() => router.back()} className="mt-4 bg-blue-600 px-6 py-2 rounded-lg">
                    <Text className="text-white font-semibold">Quay lại</Text>
                </Pressable>
            </View>
        );
    }

    const statusObj = getStatusStyle(order.status);
    const canCancel = order.status === 'SUBMITTED';

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="pt-12 pb-4 px-4 bg-blue-700 flex-row justify-between items-center">
                <Pressable onPress={() => router.back()}>
                    <Text className="text-white text-lg">← Quay lại</Text>
                </Pressable>
                <Text className="text-white text-xl font-bold">Chi Tiết Đơn Hàng</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1d4ed8']} />
                }
            >
                {/* Order Info Card */}
                <View className="bg-white m-4 p-4 rounded-xl shadow-sm">
                    <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-1">
                            <Text className="text-slate-500 text-sm mb-1">Mã đơn hàng</Text>
                            <Text className="font-bold text-slate-800 text-lg">{order.order_code}</Text>
                        </View>
                        <View className={`px-3 py-1.5 rounded-lg ${statusObj.bg}`}>
                            <Text className={`text-sm font-semibold ${statusObj.text}`}>
                                {statusObj.icon} {statusObj.label}
                            </Text>
                        </View>
                    </View>

                    <View className="border-t border-slate-100 pt-4">
                        <View className="flex-row justify-between mb-3">
                            <View className="flex-1">
                                <Text className="text-slate-500 text-sm">Ngày đặt</Text>
                                <Text className="text-slate-800 font-medium">
                                    {formatDate(order.order_date)}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-500 text-sm">Ngày cần</Text>
                                <Text className="text-slate-800 font-medium">
                                    {order.required_date ? new Date(order.required_date).toLocaleDateString('vi-VN') : 'N/A'}
                                </Text>
                            </View>
                        </View>

                        {order.note && (
                            <View className="bg-slate-50 p-3 rounded-lg mt-2">
                                <Text className="text-slate-500 text-sm mb-1">Ghi chú</Text>
                                <Text className="text-slate-700 italic">"{order.note}"</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Items List */}
                <View className="bg-white mx-4 mb-4 p-4 rounded-xl shadow-sm">
                    <Text className="font-bold text-slate-800 text-lg mb-4">
                        📦 Danh sách nguyên liệu ({order.items?.length || 0})
                    </Text>

                    {order.items?.map((item: any, index: number) => (
                        <View
                            key={item.id}
                            className={`py-3 ${index !== order.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                        >
                            <View className="flex-row justify-between items-center">
                                <View className="flex-1">
                                    <Text className="font-medium text-slate-800">
                                        {index + 1}. {item.item?.name || 'Không xác định'}
                                    </Text>
                                    {item.note && (
                                        <Text className="text-slate-500 text-sm mt-1">{item.note}</Text>
                                    )}
                                </View>
                                <View className="items-end">
                                    <Text className="font-bold text-blue-700">
                                        {item.ordered_quantity} {item.unit}
                                    </Text>
                                    {item.approved_quantity !== null && (
                                        <Text className="text-sm text-slate-500">
                                            Duyệt: {item.approved_quantity} {item.unit}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}

                    {(!order.items || order.items.length === 0) && (
                        <Text className="text-slate-500 text-center py-4">Không có nguyên liệu nào</Text>
                    )}
                </View>

                {/* Status Timeline */}
                <View className="bg-white mx-4 mb-4 p-4 rounded-xl shadow-sm">
                    <Text className="font-bold text-slate-800 text-lg mb-4">
                        📋 Lịch sử trạng thái
                    </Text>

                    {order.status_histories?.map((history: any, index: number) => {
                        const fromStatus = history.from_status ? getStatusStyle(history.from_status) : null;
                        const toStatus = getStatusStyle(history.to_status);
                        const isLast = index === order.status_histories.length - 1;

                        return (
                            <View key={history.id} className="flex-row">
                                {/* Timeline line */}
                                <View className="items-center mr-4">
                                    <View className={`w-3 h-3 rounded-full ${isLast ? 'bg-blue-600' : 'bg-slate-300'}`} />
                                    {!isLast && <View className="w-0.5 flex-1 bg-slate-200 my-1" />}
                                </View>

                                {/* Content */}
                                <View className={`flex-1 pb-4 ${!isLast ? '' : ''}`}>
                                    <View className="flex-row items-center flex-wrap">
                                        {fromStatus ? (
                                            <>
                                                <Text className={`text-sm font-medium ${fromStatus.text} bg-slate-100 px-2 py-0.5 rounded`}>
                                                    {fromStatus.label}
                                                </Text>
                                                <Text className="text-slate-400 mx-2">→</Text>
                                            </>
                                        ) : (
                                            <Text className="text-slate-500 text-sm mr-2">🆕 Khởi tạo:</Text>
                                        )}
                                        <Text className={`text-sm font-medium ${toStatus.text} ${toStatus.bg} px-2 py-0.5 rounded`}>
                                            {toStatus.label}
                                        </Text>
                                    </View>

                                    <Text className="text-slate-500 text-xs mt-1">
                                        {formatDate(history.created_at)}
                                    </Text>

                                    {history.changed_by && (
                                        <Text className="text-slate-400 text-xs mt-0.5">
                                            bởi {history.changed_by.name}
                                        </Text>
                                    )}

                                    {history.note && (
                                        <Text className="text-slate-600 text-sm mt-1 bg-slate-50 p-2 rounded">
                                            {history.note}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}

                    {(!order.status_histories || order.status_histories.length === 0) && (
                        <Text className="text-slate-500 text-center py-4">Chưa có lịch sử trạng thái</Text>
                    )}
                </View>

                {/* Cancel Button - Only show when status = SUBMITTED */}
                {canCancel && (
                    <View className="mx-4 mb-8">
                        <Pressable
                            onPress={handleCancel}
                            disabled={cancelling}
                            className="bg-red-500 py-4 rounded-xl items-center flex-row justify-center"
                            style={{ opacity: cancelling ? 0.7 : 1 }}
                        >
                            {cancelling ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white text-lg font-bold mr-2">🚫</Text>
                                    <Text className="text-white text-lg font-bold">Hủy Đơn Hàng</Text>
                                </>
                            )}
                        </Pressable>
                        <Text className="text-slate-400 text-center text-sm mt-2">
                            Chỉ có thể hủy khi đơn đang ở trạng thái "Chờ Xác Nhận"
                        </Text>
                    </View>
                )}

                {/* Bottom padding */}
                <View className="h-4" />
            </ScrollView>
        </View>
    );
}
