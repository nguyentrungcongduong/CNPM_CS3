import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Input, Select, Button, Row, Col, Typography, Space, Badge, Statistic, Tooltip, Alert, Modal, Form, DatePicker, InputNumber, notification } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, WarningOutlined, HomeOutlined, ExperimentOutlined, CalendarOutlined } from '@ant-design/icons';
import batchService from '../../api/batchService';
import { inventoryService } from '../../api/inventoryService';

const { Title, Text } = Typography;

const BatchListPage = () => {
    const [batches, setBatches] = useState([]);
    const [items, setItems] = useState([]);
    const [kitchens, setKitchens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [filters, setFilters] = useState({ batch_number: '', item_id: undefined, warehouse_id: undefined });
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [alerts, setAlerts] = useState({ expiring_soon: [], expired: [], low_stock: [] });

    const fetchBatches = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await batchService.getBatches({ page, per_page: pagination.pageSize, ...filters });
            setBatches(res.data.data);
            setPagination(p => ({ ...p, current: res.data.current_page, total: res.data.total }));
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.pageSize]);

    const fetchInitialData = async () => {
        try {
            // Get all items and kitchens for select options
            const itemRes = await inventoryService.getKitchenStock({ per_page: 1000 });
            // Distinct items from inventory
            const distinctItems = Array.from(new Set(itemRes.data.data.map(i => i.item?.id)))
                .map(id => itemRes.data.data.find(i => i.item?.id === id).item);
            setItems(distinctItems || []);
            setKitchens(itemRes.kitchens || []);

            const alertRes = await batchService.getAlerts();
            setAlerts(alertRes.data || { expiring_soon: [], expired: [], low_stock: [] });
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchInitialData();
        fetchBatches();
    }, [fetchBatches]); // eslint-disable-line

    const handleCreateBatch = async (values) => {
        try {
            await batchService.createBatch({
                ...values,
                manufacturing_date: values.manufacturing_date?.format('YYYY-MM-DD'),
                expiry_date: values.expiry_date?.format('YYYY-MM-DD'),
            });
            notification.success({ message: 'Thành công', description: 'Đã tạo lô hàng mới' });
            setIsModalVisible(false);
            form.resetFields();
            fetchBatches(1);
        } catch (err) {
            notification.error({ message: 'Lỗi', description: 'Không thể tạo lô hàng' });
        }
    };

    const columns = [
        { title: 'Số lô', dataIndex: 'batch_number', key: 'batch_number', render: (text) => <Tag color="blue">{text}</Tag> },
        { title: 'Hàng hóa', key: 'item', render: (_, r) => <div><Text strong>{r.item?.name}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{r.item?.code}</Text></div> },
        { title: 'Kho', key: 'warehouse', render: (_, r) => r.warehouse?.name },
        {
            title: 'HSD', dataIndex: 'expiry_date', key: 'expiry_date', render: (v) => {
                if (!v) return '—';
                const date = new Date(v);
                const today = new Date();
                const isExpired = date < today;
                const expiringSoon = (date - today) / (1000 * 60 * 60 * 24) <= 30;
                return <Tag color={isExpired ? 'error' : expiringSoon ? 'warning' : 'success'}>{v}</Tag>;
            }
        },
        { title: 'Tồn kho', dataIndex: 'quantity_on_hand', key: 'qty', align: 'right', render: (v, r) => <b>{v} {r.item?.unit}</b> },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s) => <Badge status={s === 'ACTIVE' ? 'success' : 'default'} text={s} /> },
        { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created', render: (v) => new Date(v).toLocaleDateString('vi-VN') },
    ];

    return (
        <>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col><Title level={3}>Quản lý Lô hàng (Batch Management)</Title></Col>
                <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>Tạo lô mới</Button></Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col span={6}>
                    <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <Statistic title="Sắp hết hạn" value={alerts.expiring_soon.length} prefix={<CalendarOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: alerts.expiring_soon.length > 0 ? '#faad14' : '#52c41a' }} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <Statistic title="Đã hết hạn" value={alerts.expired.length} prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />} valueStyle={{ color: alerts.expired.length > 0 ? '#ff4d4f' : '#52c41a' }} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <Statistic title="Tồn kho thấp" value={alerts.low_stock.length} prefix={<ExperimentOutlined style={{ color: '#722ed1' }} />} valueStyle={{ color: alerts.low_stock.length > 0 ? '#faad14' : '#52c41a' }} />
                    </Card>
                </Col>
            </Row>

            {(alerts.expired.length > 0 || alerts.expiring_soon.length > 0) && (
                <Alert
                    type="error"
                    showIcon
                    icon={<WarningOutlined />}
                    message={`Cảnh báo: Có ${alerts.expired.length} lô đã hết hạn và ${alerts.expiring_soon.length} lô sắp hết hạn!`}
                    style={{ marginBottom: 16, borderRadius: 8 }}
                />
            )}

            <Card variant="borderless" style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Row gutter={12} align="middle">
                    <Col span={6}>
                        <Input placeholder="Số lô..." prefix={<SearchOutlined />} value={filters.batch_number} onChange={e => setFilters(f => ({ ...f, batch_number: e.target.value }))} allowClear />
                    </Col>
                    <Col span={6}>
                        <Select placeholder="Chọn hàng hóa" style={{ width: '100%' }} allowClear value={filters.item_id} onChange={v => setFilters(f => ({ ...f, item_id: v }))} options={items.map(i => ({ value: i.id, label: `[${i.code}] ${i.name}` }))} />
                    </Col>
                    <Col span={6}>
                        <Select placeholder="Chọn kho" style={{ width: '100%' }} allowClear value={filters.warehouse_id} onChange={v => setFilters(f => ({ ...f, warehouse_id: v }))} options={kitchens.map(k => ({ value: k.id, label: k.name }))} />
                    </Col>
                    <Col span={6}>
                        <Space>
                            <Button type="primary" onClick={() => fetchBatches(1)}>Lọc</Button>
                            <Button icon={<ReloadOutlined />} onClick={() => { setFilters({ batch_number: '', item_id: undefined, warehouse_id: undefined }); fetchBatches(1); }}>Reset</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={batches}
                    loading={loading}
                    pagination={{ ...pagination, showTotal: (t) => `Tổng ${t} lô` }}
                    onChange={(p) => fetchBatches(p.current)}
                />
            </Card>

            <Modal
                title="Tạo lô hàng mới"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleCreateBatch}>
                    <Form.Item name="item_id" label="Hàng hóa" rules={[{ required: true }]}>
                        <Select options={items.map(i => ({ value: i.id, label: `[${i.code}] ${i.name}` }))} />
                    </Form.Item>
                    <Form.Item name="warehouse_id" label="Kho" rules={[{ required: true }]}>
                        <Select options={kitchens.map(k => ({ value: k.id, label: k.name }))} />
                    </Form.Item>
                    <Form.Item name="batch_number" label="Số lô (Batch number)" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="manufacturing_date" label="Ngày SX">
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="expiry_date" label="Hạn sử dụng">
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="initial_quantity" label="SL ban đầu" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="quantity_on_hand" label="Tồn thực tế" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </>
    );
};

export default BatchListPage;
