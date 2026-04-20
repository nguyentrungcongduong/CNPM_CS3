import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import api from "@/services/api";

// ── Vertical searchable item picker ──────────────────────────────
function ItemPicker({ items, selectedId, onSelect }: { items: any[]; selectedId: string; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = query.trim()
    ? items.filter((i) =>
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        (i.code ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : items;

  const selected = items.find((i) => i.id.toString() === selectedId);

  return (
    <View className="mb-3">
      {/* Search / selected display */}
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-row justify-between items-center"
      >
        <Text className={selected ? "text-slate-800 font-medium" : "text-slate-400"}>
          {selected ? `${selected.name} (${selected.unit})` : "Chọn nguyên liệu..."}
        </Text>
        <Text className="text-slate-400">{open ? "▲" : "▼"}</Text>
      </Pressable>

      {open && (
        <View className="border border-slate-200 rounded-lg mt-1 bg-white shadow-sm overflow-hidden">
          {/* Search input */}
          <View className="border-b border-slate-100 px-3 py-2">
            <TextInput
              placeholder="Tìm nguyên liệu..."
              value={query}
              onChangeText={setQuery}
              autoFocus
              className="text-slate-700"
            />
          </View>
          {/* List — dùng ScrollView thay FlatList để tránh lỗi VirtualizedList nested */}
          <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {filtered.length === 0 ? (
              <Text className="text-slate-400 italic text-center py-4">Không tìm thấy nguyên liệu</Text>
            ) : (
              filtered.map((item) => (
                <Pressable
                  key={item.id.toString()}
                  onPress={() => {
                    onSelect(item.id.toString());
                    setQuery("");
                    setOpen(false);
                  }}
                  style={{ backgroundColor: selectedId === item.id.toString() ? "#eff6ff" : "transparent" }}
                  className="px-4 py-3 border-b border-slate-50 flex-row justify-between items-center"
                >
                  <Text className={selectedId === item.id.toString() ? "text-blue-700 font-semibold" : "text-slate-700"}>
                    {item.name}
                  </Text>
                  <Text className="text-slate-400 text-sm">{item.unit}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────


export default function CreateOrderScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Order form state
  const [requiredDate, setRequiredDate] = useState("");
  const [note, setNote] = useState("");

  // Selected items state
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Form for adding individual item
  const [currentItemId, setCurrentItemId] = useState<string>("");
  const [currentQuantity, setCurrentQuantity] = useState<string>("");

  useEffect(() => {
    fetchItems();
    // Set default required date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRequiredDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  const fetchItems = async () => {
    try {
      // Mobile dùng chung catalog items cho Manager.
      // ItemController@index trả về: { success: true, data: [...] }
      const response = await api.get("/manager/items");
      const payload = response?.data;
      const list = payload?.data ?? payload ?? [];
      setItems(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) {
        setCurrentItemId(list[0].id.toString());
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách nguyên liệu:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách nguyên liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (
      !currentItemId ||
      !currentQuantity ||
      isNaN(Number(currentQuantity)) ||
      Number(currentQuantity) <= 0
    ) {
      Alert.alert(
        "Lỗi",
        "Vui lòng chọn nguyên liệu và nhập số lượng hợp lệ (> 0)",
      );
      return;
    }

    const itemObj = items.find((i) => i.id.toString() === currentItemId);
    if (!itemObj) return;

    // Check if item already exists in selected list, update it
    const existingIndex = selectedItems.findIndex(
      (i) => i.item_id === itemObj.id,
    );
    if (existingIndex >= 0) {
      const newList = [...selectedItems];
      newList[existingIndex].ordered_quantity += Number(currentQuantity);
      setSelectedItems(newList);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          item_id: itemObj.id,
          name: itemObj.name,
          unit: itemObj.unit,
          ordered_quantity: Number(currentQuantity),
        },
      ]);
    }

    setCurrentQuantity("");
  };

  const handleRemoveItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter((i) => i.item_id !== itemId));
  };

  const handleSubmitOrder = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất 1 nguyên liệu để đặt hàng");
      return;
    }

    if (!requiredDate) {
      Alert.alert("Lỗi", "Vui lòng nhập ngày cần hàng");
      return;
    }

    try {
      setLoading(true);
      const orderPayload = {
        required_date: requiredDate,
        note: note,
        items: selectedItems.map((item) => ({
          item_id: item.item_id,
          ordered_quantity: item.ordered_quantity,
          unit: item.unit,
        })),
      };

      const response = await api.post("/store/orders", orderPayload);

      if (response.data.success) {
        Alert.alert("Thành công", "Đã tạo đơn đặt hàng mới thành công!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error("Lỗi tạo đơn hàng:", error);
      const msg =
        error.response?.data?.message || "Có lỗi xảy ra khi tạo đơn hàng";
      Alert.alert("Lỗi", msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text className="mt-2 text-slate-500">Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-blue-700 pt-12 pb-4 px-4 flex-row items-center drop-shadow-md">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Text className="text-white font-bold text-lg">← Quay lại</Text>
        </Pressable>
        <Text className="text-white text-xl font-bold flex-1">
          Tạo Đặt Hàng
        </Text>
      </View>

      <View className="p-4">
        <Text className="text-slate-500 mb-4">
          Điền thông tin và chọn nguyên liệu cần đặt cho cửa hàng.
        </Text>

        {/* General Info */}
        <View className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
          <Text className="font-semibold text-slate-700 mb-2">
            Thông tin chung
          </Text>

          <Text className="text-sm text-slate-500 mb-1">
            Ngày cần hàng (YYYY-MM-DD)
          </Text>
          <TextInput
            className="bg-slate-50 border border-slate-200 rounded-lg p-3 py-2 mb-3"
            value={requiredDate}
            onChangeText={setRequiredDate}
            placeholder="2025-10-25"
          />

          <Text className="text-sm text-slate-500 mb-1">
            Ghi chú đơn hàng (Tùy chọn)
          </Text>
          <TextInput
            className="bg-slate-50 border border-slate-200 rounded-lg p-3 py-2"
            value={note}
            onChangeText={setNote}
            placeholder="Giao buổi sáng..."
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Add Item Form */}
        <View className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
          <Text className="font-semibold text-slate-700 mb-2">
            Thêm nguyên liệu
          </Text>

          <Text className="text-sm text-slate-500 mb-1">Chọn nguyên liệu</Text>
          <ItemPicker
            items={items}
            selectedId={currentItemId}
            onSelect={setCurrentItemId}
          />


          <Text className="text-sm text-slate-500 mb-1">Số lượng</Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 py-2"
              value={currentQuantity}
              onChangeText={setCurrentQuantity}
              placeholder="Nhập số lượng..."
              keyboardType="numeric"
            />
            <Pressable
              className="bg-green-600 justify-center px-4 rounded-lg"
              onPress={handleAddItem}
            >
              <Text className="text-white font-bold">Thêm</Text>
            </Pressable>
          </View>
        </View>

        {/* Selected Items List */}
        <View className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
          <Text className="font-semibold text-slate-700 mb-2">
            Danh sách đã chọn ({selectedItems.length})
          </Text>

          {selectedItems.length === 0 ? (
            <Text className="text-slate-400 italic">
              Chưa có nguyên liệu nào được chọn.
            </Text>
          ) : (
            selectedItems.map((item, index) => (
              <View
                key={index}
                className="flex-row justify-between items-center py-2 border-b border-slate-100"
              >
                <View>
                  <Text className="font-medium text-slate-800">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-slate-500">
                    {item.ordered_quantity} {item.unit}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleRemoveItem(item.item_id)}
                  className="bg-red-50 p-2 rounded-lg"
                >
                  <Text className="text-red-600 font-bold">Xóa</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Submit Action */}
        <Pressable
          className={`p-4 rounded-xl items-center mb-10 ${selectedItems.length > 0 && requiredDate ? "bg-blue-600" : "bg-slate-300"}`}
          onPress={handleSubmitOrder}
          disabled={selectedItems.length === 0 || !requiredDate || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Xác nhận tạo Đơn
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
