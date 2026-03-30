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
  const [createdBatches, setCreatedBatches] = useState([]);
  const [batchInputs, setBatchInputs] = useState([]);
  const [batchNote, setBatchNote] = useState('');

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
    // Khởi tạo batchInputs cho tất cả items trong kế hoạch
    const initialInputs = (plan.items || []).map((item, index) => ({
      key: index,
      item_id: item.item_id,
      item_name: item.item?.name || `Item #${item.item_id}`,
      item_code: item.item?.code || '',
      unit: item.unit || 'kg',
      required_quantity: Number(item.planned_quantity || 0),
      actual_quantity: Number(item.planned_quantity || 0), // Default = số cần SX
      production_date: plan.plan_date || dayjs().format('YYYY-MM-DD'),
      expiry_date: dayjs().add(7, 'day').format('YYYY-MM-DD'), // Default = 7 ngày sau
      note: '',
    }));
    setBatchInputs(initialInputs);
    setBatchNote('');
    setBatchModalOpen(true);
  };

  const submitCreateBatch = async () => {
    // Validate all inputs
    for (const input of batchInputs) {
      if (!input.actual_quantity || input.actual_quantity <= 0) {
        message.error(`Chưa nhập số lượng sản xuất cho: ${input.item_name}`);
        return;
      }
      if (!input.expiry_date) {
        message.error(`Chưa nhập hạn sử dụng cho: ${input.item_name}`);
        return;
      }
    }

    setBatchSubmitting(true);
    try {
      const payload = {
        production_plan_id: selectedPlan?.id,
        note: batchNote || null,
        batches: batchInputs.map(input => ({
          item_id: input.item_id,
          quantity: input.actual_quantity,
          production_date: input.production_date,
          expiry_date: input.expiry_date,
        })),
      };

      const res = await kitchenBatchService.createMultiple(payload);
      const batches = res.data?.batches || res.data || [];
      setCreatedBatches(Array.isArray(batches) ? batches : [batches]);
      message.success(res.message || `Tạo thành công ${batches.length} lô sản xuất`);

      // Mark plan as completed after creating batches
      if (selectedPlan?.id) {
        await updateProductionStatus(selectedPlan.id, 'COMPLETED');
        fetchPlans(pagination.current);
        setSelectedPlan((prev) => (prev ? { ...prev, status: 'COMPLETED' } : prev));
      }

      setBatchModalOpen(false);
      setBatchResultOpen(true);
    } catch (e) {
      message.error(e?.response?.data?.message || 'Lỗi khi tạo lô sản xuất');
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

  const copyBatchCodes = async () => {
    if (!createdBatches?.length) return;
    try {
      const codes = createdBatches.map(b => b.batch_code).join('\n');
      await navigator.clipboard.writeText(codes);
      message.success(`Đã copy ${createdBatches.length} mã lô`);
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

      {/* Complete → Create Multiple Batches Modal */}
      <Modal
        title={
          <Space>
            <QrcodeOutlined />
            <span>📦 Tạo lô sản xuất — {selectedPlan?.plan_code}</span>
          </Space>
        }
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        onOk={submitCreateBatch}
        okText="Tạo tất cả lô ✅"
        cancelText="Hủy"
        okButtonProps={{ loading: batchSubmitting }}
        width={800}
        destroyOnHidden
      >
        <Card
          bordered={false}
          style={{ borderRadius: 10, background: '#f6ffed', border: '1px solid #b7eb8f', marginBottom: 16 }}
          bodyStyle={{ padding: 16 }}
        >
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Text strong style={{ color: '#389e0d' }}>Ghi nhận lô sản xuất</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Điền số lượng thực tế và HSD cho từng sản phẩm. Hệ thống sẽ tạo tất cả lô cùng lúc.
            </Text>
          </Space>
        </Card>

        {/* Table of items to produce */}
        <Card
          title={<Text strong>Danh sách sản phẩm cần sản xuất</Text>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Table
            dataSource={batchInputs}
            pagination={false}
            size="small"
            rowKey="key"
            columns={[
              {
                title: 'Sản phẩm',
                key: 'product',
                render: (_, record) => (
                  <Space direction="vertical" size={0}>
                    <Tag color="geekblue">{record.item_code}</Tag>
                    <Text strong>{record.item_name}</Text>
                  </Space>
                ),
              },
              {
                title: 'Cần SX',
                key: 'required',
                width: 100,
                align: 'right',
                render: (_, record) => (
                  <Text type="secondary">{record.required_quantity} {record.unit}</Text>
                ),
              },
              {
                title: 'Thực tế',
                key: 'actual',
                width: 140,
                render: (_, record, index) => (
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0.001}
                    step={0.001}
                    precision={3}
                    value={record.actual_quantity}
                    onChange={(val) => {
                      const updated = [...batchInputs];
                      updated[index].actual_quantity = val || 0;
                      setBatchInputs(updated);
                    }}
                    addonAfter={record.unit}
                  />
                ),
              },
              {
                title: 'Ngày SX',
                key: 'prod_date',
                width: 130,
                render: (_, record, index) => (
                  <DatePicker
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    value={record.production_date ? dayjs(record.production_date) : null}
                    onChange={(date) => {
                      const updated = [...batchInputs];
                      updated[index].production_date = date ? date.format('YYYY-MM-DD') : null;
                      setBatchInputs(updated);
                    }}
                    allowClear={false}
                  />
                ),
              },
              {
                title: 'Hạn sử dụng *',
                key: 'expiry',
                width: 130,
                render: (_, record, index) => (
                  <DatePicker
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    value={record.expiry_date ? dayjs(record.expiry_date) : null}
                    onChange={(date) => {
                      const updated = [...batchInputs];
                      updated[index].expiry_date = date ? date.format('YYYY-MM-DD') : null;
                      setBatchInputs(updated);
                    }}
                    placeholder="Bắt buộc"
                    allowClear={false}
                  />
                ),
              },
            ]}
          />
        </Card>

        <Form.Item label="Ghi chú chung (tuỳ chọn)">
          <Input.TextArea 
            rows={2} 
            placeholder="Ví dụ: Ca sáng, line 1..." 
            maxLength={1000} 
            showCount 
            value={batchNote}
            onChange={(e) => setBatchNote(e.target.value)}
          />
        </Form.Item>
      </Modal>

      {/* Batch Result Drawer with QR */}
      <Drawer
        title={`✅ Đã tạo ${createdBatches.length} lô sản xuất`}
        width={900}
        open={batchResultOpen}
        onClose={() => setBatchResultOpen(false)}
        styles={{
          header: { borderBottom: '1px solid #f0f0f0' },
          body: { background: '#f5f5f5' },
        }}
        extra={
          createdBatches.length > 0 && (
            <Space>
              <Tooltip title="Copy tất cả mã lô">
                <Button icon={<CopyOutlined />} onClick={copyBatchCodes}>Copy mã</Button>
              </Tooltip>
              <Tooltip title="In tất cả tem QR">
                <Button icon={<PrinterOutlined />} onClick={() => window.print()}>In QR</Button>
              </Tooltip>
              <Button type="primary" onClick={() => setBatchResultOpen(false)}>
                Đóng
              </Button>
            </Space>
          )
        }
      >
        {createdBatches.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Result
              status="success"
              title={`Tạo thành công ${createdBatches.length} lô sản xuất`}
              subTitle="Tất cả lô đã được tạo, cập nhật tồn kho và đánh dấu kế hoạch hoàn thành."
            />

            {/* Danh sách tất cả các lô */}
            {createdBatches.map((batch, index) => (
              <Card
                key={batch.id || index}
                variant="borderless"
                title={
                  <Space>
                    <Tag color="geekblue">{batch.batch_code}</Tag>
                    <Text strong>{batch.item?.name || `Sản phẩm #${batch.item_id}`}</Text>
                  </Space>
                }
                style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: 18 }}
              >
                <Row gutter={[16, 16]} align="top">
                  <Col xs={24} md={14}>
                    <Descriptions size="small" column={1} bordered>
                      <Descriptions.Item label="Số lượng">
                        <Text strong>{Number(batch.quantity).toFixed(3)} {batch.item?.unit || 'kg'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày sản xuất">
                        {batch.mfg_date ? new Date(batch.mfg_date).toLocaleDateString('vi-VN') : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Hạn sử dụng">
                        {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString('vi-VN') : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">
                        <Tag color="green" style={{ fontWeight: 600 }}>{batch.status}</Tag>
                      </Descriptions.Item>
                    </Descriptions>
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
                          <QRCodeCanvas value={getQrPayload(batch)} size={200} includeMargin />
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Quét QR để tra cứu.
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        ) : (
          <Empty description="Chưa có dữ liệu lô" />
        )}
      </Drawer>
    </>
  );
}
