import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';

export default function InventoryScreen() {
    const router = useRouter();
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [storeId, setStoreId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        initData();
    }, []);

    const initData = async () => {
        try {
            setLoading(true);
            // 1. Get current user's store_id
            const meRes = await api.get('/me');
            const userStoreId = meRes.data?.data?.store_id || meRes.data?.user?.store_id;
            
            if (!userStoreId) {
                Alert.alert('Lỗi', 'Tài khoản không được gắn với cửa hàng nào.');
                setLoading(false);
                return;
            }
            
            setStoreId(userStoreId);
            await fetchInventory(userStoreId, '');
        } catch (error) {
            console.error('Failed to init inventory:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
            setLoading(false);
        }
    };

    const fetchInventory = async (id: number, search: string) => {
        try {
            setLoading(true);
            const res = await api.get(`/store/inventory/${id}`, {
                params: { search, per_page: 50 }
            });
            const data = res.data?.data?.data || res.data?.data || [];
            setInventory(data);
        } catch (error) {
            console.error('Failed to load inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (storeId) {
            fetchInventory(storeId, searchQuery);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const itemData = item.item || {};
        const available = Number(item.quantity_available || 0);
        const minStock = Number(itemData.min_stock || 0);

        return (
            <View className="bg-white p-4 mx-4 mb-3 rounded-xl shadow-sm border border-slate-100 flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className="font-bold text-slate-800 text-lg mb-1">{itemData.name || 'Không rõ'}</Text>
                    <Text className="text-xs text-slate-500 mb-2">Mã: {itemData.code}</Text>
                    
                    <View className="flex-row items-center gap-2">
                        <View className={`px-2 py-1 rounded ${available <= minStock ? 'bg-red-100' : 'bg-green-100'}`}>
                            <Text className={`text-xs font-semibold ${available <= minStock ? 'text-red-700' : 'text-green-700'}`}>
                                Khả dụng: {available} {itemData.unit}
                            </Text>
                        </View>
                    </View>
                </View>
                
                <View className="items-end justify-center">
                     <Text className="text-sm text-slate-500">Tồn kho:</Text>
                     <Text className="text-xl font-bold text-slate-700">{item.quantity_on_hand}</Text>
                     <Text className="text-xs text-slate-400">{itemData.unit}</Text>
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
                <Text className="text-white text-xl font-bold flex-1">Tồn Kho Cửa Hàng</Text>
                <Pressable onPress={() => router.push('/transactions')} className="bg-white/20 px-3 py-1.5 rounded-lg">
                    <Text className="text-white text-xs font-semibold">Lịch sử</Text>
                </Pressable>
            </View>

            {/* Search Bar */}
            <View className="p-4 flex-row gap-2">
                <TextInput
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2"
                    placeholder="Tìm mã hoặc tên NL..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                />
                <Pressable onPress={handleSearch} className="bg-blue-600 justify-center px-4 rounded-lg">
                    <Text className="text-white font-semibold">Tìm</Text>
                </Pressable>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#1d4ed8" />
                </View>
            ) : (
                <FlatList
                    data={inventory}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center p-10">
                            <Text className="text-slate-500">Không tìm thấy dữ liệu tồn kho.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
