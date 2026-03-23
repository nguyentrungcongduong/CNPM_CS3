import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/services/api';

export default function ReceiveBatchScreen() {
    const { batchCode } = useLocalSearchParams<{ batchCode: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [batch, setBatch] = useState<any>(null);

    const [quantity, setQuantity] = useState('');
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        if (!batchCode) {
            Alert.alert('Lỗi', 'Không tìm thấy mã lô hàng');
            router.back();
            return;
        }
        fetchBatchInfo();
    }, [batchCode]);

    const fetchBatchInfo = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/store/batches/${batchCode}`);
            if (response.data.success) {
                setBatch(response.data.data);
                setQuantity(response.data.data.quantity.toString());
            } else {
                Alert.alert('Lỗi', response.data.message || 'Không thể lấy thông tin lô hàng');
                router.back();
            }
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể kết nối với máy chủ');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleReceive = async () => {
        if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
            Alert.alert('Lỗi', 'Vui lòng nhập số lượng hợp lệ');
            return;
        }

        try {
            setSubmitting(true);
            const response = await api.post('/store/receive-batch', {
                batch_code: batchCode,
                quantity: Number(quantity),
                quality_feedback: feedback
            });

            if (response.data.success) {
                Alert.alert('Thành công', 'Đã nhận lô hàng thành công', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)') }
                ]);
            } else {
                Alert.alert('Lỗi', response.data.message || 'Có lỗi xảy ra khi nhận hàng');
            }
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể kết nối với máy chủ');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50">
                <ActivityIndicator size="large" color="#1d4ed8" />
                <Text className="mt-4 text-slate-600">Đang tải thông tin lô hàng...</Text>
            </View>
        );
    }

    if (!batch) return null;

    return (
        <ScrollView className="flex-1 bg-slate-50 p-5">
            <View className="mb-6 mt-4">
                <Text className="text-2xl font-bold text-slate-800 mb-2">Nhận Lô Hàng</Text>
                <Text className="text-slate-500">Mã lô: {batch.batch_code}</Text>
            </View>

            <View className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-5">
                <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Thông tin nguyên liệu
                </Text>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-600">Tên:</Text>
                    <Text className="text-slate-800 font-medium">{batch.item?.name}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-600">Ngày SX:</Text>
                    <Text className="text-slate-800 font-medium">{batch.mfg_date?.substring(0, 10) || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-600">Hạn SD:</Text>
                    <Text className="text-slate-800 font-medium">{batch.expiry_date?.substring(0, 10) || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-600">Số lượng khả dụng:</Text>
                    <Text className="text-slate-800 font-medium">{batch.quantity} {batch.item?.unit}</Text>
                </View>
            </View>

            <View className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-5">
                <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Xác nhận nhận hàng
                </Text>
                
                <View className="mb-4">
                    <Text className="text-slate-700 font-medium mb-2">Số lượng thực nhận ({batch.item?.unit}) <Text className="text-red-500">*</Text></Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800"
                        keyboardType="numeric"
                        value={quantity}
                        onChangeText={setQuantity}
                        placeholder="Nhập số lượng nhận thực tế"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-slate-700 font-medium mb-2">Phản hồi chất lượng</Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 h-24"
                        multiline
                        textAlignVertical="top"
                        value={feedback}
                        onChangeText={setFeedback}
                        placeholder="Ghi chú về tình trạng, chất lượng hàng hóa (nếu có vấn đề)"
                    />
                </View>
            </View>

            <Pressable
                className={`rounded-xl p-4 items-center mb-8 ${submitting ? 'bg-blue-400' : 'bg-blue-600'}`}
                onPress={handleReceive}
                disabled={submitting}
            >
                {submitting ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-bold text-lg">Xác nhận nhận lô hàng</Text>
                )}
            </Pressable>
        </ScrollView>
    );
}
