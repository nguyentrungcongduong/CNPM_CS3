import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, DatePicker, TimePicker,
  Tag, Space, Typography, Row, Col, Statistic, Checkbox, message,
  Alert, Tooltip, Empty, Spin,
} from 'antd';
import {
  CarOutlined, ClockCircleOutlined, ShopOutlined,
  PlusOutlined, CheckSquareOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { deliveryService } from '../../api/deliveryService';

const { Title, Text } = Typography;

const STATUS_COLOR = {
  READY:       { color: 'green',  label: 'Sẵn sàng' },
  IN_DELIVERY: { color: 'blue',   label: 'Đang giao' },
  DELIVERED:   { color: 'purple', label: 'Đã giao'   },
};

export default function CoordinatorDeliverySchedulePage() {
  const [readyOrders, setReadyOrders]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [modalOpen, setModalOpen]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [form] = Form.useForm();

  const fetchReadyOrders = async () => {
    setLoading(true);
    try {
      const res = await deliveryService.readyOrders();
      setReadyOrders(res.data ?? []);
    } catch {
      // axios interceptor hiển thị lỗi rồi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReadyOrders(); }, []);

  const handleOpenModal = () => {
    if (selectedKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một đơn hàng để lên lịch giao.');
      return;
    }
    form.resetFields();
    form.setFieldsValue({ scheduled_date: dayjs().add(1, 'day') });
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        scheduled_date: values.scheduled_date.format('YYYY-MM-DD'),
        scheduled_time: values.scheduled_time ? values.scheduled_time.format('HH:mm') : null,
        driver_name:    values.driver_name   || null,
        driver_phone:   values.driver_phone  || null,
        vehicle_plate:  values.vehicle_plate || null,
        note:           values.note          || null,
        order_ids:      selectedKeys,
      };
      const res = await deliveryService.create(payload);
      message.success(res.message || 'Tạo lịch giao hàng thành công!');
      setModalOpen(false);
      setSelectedKeys([]);
      fetchReadyOrders();
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      key: 'order_code',
      render: (v) => <Text strong style={{ color: '#1890ff' }}>{v}</Text>,
      width: 180,
    },
    {
      title: 'Cửa hàng',
      dataIndex: ['store', 'name'],
      key: 'store',
      render: (_, r) => (
        <Space>
          <ShopOutlined style={{ color: '#52c41a' }} />
          <span>{r.store?.name ?? '—'}</span>
        </Space>
      ),
    },
    {
      title: 'Ngày cần',
      dataIndex: 'required_date',
      key: 'required_date',
      render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
      width: 120,
    },
    {
      title: 'Sẵn sàng lúc',
      dataIndex: 'ready_at',
      key: 'ready_at',
      render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—',
      width: 160,
    },
    {
      title: 'Số món',
      key: 'items_count',
      align: 'center',
      render: (_, r) => r.items?.length ?? 0,
      width: 80,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const cfg = STATUS_COLOR[s] || { color: 'default', label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
      width: 110,
    },
    {
      title: 'Ghi chú đơn',
      dataIndex: 'note',
      key: 'note',
      render: (v) => v ? (
        <Tooltip title={v}>
          <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
        </Tooltip>
      ) : '—',
      width: 90,
      align: 'center',
    },
  ];

  const selectedOrders = readyOrders.filter((o) => selectedKeys.includes(o.id));

  return (
    <div>
      {/* KPI cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="Đơn chờ lên lịch"
              value={readyOrders.length}
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="Đã chọn"
              value={selectedKeys.length}
              valueStyle={{ color: '#1890ff', fontSize: 28 }}
              prefix={<CheckSquareOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="Số cửa hàng (đã chọn)"
              value={new Set(selectedOrders.map((o) => o.store_id)).size}
              valueStyle={{ color: '#fa8c16', fontSize: 28 }}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
        title={
          <Space>
            <CarOutlined style={{ color: '#52c41a' }} />
            <span style={{ fontWeight: 600 }}>Danh sách đơn hàng READY – Chờ lên lịch giao</span>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={fetchReadyOrders} loading={loading}>Làm mới</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={selectedKeys.length === 0}
              onClick={handleOpenModal}
            >
              Tạo lịch giao ({selectedKeys.length})
            </Button>
          </Space>
        }
      >
        {selectedKeys.length > 0 && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message={
              <span>
                Đã chọn <strong>{selectedKeys.length}</strong> đơn hàng từ{' '}
                <strong>{new Set(selectedOrders.map((o) => o.store_id)).size}</strong> cửa hàng.{' '}
                <Button type="link" size="small" onClick={() => setSelectedKeys([])}>Bỏ chọn tất cả</Button>
              </span>
            }
          />
        )}

        <Spin spinning={loading}>
          {readyOrders.length === 0 && !loading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Hiện không có đơn hàng nào sẵn sàng để giao."
            />
          ) : (
            <Table
              rowKey="id"
              dataSource={readyOrders}
              columns={columns}
              size="middle"
              pagination={{ pageSize: 15, showSizeChanger: false }}
              rowSelection={{
                selectedRowKeys: selectedKeys,
                onChange: (keys) => setSelectedKeys(keys),
              }}
              rowClassName={(r) =>
                selectedKeys.includes(r.id) ? 'ant-table-row-selected' : ''
              }
            />
          )}
        </Spin>
      </Card>

      {/* Create delivery modal */}
      <Modal
        open={modalOpen}
        title={
          <Space>
            <CarOutlined style={{ color: '#1890ff' }} />
            <span>Tạo lịch giao hàng – {selectedKeys.length} đơn</span>
          </Space>
        }
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        {/* Summary of selected orders */}
        <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: '10px 16px', marginBottom: 20 }}>
          {selectedOrders.map((o) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <Text strong style={{ color: '#1890ff' }}>{o.order_code}</Text>
              <Text type="secondary">{o.store?.name}</Text>
            </div>
          ))}
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Ngày giao dự kiến"
                name="scheduled_date"
                rules={[{ required: true, message: 'Vui lòng chọn ngày giao' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={(d) => d.isBefore(dayjs(), 'day')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Giờ giao (tuỳ chọn)" name="scheduled_time">
                <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={15} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Tên tài xế" name="driver_name">
                <Input placeholder="Nguyễn Văn A" prefix={<CarOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Số điện thoại tài xế" name="driver_phone">
                <Input placeholder="0901234567" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Biển số xe" name="vehicle_plate">
            <Input placeholder="51A-12345" prefix={<CarOutlined />} />
          </Form.Item>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={2} placeholder="Lưu ý đặc biệt khi giao hàng..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<CarOutlined />}>
              Xác nhận tạo lịch
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
