import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Badge,
  Modal,
  Empty,
  message,
  Select,
  Drawer,
  Descriptions,
} from 'antd';
import {
  FileSearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { coordinatorOrderService } from '../../api/coordinatorOrderService';
import { OrderStatusBadge, OrderStatusSteps } from '../../components/OrderStatus';
import { ORDER_STATUS, STATUS_LABELS } from '../../constants/orderStatus';

const { Title, Text } = Typography;

// -----------------------------------------------------------------------
// Order Detail Drawer
// -----------------------------------------------------------------------
function OrderDetailDrawer({ open, onClose, order, onConfirm, onReject }) {
  if (!order) return null;
  const isSubmitted = order.status === ORDER_STATUS.SUBMITTED;

  return (
    <Drawer
      title={
        <Space>
          <FileSearchOutlined />
          <span>Chi tiết đơn {order.order_code}</span>
        </Space>
      }
      width={680}
      open={open}
      onClose={onClose}
      styles={{
        header: { borderBottom: '1px solid #f0f0f0' },
        body: { background: '#f5f5f5' },
      }}
      extra={
        isSubmitted && (
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => { onConfirm(order); onClose(); }}
            >
              Xác nhận
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => { onReject(order); onClose(); }}
            >
              Từ chối
            </Button>
          </Space>
        )
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Status stepper */}
        <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>Tiến trình đơn hàng</Text>
          <OrderStatusSteps status={order.status} size="small" />
        </Card>

        {/* Basic info */}
        <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Mã đơn">
              <Tag color="geekblue">{order.order_code}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <OrderStatusBadge status={order.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Cửa hàng">
              {order.store ? (
                <span>
                  <Tag color="geekblue" style={{ marginRight: 6 }}>{order.store.code}</Tag>
                  {order.store.name}
                </span>
              ) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày đặt">
              {order.order_date ? new Date(order.order_date).toLocaleString('vi-VN') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày yêu cầu">
              {order.required_date ? new Date(order.required_date).toLocaleDateString('vi-VN') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              {order.note || <Text type="secondary">Không có</Text>}
            </Descriptions.Item>
            {order.cancel_reason && (
              <Descriptions.Item label="Lý do từ chối">
                <Text type="danger">{order.cancel_reason}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Items */}
        <Card
          bordered={false}
          title="Danh sách mặt hàng"
          style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <Table
            rowKey="id"
            size="small"
            dataSource={order.items || []}
            pagination={false}
            locale={{ emptyText: <Empty description="Chưa có mặt hàng" /> }}
            columns={[
              {
                title: 'Mã hàng',
                key: 'code',
                width: 110,
                render: (_, r) => r.item ? <Tag color="geekblue">{r.item.code}</Tag> : '—',
              },
              { title: 'Tên hàng', key: 'name', render: (_, r) => r.item ? r.item.name : '—' },
              {
                title: 'SL đặt',
                dataIndex: 'ordered_quantity',
                align: 'right',
                render: (v, r) => v != null ? `${Number(v).toFixed(3)} ${r.unit}` : '—',
              },
              { title: 'Ghi chú', dataIndex: 'note', ellipsis: true },
            ]}
          />
        </Card>
      </Space>
    </Drawer>
  );
}

// -----------------------------------------------------------------------
// Main Page
// -----------------------------------------------------------------------
export default function CoordinatorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(ORDER_STATUS.SUBMITTED);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, per_page: pagination.pageSize };
      if (statusFilter) params.status = statusFilter;
      const res = await coordinatorOrderService.list(params);
      const payload = res.data || res;
      setOrders(payload.data || []);
      setPagination((p) => ({ ...p, current: payload.current_page, total: payload.total }));
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize, statusFilter]);

  useEffect(() => { fetchOrders(1); }, [fetchOrders]);

  const handleConfirm = (record) => {
    Modal.confirm({
      title: 'Xác nhận đơn hàng',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: `Xác nhận đơn ${record.order_code}? Đơn sẽ được chuyển sang bếp sản xuất.`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      async onOk() {
        await coordinatorOrderService.confirm(record.id);
        message.success('Đã xác nhận đơn hàng');
        fetchOrders(pagination.current);
      },
    });
  };

  const handleReject = (record) => {
    let reason = '';
    Modal.confirm({
      title: 'Từ chối đơn hàng',
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <Text>Lý do từ chối (không bắt buộc):</Text>
          <textarea
            style={{ width: '100%', marginTop: 8, borderRadius: 6, border: '1px solid #d9d9d9', padding: 8 }}
            rows={3}
            onChange={(e) => { reason = e.target.value; }}
          />
        </div>
      ),
      okText: 'Từ chối đơn',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      async onOk() {
        await coordinatorOrderService.reject(record.id, { cancel_reason: reason || null });
        message.success('Đã từ chối đơn hàng');
        fetchOrders(pagination.current);
      },
    });
  };

  const statusOptions = [
    ORDER_STATUS.SUBMITTED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.IN_PRODUCTION,
    ORDER_STATUS.READY,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.COMPLETED,
  ].map((s) => ({ value: s, label: STATUS_LABELS[s] }));

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      key: 'order_code',
      width: 150,
      render: (code) => <Tag color="geekblue">{code}</Tag>,
    },
    {
      title: 'Cửa hàng',
      key: 'store',
      render: (_, r) =>
        r.store ? (
          <span>
            <Tag color="blue" style={{ marginRight: 4 }}>{r.store.code}</Tag>
            {r.store.name}
          </span>
        ) : '—',
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 170,
      render: (v) => v ? new Date(v).toLocaleString('vi-VN') : '—',
    },
    {
      title: 'Số SP',
      key: 'items_count',
      width: 80,
      align: 'center',
      render: (_, r) => <Badge count={r.items?.length || 0} style={{ backgroundColor: '#1890ff' }} />,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status) => <OrderStatusBadge status={status} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 240,
      render: (_, record) => {
        const isSubmitted = record.status === ORDER_STATUS.SUBMITTED;
        return (
          <Space>
            <Button
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() => { setSelected(record); setDrawerOpen(true); }}
            >
              Xem
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              disabled={!isSubmitted}
              onClick={() => handleConfirm(record)}
            >
              Xác nhận
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              disabled={!isSubmitted}
              onClick={() => handleReject(record)}
            >
              Từ chối
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>Xác nhận đơn hàng – Coordinator</Title>

      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 16 }}
        bodyStyle={{ padding: 18 }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space direction="vertical" size={2}>
            <Text strong>Duyệt đơn đặt hàng từ cửa hàng</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Xem và xác nhận / từ chối các đơn hàng ở trạng thái "Chờ xác nhận".
            </Text>
          </Space>
          <Space>
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              placeholder="Lọc theo trạng thái"
              allowClear
              style={{ width: 200 }}
              options={statusOptions}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchOrders(pagination.current)}>
              Làm mới
            </Button>
          </Space>
        </Space>
      </Card>

      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          size="middle"
          locale={{ emptyText: <Empty description="Không có đơn hàng nào" /> }}
          pagination={{
            ...pagination,
            showTotal: (t) => `Tổng ${t} đơn`,
            onChange: (page) => fetchOrders(page),
          }}
        />
      </Card>

      <OrderDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        order={selected}
        onConfirm={handleConfirm}
        onReject={handleReject}
      />
    </>
  );
}
