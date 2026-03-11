import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Tag, Modal,
  Form, message, Popconfirm, Typography, Row, Col, Badge,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  StopOutlined, UserOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { userService, roleService } from '../../api/userService';
import { storeService } from '../../api/storeService';

const { Title } = Typography;

const STATUS_COLORS = { ACTIVE: 'success', INACTIVE: 'error' };
const STATUS_LABELS = { ACTIVE: 'Hoạt động', INACTIVE: 'Vô hiệu hóa' };

export default function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [roles, setRoles]       = useState([]);
  const [stores, setStores]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [filters, setFilters]   = useState({ search: '', role_id: undefined, status: undefined });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async (page = 1, extraFilters = {}) => {
    setLoading(true);
    try {
      const res = await userService.getAll({
        page,
        per_page: pagination.pageSize,
        ...filters,
        ...extraFilters,
      });
      setUsers(res.data.data);
      setPagination(p => ({ ...p, current: res.data.current_page, total: res.data.total }));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line

  useEffect(() => {
    roleService.getAll().then(r => setRoles(r.data));
    storeService.getList().then(r => setStores(r.data));
  }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit   = (rec) => { setEditing(rec); form.setFieldsValue({ ...rec, role_id: rec.role?.id, store_id: rec.store?.id }); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      if (editing) {
        await userService.update(editing.id, vals);
        message.success('Cập nhật thành công!');
      } else {
        await userService.create(vals);
        message.success('Tạo người dùng thành công!');
      }
      setModalOpen(false);
      fetchUsers(pagination.current);
    } catch {/* validation or API error handled globally */}
  };

  const handleDeactivate = async (id) => {
    await userService.delete(id);
    message.success('Đã vô hiệu hóa tài khoản.');
    fetchUsers(pagination.current);
  };

  const columns = [
    {
      title: 'Họ tên', dataIndex: 'full_name', key: 'full_name',
      render: (t) => <span><UserOutlined style={{ marginRight: 6, color: '#1890ff' }} />{t}</span>
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    {
      title: 'Vai trò', key: 'role',
      render: (_, rec) => <Tag color="blue">{rec.role?.name || '—'}</Tag>
    },
    {
      title: 'Cửa hàng', key: 'store',
      render: (_, rec) => rec.store?.name || <span style={{ color: '#bbb' }}>—</span>
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (s) => <Badge status={STATUS_COLORS[s]} text={STATUS_LABELS[s] || s} />
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_, rec) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(rec)}>Sửa</Button>
          {rec.status === 'ACTIVE' && (
            <Popconfirm title="Vô hiệu hóa tài khoản này?" onConfirm={() => handleDeactivate(rec.id)} okText="Xác nhận" cancelText="Hủy">
              <Button size="small" icon={<StopOutlined />} danger>Khóa</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>Quản lý Người dùng</Title>

      {/* Filters */}
      <Card variant="borderless" style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Row gutter={12} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Tìm theo tên, email, username..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              onPressEnter={() => fetchUsers(1)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Vai trò"
              style={{ width: 180 }}
              allowClear
              value={filters.role_id}
              onChange={v => setFilters(f => ({ ...f, role_id: v }))}
              options={roles.map(r => ({ value: r.id, label: r.name }))}
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
              <Button icon={<SearchOutlined />} type="primary" onClick={() => fetchUsers(1)}>Tìm</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { setFilters({ search: '', role_id: undefined, status: undefined }); fetchUsers(1); }}>Xóa lọc</Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm người dùng</Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          loading={loading}
          size="middle"
          pagination={{
            current: pagination.current,
            total: pagination.total,
            pageSize: pagination.pageSize,
            showTotal: (t) => `Tổng ${t} người dùng`,
            onChange: (page) => fetchUsers(page),
          }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
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
            <Col span={12}>
              <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true }]}>
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                <Input placeholder="nguyenvana" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại">
                <Input placeholder="0901234567" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={editing ? [] : [{ required: true, min: 6 }]}
            extra={editing ? 'Để trống nếu không đổi mật khẩu' : ''}
          >
            <Input.Password placeholder="Tối thiểu 6 ký tự" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role_id" label="Vai trò" rules={[{ required: true }]}>
                <Select
                  placeholder="Chọn vai trò"
                  options={roles.map(r => ({ value: r.id, label: r.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái" initialValue="ACTIVE">
                <Select
                  options={[{ value: 'ACTIVE', label: 'Hoạt động' }, { value: 'INACTIVE', label: 'Vô hiệu hóa' }]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="store_id" label="Cửa hàng (nếu có)">
            <Select
              placeholder="Chọn cửa hàng"
              allowClear
              options={stores.map(s => ({ value: s.id, label: `[${s.code}] ${s.name}` }))}
              showSearch
              filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
