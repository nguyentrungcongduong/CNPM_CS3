import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const router = useRouter();

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

    const handleBarCodeScanned = ({ type, data }: any) => {
        setScanned(true);
        // Assume data is string (batch_code) like "BTC-12345"
        router.push({
            pathname: '/receive',
            params: { batchCode: data }
        });
    };

    return (
        <View className="flex-1 bg-black">
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />
            
            {/* Overlay for Scanning Area */}
            <View className="absolute inset-x-0 inset-y-0 justify-center items-center pointer-events-none">
                <View className="w-64 h-64 border-2 border-green-500 bg-transparent" />
                <Text className="text-white text-center mt-5 bg-black/50 px-2 py-1 rounded">
                    Hướng camera vào mã QR để quét
                </Text>
            </View>

            {scanned && (
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
