import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { storeReceiveService } from '../services/storeReceive.service';

/**
 * Batch Confirmation Screen
 * Hiển thị thông tin lô hàng và xác nhận nhận
 */
export default function BatchConfirmationScreen() {
  const { batchData, qrData } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // Parse data từ params
  const batch = JSON.parse(batchData as string);
  const qrInfo = JSON.parse(qrData as string);

  // Xác nhận nhận hàng
  const handleConfirm = async () => {
    const qty = parseFloat(quantity);
    
    if (!qty || qty <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng nhận hàng hợp lệ');
      return;
    }

    if (qty > batch.quantity) {
      Alert.alert(
        'Cảnh báo', 
        `Số lượng nhận (${qty}) lớn hơn số lượng giao (${batch.quantity}). Tiếp tục?`,
        [
          { text: 'Huỷ', style: 'cancel' },
          { text: 'Tiếp tục', onPress: () => submitReceive(qty) }
        ]
      );
      return;
    }

    submitReceive(qty);
  };

  const submitReceive = async (qty: number) => {
    setLoading(true);
    
    try {
      const response = await storeReceiveService.receiveBatch({
        batch_code: batch.batch_code,
        quantity: qty,
        quality_feedback: feedback || undefined,
      });

      if (response.success) {
        Alert.alert(
          '✅ Nhận hàng thành công',
          `Đã nhận ${qty} ${batch.item?.unit || 'kg'} ${batch.item?.name}\n\n` +
          `Tồn kho cửa hàng đã được cập nhật.`,
          [
            { 
              text: 'Về trang chủ', 
              onPress: () => router.replace('/(tabs)') 
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể nhận hàng');
      }
    } catch (error: any) {
      console.log('[Confirm] Error:', error);
      Alert.alert(
        'Lỗi nhận hàng',
        error?.response?.data?.message || 'Có lỗi xảy ra khi xác nhận nhận hàng'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận nhận hàng</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Thông tin lô hàng */}
        <View style={styles.batchCard}>
          <View style={styles.batchHeader}>
            <Ionicons name="cube-outline" size={32} color="#4CAF50" />
            <View style={styles.batchTitleContainer}>
              <Text style={styles.batchCode}>{batch.batch_code}</Text>
              <Text style={styles.itemName}>{batch.item?.name || 'Không xác định'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Số lượng giao</Text>
              <Text style={styles.infoValue}>
                {batch.quantity} {batch.item?.unit || 'kg'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ngày sản xuất</Text>
              <Text style={styles.infoValue}>
                {batch.mfg_date 
                  ? new Date(batch.mfg_date).toLocaleDateString('vi-VN') 
                  : '—'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Hạn sử dụng</Text>
              <Text style={[styles.infoValue, styles.expiryHighlight]}>
                {batch.expiry_date 
                  ? new Date(batch.expiry_date).toLocaleDateString('vi-VN') 
                  : '—'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Kho gửi</Text>
              <Text style={styles.infoValue}>
                {batch.warehouse?.name || 'Kho bếp trung tâm'}
              </Text>
            </View>
          </View>
        </View>

        {/* Form nhập liệu */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>📦 Số lượng thực nhận</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.quantityInput}
              placeholder={`Nhập số lượng (${batch.item?.unit || 'kg'})`}
              keyboardType="decimal-pad"
              value={quantity}
              onChangeText={setQuantity}
              defaultValue={String(batch.quantity)}
            />
            <TouchableOpacity 
              style={styles.fillButton}
              onPress={() => setQuantity(String(batch.quantity))}
            >
              <Text style={styles.fillButtonText}>Đủ hàng</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>📝 Phản hồi chất lượng (tuỳ chọn)</Text>
          
          <TextInput
            style={styles.feedbackInput}
            placeholder="Mô tả tình trạng hàng hoá, chất lượng, vấn đề nếu có..."
            multiline
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
            textAlignVertical="top"
          />
        </View>

        {/* Nút xác nhận */}
        <TouchableOpacity 
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
              <Text style={styles.confirmButtonText}>Xác nhận nhận hàng</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          💡 Lưu ý: Sau khi xác nhận, hàng sẽ được cộng vào tồn kho cửa hàng của bạn.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  batchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  batchTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  batchCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expiryHighlight: {
    color: '#FF5722',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  fillButton: {
    marginLeft: 12,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  fillButtonText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#fafafa',
    minHeight: 100,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  confirmButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
});
