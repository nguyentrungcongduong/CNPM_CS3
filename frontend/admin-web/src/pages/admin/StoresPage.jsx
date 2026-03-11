import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Tag, Modal,
  Form, message, Popconfirm, Typography, Row, Col, Badge,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  StopOutlined, ShopOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { storeService } from '../../api/storeService';

const { Title } = Typography;
const STATUS_COLORS = { ACTIVE: 'success', INACTIVE: 'error' };
const STATUS_LABELS = { ACTIVE: 'Hoạt động', INACTIVE: 'Vô hiệu hóa' };

export default function StoresPage() {
  const [stores, setStores]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: undefined });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchStores = useCallback(async (page = 1, extra = {}) => {
    setLoading(true);
    try {
      const res = await storeService.getAll({ page, per_page: pagination.pageSize, ...filters, ...extra });
      setStores(res.data.data);
      setPagination(p => ({ ...p, current: res.data.current_page, total: res.data.total }));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);

  useEffect(() => { fetchStores(); }, []); // eslint-disable-line

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: 'ACTIVE' }); setModalOpen(true); };
  const openEdit   = (rec) => { setEditing(rec); form.setFieldsValue(rec); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      if (editing) {
        await storeService.update(editing.id, vals);
        message.success('Cập nhật cửa hàng thành công!');
      } else {
        await storeService.create(vals);
        message.success('Tạo cửa hàng thành công!');
      }
      setModalOpen(false);
      fetchStores(pagination.current);
    } catch {/* handled globally */}
  };

  const handleDeactivate = async (id) => {
    await storeService.delete(id);
    message.success('Đã vô hiệu hóa cửa hàng.');
    fetchStores(pagination.current);
  };

  const columns = [
    {
      title: 'Mã', dataIndex: 'code', key: 'code', width: 120,
      render: t => <Tag color="geekblue">{t}</Tag>
    },
    {
      title: 'Tên cửa hàng', dataIndex: 'name', key: 'name',
      render: t => <span><ShopOutlined style={{ marginRight: 6, color: '#1890ff' }} />{t}</span>
    },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: 'Điện thoại', dataIndex: 'phone', key: 'phone' },
    { title: 'Quản lý', dataIndex: 'manager_name', key: 'manager_name' },
    {
      title: 'Nhân viên', dataIndex: 'users_count', key: 'users_count',
      align: 'center', render: v => v ?? 0,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: s => <Badge status={STATUS_COLORS[s]} text={STATUS_LABELS[s] || s} />
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_, rec) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(rec)}>Sửa</Button>
          {rec.status === 'ACTIVE' && (
            <Popconfirm title="Vô hiệu hóa cửa hàng này?" onConfirm={() => handleDeactivate(rec.id)} okText="Xác nhận" cancelText="Hủy">
              <Button size="small" icon={<StopOutlined />} danger>Tắt</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>Quản lý Cửa hàng Franchise</Title>

      <Card variant="borderless" style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Row gutter={12} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Tìm theo tên, mã, địa chỉ..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              onPressEnter={() => fetchStores(1)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Trạng thái"
              style={{ width: 140 }}
              allowClear
              value={filters.status}
              onChange={v => setFilters(f => ({ ...f, status: v }))}
              options={[{ value: 'ACTIVE', label: 'Hoạt động' }, { value: 'INACTIVE', label: 'Vô hiệu hóa' }]}
            />
          </Col>
          <Col>
            <Space>
              <Button icon={<SearchOutlined />} type="primary" onClick={() => fetchStores(1)}>Tìm</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { setFilters({ search: '', status: undefined }); fetchStores(1); }}>Xóa lọc</Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm cửa hàng</Button>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={stores}
          loading={loading}
          size="middle"
          pagination={{
            current: pagination.current,
            total: pagination.total,
            pageSize: pagination.pageSize,
            showTotal: t => `Tổng ${t} cửa hàng`,
            onChange: (page) => fetchStores(page),
          }}
        />
      </Card>

      <Modal
        title={editing ? 'Chỉnh sửa cửa hàng' : 'Thêm cửa hàng mới'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Lưu thay đổi' : 'Tạo mới'}
        cancelText="Hủy"
        width={540}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code" label="Mã cửa hàng" rules={[{ required: true }]}>
                <Input placeholder="STORE_01" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên cửa hàng" rules={[{ required: true }]}>
                <Input placeholder="Franchise Quận 1" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="123 Đường ABC, Phường XYZ..." />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại">
                <Input placeholder="0901234567" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manager_name" label="Tên quản lý">
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="Trạng thái">
            <Select options={[{ value: 'ACTIVE', label: 'Hoạt động' }, { value: 'INACTIVE', label: 'Vô hiệu hóa' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
