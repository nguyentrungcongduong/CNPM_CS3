import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Modal,
  Empty,
  message,
  DatePicker,
  Drawer,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Result,
  Select,
  Divider,
  Tooltip,
  Row,
  Col,
} from 'antd';
import {
  FileSearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  QrcodeOutlined,
  CopyOutlined,
  PrinterOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { getProductionPlans, createProductionPlan, checkIngredients, updateProductionStatus, deleteProductionPlan } from '../../api/productionService';
import dayjs from 'dayjs';
import { kitchenBatchService } from '../../api/kitchenBatchService';
import { QRCodeCanvas } from 'qrcode.react';

const { Title, Text } = Typography;

export default function KitchenProductionPage() {
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState(null);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Batch creation UI
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchResultOpen, setBatchResultOpen] = useState(false);
  const [createdBatch, setCreatedBatch] = useState(null);
  const [batchForm] = Form.useForm();

  const fetchPlans = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, per_page: pagination.pageSize };
      if (filterDate) params.date = filterDate;
      const res = await getProductionPlans(params);
      const payload = res.data || res;
      setPlans(payload.data || []);
      setPagination(p => ({ ...p, current: payload.current_page, total: payload.total }));
    } catch (e) {
      console.error(e);
      message.error('Lỗi khi tải danh sách kế hoạch sản xuất');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize, filterDate]);

  useEffect(() => { fetchPlans(1); }, [fetchPlans]);

  const handleCreatePlan = () => {
    if (!filterDate) {
      message.warning('Vui lòng chọn ngày để tạo kế hoạch');
      return;
    }
    
    Modal.confirm({
      title: 'Tạo kế hoạch sản xuất mới?',
      content: `Hệ thống sẽ tổng hợp tự động các mặt hàng cần sản xuất cho ngày ${filterDate}`,
      async onOk() {
        try {
          await createProductionPlan({ plan_date: filterDate });
          message.success('Tạo kế hoạch thành công');
          fetchPlans(1);
        } catch (e) {
          console.error(e);
          message.error(e.response?.data?.message || 'Lỗi khi tạo kế hoạch');
        }
      }
    });
  };

  const openPlanDetail = async (plan) => {
    setSelectedPlan(plan);
    setDrawerOpen(true);
    setLoadingIngredients(true);
    try {
      const res = await checkIngredients(plan.id);
      setIngredients(res.data || []);
    } catch (e) {
      console.error(e);
      message.error('Lỗi tải danh sách nguyên liệu');
    } finally {
      setLoadingIngredients(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateProductionStatus(id, status);
      message.success('Cập nhật trạng thái thành công');
      fetchPlans(pagination.current);
      if (selectedPlan && selectedPlan.id === id) {
        setSelectedPlan(prev => ({...prev, status}));
      }
    } catch (e) {
      message.error('Lỗi cập nhật trạng thái');
    }
  };

  const handleDeletePlan = (plan) => {
    const isCompleted = plan.status === 'COMPLETED';
    Modal.confirm({
      title: 'Xóa kế hoạch sản xuất',
      content: isCompleted
        ? 'Kế hoạch này đã hoàn thành. Bạn có chắc muốn xóa không?'
        : 'Bạn có chắc muốn xóa kế hoạch này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      async onOk() {
        await deleteProductionPlan(plan.id);
        message.success('Đã xóa kế hoạch sản xuất');
        fetchPlans(pagination.current);
      },
    });
  };

  const openCompleteWithBatch = (plan) => {
    setSelectedPlan(plan);
    const firstItem = (plan.items || [])[0];
    batchForm.setFieldsValue({
      item_id: firstItem?.item_id,
      quantity: firstItem?.planned_quantity ? Number(firstItem.planned_quantity) : null,
      production_date: plan.plan_date ? dayjs(plan.plan_date) : dayjs(),
      expiry_date: null,
      note: '',
    });
    setBatchModalOpen(true);
  };

  const submitCreateBatch = async () => {
    try {
      const vals = await batchForm.validateFields();
      setBatchSubmitting(true);
      const payload = {
        item_id: vals.item_id,
        quantity: vals.quantity,
        production_date: vals.production_date ? vals.production_date.format('YYYY-MM-DD') : null,
        expiry_date: vals.expiry_date ? vals.expiry_date.format('YYYY-MM-DD') : null,
        note: vals.note || null,
      };

      const res = await kitchenBatchService.create(payload);
      const batch = res.data || res;
      setCreatedBatch(batch);
      message.success(res.message || 'Tạo lô sản xuất thành công');

      // Mark plan as completed after creating batch (keep existing workflow)
      if (selectedPlan?.id) {
        await updateProductionStatus(selectedPlan.id, 'COMPLETED');
        fetchPlans(pagination.current);
        setSelectedPlan((prev) => (prev ? { ...prev, status: 'COMPLETED' } : prev));
      }

      setBatchModalOpen(false);
      setBatchResultOpen(true);
    } catch (e) {
      // validation or API error is handled by antd + axios interceptor
    } finally {
      setBatchSubmitting(false);
    }
  };

  const getQrPayload = (batch) => {
    if (!batch) return '';
    const qrObj = {
      batch_code: batch.batch_code,
      item_id: batch.item_id,
      warehouse_id: batch.warehouse_id,
      quantity: batch.quantity,
      mfg_date: batch.mfg_date,
      expiry_date: batch.expiry_date,
      status: batch.status,
    };
    return JSON.stringify(qrObj);
  };

  const copyBatchCode = async () => {
    if (!createdBatch?.batch_code) return;
    try {
      await navigator.clipboard.writeText(createdBatch.batch_code);
      message.success('Đã copy batch code');
    } catch {
      message.error('Không thể copy. Vui lòng thử lại.');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'orange';
      case 'IN_PROGRESS': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'IN_PROGRESS': return 'Đang sản xuất';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const columns = [
    {
      title: 'Mã kế hoạch',
      dataIndex: 'plan_code',
      key: 'plan_code',
      render: code => <Tag color="geekblue">{code}</Tag>
    },
    {
      title: 'Ngày sản xuất',
      dataIndex: 'plan_date',
      key: 'plan_date',
      render: date => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
    },
    {
      title: 'Người tạo',
      dataIndex: 'creator',
      key: 'creator',
      render: creator => creator ? creator.full_name : '—'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<FileSearchOutlined />} onClick={() => openPlanDetail(record)}>
            Chi tiết & Nguyên liệu
          </Button>
          {record.status === 'PENDING' && (
            <Button size="small" type="primary" onClick={() => updateStatus(record.id, 'IN_PROGRESS')}>
              Bắt đầu
            </Button>
          )}
          {(record.status === 'PENDING' || record.status === 'COMPLETED') && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeletePlan(record)}
            >
              Xóa
            </Button>
          )}
          {record.status === 'IN_PROGRESS' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined/>} onClick={() => openCompleteWithBatch(record)}>
              Hoàn thành
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ marginBottom: 4 }}>Kế hoạch sản xuất</Title>
        <Text type="secondary">
          Theo dõi kế hoạch, kiểm tra nguyên liệu và ghi nhận lô sản xuất khi hoàn thành.
        </Text>
      </div>

      <Card
        variant="borderless"
        style={{ marginBottom: 16, borderRadius: 10, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: 18 }}
      >
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <DatePicker 
              placeholder="Chọn ngày sản xuất" 
              onChange={(d, dString) => setFilterDate(dString)}
            />
            <Button onClick={() => fetchPlans(1)} icon={<ReloadOutlined />}>Tải lại</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePlan} title="Tạo tự động cho ngày đã chọn">
            Tạo kế hoạch tự động
          </Button>
        </Space>
      </Card>

      <Card
        variant="borderless"
        style={{ borderRadius: 10, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={plans}
          loading={loading}
          pagination={{ ...pagination, onChange: page => fetchPlans(page) }}
          locale={{ emptyText: <Empty description="Chưa có kế hoạch sản xuất" /> }}
        />
      </Card>

      {/* Drawer Chi tiết */}
      <Drawer
        title="Chi tiết kế hoạch"
        width={700}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{
          header: { borderBottom: '1px solid #f0f0f0' },
          body: { background: '#f5f5f5' },
        }}
      >
        {selectedPlan && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
             <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Mã KH"><Tag color="geekblue">{selectedPlan.plan_code}</Tag></Descriptions.Item>
              <Descriptions.Item label="Trạng thái"><Tag color={getStatusColor(selectedPlan.status)}>{getStatusLabel(selectedPlan.status)}</Tag></Descriptions.Item>
              <Descriptions.Item label="Ngày">{new Date(selectedPlan.plan_date).toLocaleDateString('vi-VN')}</Descriptions.Item>
            </Descriptions>

            <Card title="Danh sách Cần Sản Xuất" size="small">
              <Table 
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={selectedPlan.items || []}
                columns={[
                  { title: 'Tên món', render: (_, r) => r.item ? r.item.name : '—' },
                  { title: 'Số lượng cần', dataIndex: 'planned_quantity', render: (v, r) => `${Number(v).toFixed(2)} ${r.unit}` },
                ]}
              />
            </Card>

            <Card title="Dự trù Nguyên liệu (BOM)" size="small">
               <Table 
                rowKey={(r, i) => i}
                size="small"
                pagination={false}
                loading={loadingIngredients}
                dataSource={ingredients}
                locale={{ emptyText: <Empty description="Không có nguyên liệu hoặc chưa cấu hình BOM" /> }}
                columns={[
                  { title: 'Nguyên liệu', render: (_, r) => r.item ? r.item.name : '—' },
                  { title: 'Số lượng tổng', render: (_, r) => r.item ? `${Number(r.total_quantity).toFixed(3)} ${r.item.unit}` : r.total_quantity }
                ]}
              />
            </Card>
          </Space>
        )}
      </Drawer>

      {/* Complete → Create Batch Modal */}
      <Modal
        title={
          <Space>
            <QrcodeOutlined />
            <span>Xác nhận tạo lô sản xuất</span>
          </Space>
        }
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        onOk={submitCreateBatch}
        okText="Tạo lô & Hoàn thành"
        cancelText="Hủy"
        okButtonProps={{ loading: batchSubmitting }}
        width={720}
        destroyOnHidden
      >
        <Card
          bordered={false}
          style={{ borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}
          bodyStyle={{ padding: 16 }}
        >
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Text strong>Ghi nhận lô sản xuất</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Kiểm tra thông tin lô. Khi xác nhận, hệ thống sẽ tạo batch, cập nhật tồn kho và đánh dấu kế hoạch là “Hoàn thành”.
            </Text>
          </Space>
        </Card>

        <Form
          form={batchForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Form.Item
                name="item_id"
                label="Sản phẩm"
                rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
              >
                <Select
                  placeholder="Chọn sản phẩm trong kế hoạch..."
                  options={(selectedPlan?.items || []).map((it) => ({
                    value: it.item_id,
                    label: it.item?.name ? `${it.item.name} (${it.unit})` : `Item #${it.item_id}`,
                  }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item
                name="quantity"
                label="Số lượng sản xuất"
                rules={[
                  { required: true, message: 'Vui lòng nhập số lượng' },
                  { type: 'number', min: 0.001, message: 'Số lượng phải > 0' },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={0.001} step={1} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="production_date"
                label="Ngày sản xuất"
                rules={[{ required: true, message: 'Chọn ngày sản xuất' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="expiry_date"
                label="Ngày hết hạn"
                tooltip="Nếu có HSD, vui lòng chọn lớn hơn hoặc bằng ngày sản xuất"
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú (tuỳ chọn)">
            <Input.TextArea rows={3} placeholder="Ví dụ: Ca sáng, line 1..." maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* Batch Result Drawer with QR */}
      <Drawer
        title="Kết quả tạo lô sản xuất"
        width={820}
        open={batchResultOpen}
        onClose={() => setBatchResultOpen(false)}
        styles={{
          header: { borderBottom: '1px solid #f0f0f0' },
          body: { background: '#f5f5f5' },
        }}
        extra={
          createdBatch && (
            <Space>
              <Tooltip title="Copy batch code">
                <Button icon={<CopyOutlined />} onClick={copyBatchCode} />
              </Tooltip>
              <Tooltip title="In tem QR (mở hộp thoại in)">
                <Button icon={<PrinterOutlined />} onClick={() => window.print()} />
              </Tooltip>
              <Button type="primary" onClick={() => setBatchResultOpen(false)}>
                Đóng
              </Button>
            </Space>
          )
        }
      >
        {createdBatch ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Result
              status="success"
              title="Tạo lô sản xuất thành công"
              subTitle="Bạn có thể in/scan QR code để tra cứu lô và phục vụ kiểm kê."
            />

            <Card
              variant="borderless"
              style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}
              bodyStyle={{ padding: 18 }}
            >
              <Row gutter={[16, 16]} align="top">
                <Col xs={24} md={14}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Batch code</Text>
                      <div style={{ marginTop: 6 }}>
                        <Tag color="geekblue" style={{ fontWeight: 700, fontSize: 14, padding: '2px 10px' }}>
                          {createdBatch.batch_code}
                        </Tag>
                      </div>
                    </div>

                    <Divider style={{ margin: 0 }} />

                    <Descriptions size="small" column={1} bordered>
                      <Descriptions.Item label="Sản phẩm">
                        {createdBatch.item ? createdBatch.item.name : `#${createdBatch.item_id}`}
                      </Descriptions.Item>
                      <Descriptions.Item label="Kho bếp">
                        {createdBatch.warehouse ? createdBatch.warehouse.name : `#${createdBatch.warehouse_id}`}
                      </Descriptions.Item>
                      <Descriptions.Item label="Số lượng">
                        <Text strong>{Number(createdBatch.quantity).toFixed(3)}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày sản xuất">
                        {createdBatch.mfg_date ? new Date(createdBatch.mfg_date).toLocaleDateString('vi-VN') : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Hạn sử dụng">
                        {createdBatch.expiry_date ? new Date(createdBatch.expiry_date).toLocaleDateString('vi-VN') : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">
                        <Tag color="green" style={{ fontWeight: 600 }}>{createdBatch.status}</Tag>
                      </Descriptions.Item>
                    </Descriptions>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                      QR payload: {`{ batch_code, item_id, warehouse_id, quantity, mfg_date, expiry_date, status }`}
                    </Text>
                  </Space>
                </Col>

                <Col xs={24} md={10}>
                  <Card
                    bordered={false}
                    style={{
                      borderRadius: 12,
                      background: '#fafafa',
                      border: '1px dashed #d9d9d9',
                      height: '100%',
                    }}
                    bodyStyle={{ textAlign: 'center', padding: 16 }}
                  >
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <Space size={8} style={{ justifyContent: 'center' }}>
                        <QrcodeOutlined style={{ color: '#1890ff' }} />
                        <Text strong>QR Code</Text>
                      </Space>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <QRCodeCanvas value={getQrPayload(createdBatch)} size={220} includeMargin />
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Quét QR để tra cứu nhanh thông tin lô.
                      </Text>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Space>
        ) : (
          <Empty description="Chưa có dữ liệu lô" />
        )}
      </Drawer>
    </>
  );
}
