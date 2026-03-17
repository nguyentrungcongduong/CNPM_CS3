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
  Drawer,
  Descriptions,
  Divider,
  DatePicker,
  Tooltip,
} from 'antd';
import {
  FileSearchOutlined,
  ReloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { kitchenOrderService } from '../../api/kitchenOrderService';
import { OrderStatusBadge, OrderStatusSteps } from '../../components/OrderStatus';
import { ORDER_STATUS, STATUS_LABELS, ORDER_STEPS } from '../../constants/orderStatus';
import { createProductionPlan } from '../../api/productionService';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// -----------------------------------------------------------------------
// Order Detail Drawer
// -----------------------------------------------------------------------
function OrderDetailDrawer({ open, onClose, order }) {
  if (!order) return null;

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
          </Descriptions>

          {/* Timestamps */}
          {order.confirmed_at && (
            <><Divider style={{ margin: '12px 0' }} />
              <Descriptions column={2} size="small" title="Mốc thời gian">
                {order.confirmed_at && (
                  <Descriptions.Item label="Xác nhận">
                    {new Date(order.confirmed_at).toLocaleString('vi-VN')}
                  </Descriptions.Item>
                )}
                {order.production_started_at && (
                  <Descriptions.Item label="Bắt đầu sx">
                    {new Date(order.production_started_at).toLocaleString('vi-VN')}
                  </Descriptions.Item>
                )}
                {order.ready_at && (
                  <Descriptions.Item label="Sẵn sàng">
                    {new Date(order.ready_at).toLocaleString('vi-VN')}
                  </Descriptions.Item>
                )}
                {order.in_delivery_at && (
                  <Descriptions.Item label="Xuất giao">
                    {new Date(order.in_delivery_at).toLocaleString('vi-VN')}
                  </Descriptions.Item>
                )}
                {order.delivered_at && (
                  <Descriptions.Item label="Đã giao">
                    {new Date(order.delivered_at).toLocaleString('vi-VN')}
                  </Descriptions.Item>
                )}
                {order.completed_at && (
                  <Descriptions.Item label="Hoàn thành">
                    {new Date(order.completed_at).toLocaleString('vi-VN')}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </>
          )}
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
              {
                title: 'Tên hàng',
                key: 'name',
                render: (_, r) => r.item ? r.item.name : '—',
              },
              {
                title: 'SL đặt',
                dataIndex: 'ordered_quantity',
                align: 'right',
                render: (v, r) => v != null ? `${Number(v).toFixed(3)} ${r.unit}` : '—',
              },
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
export default function KitchenOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [creatingPlanForId, setCreatingPlanForId] = useState(null);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await kitchenOrderService.list({
        page,
        per_page: pagination.pageSize,
        date: selectedDate?.format('YYYY-MM-DD'),
      });
      const payload = res.data || res;
      setOrders(payload.data || []);
      setPagination((p) => ({ ...p, current: payload.current_page, total: payload.total }));
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize, selectedDate]);

  useEffect(() => { fetchOrders(1); }, [fetchOrders]);

  const openDetail = async (record) => {
    try {
      const res = await kitchenOrderService.getById(record.id);
      setSelected(res.data ?? res);
      setDrawerOpen(true);
    } catch {
      message.error('Không thể tải chi tiết đơn hàng');
    }
  };

  const handleCreatePlan = (record) => {
    Modal.confirm({
      title: 'Tạo kế hoạch sản xuất cho đơn này?',
      content: (
        <div>
          <div><Text strong>Mã đơn:</Text> <Tag color="geekblue">{record.order_code}</Tag></div>
          <div style={{ marginTop: 6 }}>
            <Text strong>Ngày:</Text>{' '}
            <Text>{selectedDate ? selectedDate.format('YYYY-MM-DD') : '—'}</Text>
          </div>
          <div style={{ marginTop: 6 }}>
            <Text type="secondary">
              Kế hoạch sẽ chỉ lấy sản phẩm từ <Text strong>1 đơn</Text> (không tự gom tất cả đơn trong ngày).
            </Text>
          </div>
        </div>
      ),
      okText: 'Tạo kế hoạch',
      cancelText: 'Hủy',
      async onOk() {
        setCreatingPlanForId(record.id);
        try {
          await createProductionPlan({
            plan_date: selectedDate?.format('YYYY-MM-DD'),
            order_id: record.id,
          });
          message.success('Đã tạo kế hoạch sản xuất. Chuyển sang màn hình Kế hoạch sản xuất…');
          navigate('/kitchen/production');
        } catch (e) {
          message.error(e?.response?.data?.message || 'Không thể tạo kế hoạch sản xuất');
        } finally {
          setCreatingPlanForId(null);
        }
      },
    });
  };

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
      title: 'Ngày yêu cầu',
      dataIndex: 'required_date',
      key: 'required_date',
      width: 130,
      render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
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
      width: 260,
      render: (_, record) => {
        const canCreatePlan = record.status === 'APPROVED';
        return (
          <Space>
            <Button size="small" icon={<FileSearchOutlined />} onClick={() => openDetail(record)}>
              Xem
            </Button>
            <Tooltip title={canCreatePlan ? null : 'Đơn chưa được duyệt'}>
              <Button
                size="small"
                type="primary"
                icon={<PlusOutlined />}
                loading={creatingPlanForId === record.id}
                disabled={!canCreatePlan}
                onClick={() => handleCreatePlan(record)}
              >
                Tạo kế hoạch
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>Quản lý sản xuất – Bếp Trung Tâm</Title>

      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 16 }}
        bodyStyle={{ padding: 18 }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space direction="vertical" size={2}>
            <Text strong>Đơn hàng theo ngày</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Chọn ngày để xem danh sách đơn. Bếp sẽ <Text strong>chọn từng đơn</Text> để tạo kế hoạch sản xuất.
            </Text>
          </Space>
          <Space>
            <DatePicker
              value={selectedDate}
              onChange={(d) => setSelectedDate(d || dayjs())}
              format="YYYY-MM-DD"
              allowClear={false}
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
          locale={{ emptyText: <Empty description="Không có đơn hàng nào trong bếp" /> }}
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
      />
    </>
  );
}
