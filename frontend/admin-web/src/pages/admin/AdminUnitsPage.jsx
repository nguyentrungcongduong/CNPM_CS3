import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Space,
  Typography,
  message,
  Switch,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { unitService } from "../../api/unitService";

const { Title } = Typography;

const TYPE_LABELS = {
  weight: "Khoi luong",
  volume: "The tich",
  count: "Dem",
};

export default function AdminUnitsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await unitService.getAllForAdmin();
      setUnits(res?.data || res || []);
    } catch (e) {
      message.error(
        e?.response?.data?.message || e.message || "Không thể tải đơn vị",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const openAdd = () => {
    setEditingUnit(null);
    form.resetFields();
    setModalOpen(true);
    setTimeout(() => {
      form.setFieldsValue({
        type: "weight",
        is_default: false,
      });
    }, 0);
  };

  const openEdit = (unit) => {
    setEditingUnit(unit);
    form.setFieldsValue(unit);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingUnit) {
        await unitService.update(editingUnit.id, values);
      } else {
        await unitService.create(values);
      }

      setModalOpen(false);
      message.success("Đã lưu đơn vị");
      fetchUnits();
      window.dispatchEvent(new Event("units:updated"));
    } catch (e) {
      message.error(e?.response?.data?.message || e.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await unitService.delete(id);
      message.success("Đã xóa đơn vị");
      fetchUnits();
      window.dispatchEvent(new Event("units:updated"));
    } catch (e) {
      message.error(
        e?.response?.data?.message || e.message || "Không thể xóa đơn vị",
      );
    }
  };

  const columns = useMemo(
    () => [
      { title: "Tên", dataIndex: "name", key: "name" },
      { title: "Ký hiệu", dataIndex: "symbol", key: "symbol" },
      {
        title: "Loại",
        dataIndex: "type",
        key: "type",
        render: (t) => TYPE_LABELS[t] || t,
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 180,
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xác nhận xóa?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <Card variant="borderless" style={{ borderRadius: 10 }}>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Quản lý Đơn vị Tính
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          Thêm mới
        </Button>
      </Space>

      <Table
        rowKey="id"
        dataSource={units}
        columns={columns}
        loading={loading}
        pagination={false}
      />

      <Modal
        open={modalOpen}
        title={editingUnit ? "Sửa đơn vị" : "Thêm đơn vị"}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Lưu"
        okButtonProps={{ loading: saving }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ is_default: false }}
        >
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input placeholder="VD: Kilogram" />
          </Form.Item>
          <Form.Item name="symbol" label="Ký hiệu" rules={[{ required: true }]}>
            <Input placeholder="VD: kg" />
          </Form.Item>
          <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "weight", label: "Khoi luong" },
                { value: "volume", label: "The tich" },
                { value: "count", label: "Dem" },
              ]}
            />
          </Form.Item>
          <Form.Item name="is_default" label="Mặc định" valuePropName="checked">
            <Switch checkedChildren="Mặc định" unCheckedChildren="Không" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
