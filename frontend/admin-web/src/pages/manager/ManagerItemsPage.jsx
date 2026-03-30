import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Row, Col, Typography
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, WarningOutlined
} from '@ant-design/icons';
import { itemService } from '../../api/itemService';

const { Title, Text } = Typography;
const { Option } = Select;

const ITEM_TYPES = [
  { value: 'RAW', label: 'Nguyên liệu thô' },
  { value: 'SEMI', label: 'Bán thành phẩm' },
  { value: 'FINISHED', label: 'Thành phẩm' },
  { value: 'PACKAGING', label: 'Bao bì' },
];

export default function ManagerItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await itemService.getItems({ search: searchText });
      console.log('API Response:', res);
      console.log('Items data:', res.data);
      setItems(res.data || []);
    } catch (err) {
      console.error('API Error:', err);
      message.error('Không thể tải danh sách hàng hóa');
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue(item);
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await itemService.updateItem(editingItem.id, values);
        message.success('Cập nhật hàng hóa thành công');
      } else {
        await itemService.createItem(values);
        message.success('Thêm hàng hóa mới thành công');
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    try {
      await itemService.deleteItem(id);
      message.success('Đã xóa hàng hóa thành công');
      fetchItems();
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể xóa hàng hóa');
    }
  };

  const columns = [
    {
      title: 'Mã hàng',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Tên hàng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeLabel = ITEM_TYPES.find(t => t.value === type)?.label || type;
        return <Tag color="purple">{typeLabel}</Tag>;
      },
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      render: (unit) => <Text type="secondary">{unit}</Text>,
    },
    {
      title: 'Ngưỡng cảnh báo',
      dataIndex: 'min_stock',
      key: 'min_stock',
      render: (val, record) => val ? (
        <span>{val} {record.unit}</span>
      ) : (
        <Text type="secondary">—</Text>
      ),
    },
    {
      title: 'Giá mặc định',
      dataIndex: 'default_price',
      key: 'default_price',
      render: (price) => price ? (
        <span>{Number(price).toLocaleString('vi-VN')} đ</span>
      ) : (
        <Text type="secondary">—</Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleOpenModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa hàng hóa?"
            description="Bạn có chắc muốn xóa hàng hóa này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3}>Quản lý hàng hóa</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Thêm hàng hóa
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Tìm theo tên, mã hàng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={fetchItems}
              allowClear
            />
          </Col>
          <Col>
            <Button icon={<SearchOutlined />} type="primary" onClick={fetchItems}>
              Tìm
            </Button>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); fetchItems(); }}>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} mặt hàng` }}
      />

      <Modal
        title={editingItem ? 'Sửa hàng hóa' : 'Thêm hàng hóa mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'ACTIVE', type: 'RAW' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã hàng"
                rules={[{ required: true, message: 'Vui lòng nhập mã hàng' }]}
              >
                <Input placeholder="VD: RICE-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên hàng"
                rules={[{ required: true, message: 'Vui lòng nhập tên hàng' }]}
              >
                <Input placeholder="VD: Gạo Jasmine" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Loại hàng"
                rules={[{ required: true }]}
              >
                <Select>
                  {ITEM_TYPES.map(t => (
                    <Option key={t.value} value={t.value}>{t.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Đơn vị tính"
                rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
              >
                <Input placeholder="VD: kg, lít, gói" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="min_stock"
                label="Ngưỡng cảnh báo tồn kho"
                tooltip="Số lượng tối thiểu để cảnh báo sắp hết hàng"
              >
                <InputNumber style={{ width: '100%' }} placeholder="VD: 10" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="default_price"
                label="Giá mặc định"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 50000"
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shelf_life_days"
                label="Hạn sử dụng (ngày)"
              >
                <InputNumber style={{ width: '100%' }} placeholder="VD: 30" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="ACTIVE">Hoạt động</Option>
                  <Option value="INACTIVE">Ngừng</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết về hàng hóa..." />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
