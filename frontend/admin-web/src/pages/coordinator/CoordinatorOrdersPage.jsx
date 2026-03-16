import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  InputNumber,
  Form,
  Input,
  Divider,
  Tooltip,
  Row,
  Col,
  Statistic,
  Alert,
} from 'antd';
import {
  FileSearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  EditOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { coordinatorOrderService } from '../../api/coordinatorOrderService';
import { OrderStatusBadge, OrderStatusSteps } from '../../components/OrderStatus';
import { ORDER_STATUS, STATUS_LABELS } from '../../constants/orderStatus';

const { Title, Text } = Typography;

// ─────────────────────────────────────────────────────────────────────────
// Drawer: Chi tiết đơn hàng (xem + duyệt / từ chối / hủy)
// ─────────────────────────────────────────────────────────────────────────
function OrderDetailDrawer({ open, onClose, order, onConfirm, onReject, onCancel, onAdjust }) {
  if (!order) return null;

  const isSubmitted = order.status === ORDER_STATUS.SUBMITTED;
  const isConfirmed = order.status === ORDER_STATUS.CONFIRMED;
  const canCancel   = [ORDER_STATUS.SUBMITTED, ORDER_STATUS.CONFIRMED].includes(order.status);

  return (
    <Drawer
      title={
        <Space>
          <FileSearchOutlined />
          <span>Chi tiết đơn {order.order_code}</span>
        </Space>
      }
      width={720}
      open={open}
      onClose={onClose}
      styles={{
        header: { borderBottom: '1px solid #f0f0f0' },
        body: { background: '#f5f5f5' },
      }}
      extra={
        <Space>
          {isSubmitted && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => { onConfirm(order); onClose(); }}
              >
                Xác nhận
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => { onAdjust(order); onClose(); }}
              >
                Sửa số lượng
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => { onReject(order); onClose(); }}
              >
                Từ chối
              </Button>
            </>
          )}
          {canCancel && (
            <Button
              danger
              ghost
              icon={<StopOutlined />}
              onClick={() => { onCancel(order); onClose(); }}
            >
              Hủy đơn
            </Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Status stepper */}
        <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>Tiến trình đơn hàng</Text>
          <OrderStatusSteps status={order.status} size="small" />
        </Card>

        {/* Thông báo nếu đơn có vấn đề */}
        {order.cancel_reason && (
          <Alert
            type="error"
            showIcon
            message="Lý do từ chối / hủy"
            description={order.cancel_reason}
          />
        )}

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
                width: 110,
                render: (v, r) => v != null ? `${Number(v).toFixed(3)} ${r.unit}` : '—',
              },
              {
                title: 'SL duyệt',
                dataIndex: 'approved_quantity',
                align: 'right',
                width: 110,
                render: (v, r) => {
                  if (v == null) return <Text type="secondary">—</Text>;
                  const ordered = Number(r.ordered_quantity || 0);
                  const approved = Number(v);
                  const isShort = approved < ordered;
                  return (
                    <Tooltip title={isShort ? `Thiếu ${(ordered - approved).toFixed(3)} ${r.unit}` : null}>
                      <Text type={isShort ? 'danger' : 'success'}>
                        {approved.toFixed(3)} {r.unit}
                        {isShort && <WarningOutlined style={{ marginLeft: 4 }} />}
                      </Text>
                    </Tooltip>
                  );
                },
              },
              { title: 'Ghi chú', dataIndex: 'note', ellipsis: true },
            ]}
          />
        </Card>
      </Space>
    </Drawer>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Modal: Điều chỉnh số lượng (xử lý thiếu hàng)
// ─────────────────────────────────────────────────────────────────────────
function AdjustQuantitiesModal({ open, order, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && order) {
      const initial = {};
      (order.items || []).forEach((oi) => {
        initial[`qty_${oi.id}`] = Number(oi.approved_quantity ?? oi.ordered_quantity ?? 0);
      });
      form.setFieldsValue({ ...initial, note: order.note || '' });
    }
  }, [open, order, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const items = (order.items || []).map((oi) => ({
        order_item_id:     oi.id,
        approved_quantity: values[`qty_${oi.id}`] ?? Number(oi.ordered_quantity),
      }));
      await coordinatorOrderService.adjustQuantities(order.id, { items, note: values.note || null });
      message.success('Đã cập nhật số lượng phê duyệt');
      onSuccess?.();
      onClose();
    } catch (e) {
      // error shown by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Modal
      open={open}
      title={
        <Space>
          <EditOutlined style={{ color: '#faad14' }} />
          Điều chỉnh số lượng – {order.order_code}
        </Space>
      }
      onCancel={onClose}
      onOk={handleOk}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      confirmLoading={loading}
      width={640}
      destroyOnClose
    >
      <Alert
        showIcon
        type="warning"
        message="Xử lý thiếu hàng"
        description="Điều chỉnh số lượng thực tế có thể cung ứng. Số lượng thấp hơn đặt ban đầu sẽ được highlight đỏ."
        style={{ marginBottom: 16 }}
      />
      <Form form={form} layout="vertical">
        {(order.items || []).map((oi) => {
          const orderedQty = Number(oi.ordered_quantity || 0);
          return (
            <Form.Item
              key={oi.id}
              name={`qty_${oi.id}`}
              label={
                <Space>
                  <Tag color="geekblue">{oi.item?.code}</Tag>
                  <Text strong>{oi.item?.name}</Text>
                  <Text type="secondary">(Đặt: {orderedQty.toFixed(3)} {oi.unit})</Text>
                </Space>
              }
              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
            >
              <InputNumber
                min={0}
                max={orderedQty}
                step={0.001}
                precision={3}
                style={{ width: '100%' }}
                addonAfter={oi.unit}
                onChange={(val) => {
                  // visual feedback is handled by the display above
                }}
              />
            </Form.Item>
          );
        })}
        <Divider />
        <Form.Item name="note" label="Ghi chú (lý do điều chỉnh)">
          <Input.TextArea rows={2} placeholder="Ví dụ: Thiếu nguyên liệu X, chỉ đáp ứng được 80%..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────
export default function CoordinatorOrdersPage() {
  const [orders, setOrders]       = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [loading, setLoading]     = useState(false);
  const [statusFilter, setStatusFilter] = useState(ORDER_STATUS.SUBMITTED);
  const [selected, setSelected]   = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null);

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

  // ---------- Xác nhận ----------
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

  // ---------- Từ chối ----------
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

  // ---------- Hủy đơn ----------
  const handleCancel = (record) => {
    let reason = '';
    Modal.confirm({
      title: 'Hủy đơn hàng',
      icon: <StopOutlined style={{ color: '#ff7a00' }} />,
      content: (
        <div>
          <Text type="warning">
            <WarningOutlined /> Hủy đơn ở trạng thái "{STATUS_LABELS[record.status]}".
          </Text>
          <br />
          <Text style={{ marginTop: 8, display: 'block' }}>Lý do hủy (không bắt buộc):</Text>
          <textarea
            style={{ width: '100%', marginTop: 8, borderRadius: 6, border: '1px solid #d9d9d9', padding: 8 }}
            rows={3}
            onChange={(e) => { reason = e.target.value; }}
          />
        </div>
      ),
      okText: 'Xác nhận hủy',
      okButtonProps: { danger: true },
      cancelText: 'Không hủy',
      async onOk() {
        await coordinatorOrderService.cancel(record.id, { cancel_reason: reason || null });
        message.success('Đã hủy đơn hàng');
        fetchOrders(pagination.current);
      },
    });
  };

  // ---------- Điều chỉnh số lượng ----------
  const handleAdjust = (record) => {
    setAdjustTarget(record);
    setAdjustOpen(true);
  };

  const statusOptions = [
    ORDER_STATUS.SUBMITTED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.IN_PRODUCTION,
    ORDER_STATUS.READY,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.COMPLETED,
  ].map((s) => ({ value: s, label: STATUS_LABELS[s] }));

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      key: 'order_code',
      width: 160,
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
      title: 'Ngày cần',
      dataIndex: 'required_date',
      key: 'required_date',
      width: 120,
      render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Số SP',
      key: 'items_count',
      width: 70,
      align: 'center',
      render: (_, r) => <Badge count={r.items?.length || 0} style={{ backgroundColor: '#1890ff' }} />,
    },
    {
      title: 'Thiếu hàng',
      key: 'shortage',
      width: 100,
      align: 'center',
      render: (_, r) => {
        const items = r.items || [];
        const hasShortage = items.some(
          (oi) => oi.approved_quantity != null &&
            Number(oi.approved_quantity) < Number(oi.ordered_quantity)
        );
        return hasShortage ? (
          <Tooltip title="Đơn có mặt hàng thiếu hàng">
            <Tag color="volcano" icon={<WarningOutlined />}>Thiếu</Tag>
          </Tooltip>
        ) : null;
      },
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
      width: 280,
      render: (_, record) => {
        const isSubmitted = record.status === ORDER_STATUS.SUBMITTED;
        const canCancel   = [ORDER_STATUS.SUBMITTED, ORDER_STATUS.CONFIRMED].includes(record.status);
        return (
          <Space size={4}>
            <Button
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() => { setSelected(record); setDrawerOpen(true); }}
            >
              Xem
            </Button>
            {isSubmitted && (
              <>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleConfirm(record)}
                >
                  Duyệt
                </Button>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleAdjust(record)}
                >
                  Sửa SL
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleReject(record)}
                >
                  Từ chối
                </Button>
              </>
            )}
            {canCancel && !isSubmitted && (
              <Button
                size="small"
                danger
                ghost
                icon={<StopOutlined />}
                onClick={() => handleCancel(record)}
              >
                Hủy
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>
        Duyệt đơn hàng – Coordinator
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
        bodyStyle={{ padding: 18 }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space direction="vertical" size={2}>
            <Text strong>Duyệt đơn đặt hàng từ cửa hàng</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Xem, xác nhận, từ chối, hủy đơn và điều chỉnh số lượng khi thiếu hàng.
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

      {/* Table */}
      <Card
        variant="borderless"
        style={{
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0',
        }}
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

      {/* Drawer xem chi tiết */}
      <OrderDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        order={selected}
        onConfirm={(r) => { setDrawerOpen(false); handleConfirm(r); }}
        onReject={(r) => { setDrawerOpen(false); handleReject(r); }}
        onCancel={(r) => { setDrawerOpen(false); handleCancel(r); }}
        onAdjust={(r) => { setDrawerOpen(false); handleAdjust(r); }}
      />

      {/* Modal điều chỉnh số lượng */}
      <AdjustQuantitiesModal
        open={adjustOpen}
        order={adjustTarget}
        onClose={() => { setAdjustOpen(false); setAdjustTarget(null); }}
        onSuccess={() => fetchOrders(pagination.current)}
      />
    </>
  );
}
