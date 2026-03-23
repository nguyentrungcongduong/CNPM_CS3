import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';

export default function TransactionsScreen() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [storeId, setStoreId] = useState<number | null>(null);

    const fetchTransactions = async (id: number) => {
        try {
            const res = await api.get(`/store/inventory/${id}/transactions`);
            const data = res.data?.data?.data || res.data?.data || [];
            setTransactions(data);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const initData = async () => {
        try {
            setLoading(true);
            const meRes = await api.get('/me');
            const userStoreId = meRes.data?.data?.store_id || meRes.data?.user?.store_id;
            
            if (!userStoreId) {
                Alert.alert('Lỗi', 'Tài khoản không được gắn với cửa hàng nào.');
                setLoading(false);
                return;
            }
            
            setStoreId(userStoreId);
            await fetchTransactions(userStoreId);
        } catch (error) {
            console.error('Failed to init transactions:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        initData();
    }, []);

    const onRefresh = useCallback(() => {
        if (storeId) {
            setRefreshing(true);
            fetchTransactions(storeId);
        }
    }, [storeId]);

    const getTransactionStyle = (type: string) => {
        switch (type) {
            case 'IN': return { bg: 'bg-green-100', text: 'text-green-700', label: 'NHẬP' };
            case 'OUT': return { bg: 'bg-red-100', text: 'text-red-700', label: 'XUẤT' };
            case 'ADJUST': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'ĐIỀU CHỈNH' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600', label: type };
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const itemData = item.item || {};
        const style = getTransactionStyle(item.type);
        const date = new Date(item.created_at).toLocaleString('vi-VN');

        return (
            <View className="bg-white p-4 mx-4 mb-3 rounded-xl shadow-sm border border-slate-100">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-slate-800 text-base">{itemData.name}</Text>
                    <View className={`px-2 py-1 rounded ${style.bg}`}>
                        <Text className={`text-xs font-bold ${style.text}`}>{style.label}</Text>
                    </View>
                </View>

                <View className="flex-row justify-between items-end">
                    <View className="flex-1">
                        <Text className="text-xs text-slate-400 mb-1">{date}</Text>
                        <Text className="text-sm text-slate-600" numberOfLines={2}>
                            {item.note || 'Không có ghi chú'}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className={`text-lg font-bold ${item.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                            {item.type === 'IN' ? '+' : '-'}{item.quantity}
                        </Text>
                        <Text className="text-xs text-slate-400">{itemData.unit}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-blue-700 pt-12 pb-4 px-4 flex-row items-center drop-shadow-md">
                <Pressable onPress={() => router.back()} className="mr-3 p-1">
                    <Text className="text-white font-bold text-lg">← Quay lại</Text>
                </Pressable>
                <Text className="text-white text-xl font-bold flex-1">Lịch Sử Giao Dịch</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#1d4ed8" />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1d4ed8']} />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center p-10">
                            <Text className="text-slate-500 font-medium text-center">
                                Chưa có giao dịch kho nào được ghi lại.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
