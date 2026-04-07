import { View, Text, ScrollView, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { tokenStorage } from "@/services/token.storage";
import { authService } from "@/services/auth.service";
import api from "@/services/api";

export default function HomeScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [summary, setSummary] = useState({
    pending_orders: 0,
    in_delivery: 0,
    total_items: 0,
    low_stock_items: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    tokenStorage.getToken().then((token) => {
      if (token) {
        setUserInfo("Đã xác thực");
        authService
          .getMe()
          .then((res) => setMe(res))
          .catch(() => {
            // Nếu call /me lỗi vẫn giữ trạng thái đăng nhập
          });
      }
    });
  }, []);

  const fullName = me?.full_name || "nhân viên";
  const storeName = me?.store?.name || "";
  const areaName = me?.store?.area?.name || "";

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setDashboardLoading(true);
        const res = await api.get("/store/dashboard");
        const data = res?.data;

        setSummary(data?.summary || summary);
        setRecentOrders(data?.recent_orders || []);
        setAlerts(data?.alerts || []);
      } catch {
        // ignore for demo UI
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "Chờ duyệt";
      case "IN_DELIVERY":
        return "Đang giao";
      case "CONFIRMED":
        return "Đã xác nhận";
      case "READY":
        return "Sẵn sàng giao";
      case "DELIVERED":
        return "Đã nhận";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status || "—";
    }
  };

  const formatDate = (dt: any) => {
    if (!dt) return "";
    const s = String(dt);
    // ISO / date string
    if (s.length >= 10)
      return s.substring(0, 10).split("-").reverse().join("/");
    try {
      return new Date(dt).toLocaleDateString("vi-VN");
    } catch {
      return "";
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="p-5">
        {/* Welcome Banner */}
        <View className="bg-blue-700 rounded-2xl p-5 mb-5 shadow-md">
          <Text className="text-white text-lg font-bold">
            Xin chào, {fullName}! 👋
          </Text>
          <Text className="text-blue-200 text-sm mt-1">
            {storeName && areaName
              ? `${storeName} - ${areaName}`
              : storeName || "Hệ thống quản lý CKFMS"}
          </Text>
        </View>

        {/* Quick Actions */}
        <Text className="text-slate-700 font-semibold text-base mb-3">
          Thao tác nhanh
        </Text>
        <View className="flex-row gap-3 mb-5">
          <Link href="/scan" asChild>
            <Pressable className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-100 items-center">
              <Text className="text-2xl mb-1">📦</Text>
              <Text className="text-slate-600 text-sm font-medium text-center">
                Nhận hàng
              </Text>
            </Pressable>
          </Link>
          <Link href="/create-order" asChild>
            <Pressable className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-100 items-center">
              <Text className="text-2xl mb-1">📋</Text>
              <Text className="text-slate-600 text-sm font-medium text-center">
                Đặt hàng
              </Text>
            </Pressable>
          </Link>
          <Link href="/inventory" asChild>
            <Pressable className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-100 items-center">
              <Text className="text-2xl mb-1">📊</Text>
              <Text className="text-slate-600 text-sm font-medium text-center">
                Tồn kho
              </Text>
            </Pressable>
          </Link>
        </View>

        {/* KPI Today */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-4">
          <Text className="text-slate-700 font-semibold text-base mb-3">
            Tổng quan hôm nay
          </Text>
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <Text className="text-slate-500 text-xs mb-1">Đơn chờ</Text>
              <Text className="text-slate-900 font-bold text-lg">
                {dashboardLoading ? "..." : summary.pending_orders}
              </Text>
            </View>
            <View className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <Text className="text-slate-500 text-xs mb-1">Đang giao</Text>
              <Text className="text-slate-900 font-bold text-lg">
                {dashboardLoading ? "..." : summary.in_delivery}
              </Text>
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <Text className="text-slate-500 text-xs mb-1">Tồn kho</Text>
              <Text className="text-slate-900 font-bold text-lg">
                {dashboardLoading ? "..." : summary.total_items} SP
              </Text>
            </View>
            <View className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <Text className="text-slate-500 text-xs mb-1">Sắp hết</Text>
              <Text className="text-slate-900 font-bold text-lg">
                {dashboardLoading ? "..." : summary.low_stock_items} SP
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Orders */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-slate-700 font-semibold text-base">
              Đơn hàng gần đây
            </Text>
            <Pressable
              onPress={() => router.push("/orders")}
              className="flex-row items-center"
            >
              <Text className="text-blue-700 text-sm font-medium">
                Xem tất cả →
              </Text>
            </Pressable>
          </View>

          {recentOrders?.length ? (
            <View className="gap-2">
              {recentOrders.map((o) => (
                <View
                  key={o.id}
                  className="flex-row justify-between items-center"
                >
                  <Text className="text-slate-800 text-sm font-medium">
                    {o.order_code} · {statusLabel(o.status)} ·{" "}
                    {formatDate(o.order_date)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-slate-500 text-sm">Chưa có đơn gần đây</Text>
          )}
        </View>

        {/* Alerts */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-4">
          <Text className="text-red-600 font-semibold mb-3">🔴 Cảnh báo</Text>
          {alerts?.length ? (
            <View className="gap-2">
              {alerts.map((a, idx) => (
                <Text
                  key={`${a.type}-${idx}`}
                  className="text-slate-800 text-sm font-medium"
                >
                  {a.message}
                </Text>
              ))}
            </View>
          ) : (
            <Text className="text-slate-500 text-sm">Không có cảnh báo</Text>
          )}
        </View>

        {/* Status */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <Text className="text-slate-500 text-xs mb-2 font-medium uppercase tracking-wider">
            Trạng thái kết nối
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <Text className="text-slate-700 text-sm">
              {userInfo ?? "Đang kiểm tra..."}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
