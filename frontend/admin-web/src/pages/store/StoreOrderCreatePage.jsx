import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Select,
  InputNumber,
  Divider,
  Alert,
  message,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { storeOrderService } from '../../api/storeOrderService';
import { recipeService } from '../../api/recipeService';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function StoreOrderCreatePage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [itemsOptions, setItemsOptions] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const res = await recipeService.getItems();
        const items = res.data || res;
        setItemsOptions(
          (items.data || items).map((it) => ({
            value: it.id,
            label: `[${it.code}] ${it.name}`,
            unit: it.unit,
          })),
        );
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, []);

  const handleSubmit = async (values) => {
    if (!values.items || values.items.length === 0) {
      message.error('Vui lòng thêm ít nhất một mặt hàng vào đơn.');
      return;
    }

    setSubmitting(true);
    try {
      await storeOrderService.create({
        note: values.note || null,
        items: values.items.map((row) => ({
          item_id: row.item_id,
          ordered_quantity: row.ordered_quantity,
          unit: row.unit,
          note: row.item_note || null,
        })),
      });
      message.success('Tạo đơn hàng thành công');
      navigate('/store/orders');
    } finally {
      setSubmitting(false);
    }
  };

  const onItemSelect = (index, itemId) => {
    const found = itemsOptions.find((opt) => opt.value === itemId);
    if (!found) return;
    const current = form.getFieldsValue();
    const nextItems = [...(current.items || [])];
    if (!nextItems[index]) return;
    if (!nextItems[index].unit) {
      nextItems[index].unit = found.unit || '';
      form.setFieldsValue({ ...current, items: nextItems });
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          Tạo đơn hàng cửa hàng
        </Title>
        <Text type="secondary">
          Tạo yêu cầu đặt hàng từ cửa hàng về Bếp Trung Tâm với danh sách mặt hàng rõ ràng, đầy đủ.
        </Text>
      </div>
      <Card
        variant="borderless"
        style={{
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          message="Đơn đặt hàng nội bộ"
          description="Tạo yêu cầu đặt hàng từ cửa hàng về Bếp Trung Tâm. Vui lòng chọn đúng mặt hàng và số lượng cần đặt."
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ items: [{ item_id: undefined, ordered_quantity: null, unit: '' }] }}
        >
          <Form.Item label="Ghi chú đơn hàng" name="note">
            <TextArea
              rows={3}
              placeholder="Ghi chú ngắn gọn về mục đích đơn, ví dụ: 'Đơn hàng cho cuối tuần'..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Divider orientation="left" style={{ marginTop: 8 }}>
            <Space size={8}>
              <ShoppingCartOutlined style={{ color: '#1890ff' }} />
              <Text strong style={{ fontSize: 15 }}>Danh sách mặt hàng</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Thêm từng mặt hàng cần đặt, số lượng và đơn vị tương ứng.
              </Text>
            </Space>
          </Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Card
                    key={key}
                    size="small"
                    style={{
                      marginBottom: 12,
                      borderRadius: 8,
                      border: '1px solid #f0f0f0',
                      background: '#fafafa',
                    }}
                    bodyStyle={{ padding: 16, paddingBottom: 8 }}
                  >
                    <Space
                      align="start"
                      style={{ width: '100%', flexWrap: 'wrap', rowGap: 8 }}
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'item_id']}
                        label="Mặt hàng"
                        rules={[
                          { required: true, message: 'Vui lòng chọn mặt hàng' },
                        ]}
                        style={{ minWidth: 260, flex: 2 }}
                      >
                        <Select
                          placeholder="Chọn mặt hàng..."
                          loading={loadingItems}
                          options={itemsOptions}
                          showSearch
                          optionFilterProp="label"
                          onChange={(value) => onItemSelect(index, value)}
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'ordered_quantity']}
                        label="Số lượng"
                        rules={[
                          { required: true, message: 'Nhập số lượng' },
                          {
                            type: 'number',
                            min: 0.001,
                            message: 'Số lượng phải lớn hơn 0',
                          },
                        ]}
                        style={{ width: 160 }}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0.001}
                          step={0.5}
                          placeholder="0.00"
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'unit']}
                        label="Đơn vị"
                        rules={[
                          { required: true, message: 'Đơn vị bắt buộc' },
                          { max: 50, message: 'Tối đa 50 ký tự' },
                        ]}
                        style={{ width: 140 }}
                      >
                        <Input placeholder="VD: KG, PCS..." />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'item_note']}
                        label="Ghi chú dòng"
                        style={{ flex: 3, minWidth: 220 }}
                      >
                        <Input placeholder="Ghi chú thêm cho dòng này (không bắt buộc)" />
                      </Form.Item>

                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                          style={{ marginTop: 32 }}
                        >
                          Xóa
                        </Button>
                      )}
                    </Space>
                  </Card>
                ))}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() =>
                      add({ item_id: undefined, ordered_quantity: null, unit: '' })
                    }
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm mặt hàng
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider style={{ marginTop: 16, marginBottom: 16 }} />

          <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }} size="middle">
            <Button onClick={() => navigate('/store/orders')}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
            >
              Tạo đơn hàng
            </Button>
          </Space>
        </Form>
      </Card>
    </>
  );
}

