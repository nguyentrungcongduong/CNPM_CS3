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
  Alert,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  FileSearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { kitchenOrderService } from '../../api/kitchenOrderService';
import { OrderStatusBadge, OrderStatusSteps } from '../../components/OrderStatus';
import { ORDER_STATUS } from '../../constants/orderStatus';
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
              <Descriptions column={2} size="small" title="Mốc thờii gian">
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
  const [creatingPlan, setCreatingPlan] = useState(false);

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

  // Tính toán số đơn có thể tạo kế hoạch (CONFIRMED)
  const confirmedOrders = orders.filter(o => o.status === ORDER_STATUS.CONFIRMED);
  const canCreateBatchPlan = confirmedOrders.length > 0;

  const handleCreateBatchPlan = () => {
    if (!canCreateBatchPlan) {
      message.warning('Không có đơn nào ở trạng thái "Đã xác nhận" để tạo kế hoạch');
      return;
    }

    // Tính tổng số lượng từng mặt hàng
    const itemTotals = {};
    confirmedOrders.forEach(order => {
      order.items?.forEach(item => {
        const itemId = item.item?.id || item.item_id;
        const itemName = item.item?.name || 'Unknown';
        const itemCode = item.item?.code || 'Unknown';
        const qty = Number(item.ordered_quantity || 0);
        const unit = item.unit || 'unit';
        
        if (!itemTotals[itemId]) {
          itemTotals[itemId] = { name: itemName, code: itemCode, total: 0, unit };
        }
        itemTotals[itemId].total += qty;
      });
    });

    const itemList = Object.values(itemTotals);

    Modal.confirm({
      title: 'Tạo kế hoạch sản xuất tự động',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      width: 600,
      content: (
        <div>
          <Alert
            type="info"
            message={`Ngày: ${selectedDate.format('YYYY-MM-DD')}`}
            description={`Hệ thống sẽ gom ${confirmedOrders.length} đơn hàng đã xác nhận và tạo 1 kế hoạch sản xuất duy nhất.`}
            style={{ marginBottom: 16 }}
          />
          
          <Text strong>Tổng hợp nguyên liệu cần sản xuất:</Text>
          <div style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}>
            {itemList.map((item, idx) => (
              <div key={idx} style={{ 
                padding: '8px 12px', 
                background: '#f6ffed', 
                border: '1px solid #b7eb8f',
                borderRadius: 6,
                marginBottom: 8
              }}>
                <Tag color="geekblue">{item.code}</Tag>
                <Text strong>{item.name}</Text>
                <div style={{ marginTop: 4 }}>
                  <Text type="success" strong style={{ fontSize: 16 }}>
                    {item.total.toFixed(3)} {item.unit}
                  </Text>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 6 }}>
            <Text type="secondary">
              💡 <Text strong>Lưu ý:</Text> Tất cả đơn trên sẽ được chuyển sang trạng thái "Đang sản xuất" sau khi tạo kế hoạch.
            </Text>
          </div>
        </div>
      ),
      okText: 'Tạo kế hoạch',
      cancelText: 'Hủy',
        async onOk() {
        setCreatingPlan(true);
        try {
          // KHÔNG truyền order_id → Backend tự động gom tất cả đơn CONFIRMED trong ngày
          await createProductionPlan({
            plan_date: selectedDate.format('YYYY-MM-DD'),
          });
          message.success(`Đã tạo kế hoạch sản xuất tổng hợp cho ${confirmedOrders.length} đơn hàng`);
          navigate('/kitchen/production');
        } catch (e) {
          message.error(e?.response?.data?.message || 'Không thể tạo kế hoạch sản xuất');
        } finally {
          setCreatingPlan(false);
        }
      },
    });
  };

  const handleCreateSinglePlan = (order) => {
    Modal.confirm({
      title: `Chuyển đơn ${order.order_code} vào sản xuất?`,
      content: `Hệ thống sẽ tạo 1 kế hoạch sản xuất TÁCH BIỆT chỉ dành riêng cho đơn hàng này.`,
      okText: 'Tạo kế hoạch',
      cancelText: 'Hủy',
      async onOk() {
        try {
          await createProductionPlan({
            plan_date: dayjs().format('YYYY-MM-DD'),
            order_id: order.id
          });
          message.success(`Đã đưa đơn ${order.order_code} vào sản xuất!`);
          fetchOrders(pagination.current);
        } catch (e) {
          message.error(e?.response?.data?.message || 'Không thể tạo kế hoạch sản xuất');
        }
      }
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
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<FileSearchOutlined />} onClick={() => openDetail(record)}>
            Xem
          </Button>
          {record.status === ORDER_STATUS.CONFIRMED && (
            <Button size="small" type="primary" onClick={() => handleCreateSinglePlan(record)}>
              Tạo KH
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>Quản lý sản xuất – Bếp Trung Tâm</Title>

      {/* Stats & Actions */}
      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 16 }}
        bodyStyle={{ padding: 18 }}
      >
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space direction="vertical" size={2}>
              <Text strong>Đơn hàng theo ngày</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Xem tất cả đơn hàng và tạo kế hoạch sản xuất tổng hợp cho nhiều đơn cùng ngày.
              </Text>
            </Space>
          </Col>
          <Col>
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
          </Col>
        </Row>

        {/* Stats & Create Plan Button */}
        <div style={{ marginTop: 16, padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Space size="large">
                <Statistic 
                  title="Tổng đơn" 
                  value={orders.length} 
                  valueStyle={{ color: '#1890ff' }}
                />
                <Statistic 
                  title="Đã xác nhận" 
                  value={confirmedOrders.length} 
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic 
                  title="Đang sản xuất" 
                  value={orders.filter(o => o.status === ORDER_STATUS.IN_PRODUCTION).length} 
                  valueStyle={{ color: '#722ed1' }}
                />
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                loading={creatingPlan}
                disabled={!canCreateBatchPlan}
                onClick={handleCreateBatchPlan}
              >
                Tạo kế hoạch tự động
              </Button>
            </Col>
          </Row>
          {!canCreateBatchPlan && (
            <Alert
              type="warning"
              showIcon
              message="Không thể tạo kế hoạch"
              description="Cần ít nhất 1 đơn hàng ở trạng thái 'Đã xác nhận' để tạo kế hoạch sản xuất."
              style={{ marginTop: 12 }}
            />
          )}
        </div>
      </Card>

      {/* Orders Table */}
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
