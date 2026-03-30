import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '@/services/api';

export default function InventoryScreen() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState({ name: 'Tồn kho cửa hàng', description: 'Đang tải...' });

  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, [])
  );

  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      // Lấy thông tin store của user hiện tại từ /users/me
      let userStoreId = null;
      try {
          const meRes = await api.get('/me'); // Dùng endpoint /me
          const userData = meRes.data?.data || meRes.data?.user || meRes.data;
          userStoreId = userData?.store_id || userData?.store?.id;
          
          if (userData?.store) {
              const storeName = userData.store.name || 'Cửa hàng';
              const areaName = userData.store.area?.name || 'Quận 1';
              setStoreInfo({ name: 'Tồn kho cửa hàng', description: `${storeName} - ${areaName}` });
          }
      } catch (e) {
          console.warn('Lỗi lấy thông tin user:', e);
      }
      
      // Gọi API lấy tồn kho
      let res;
      try {
           // Ưu tiên /store/inventory/me, nếu backend trả 500 thì fallback sang ID
           res = await api.get('/store/inventory/me');
      } catch (e) {
           if (userStoreId) {
                res = await api.get(`/store/inventory/${userStoreId}`, { params: { per_page: 50 } });
           } else {
                throw e;
           }
      }
      
      let data = res.data?.data?.data || res.data?.data || res.data || [];
      
      // Map API fields to UI requirements
      data = data.map((item: any) => ({
          ...item,
          name: item.name || item.item?.name || 'Unknown',
          quantity: item.quantity !== undefined ? item.quantity : (item.quantity_on_hand !== undefined ? item.quantity_on_hand : item.quantity_available),
          min_quantity: item.min_quantity !== undefined ? item.min_quantity : item.item?.min_stock,
          unit: item.unit || item.item?.unit || 'KG',
      }));
      setInventory(data);
    } catch (err) {
      console.error(err);
      // Alert.alert('Lỗi', 'Không thể lấy dữ liệu tồn kho');
    } finally {
      setLoading(false);
    }
  }

  // Filter theo search
  const filtered = inventory.filter(item =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Badge màu theo số lượng
  const getStatus = (qty: number, minQty: number) => {
    const q = Number(qty) || 0;
    const mq = Number(minQty) || 0;
    if (q <= 0) return { label: 'Hết hàng', color: '#FF4444', icon: '🔴' }
    if (q <= mq) return { label: 'Sắp hết', color: '#FF8800', icon: '🟡' }
    return { label: 'Còn hàng', color: '#00AA44', icon: '🟢' }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Tiêu đề & Cửa hàng */}
      <View style={{ backgroundColor: '#1d4ed8', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: 'white' }}>
          {storeInfo.name}
        </Text>
        <Text style={{ fontSize: 14, color: '#DBEAFE', marginTop: 4 }}>
          {storeInfo.description}
        </Text>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        {/* Tìm kiếm */}
        <TextInput
          placeholder="🔍 Tìm kiếm..."
          value={search}
          onChangeText={setSearch}
          style={{
            backgroundColor: '#FFF',
            borderColor: '#E2E8F0',
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            fontSize: 16,
          }}
        />

        {/* Danh sách */}
        {loading && inventory.length === 0 ? (
           <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }}/>
        ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          onRefresh={fetchInventory}
          refreshing={loading}
          renderItem={({ item }) => {
            const status = getStatus(item.quantity, item.min_quantity)
            return (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                marginBottom: 10,
                backgroundColor: '#FFF',
                borderRadius: 12,
                boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.05)',
                elevation: 2
              }}>
                <View>
                  <Text style={{ fontWeight: '600', fontSize: 16, color: '#1E293B', marginBottom: 6 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '500' }}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: status.color + '15',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20
                }}>
                  <Text style={{ marginRight: 6, fontSize: 14 }}>{status.icon}</Text>
                  <Text style={{ color: status.color, fontWeight: '700', fontSize: 13 }}>
                    {status.label}
                  </Text>
                </View>
              </View>
            )
          }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 15 }}>
              Chưa có dữ liệu tồn kho
            </Text>
          }
        />
        )}
      </View>
    </View>
  )
}
