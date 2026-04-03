import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Typography, Button, Space, Statistic, Spin, Alert } from 'antd';
import { ReloadOutlined, ShopOutlined, ClockCircleOutlined, WarningOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { storeOrderService } from '../api/storeOrderService';
import { inventoryService } from '../api/inventoryService';
import { ORDER_STATUS } from '../constants/orderStatus';

const { Title } = Typography;

export default function StorePage() {
  const navigate = useNavigate();
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const storeName = user?.store?.name ?? user?.store?.code ?? 'Cửa hàng';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    ordersWaiting: 0,
    ordersDelivering: 0,
    lowStockCount: 0,
  });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Đơn chờ duyệt (SUBMITTED)
      const [draftRes, submittedRes] = await Promise.all([
        storeOrderService.list({ page: 1, per_page: 1, status: ORDER_STATUS.DRAFT }),
        storeOrderService.list({ page: 1, per_page: 1, status: ORDER_STATUS.SUBMITTED }),
      ]);
      const draftPg = draftRes?.data || draftRes;
      const submittedPg = submittedRes?.data || submittedRes;
      const ordersWaiting = Number(draftPg?.total ?? 0) + Number(submittedPg?.total ?? 0);

      // Đơn đang giao (IN_DELIVERY + DELIVERED)
      const [inDeliveryRes, deliveredRes] = await Promise.all([
        storeOrderService.list({ page: 1, per_page: 1, status: ORDER_STATUS.IN_DELIVERY }),
        storeOrderService.list({ page: 1, per_page: 1, status: ORDER_STATUS.DELIVERED }),
      ]);
      const inDeliveryPg = inDeliveryRes?.data || inDeliveryRes;
      const deliveredPg = deliveredRes?.data || deliveredRes;
      const ordersDelivering = Number(inDeliveryPg?.total ?? 0) + Number(deliveredPg?.total ?? 0);

      // Tồn kho sắp hết hạn (low_stock)
      const lowStockRes = await inventoryService.getKitchenStock({
        low_stock: true,
        page: 1,
        per_page: 1,
      });
      const lowStockCount = Number(lowStockRes?.summary?.low_stock_count ?? 0);

      setStats({ ordersWaiting, ordersDelivering, lowStockCount });
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Không thể tải dashboard cửa hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        Khu vực cửa hàng: {storeName}
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
          <Col xs={24} md={8}>
            <Card variant="borderless" style={{ borderRadius: 10 }}>
              <Statistic
                title="Đơn đang chờ duyệt"
                value={stats.ordersWaiting}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card variant="borderless" style={{ borderRadius: 10 }}>
              <Statistic
                title="Đơn đang giao"
                value={stats.ordersDelivering}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card variant="borderless" style={{ borderRadius: 10 }}>
              <Statistic
                title="Tồn kho sắp hết"
                value={stats.lowStockCount}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card variant="borderless" style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}>
          <Space wrap>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => navigate('/store/orders/new')}
            >
              Tạo đơn mới
            </Button>
            <Button icon={<FileTextOutlined />} onClick={() => navigate('/store/orders')}>
              Xem đơn hàng
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchDashboard} loading={loading}>
              Làm mới
            </Button>
          </Space>
        </Card>
      </Spin>
    </div>
  );
}
