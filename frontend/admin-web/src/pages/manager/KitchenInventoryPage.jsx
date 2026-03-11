import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Input, Select, Button, Row, Col, Typography, Space, Badge, Statistic, Tabs, Progress, Tooltip, Alert } from 'antd';
import { SearchOutlined, ReloadOutlined, WarningOutlined, HomeOutlined, SwapOutlined } from '@ant-design/icons';
import { inventoryService } from '../../api/inventoryService';

const { Title, Text } = Typography;

const TX_COLORS = { IN: 'success', OUT: 'error', RESERVE: 'warning', UNRESERVE: 'processing', ADJUST: 'default' };
const TX_LABELS = { IN: '↑ Nhập', OUT: '↓ Xuất', RESERVE: '⚑ Giữ', UNRESERVE: '↺ Hủy giữ', ADJUST: '✎ Điều chỉnh' };

const StockProgress = ({ available, minStock }) => {
  const pct = minStock ? Math.min(100, (available / minStock) * 100) : null;
  const status = pct === null ? null : pct <= 50 ? 'exception' : pct <= 100 ? 'normal' : 'success';
  return (
    <div style={{ minWidth: 100 }}>
      <span style={{ fontWeight: 600 }}>{Number(available).toFixed(2)}</span>
      {minStock && (
        <Tooltip title={`Tồn tối thiểu: ${minStock}`}>
          <Progress percent={Math.round(pct)} size="small" status={status} style={{ marginTop: 2 }} />
        </Tooltip>
      )}
    </div>
  );
};

const StockTable = ({ data, loading, pagination, onPageChange }) => {
  const columns = [
    { title: 'Mã', key: 'code', width: 110, render: (_, r) => <Tag color="purple">{r.item?.code}</Tag> },
    { title: 'Tên', key: 'name', render: (_, r) => <div><Text strong>{r.item?.name}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{r.item?.type}</Text></div> },
    { title: 'Kho', key: 'warehouse', render: (_, r) => <span><HomeOutlined style={{ color: '#722ed1', marginRight: 4 }} />{r.warehouse?.name}</span> },
    { title: 'Tồn thực', dataIndex: 'quantity_on_hand', key: 'qty_on_hand', align: 'right', render: (v, r) => `${Number(v).toFixed(2)} ${r.item?.unit || ''}` },
    { title: 'Đang giữ', dataIndex: 'quantity_reserved', key: 'qty_reserved', align: 'right', render: (v, r) => v > 0 ? <Tag color="orange">{Number(v).toFixed(2)} {r.item?.unit}</Tag> : <Text type="secondary">—</Text> },
    { title: 'Có sẵn', key: 'qty_available', align: 'right', render: (_, r) => <StockProgress available={r.quantity_available} minStock={r.item?.min_stock} /> },
    { title: 'Cập nhật', dataIndex: 'last_updated_at', key: 'updated', width: 140, render: (v) => v ? new Date(v).toLocaleString('vi-VN') : '—' },
  ];
  return (
    <Table rowKey="id" columns={columns} dataSource={data} loading={loading} size="middle"
      pagination={{ ...pagination, showTotal: (t) => `Tổng ${t} dòng`, onChange: onPageChange }}
      rowClassName={(r) => {
        const min = parseFloat(r.item?.min_stock || 0);
        return min > 0 && parseFloat(r.quantity_available) <= min ? 'ant-table-row-danger' : '';
      }}
    />
  );
};

const TxTable = ({ data, loading, pagination, onPageChange }) => {
  const columns = [
    { title: 'Loại', dataIndex: 'type', key: 'type', width: 120, render: (t) => <Badge status={TX_COLORS[t]} text={TX_LABELS[t] || t} /> },
    { title: 'Hàng', key: 'item', render: (_, r) => <span><Tag color="purple">{r.item?.code}</Tag> {r.item?.name}</span> },
    { title: 'Kho', key: 'wh', render: (_, r) => r.warehouse?.name },
    { title: 'SL đổi', dataIndex: 'quantity', key: 'qty', align: 'right', render: (v, r) => {
      const sign = ['IN', 'UNRESERVE'].includes(r.type) ? '+' : '-';
      const color = ['IN', 'UNRESERVE'].includes(r.type) ? '#52c41a' : '#ff4d4f';
      return <span style={{ color, fontWeight: 600 }}>{sign}{Number(v).toFixed(2)}</span>;
    }},
    { title: 'Trước → Sau', key: 'before_after', render: (_, r) => <Text type="secondary">{Number(r.quantity_before).toFixed(2)} → {Number(r.quantity_after).toFixed(2)}</Text> },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note', ellipsis: true },
    { title: 'Người', key: 'user', render: (_, r) => r.user?.full_name || 'Hệ thống' },
    { title: 'Thời gian', dataIndex: 'created_at', key: 'time', width: 140, render: (v) => new Date(v).toLocaleString('vi-VN') },
  ];
  return <Table rowKey="id" columns={columns} dataSource={data} loading={loading} size="middle" pagination={{ ...pagination, showTotal: (t) => `Tổng ${t} GD`, onChange: onPageChange }} />;
};

export default function KitchenInventoryPage() {
  const [stock, setStock] = useState([]);
  const [txs, setTxs] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [stockPagi, setStockPagi] = useState({ current: 1, pageSize: 20, total: 0 });
  const [txPagi, setTxPagi] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ search: '', warehouse_id: undefined, low_stock: false });
  const [summaryStats, setSummaryStats] = useState({ total: 0, lowStock: 0 });

  const fetchStock = useCallback(async (page = 1) => {
    setLoadingStock(true);
    try {
      const res = await inventoryService.getKitchenStock({ page, per_page: stockPagi.pageSize, ...filters });
      setStock(res.data.data);
      setKitchens(res.kitchens || []);
      setStockPagi(p => ({ ...p, current: res.data.current_page, total: res.data.total }));
      const lowCount = res.data.data.filter(r => {
        const min = parseFloat(r.item?.min_stock || 0);
        return min > 0 && parseFloat(r.quantity_available) <= min;
      }).length;
      setSummaryStats({ total: res.data.total, lowStock: lowCount });
    } finally { setLoadingStock(false); }
  }, [filters, stockPagi.pageSize]);

  const fetchTx = useCallback(async (page = 1) => {
    setLoadingTx(true);
    try {
      const res = await inventoryService.getKitchenTransactions({ page, per_page: txPagi.pageSize, warehouse_id: filters.warehouse_id });
      setTxs(res.data.data);
      setTxPagi(p => ({ ...p, current: res.data.current_page, total: res.data.total }));
    } finally { setLoadingTx(false); }
  }, [filters.warehouse_id, txPagi.pageSize]);

  useEffect(() => { fetchStock(); }, []); // eslint-disable-line

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>Tồn kho Bếp Trung Tâm</Title>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic title="Tổng mặt hàng" value={summaryStats.total} prefix={<HomeOutlined style={{ color: '#722ed1' }} />} styles={{ content: { color: '#722ed1' } }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic title="Sắp hết hàng" value={summaryStats.lowStock} prefix={<WarningOutlined style={{ color: '#faad14' }} />} styles={{ content: { color: summaryStats.lowStock > 0 ? '#ff4d4f' : '#52c41a' } }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic title="Số bếp" value={kitchens.length} prefix={<HomeOutlined style={{ color: '#1890ff' }} />} styles={{ content: { color: '#1890ff' } }} />
          </Card>
        </Col>
      </Row>

      {summaryStats.lowStock > 0 && <Alert type="warning" showIcon icon={<WarningOutlined />} message={`${summaryStats.lowStock} mặt hàng đang dưới mức tồn tối thiểu!`} style={{ marginBottom: 16, borderRadius: 8 }} />}

      <Tabs defaultActiveKey="stock" onChange={(k) => { if (k === 'tx') fetchTx(1); }} items={[
        {
          key: 'stock',
          label: 'Tồn kho hiện tại',
          children: (
            <>
              <Card variant="borderless" style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Row gutter={12} align="middle">
                  <Col flex="auto">
                    <Input placeholder="Tìm theo tên, mã hàng..." prefix={<SearchOutlined />} value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} onPressEnter={() => fetchStock(1)} allowClear />
                  </Col>
                  <Col>
                    <Select placeholder="Bếp trung tâm" style={{ width: 200 }} allowClear value={filters.warehouse_id} onChange={v => setFilters(f => ({ ...f, warehouse_id: v }))} options={kitchens.map(k => ({ value: k.id, label: `[${k.code}] ${k.name}` }))} />
                  </Col>
                  <Col>
                    <Button icon={<WarningOutlined />} type={filters.low_stock ? 'primary' : 'default'} danger={filters.low_stock} onClick={() => setFilters(f => ({ ...f, low_stock: !f.low_stock }))}>Sắp hết</Button>
                  </Col>
                  <Col>
                    <Space>
                      <Button icon={<SearchOutlined />} type="primary" onClick={() => fetchStock(1)}>Tìm</Button>
                      <Button icon={<ReloadOutlined />} onClick={() => { setFilters({ search: '', warehouse_id: undefined, low_stock: false }); fetchStock(1); }}>Reset</Button>
                    </Space>
                  </Col>
                </Row>
              </Card>
              <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <StockTable data={stock} loading={loadingStock} pagination={stockPagi} onPageChange={(page) => fetchStock(page)} />
              </Card>
            </>
          ),
        },
        { key: 'tx', label: <span><SwapOutlined /> Lịch sử giao dịch</span>, children: <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}><TxTable data={txs} loading={loadingTx} pagination={txPagi} onPageChange={(page) => fetchTx(page)} /></Card> },
      ]} />
    </>
  );
}
