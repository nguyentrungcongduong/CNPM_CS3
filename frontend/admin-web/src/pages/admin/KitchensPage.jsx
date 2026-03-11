import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Tag, Modal,
  Form, message, Popconfirm, Typography, Row, Col, Badge,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  StopOutlined, HomeOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { kitchenService } from '../../api/kitchenService';
import { storeService } from '../../api/storeService';

const { Title } = Typography;
const STATUS_COLORS = { ACTIVE: 'success', INACTIVE: 'error' };
const STATUS_LABELS = { ACTIVE: 'Hoạt động', INACTIVE: 'Vô hiệu hóa' };

export default function KitchensPage() {
  const [kitchens, setKitchens] = useState([]);
  const [stores, setStores]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [filters, setFilters]   = useState({ search: '', status: undefined });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form] = Form.useForm();

  const fetchKitchens = useCallback(async (page = 1, extra = {}) => {
    setLoading(true);
    try {
      const res = await kitchenService.getAll({ page, per_page: pagination.pageSize, ...filters, ...extra });
      setKitchens(res.data.data);
      setPagination(p => ({ ...p, current: res.data.current_page, total: res.data.total }));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);

  useEffect(() => { fetchKitchens(); }, []); // eslint-disable-line

  useEffect(() => {
    storeService.getList().then(r => setStores(r.data));
  }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ status: 'ACTIVE' }); setModalOpen(true); };
  const openEdit   = (rec) => { setEditing(rec); form.setFieldsValue({ ...rec, store_id: rec.store?.id }); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      if (editing) {
        await kitchenService.update(editing.id, vals);
        message.success('Cập nhật bếp trung tâm thành công!');
      } else {
        await kitchenService.create(vals);
        message.success('Tạo bếp trung tâm thành công!');
      }
      setModalOpen(false);
      fetchKitchens(pagination.current);
    } catch {/* handled globally */}
  };

  const handleDeactivate = async (id) => {
    await kitchenService.delete(id);
    message.success('Đã vô hiệu hóa bếp trung tâm.');
    fetchKitchens(pagination.current);
  };

  const columns = [
    {
      title: 'Mã', dataIndex: 'code', key: 'code', width: 130,
      render: t => <Tag color="purple">{t}</Tag>
    },
    {
      title: 'Tên bếp', dataIndex: 'name', key: 'name',
      render: t => <span><HomeOutlined style={{ marginRight: 6, color: '#722ed1' }} />{t}</span>
    },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: 'Cửa hàng liên kết', key: 'store',
      render: (_, rec) => rec.store ? <Tag color="geekblue">{rec.store.name}</Tag> : <span style={{ color: '#bbb' }}>—</span>
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
            <Popconfirm title="Vô hiệu hóa bếp này?" onConfirm={() => handleDeactivate(rec.id)} okText="Xác nhận" cancelText="Hủy">
              <Button size="small" icon={<StopOutlined />} danger>Tắt</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>Quản lý Bếp Trung Tâm</Title>

      <Card variant="borderless" style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Row gutter={12} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Tìm theo tên, mã, địa chỉ..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              onPressEnter={() => fetchKitchens(1)}
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
              <Button icon={<SearchOutlined />} type="primary" onClick={() => fetchKitchens(1)}>Tìm</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { setFilters({ search: '', status: undefined }); fetchKitchens(1); }}>Xóa lọc</Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm bếp</Button>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={kitchens}
          loading={loading}
          size="middle"
          pagination={{
            current: pagination.current,
            total: pagination.total,
            pageSize: pagination.pageSize,
            showTotal: t => `Tổng ${t} bếp`,
            onChange: (page) => fetchKitchens(page),
          }}
        />
      </Card>

      <Modal
        title={editing ? 'Chỉnh sửa bếp trung tâm' : 'Thêm bếp trung tâm mới'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Lưu thay đổi' : 'Tạo mới'}
        cancelText="Hủy"
        width={500}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code" label="Mã bếp" rules={[{ required: true }]}>
                <Input placeholder="CK_01" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên bếp trung tâm" rules={[{ required: true }]}>
                <Input placeholder="Bếp Trung Tâm Quận 1" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="123 Đường ABC..." />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="store_id" label="Cửa hàng liên kết">
                <Select
                  placeholder="Chọn cửa hàng (nếu có)"
                  allowClear
                  options={stores.map(s => ({ value: s.id, label: `[${s.code}] ${s.name}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái">
                <Select options={[{ value: 'ACTIVE', label: 'Hoạt động' }, { value: 'INACTIVE', label: 'Vô hiệu hóa' }]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
