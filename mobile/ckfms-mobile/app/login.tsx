import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin đăng nhập.');
            return;
        }

        setLoading(true);
        try {
            await authService.login({ username: username.trim(), password });
            // Sau khi login thành công → redirect về trang chính
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert(
                'Đăng nhập thất bại',
                error?.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-slate-50"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View className="flex-1 justify-center px-6">
                {/* Logo & Header */}
                <View className="items-center mb-10">
                    <View className="w-20 h-20 bg-blue-700 rounded-2xl items-center justify-center mb-4 shadow-lg">
                        <Text className="text-white text-3xl font-bold">CK</Text>
                    </View>
                    <Text className="text-2xl font-bold text-slate-800 tracking-tight">
                        CKFMS Mobile
                    </Text>
                    <Text className="text-sm text-slate-500 mt-1">
                        Central Kitchen & Franchise Management
                    </Text>
                </View>

                {/* Card */}
                <View className="bg-white rounded-2xl shadow-md p-6">
                    <Text className="text-lg font-semibold text-slate-700 mb-5">
                        Đăng nhập
                    </Text>

                    {/* Username */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-slate-600 mb-1.5">
                            Tên đăng nhập
                        </Text>
                        <TextInput
                            className="bg-slate-100 rounded-xl px-4 py-3 text-slate-800 text-base border border-slate-200"
                            placeholder="Nhập tên đăng nhập..."
                            placeholderTextColor="#94a3b8"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                        />
                    </View>

                    {/* Password */}
                    <View className="mb-6">
                        <Text className="text-sm font-medium text-slate-600 mb-1.5">
                            Mật khẩu
                        </Text>
                        <View className="flex-row items-center bg-slate-100 rounded-xl border border-slate-200">
                            <TextInput
                                className="flex-1 px-4 py-3 text-slate-800 text-base"
                                placeholder="Nhập mật khẩu..."
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                            />
                            <TouchableOpacity
                                className="px-4 py-3"
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Text className="text-slate-400 text-sm">
                                    {showPassword ? 'Ẩn' : 'Hiện'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        className={`rounded-xl py-4 items-center ${loading ? 'bg-blue-400' : 'bg-blue-700'
                            }`}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-base tracking-wide">
                                Đăng nhập
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <Text className="text-center text-xs text-slate-400 mt-8">
                    © 2025 CKFMS · v1.0.0
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}
