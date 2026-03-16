import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Collapse,
  Empty,
  Spin,
  DatePicker,
  Select,
  Tooltip,
  Progress,
  Badge,
  Divider,
} from 'antd';
import {
  ReloadOutlined,
  ShopOutlined,
  InboxOutlined,
  BarChartOutlined,
  CalendarOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { coordinatorOrderService } from '../../api/coordinatorOrderService';
import { STATUS_LABELS, STATUS_COLORS, ORDER_STATUS } from '../../constants/orderStatus';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

// Màu status badge
const statusColors = {
  [ORDER_STATUS.SUBMITTED]: '#faad14',
  [ORDER_STATUS.CONFIRMED]: '#1890ff',
};

export default function CoordinatorSummaryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [statusFilter, setStatusFilter] = useState([
    ORDER_STATUS.SUBMITTED,
    ORDER_STATUS.CONFIRMED,
  ]);
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'stores'

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        statuses: statusFilter.join(','),
      };
      if (dateRange[0]) params.date_from = dateRange[0].format('YYYY-MM-DD');
      if (dateRange[1]) params.date_to = dateRange[1].format('YYYY-MM-DD');
      const res = await coordinatorOrderService.summary(params);
      setData(res.data || res);
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ------------ Columns: By Item ------------
  const itemColumns = [
    {
      title: '#',
      key: 'index',
      width: 45,
      render: (_, __, i) => <Text type="secondary">{i + 1}</Text>,
    },
    {
      title: 'Mã hàng',
      dataIndex: 'item_code',
      key: 'item_code',
      width: 110,
      render: (v) => <Tag color="geekblue">{v || '—'}</Tag>,
    },
    {
      title: 'Tên hàng',
      dataIndex: 'item_name',
      key: 'item_name',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center',
      render: (v) => <Tag>{v || '—'}</Tag>,
    },
    {
      title: 'Tổng đặt',
      dataIndex: 'total_ordered',
      key: 'total_ordered',
      width: 120,
      align: 'right',
      render: (v) => (
        <Text strong style={{ color: '#1890ff' }}>
          {Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
        </Text>
      ),
      sorter: (a, b) => a.total_ordered - b.total_ordered,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Theo cửa hàng',
      dataIndex: 'store_breakdown',
      key: 'store_breakdown',
      render: (breakdown) =>
        breakdown && breakdown.length > 0 ? (
          <Space wrap size={4}>
            {breakdown.map((b) => (
              <Tooltip
                key={b.store_code}
                title={`${b.store_code}: ${Number(b.quantity).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}`}
              >
                <Tag color="blue" style={{ cursor: 'default' }}>
                  {b.store_code}:{' '}
                  {Number(b.quantity).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        ) : (
          '—'
        ),
    },
  ];

  // ------------ Columns: By Store ------------
  const storeColumns = [
    {
      title: 'Cửa hàng',
      key: 'store',
      render: (_, r) => (
        <Space>
          <ShopOutlined style={{ color: '#1890ff' }} />
          <Tag color="geekblue">{r.store_code}</Tag>
          <Text>{r.store_name}</Text>
        </Space>
      ),
    },
    {
      title: 'Số đơn',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 90,
      align: 'center',
      render: (v) => <Badge count={v} style={{ backgroundColor: '#1890ff' }} />,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'statuses',
      key: 'statuses',
      render: (statuses) =>
        statuses && Object.keys(statuses).length > 0 ? (
          <Space wrap size={4}>
            {Object.entries(statuses).map(([s, cnt]) => (
              <Tag key={s} color={STATUS_COLORS[s] || 'default'}>
                {STATUS_LABELS[s] || s}: {cnt}
              </Tag>
            ))}
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'orders',
      key: 'orders',
      render: (orders) =>
        orders ? (
          <Space wrap size={4}>
            {orders.slice(0, 3).map((o) => (
              <Tooltip
                key={o.id}
                title={`${o.order_code} — ${STATUS_LABELS[o.status] || o.status}`}
              >
                <Tag color={STATUS_COLORS[o.status] || 'default'}>{o.order_code}</Tag>
              </Tooltip>
            ))}
            {orders.length > 3 && (
              <Text type="secondary">+{orders.length - 3} đơn khác</Text>
            )}
          </Space>
        ) : (
          '—'
        ),
    },
  ];

  const byItem = data?.by_item || [];
  const byStore = data?.by_store || [];
  const totalOrders = data?.total_orders || 0;
  const totalStores = data?.total_stores || 0;
  const statusBreakdown = data?.statuses || {};

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>
        <BarChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
        Tổng hợp nhu cầu đặt hàng
      </Title>

      {/* Filter bar */}
      <Card
        variant="borderless"
        style={{
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0',
          marginBottom: 16,
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            <RangePicker
              style={{ width: 260 }}
              onChange={(dates) => setDateRange(dates || [null, null])}
              placeholder={['Từ ngày', 'Đến ngày']}
            />
            <FilterOutlined style={{ color: '#8c8c8c' }} />
            <Select
              mode="multiple"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ minWidth: 250 }}
              placeholder="Lọc theo trạng thái đơn"
              options={[
                { value: ORDER_STATUS.SUBMITTED, label: 'Chờ xác nhận' },
                { value: ORDER_STATUS.CONFIRMED, label: 'Đã xác nhận' },
                { value: ORDER_STATUS.IN_PRODUCTION, label: 'Đang sản xuất' },
              ]}
            />
          </Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchSummary}
            loading={loading}
            type="primary"
            ghost
          >
            Làm mới
          </Button>
        </Space>
      </Card>

      {/* KPI Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Statistic
              title="Tổng đơn hàng"
              value={totalOrders}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Statistic
              title="Cửa hàng đặt hàng"
              value={totalStores}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Statistic
              title="Chờ xác nhận"
              value={statusBreakdown[ORDER_STATUS.SUBMITTED] || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Statistic
              title="Đã xác nhận"
              value={statusBreakdown[ORDER_STATUS.CONFIRMED] || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main content */}
      <Spin spinning={loading}>
        {/* Tab switch */}
        <Space style={{ marginBottom: 12 }}>
          <Button
            type={activeTab === 'items' ? 'primary' : 'default'}
            icon={<InboxOutlined />}
            onClick={() => setActiveTab('items')}
          >
            Tổng hợp theo mặt hàng ({byItem.length})
          </Button>
          <Button
            type={activeTab === 'stores' ? 'primary' : 'default'}
            icon={<ShopOutlined />}
            onClick={() => setActiveTab('stores')}
          >
            Tổng hợp theo cửa hàng ({byStore.length})
          </Button>
        </Space>

        {activeTab === 'items' && (
          <Card
            variant="borderless"
            title={
              <Space>
                <InboxOutlined style={{ color: '#1890ff' }} />
                <span>Nhu cầu mặt hàng tổng hợp</span>
                <Tag color="blue">{byItem.length} loại</Tag>
              </Space>
            }
            style={{
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0',
            }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              rowKey={(r) => r.item_id ?? r.item_code}
              columns={itemColumns}
              dataSource={byItem}
              size="middle"
              locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }}
              pagination={{ pageSize: 20, showTotal: (t) => `Tổng ${t} mặt hàng` }}
            />
          </Card>
        )}

        {activeTab === 'stores' && (
          <Card
            variant="borderless"
            title={
              <Space>
                <ShopOutlined style={{ color: '#722ed1' }} />
                <span>Đơn hàng theo cửa hàng</span>
                <Tag color="purple">{byStore.length} cửa hàng</Tag>
              </Space>
            }
            style={{
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0',
            }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              rowKey={(r) => r.store_id ?? r.store_code}
              columns={storeColumns}
              dataSource={byStore}
              size="middle"
              locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }}
              pagination={false}
            />
          </Card>
        )}
      </Spin>
    </>
  );
}
