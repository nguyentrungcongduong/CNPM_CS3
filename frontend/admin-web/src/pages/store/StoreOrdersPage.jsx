import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Badge,
  Empty,
  Drawer,
  Descriptions,
  Alert,
} from 'antd';
import {
  FileSearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { storeOrderService } from '../../api/storeOrderService';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  PENDING: 'gold',
  APPROVED: 'blue',
  PROCESSING: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const STATUS_LABELS = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const OrderDetailDrawer = ({ open, onClose, order }) => {
  if (!order) return null;

  const status = order.status || 'PENDING';
  const statusColor = STATUS_COLORS[status] || 'default';

  return (
    <Drawer
      title={
        <Space>
          <FileSearchOutlined />
          <span>Chi tiết đơn hàng {order.order_code}</span>
        </Space>
      }
      width={640}
      onClose={onClose}
      open={open}
      styles={{
        header: { borderBottom: '1px solid #f0f0f0' },
        body: { background: '#f5f5f5' },
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card
          bordered={false}
          style={{ borderRadius: 10, background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          headStyle={{ borderBottom: 'none', paddingBottom: 0 }}
          bodyStyle={{ paddingTop: 12 }}
        >
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Mã đơn">
              <Tag color="geekblue">{order.order_code}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColor} style={{ fontWeight: 500 }}>
                {STATUS_LABELS[status] || status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Cửa hàng">
              {order.store ? (
                <span>
                  <Tag color="geekblue" style={{ marginRight: 8 }}>
                    {order.store.code}
                  </Tag>
                  {order.store.name}
                </span>
              ) : (
                '—'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian tạo">
              {order.order_date ? new Date(order.order_date).toLocaleString('vi-VN') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày yêu cầu">
              {order.required_date
                ? new Date(order.required_date).toLocaleDateString('vi-VN')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú đơn">
              {order.note || <Text type="secondary">Không có</Text>}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          bordered={false}
          title="Danh sách mặt hàng"
          style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          headStyle={{ borderBottom: '1px solid #f0f0f0' }}
          bodyStyle={{ paddingTop: 12 }}
        >
          <Table
            rowKey="id"
            size="middle"
            dataSource={order.items || []}
            locale={{ emptyText: <Empty description="Chưa có mặt hàng" /> }}
            pagination={false}
            columns={[
              {
                title: 'Mã hàng',
                key: 'code',
                width: 120,
                render: (_, r) =>
                  r.item ? <Tag color="geekblue">{r.item.code}</Tag> : '—',
              },
              {
                title: 'Tên hàng',
                key: 'name',
                render: (_, r) =>
                  r.item ? (
                    <Space direction="vertical" size={0}>
                      <Text strong>{r.item.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {r.item.type}
                      </Text>
                    </Space>
                  ) : (
                    '—'
                  ),
              },
              {
                title: 'Số lượng đặt',
                dataIndex: 'ordered_quantity',
                key: 'ordered',
                align: 'right',
                render: (v, r) =>
                  v != null ? (
                    <span>
                      {Number(v).toFixed(3)} {r.unit}
                    </span>
                  ) : (
                    '—'
                  ),
              },
              {
                title: 'Ghi chú dòng',
                dataIndex: 'note',
                key: 'note',
                ellipsis: true,
              },
            ]}
          />
        </Card>
      </Space>
    </Drawer>
  );
};

export default function StoreOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await storeOrderService.list({
          page,
          per_page: pagination.pageSize,
        });
        const payload = res.data || res;
        setOrders(payload.data || []);
        setPagination((prev) => ({
          ...prev,
          current: payload.current_page,
          total: payload.total,
        }));
      } catch (e) {
        setError('Không thể tải danh sách đơn hàng, vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize],
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const openDetail = async (orderId) => {
    try {
      const res = await storeOrderService.getById(orderId);
      const order = res.data || res;
      setSelectedOrder(order);
      setDetailOpen(true);
    } catch {
      // error already handled globally
    }
  };

  const columns = [
    {
      title: 'Mã đơn',
      key: 'code',
      width: 140,
      render: (_, r) => <Tag color="geekblue">{r.order_code}</Tag>,
    },
    {
      title: 'Thời gian tạo',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 180,
      render: (v) =>
        v ? (
          <Space size={4}>
            <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
            <span>{new Date(v).toLocaleString('vi-VN')}</span>
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (v) =>
        v ? <Text>{v}</Text> : <Text type="secondary">Không có</Text>,
    },
    {
      title: 'Số mặt hàng',
      key: 'item_count',
      width: 120,
      align: 'center',
      render: (_, r) => (
        <Badge
          count={r.items?.length || 0}
          style={{ backgroundColor: '#1890ff' }}
        />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, r) => (
        <Button
          size="small"
          icon={<FileSearchOutlined />}
          onClick={() => openDetail(r.id)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          Đơn hàng cửa hàng
        </Title>
        <Text type="secondary">
          Xem, theo dõi và truy vết các đơn đặt hàng mà cửa hàng của bạn đã gửi lên Bếp Trung Tâm.
        </Text>
      </div>
      <Card
        variant="borderless"
        style={{ marginBottom: 16, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
        bodyStyle={{ padding: 18 }}
      >
        <Space
          style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}
        >
          <Space direction="vertical" size={2}>
            <Text strong>Quản lý đơn đặt hàng nội bộ</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Xem và theo dõi các đơn đặt hàng của cửa hàng bạn gửi lên Bếp Trung Tâm.
            </Text>
          </Space>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchOrders(pagination.current)}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/store/orders/new')}
            >
              Tạo đơn hàng
            </Button>
          </Space>
        </Space>
      </Card>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={orders}
          locale={{
            emptyText: (
              <Empty
                description={
                  <span>
                    Chưa có đơn hàng nào
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Bắt đầu bằng cách tạo đơn hàng mới cho cửa hàng của bạn.
                    </Text>
                  </span>
                }
              />
            ),
          }}
          pagination={{
            ...pagination,
            showTotal: (t) => `Tổng ${t} đơn`,
            onChange: (page) => fetchOrders(page),
          }}
        />
      </Card>

      <OrderDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        order={selectedOrder}
      />
    </>
  );
}

