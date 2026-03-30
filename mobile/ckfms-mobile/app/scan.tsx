import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { storeReceiveService } from '../services/storeReceive.service';

/**
 * QR Scanner Screen - Nhận hàng từ bếp trung tâm
 * Quét mã QR trên lô hàng để nhận thông tin và xác nhận
 */
export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Xử lý khi quét được QR
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // Parse QR data (JSON format)
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch {
        // Nếu không phải JSON, giả sử đó là batch_code trực tiếp
        qrData = { batch_code: data };
      }

      const batchCode = qrData.batch_code || data;
      console.log('[QR] Scanned data:', data);
      console.log('[QR] Parsed batchCode:', batchCode);
      console.log('[QR] QR Data object:', qrData);

      // Gọi API lấy thông tin batch
      const response = await storeReceiveService.getBatchInfo(batchCode);
      
      if (response.success) {
        // Chuyển sang màn hình xác nhận
        router.push({
          pathname: '/batch-confirmation',
          params: { 
            batchData: JSON.stringify(response.data),
            qrData: JSON.stringify(qrData)
          }
        });
      } else {
        alert(response.message || 'Không tìm thấy thông tin lô hàng');
        setScanned(false);
      }
    } catch (error: any) {
      console.error('[QR Scan] Error:', error);
      alert(error?.response?.data?.message || 'Không thể đọc thông tin từ mã QR');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <Text>Đang yêu cầu quyền sử dụng camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-slate-50">
        <Text className="text-center mb-5 text-slate-700">
          Ứng dụng cần quyền sử dụng camera để quét mã QR nhận hàng.
        </Text>
        <Pressable
          className="bg-blue-600 px-5 py-3 rounded-lg"
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold">Cấp quyền camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      {/* Overlay cho vùng quét */}
      <View className="absolute inset-x-0 inset-y-0 justify-center items-center pointer-events-none">
        <View className="w-64 h-64 border-2 border-green-500 bg-transparent rounded-lg" />
        
        {loading ? (
          <View className="mt-5 bg-black/70 px-4 py-2 rounded-lg flex-row items-center">
            <ActivityIndicator color="#4CAF50" className="mr-2" />
            <Text className="text-white text-center">Đang xử lý...</Text>
          </View>
        ) : (
          <Text className="text-white text-center mt-5 bg-black/50 px-2 py-1 rounded">
            Hướng camera vào mã QR để quét
          </Text>
        )}
      </View>

      {scanned && !loading && (
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <Pressable
            className="bg-white px-5 py-3 rounded-lg shadow"
            onPress={() => setScanned(false)}
          >
            <Text className="text-blue-600 font-semibold">Quét lại</Text>
          </Pressable>
        </View>
      )}

      <View className="absolute top-12 left-5 z-10">
        <Pressable
          className="bg-white/80 p-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-slate-800 font-bold">✕ Đóng</Text>
        </Pressable>
      </View>
    </View>
  );
}
