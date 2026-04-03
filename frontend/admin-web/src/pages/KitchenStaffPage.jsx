import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Statistic,
  Spin,
  Alert,
} from "antd";
import {
  ReloadOutlined,
  FireOutlined,
  ShopOutlined,
  WarningOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { kitchenOrderService } from "../api/kitchenOrderService";
import { inventoryService } from "../api/inventoryService";
import { ORDER_STATUS } from "../constants/orderStatus";

const { Title, Text } = Typography;

function safeDayKey(v) {
  if (!v) return null;
  const d = dayjs(v);
  return d.isValid() ? d.format("YYYY-MM-DD") : null;
}

export default function KitchenStaffPage() {
  const navigate = useNavigate();
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const kitchenWarehouseId = user?.warehouse?.id ?? user?.warehouse_id ?? null;
  const todayKey = dayjs().format("YYYY-MM-DD");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    ordersNeedProductionToday: 0,
    plansInProgressToday: 0,
    batchesToday: 0,
    ingredientsExpiringSoon: 0,
  });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Để dashboard không bị "trống" ở demo, gom 3 mốc phù hợp với dữ liệu seed:
      // - CONFIRMED cần sx cho ngày mai (today + 1)
      // - IN_PRODUCTION đang làm cho hôm nay (today)
      // - READY sẵn sàng giao/tiếp tục cho ngày hôm qua (today - 1)
      const prevKey = dayjs(todayKey).subtract(1, "day").format("YYYY-MM-DD");
      const nextKey = dayjs(todayKey).add(1, "day").format("YYYY-MM-DD");

      const [confirmedRes, inProgressRes, readyRes] = await Promise.all([
        kitchenOrderService.list({
          page: 1,
          per_page: 1,
          date: nextKey,
          status: ORDER_STATUS.CONFIRMED,
        }),
        kitchenOrderService.list({
          page: 1,
          per_page: 1,
          date: todayKey,
          status: ORDER_STATUS.IN_PRODUCTION,
        }),
        kitchenOrderService.list({
          page: 1,
          per_page: 1,
          date: prevKey,
          status: ORDER_STATUS.READY,
        }),
      ]);

      const confirmedPg = confirmedRes?.data || confirmedRes;
      const inProgressPg = inProgressRes?.data || inProgressRes;
      const readyPg = readyRes?.data || readyRes;

      const confirmedDue = Number(confirmedPg?.total ?? 0);
      const inProductionToday = Number(inProgressPg?.total ?? 0);
      const readyDue = Number(readyPg?.total ?? 0);

      const ordersNeedProductionToday =
        confirmedDue + inProductionToday + readyDue;
      const plansInProgressToday = inProductionToday; // demo-friendly: coi IN_PRODUCTION như kế hoạch đang chạy

      // 3) Batches created today (created_at date)
      const batchParams = {
        per_page: 200,
        page: 1,
        status: "ACTIVE",
      };
      if (kitchenWarehouseId) batchParams.warehouse_id = kitchenWarehouseId;

      const batchesRes = await inventoryService.getBatches(batchParams);
      const batchesPg = batchesRes?.data || batchesRes;
      const batches = batchesPg?.data || [];
      const batchesToday = batches.filter(
        (b) => safeDayKey(b?.created_at) === todayKey,
      ).length;

      // 4) Ingredients expiring soon (distinct item_id)
      // Note: tránh dùng isSameOrAfter/isSameOrBefore vì dayjs version hiện tại
      // không expose các hàm so sánh này.
      const now = dayjs();
      const startDay = now.startOf("day").valueOf();
      const endDay = now.add(30, "day").startOf("day").valueOf();
      const expiringBatches = batches.filter((b) => {
        const exp = b?.expiry_date ? dayjs(b.expiry_date) : null;
        if (!exp || !exp.isValid()) return false;
        const expDay = exp.startOf("day").valueOf();
        return expDay >= startDay && expDay <= endDay;
      });
      const ingredientsExpiringSoon = new Set(
        expiringBatches.map((b) => b?.item_id).filter(Boolean),
      ).size;

      setStats({
        ordersNeedProductionToday,
        plansInProgressToday,
        batchesToday,
        ingredientsExpiringSoon,
      });
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e.message ||
          "Không thể tải dashboard bếp",
      );
    } finally {
      setLoading(false);
    }
  }, [kitchenWarehouseId, todayKey]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 16 }}>
        Khu vực nhân viên bếp trung tâm
      </Title>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Lỗi tải dashboard"
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading && !error}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={6}>
            <Card variant="borderless" style={{ borderRadius: 10 }}>
              <Statistic
                title="Đơn cần sản xuất hôm nay"
                value={stats.ordersNeedProductionToday}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card variant="borderless" style={{ borderRadius: 10 }}>
              <Statistic
                title="Kế hoạch đang thực hiện"
                value={stats.plansInProgressToday}
                prefix={<FireOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card variant="borderless" style={{ borderRadius: 10 }}>
              <Statistic
                title="Lô đã tạo hôm nay"
                value={stats.batchesToday}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card variant="borderless" style={{ borderRadius: 10 }}>
              <Statistic
                title="Nguyên liệu sắp hết hạn"
                value={stats.ingredientsExpiringSoon}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card
          variant="borderless"
          style={{ borderRadius: 10, border: "1px solid #f0f0f0" }}
        >
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchDashboard}
              loading={loading}
            >
              Làm mới
            </Button>
            <Button type="primary" onClick={() => navigate("/kitchen/orders")}>
              Xem danh sách đơn
            </Button>
            <Button onClick={() => navigate("/kitchen/production")}>
              Xem kế hoạch sản xuất
            </Button>
          </Space>
        </Card>
      </Spin>
    </div>
  );
}
