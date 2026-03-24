import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  InboxOutlined,
  RiseOutlined,
  ShopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { reportService } from '../../api/reportService';

const { Title, Text } = Typography;

const STATUS_CONFIG = [
  { key: 'submitted', label: 'Submitted', color: '#faad14' },
  { key: 'confirmed', label: 'Confirmed', color: '#1890ff' },
  { key: 'in_production', label: 'In Production', color: '#722ed1' },
  { key: 'delivering', label: 'Delivering', color: '#13c2c2' },
  { key: 'completed', label: 'Completed', color: '#52c41a' },
];

const formatQuantity = (value) =>
  Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 3 });

const formatApiError = (error, fallback, contextLabel) => {
  const statusCode = error?.response?.status;
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) {
    return `[${contextLabel}] ${apiMessage}`;
  }
  if (statusCode) {
    return `[${contextLabel}] Request failed (HTTP ${statusCode}).`;
  }
  return `[${contextLabel}] ${fallback}`;
};

export default function ManagerDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [productionSeries, setProductionSeries] = useState([]);
  const [range, setRange] = useState('weekly');

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingProduction, setLoadingProduction] = useState(true);

  const [dashboardError, setDashboardError] = useState(null);
  const [inventoryError, setInventoryError] = useState(null);
  const [productionError, setProductionError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setDashboardError(null);
    try {
      const res = await reportService.getDashboard();
      setDashboard(res.data || {});
    } catch (e) {
      setDashboardError(formatApiError(e, 'Không thể tải dữ liệu dashboard.', 'Dashboard'));
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const fetchInventoryReport = useCallback(async () => {
    setLoadingInventory(true);
    setInventoryError(null);
    try {
      const res = await reportService.getInventoryReport();
      setInventoryReport(res.data || {});
    } catch (e) {
      setInventoryError(formatApiError(e, 'Không thể tải báo cáo tồn kho hệ thống.', 'Inventory Report'));
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  const fetchProductionReport = useCallback(async (nextRange) => {
    setLoadingProduction(true);
    setProductionError(null);
    try {
      const res = await reportService.getProductionReport(nextRange);
      const series = res.data?.series || [];
      setProductionSeries(series);
    } catch (e) {
      setProductionError(formatApiError(e, 'Không thể tải báo cáo sản xuất.', `Production (${nextRange})`));
    } finally {
      setLoadingProduction(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchInventoryReport();
  }, [fetchDashboard, fetchInventoryReport]);

  useEffect(() => {
    fetchProductionReport(range);
  }, [range, fetchProductionReport]);

  const statusData = useMemo(() => {
    const source = dashboard?.today_orders_by_status || {};
    return STATUS_CONFIG.map((cfg) => ({
      ...cfg,
      value: Number(source[cfg.key] || 0),
    }));
  }, [dashboard]);

  const totalOrders = Number(dashboard?.today_orders_count || 0);
  const lowStockCount = Number(dashboard?.low_stock_items_count || 0);
  const expiringCount = Number(dashboard?.expiring_items_count || 0);
  const expiredCount = Number(dashboard?.expired_items_count || 0);
  const delayedCount = Number(dashboard?.delayed_deliveries_count || 0);

  const inventoryRows = inventoryReport?.breakdown?.per_store_inventory || [];
  const centralKitchen = inventoryReport?.breakdown?.central_kitchen_inventory || {
    total_items: 0,
    total_quantity: 0,
  };

  const inventoryColumns = [
    {
      title: 'Store',
      dataIndex: 'store_name',
      key: 'store_name',
      render: (v, r) => (
        <Space>
          <ShopOutlined style={{ color: '#1890ff' }} />
          <Text strong>{v}</Text>
          {r.store_code ? <Tag color="blue">{r.store_code}</Tag> : null}
        </Space>
      ),
    },
    {
      title: 'Total Items',
      dataIndex: 'total_items',
      key: 'total_items',
      width: 140,
      align: 'right',
      render: (v) => Number(v || 0).toLocaleString('vi-VN'),
    },
    {
      title: 'Total Quantity',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      width: 180,
      align: 'right',
      render: (v) => <Text strong>{formatQuantity(v)}</Text>,
    },
  ];

  return (
    <div>
      <Space direction="vertical" size={4} style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Manager Dashboard</Title>
        <Text type="secondary">System-level operations snapshot for central kitchen and franchise stores.</Text>
      </Space>

      {dashboardError && <Alert showIcon type="error" message={dashboardError} style={{ marginBottom: 12 }} />}
      {inventoryError && <Alert showIcon type="error" message={inventoryError} style={{ marginBottom: 12 }} />}
      {productionError && <Alert showIcon type="error" message={productionError} style={{ marginBottom: 12 }} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            {loadingDashboard ? (
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            ) : (
              <Statistic
                title="Today Orders"
                value={totalOrders}
                prefix={<InboxOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            {loadingDashboard ? (
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            ) : (
              <Statistic
                title="Low Stock Items"
                value={lowStockCount}
                prefix={<WarningOutlined />}
                valueStyle={{ color: lowStockCount > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            {loadingDashboard ? (
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            ) : (
              <Statistic
                title="Expiring Items"
                value={expiringCount}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: expiringCount > 0 ? '#fa8c16' : '#52c41a' }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            {loadingDashboard ? (
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            ) : (
              <Statistic
                title="Delayed Deliveries"
                value={delayedCount}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: delayedCount > 0 ? '#cf1322' : '#52c41a' }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
        <Col xs={24} lg={12}>
          <Card title="Order Status Summary (Today)" bordered={false}>
            {loadingDashboard ? (
              <Skeleton active />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {statusData.map((row) => {
                  const percent = totalOrders > 0 ? Math.round((row.value / totalOrders) * 100) : 0;
                  return (
                    <div key={row.key}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Tag color={row.color}>{row.label}</Tag>
                        </Col>
                        <Col>
                          <Text strong>{row.value}</Text>
                          <Text type="secondary"> ({percent}%)</Text>
                        </Col>
                      </Row>
                      <Progress percent={percent} strokeColor={row.color} showInfo={false} />
                    </div>
                  );
                })}
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Alert Center"
            bordered={false}
            extra={<WarningOutlined style={{ color: '#fa8c16' }} />}
          >
            {loadingDashboard ? (
              <Skeleton active />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={10}>
                <Alert
                  showIcon
                  type={lowStockCount > 0 ? 'warning' : 'success'}
                  icon={<WarningOutlined />}
                  message={`Low stock items: ${lowStockCount}`}
                />
                <Alert
                  showIcon
                  type={expiringCount > 0 ? 'warning' : 'success'}
                  icon={<ClockCircleOutlined />}
                  message={`Expiring items (30 days): ${expiringCount}`}
                />
                <Alert
                  showIcon
                  type={expiredCount > 0 ? 'error' : 'success'}
                  icon={<FireOutlined />}
                  message={`Expired items: ${expiredCount}`}
                />
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
        <Col xs={24}>
          <Card
            bordered={false}
            title="Production Trend"
            extra={
              <Segmented
                options={[
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                ]}
                value={range}
                onChange={setRange}
              />
            }
          >
            {loadingProduction ? (
              <Skeleton active />
            ) : productionSeries.length === 0 ? (
              <Empty description="No production data." />
            ) : (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={productionSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="total_production_quantity"
                      stroke="#1890ff"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Total Production Quantity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="System-wide Inventory Summary" bordered={false}>
            {loadingInventory ? (
              <Skeleton active />
            ) : (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="System Total Items"
                        value={inventoryReport?.total_items || 0}
                        prefix={<ShopOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="System Total Quantity"
                        value={formatQuantity(inventoryReport?.total_quantity)}
                        prefix={<RiseOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="Central Kitchen Quantity"
                        value={formatQuantity(centralKitchen.total_quantity)}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Table
                  rowKey={(r) => r.store_id}
                  columns={inventoryColumns}
                  dataSource={inventoryRows}
                  pagination={{ pageSize: 8, showTotal: (t) => `Total ${t} stores` }}
                  locale={{ emptyText: <Empty description="No store inventory data." /> }}
                />
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

