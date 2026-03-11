import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Typography,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { recipeService } from '../../api/recipeService';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  ACTIVE: 'green',
  INACTIVE: 'red',
};

const STATUS_LABELS = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng dùng',
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recipeService.getRecipes();
      setRecipes(res);
    } catch (e) {
      message.error('Không thể tải danh sách công thức.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const res = await recipeService.getItems();
      setItems(res);
    } catch (e) {
      message.error('Không thể tải danh sách nguyên liệu.');
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
    fetchItems();
  }, [fetchRecipes, fetchItems]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'ACTIVE',
      ingredients: [{ item_id: undefined, quantity: 1 }],
    });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    const ingredients = (record.recipe_items || []).map((ri) => ({
      item_id: ri.item_id,
      quantity: Number(ri.quantity),
    }));

    form.setFieldsValue({
      code: record.code,
      name: record.name,
      description: record.description,
      status: record.status || 'ACTIVE',
      ingredients: ingredients.length ? ingredients : [{ item_id: undefined, quantity: 1 }],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        code: values.code,
        name: values.name,
        description: values.description || null,
        status: values.status || 'ACTIVE',
        ingredients: (values.ingredients || [])
          .filter((row) => row && row.item_id && row.quantity != null)
          .map((row) => ({
            item_id: row.item_id,
            quantity: Number(row.quantity),
          })),
      };

      setSaving(true);
      if (editing) {
        await recipeService.updateRecipe(editing.id, payload);
        message.success('Cập nhật công thức thành công!');
      } else {
        await recipeService.createRecipe(payload);
        message.success('Tạo công thức mới thành công!');
      }
      setModalOpen(false);
      fetchRecipes();
    } catch (err) {
      // validation errors are handled by Form; API errors by axios interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await recipeService.deleteRecipe(record.id);
      message.success('Đã xóa công thức.');
      fetchRecipes();
    } catch (e) {
      // handled globally
    }
  };

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <Tag color="geekblue">{code}</Tag>,
    },
    {
      title: 'Tên công thức',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <span>
          <FileTextOutlined style={{ marginRight: 6, color: '#1890ff' }} />
          {name}
        </span>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc) => desc || <Text type="secondary">—</Text>,
    },
    {
      title: 'Số nguyên liệu',
      key: 'ingredients_count',
      render: (_, rec) => {
        const count = (rec.recipe_items || []).length;
        return <Tag color={count ? 'green' : 'default'}>{count}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {STATUS_LABELS[status] || status || '—'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, rec) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(rec)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa công thức?"
            description="Bạn chắc chắn muốn xóa công thức này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(rec)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>
        Quản lý Công thức
      </Title>

      <Card
        variant="borderless"
        style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm công thức
          </Button>
        }
      >
        <Text type="secondary">
          Danh sách công thức món ăn, kèm theo danh sách nguyên liệu và định lượng cho bếp trung tâm
          và cửa hàng.
        </Text>
      </Card>

      <Card
        variant="borderless"
        style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={recipes}
          loading={loading}
          size="middle"
          pagination={false}
        />
      </Card>

      <Modal
        title={editing ? 'Chỉnh sửa công thức' : 'Thêm công thức mới'}
        open={modalOpen}
        onOk={handleSave}
        okButtonProps={{ loading: saving }}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Lưu thay đổi' : 'Tạo mới'}
        cancelText="Hủy"
        width={720}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 8 }}
        >
          <Form.Item
            name="code"
            label="Mã công thức"
            rules={[{ required: true, message: 'Vui lòng nhập mã công thức' }]}
          >
            <Input placeholder="RCP001" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên công thức"
            rules={[{ required: true, message: 'Vui lòng nhập tên công thức' }]}
          >
            <Input placeholder="Cơm chiên trứng" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Mô tả ngắn về công thức, cách chế biến..." />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
          >
            <Select
              options={[
                { value: 'ACTIVE', label: 'Hoạt động' },
                { value: 'INACTIVE', label: 'Ngừng dùng' },
              ]}
            />
          </Form.Item>

          <Form.List name="ingredients">
            {(fields, { add, remove }) => (
              <Card
                size="small"
                title="Danh sách nguyên liệu"
                style={{ marginTop: 8 }}
                extra={
                  <Button
                    type="dashed"
                    size="small"
                    onClick={() => add({ quantity: 1 })}
                    icon={<PlusOutlined />}
                  >
                    Thêm nguyên liệu
                  </Button>
                }
              >
                {fields.length === 0 && (
                  <Text type="secondary">
                    Chưa có nguyên liệu nào. Nhấn "Thêm nguyên liệu" để bắt đầu.
                  </Text>
                )}
                {fields.map((field) => (
                  <Space
                    key={field.key}
                    style={{ display: 'flex', marginBottom: 8 }}
                    align="baseline"
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, 'item_id']}
                      fieldKey={[field.fieldKey, 'item_id']}
                      rules={[{ required: true, message: 'Chọn nguyên liệu' }]}
                    >
                      <Select
                        loading={itemsLoading}
                        placeholder="Chọn nguyên liệu"
                        style={{ width: 260 }}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={items.map((it) => ({
                          value: it.id,
                          label: `[${it.code}] ${it.name}`,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, 'quantity']}
                      fieldKey={[field.fieldKey, 'quantity']}
                      rules={[{ required: true, message: 'Nhập định lượng' }]}
                    >
                      <InputNumber
                        min={0}
                        step={0.01}
                        style={{ width: 140 }}
                        placeholder="Số lượng"
                      />
                    </Form.Item>

                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    />
                  </Space>
                ))}
              </Card>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
}

