import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Tag, Space, Typography, Row, Col, Statistic,
  Select, DatePicker, Button, Modal, Descriptions, Timeline,
  Badge, Tooltip, message, Popconfirm, Input, Form,
} from 'antd';
import {
  CarOutlined, ClockCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ShopOutlined, EyeOutlined,
  FilterOutlined, ReloadOutlined, SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { deliveryService } from '../../api/deliveryService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ---- Status helpers ----
const DELIVERY_STATUS = {
  PENDING:    { color: 'orange',  text: 'Chờ xuất phát', icon: <ClockCircleOutlined /> },
  IN_TRANSIT: { color: 'blue',    text: 'Đang giao',     icon: <CarOutlined /> },
  DELIVERED:  { color: 'green',   text: 'Hoàn thành',    icon: <CheckCircleOutlined /> },
  CANCELLED:  { color: 'red',     text: 'Đã huỷ',        icon: <CloseCircleOutlined /> },
};

const ITEM_STATUS = {
  PENDING:   { color: 'orange', text: 'Chờ' },
  DELIVERED: { color: 'green',  text: 'Đã giao' },
  FAILED:    { color: 'red',    text: 'Thất bại' },
};

const nextAction = {
  PENDING:    { action: 'IN_TRANSIT', label: 'Xuất phát',     type: 'primary' },
  IN_TRANSIT: { action: 'DELIVERED',  label: 'Hoàn thành giao', type: 'primary' },
};

export default function CoordinatorDeliveryTrackingPage() {
  const [deliveries, setDeliveries]     = useState([]);
  const [pagination, setPagination]     = useState({ current: 1, total: 0, pageSize: 20 });
  const [loading, setLoading]           = useState(false);
  const [filters, setFilters]           = useState({ status: null, date_from: null, date_to: null });
  const [detailModal, setDetailModal]   = useState({ open: false, delivery: null });
  const [statusModal, setStatusModal]   = useState({ open: false, delivery: null, action: null });
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusForm] = Form.useForm();

  // ---- Stats ----
  const stats = {
    PENDING:    deliveries.filter((d) => d.status === 'PENDING').length,
    IN_TRANSIT: deliveries.filter((d) => d.status === 'IN_TRANSIT').length,
    DELIVERED:  deliveries.filter((d) => d.status === 'DELIVERED').length,
  };

  const fetchDeliveries = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: pagination.pageSize,
        ...(filters.status    && { status:    filters.status }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to   && { date_to:   filters.date_to }),
      };
      const res = await deliveryService.list(params);
      const pg  = res.data;
      setDeliveries(pg.data ?? []);
      setPagination((p) => ({ ...p, current: pg.current_page, total: pg.total }));
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);

  useEffect(() => { fetchDeliveries(1); }, [filters]);

  // ---- Open detail modal (fetch fresh) ----
  const openDetail = async (id) => {
    try {
      const res = await deliveryService.get(id);
      setDetailModal({ open: true, delivery: res.data });
    } catch {}
  };

  // ---- Update status ----
  const openStatusModal = (delivery) => {
    const na = nextAction[delivery.status];
    if (!na) return;
    statusForm.resetFields();
    setStatusModal({ open: true, delivery, action: na });
  };

  const handleStatusSubmit = async ({ note }) => {
    const { delivery, action } = statusModal;
    setStatusLoading(true);
    try {
      const res = await deliveryService.updateStatus(delivery.id, action.action, note);
      message.success(res.message || 'Cập nhật thành công!');
      setStatusModal({ open: false, delivery: null, action: null });
      fetchDeliveries(pagination.current);
      // Refresh detail if open
      if (detailModal.open && detailModal.delivery?.id === delivery.id) {
        const fresh = await deliveryService.get(delivery.id);
        setDetailModal({ open: true, delivery: fresh.data });
      }
    } catch {
      // handled
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await deliveryService.updateStatus(id, 'CANCELLED', null);
      message.success('Đã huỷ lịch giao!');
      fetchDeliveries(pagination.current);
    } catch {}
  };

  // ---- Columns ----
  const columns = [
    {
      title: 'Mã lịch',
      dataIndex: 'delivery_code',
      key: 'delivery_code',
      width: 180,
      render: (v) => <Text strong style={{ color: '#1890ff' }}>{v}</Text>,
    },
    {
      title: 'Ngày giao',
      dataIndex: 'scheduled_date',
      key: 'scheduled_date',
      width: 140,
      render: (v, r) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(v).format('DD/MM/YYYY')}</Text>
          {r.scheduled_time && <Text type="secondary" style={{ fontSize: 12 }}>{r.scheduled_time}</Text>}
        </Space>
      ),
    },
    {
      title: 'Tài xế',
      dataIndex: 'driver_name',
      key: 'driver_name',
      render: (v, r) => (
        <Space direction="vertical" size={0}>
          <Text>{v || <Text type="secondary">—</Text>}</Text>
          {r.driver_phone && <Text type="secondary" style={{ fontSize: 12 }}>{r.driver_phone}</Text>}
        </Space>
      ),
    },
    {
      title: 'Biển số',
      dataIndex: 'vehicle_plate',
      key: 'vehicle_plate',
      render: (v) => v ? <Tag>{v}</Tag> : '—',
      width: 110,
    },
    {
      title: 'Số đơn',
      key: 'items_count',
      align: 'center',
      width: 80,
      render: (_, r) => (
        <Badge count={r.items?.length ?? 0} style={{ backgroundColor: '#1890ff' }} />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s) => {
        const cfg = DELIVERY_STATUS[s] || { color: 'default', text: s, icon: null };
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.text}
          </Tag>
        );
      },
    },
    {
      title: 'Người tạo',
      dataIndex: ['assigned_by', 'full_name'],
      key: 'assigned_by',
      render: (v) => v || '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => {
        const na = nextAction[record.status];
        return (
          <Space>
            <Tooltip title="Xem chi tiết">
              <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record.id)} />
            </Tooltip>
            {na && (
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined />}
                onClick={() => openStatusModal(record)}
              >
                {na.label}
              </Button>
            )}
            {record.status === 'PENDING' && (
              <Popconfirm
                title="Huỷ lịch giao?"
                description="Các đơn hàng sẽ được trả về trạng thái READY."
                onConfirm={() => handleCancel(record.id)}
                okText="Huỷ lịch"
                cancelText="Không"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger>Huỷ</Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* KPI Row */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {[
          { label: 'Chờ xuất phát', key: 'PENDING',    color: '#fa8c16' },
          { label: 'Đang giao',     key: 'IN_TRANSIT',  color: '#1890ff' },
          { label: 'Hoàn thành',    key: 'DELIVERED',   color: '#52c41a' },
        ].map((s) => (
          <Col span={8} key={s.key}>
            <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer' }}
              onClick={() => setFilters((f) => ({ ...f, status: f.status === s.key ? null : s.key }))}>
              <Statistic
                title={s.label}
                value={stats[s.key]}
                valueStyle={{ color: s.color, fontSize: 28 }}
                prefix={DELIVERY_STATUS[s.key].icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filter bar */}
      <Card
        bordered={false}
        style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16 }}
      >
        <Space wrap>
          <FilterOutlined style={{ color: '#8c8c8c' }} />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 160 }}
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v ?? null }))}
            options={Object.entries(DELIVERY_STATUS).map(([k, v]) => ({ value: k, label: v.text }))}
          />
          <RangePicker
            format="DD/MM/YYYY"
            value={[
              filters.date_from ? dayjs(filters.date_from) : null,
              filters.date_to   ? dayjs(filters.date_to)   : null,
            ]}
            onChange={(dates) => setFilters((f) => ({
              ...f,
              date_from: dates?.[0]?.format('YYYY-MM-DD') ?? null,
              date_to:   dates?.[1]?.format('YYYY-MM-DD') ?? null,
            }))}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => { setFilters({ status: null, date_from: null, date_to: null }); }}
          >
            Xoá lọc
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchDeliveries(pagination.current)}>
            Làm mới
          </Button>
        </Space>
      </Card>

      {/* Main table */}
      <Card
        bordered={false}
        style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
        title={
          <Space>
            <CarOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: 600 }}>Theo dõi tiến độ giao hàng</span>
          </Space>
        }
      >
        <Table
          rowKey="id"
          dataSource={deliveries}
          columns={columns}
          loading={loading}
          size="middle"
          pagination={{
            current:  pagination.current,
            total:    pagination.total,
            pageSize: pagination.pageSize,
            showTotal: (t) => `Tổng ${t} lịch giao`,
            onChange: (page) => fetchDeliveries(page),
          }}
        />
      </Card>

      {/* ---- Detail Modal ---- */}
      <Modal
        open={detailModal.open}
        title={
          <Space>
            <CarOutlined />
            <span>Chi tiết: {detailModal.delivery?.delivery_code}</span>
            {detailModal.delivery && (
              <Tag color={DELIVERY_STATUS[detailModal.delivery.status]?.color}>
                {DELIVERY_STATUS[detailModal.delivery.status]?.text}
              </Tag>
            )}
          </Space>
        }
        onCancel={() => setDetailModal({ open: false, delivery: null })}
        footer={null}
        width={700}
        destroyOnClose
      >
        {detailModal.delivery && (
          <>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mã lịch" span={2}>
                <Text strong>{detailModal.delivery.delivery_code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày giao">
                {dayjs(detailModal.delivery.scheduled_date).format('DD/MM/YYYY')}
                {detailModal.delivery.scheduled_time && ` – ${detailModal.delivery.scheduled_time}`}
              </Descriptions.Item>
              <Descriptions.Item label="Người tạo">
                {detailModal.delivery.assigned_by?.full_name ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tài xế">
                {detailModal.delivery.driver_name || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT Tài xế">
                {detailModal.delivery.driver_phone || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Biển số xe" span={2}>
                {detailModal.delivery.vehicle_plate ? (
                  <Tag>{detailModal.delivery.vehicle_plate}</Tag>
                ) : '—'}
              </Descriptions.Item>
              {detailModal.delivery.note && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {detailModal.delivery.note}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Timeline milestones */}
            <Title level={5} style={{ marginBottom: 12 }}>
              Tiến trình
            </Title>
            <Timeline
              style={{ marginBottom: 16, paddingLeft: 8 }}
              items={[
                {
                  color: 'green',
                  children: `Tạo lịch: ${dayjs(detailModal.delivery.created_at).format('DD/MM/YYYY HH:mm')}`,
                },
                {
                  color: detailModal.delivery.dispatched_at ? 'blue' : 'gray',
                  children: detailModal.delivery.dispatched_at
                    ? `Xuất phát: ${dayjs(detailModal.delivery.dispatched_at).format('DD/MM/YYYY HH:mm')}`
                    : 'Chưa xuất phát',
                },
                {
                  color: detailModal.delivery.completed_at ? 'green' : 'gray',
                  children: detailModal.delivery.completed_at
                    ? `Hoàn thành: ${dayjs(detailModal.delivery.completed_at).format('DD/MM/YYYY HH:mm')}`
                    : 'Chưa hoàn thành',
                },
              ]}
            />

            {/* Delivery items */}
            <Title level={5} style={{ marginBottom: 8 }}>
              Danh sách đơn hàng ({detailModal.delivery.items?.length ?? 0})
            </Title>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={detailModal.delivery.items ?? []}
              columns={[
                {
                  title: 'Mã đơn',
                  dataIndex: ['order', 'order_code'],
                  render: (v) => <Text strong style={{ color: '#1890ff' }}>{v}</Text>,
                },
                {
                  title: 'Cửa hàng',
                  dataIndex: ['order', 'store', 'name'],
                  render: (v) => (
                    <Space>
                      <ShopOutlined style={{ color: '#52c41a' }} />
                      {v ?? '—'}
                    </Space>
                  ),
                },
                {
                  title: 'Trạng thái item',
                  dataIndex: 'status',
                  render: (s) => {
                    const cfg = ITEM_STATUS[s] || { color: 'default', text: s };
                    return <Tag color={cfg.color}>{cfg.text}</Tag>;
                  },
                  width: 110,
                },
                {
                  title: 'Giao lúc',
                  dataIndex: 'delivered_at',
                  render: (v) => v ? dayjs(v).format('HH:mm DD/MM') : '—',
                  width: 110,
                },
              ]}
            />
          </>
        )}
      </Modal>

      {/* ---- Update Status Modal ---- */}
      <Modal
        open={statusModal.open}
        title={
          <Space>
            <SendOutlined />
            <span>{statusModal.action?.label}: {statusModal.delivery?.delivery_code}</span>
          </Space>
        }
        onCancel={() => setStatusModal({ open: false, delivery: null, action: null })}
        footer={null}
        destroyOnClose
        width={420}
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusSubmit}>
          <Form.Item label="Ghi chú (tuỳ chọn)" name="note">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm..." />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setStatusModal({ open: false, delivery: null, action: null })}>Huỷ</Button>
            <Button type="primary" htmlType="submit" loading={statusLoading} icon={<SendOutlined />}>
              {statusModal.action?.label}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
