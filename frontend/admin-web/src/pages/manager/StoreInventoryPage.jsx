import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Input, Select, Button, Row, Col, Typography, Space, Badge, Statistic, Tabs, Progress, Tooltip, Alert, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined, WarningOutlined, ShopOutlined, SwapOutlined } from '@ant-design/icons';
import { inventoryService } from '../../api/inventoryService';
import { storeService } from '../../api/storeService';

const { Title, Text } = Typography;

const TX_COLORS = { IN: 'success', OUT: 'error', RESERVE: 'warning', UNRESERVE: 'processing', ADJUST: 'default' };
const TX_LABELS = { IN: '↑ Nhập', OUT: '↓ Xuất', RESERVE: '⚑ Giữ', UNRESERVE: '↺ Hủy giữ', ADJUST: '✎ Điều chỉnh' };

const StockTable = ({ data, loading, pagination, onPageChange }) => {
  const columns = [
    { title: 'Mã', key: 'code', width: 110, render: (_, r) => <Tag color="geekblue">{r.item?.code}</Tag> },
    { title: 'Tên', key: 'name', render: (_, r) => <div><Text strong>{r.item?.name}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{r.item?.type}</Text></div> },
    { title: 'Kho', key: 'warehouse', render: (_, r) => r.warehouse?.name || '—' },
    { title: 'Tồn thực', dataIndex: 'quantity_on_hand', key: 'qty_on_hand', align: 'right', render: (v, r) => `${Number(v).toFixed(2)} ${r.item?.unit || ''}` },
    { title: 'Đang giữ', dataIndex: 'quantity_reserved', key: 'qty_reserved', align: 'right', render: (v, r) => v > 0 ? <Tag color="orange">{Number(v).toFixed(2)} {r.item?.unit}</Tag> : <Text type="secondary">—</Text> },
    { title: 'Có sẵn', key: 'qty_available', align: 'right', render: (_, r) => {
        const avail = parseFloat(r.quantity_available);
        const minSt = parseFloat(r.item?.min_stock || 0);
        const isLow = minSt > 0 && avail <= minSt;
        return (
          <div style={{ minWidth: 100 }}>
            <span style={{ fontWeight: 600, color: isLow ? '#ff4d4f' : undefined }}>{avail.toFixed(2)}</span>
            {isLow && <Tooltip title={`Dưới tối thiểu (${minSt})`}><WarningOutlined style={{ color: '#faad14', marginLeft: 4 }} /></Tooltip>}
            {minSt > 0 && <Progress percent={Math.min(100, Math.round((avail / minSt) * 100))} size="small" status={isLow ? 'exception' : 'normal'} style={{ marginTop: 2 }} />}
          </div>
        );
      }
    },
    { title: 'Cập nhật', dataIndex: 'last_updated_at', key: 'updated', width: 140, render: (v) => v ? new Date(v).toLocaleString('vi-VN') : '—' },
  ];
  return <Table rowKey="id" columns={columns} dataSource={data} loading={loading} size="middle" locale={{ emptyText: <Empty description="Chưa có dữ liệu tồn kho" /> }} pagination={{ ...pagination, showTotal: (t) => `Tổng ${t} dòng`, onChange: onPageChange }} />;
};

const TxTable = ({ data, loading, pagination, onPageChange }) => {
  const columns = [
    { title: 'Loại', dataIndex: 'type', key: 'type', width: 120, render: (t) => <Badge status={TX_COLORS[t]} text={TX_LABELS[t] || t} /> },
    { title: 'Hàng', key: 'item', render: (_, r) => <span><Tag color="geekblue">{r.item?.code}</Tag> {r.item?.name}</span> },
    { title: 'SL đổi', dataIndex: 'quantity', key: 'qty', align: 'right', render: (v, r) => {
      const sign = ['IN', 'UNRESERVE'].includes(r.type) ? '+' : '-';
      const color = ['IN', 'UNRESERVE'].includes(r.type) ? '#52c41a' : '#ff4d4f';
      return <span style={{ color, fontWeight: 600 }}>{sign}{Number(v).toFixed(2)}</span>;
    }},
    { title: 'Trước → Sau', key: 'before_after', render: (_, r) => <Text type="secondary">{Number(r.quantity_before).toFixed(2)} → {Number(r.quantity_after).toFixed(2)}</Text> },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note', ellipsis: true },
    { title: 'Người', key: 'user', render: (_, r) => r.user?.full_name || 'Hệ thống' },
    { title: 'Thời gian', dataIndex: 'created_at', key: 'time', width: 145, render: (v) => new Date(v).toLocaleString('vi-VN') },
  ];
  return <Table rowKey="id" columns={columns} dataSource={data} loading={loading} size="middle" pagination={{ ...pagination, showTotal: (t) => `Tổng ${t} GD`, onChange: onPageChange }} />;
};

export default function StoreInventoryPage() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [stock, setStock] = useState([]);
  const [txs, setTxs] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [stockPagi, setStockPagi] = useState({ current: 1, pageSize: 20, total: 0 });
  const [txPagi, setTxPagi] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ search: '', low_stock: false });
  const [summaryStats, setSummaryStats] = useState({ total: 0, lowStock: 0 });

  useEffect(() => {
    storeService.getList().then(r => {
      setStores(r.data);
      if (r.data.length > 0) setSelectedStore(r.data[0].id);
    });
  }, []);

  const fetchStock = useCallback(async (page = 1) => {
    if (!selectedStore) return;
    setLoadingStock(true);
    try {
      const res = await inventoryService.getStoreStock(selectedStore, { page, per_page: stockPagi.pageSize, ...filters });
      setStock(res.data.data);
      setStoreInfo(res.store);
      setStockPagi(p => ({ ...p, current: res.data.current_page, total: res.data.total }));
      const lowCount = res.data.data.filter(r => {
        const min = parseFloat(r.item?.min_stock || 0);
        return min > 0 && parseFloat(r.quantity_available) <= min;
      }).length;
      setSummaryStats({ total: res.data.total, lowStock: lowCount });
    } finally { setLoadingStock(false); }
  }, [selectedStore, filters, stockPagi.pageSize]);

  const fetchTx = useCallback(async (page = 1) => {
    if (!selectedStore) return;
    setLoadingTx(true);
    try {
      const res = await inventoryService.getStoreTransactions(selectedStore, { page, per_page: txPagi.pageSize });
      setTxs(res.data.data);
      setTxPagi(p => ({ ...p, current: res.data.current_page, total: res.data.total }));
    } finally { setLoadingTx(false); }
  }, [selectedStore, txPagi.pageSize]);

  useEffect(() => { fetchStock(); }, [selectedStore]); // eslint-disable-line

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>Tồn kho Cửa hàng</Title>
      <Card variant="borderless" style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Row gutter={16} align="middle">
          <Col><Text strong>Chọn cửa hàng:</Text></Col>
          <Col flex="auto">
            <Select style={{ width: '100%', maxWidth: 360 }} placeholder="Chọn cửa hàng franchise..." value={selectedStore} onChange={(v) => { setSelectedStore(v); setFilters({ search: '', low_stock: false }); }} options={stores.map(s => ({ value: s.id, label: `[${s.code}] ${s.name}` }))} showSearch filterOption={(i, o) => o.label.toLowerCase().includes(i.toLowerCase())} />
          </Col>
          {storeInfo && <Col><Tag color="geekblue" style={{ fontSize: 13, padding: '2px 10px' }}><ShopOutlined style={{ marginRight: 4 }} />{storeInfo.name}</Tag></Col>}
        </Row>
      </Card>

      {selectedStore && (
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <Statistic title="Tổng mặt hàng" value={summaryStats.total} prefix={<ShopOutlined style={{ color: '#1890ff' }} />} styles={{ content: { color: '#1890ff' } }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <Statistic title="Sắp hết hàng" value={summaryStats.lowStock} prefix={<WarningOutlined />} styles={{ content: { color: summaryStats.lowStock > 0 ? '#ff4d4f' : '#52c41a' } }} />
            </Card>
          </Col>
        </Row>
      )}

      {summaryStats.lowStock > 0 && <Alert type="warning" showIcon message={`${summaryStats.lowStock} mặt hàng dưới mức tối thiểu. Cân nhắc đặt thêm!`} style={{ marginBottom: 16, borderRadius: 8 }} />}

      {selectedStore ? (
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
                      <Button icon={<WarningOutlined />} type={filters.low_stock ? 'primary' : 'default'} danger={filters.low_stock} onClick={() => setFilters(f => ({ ...f, low_stock: !f.low_stock }))}>Sắp hết</Button>
                    </Col>
                    <Col>
                      <Space>
                        <Button icon={<SearchOutlined />} type="primary" onClick={() => fetchStock(1)}>Tìm</Button>
                        <Button icon={<ReloadOutlined />} onClick={() => { setFilters({ search: '', low_stock: false }); fetchStock(1); }}>Reset</Button>
                      </Space>
                    </Col>
                  </Row>
                </Card>
                <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <StockTable data={stock} loading={loadingStock} pagination={stockPagi} onPageChange={(p) => fetchStock(p)} />
                </Card>
              </>
            ),
          },
          { key: 'tx', label: <span><SwapOutlined /> Lịch sử nhập/xuất</span>, children: <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}><TxTable data={txs} loading={loadingTx} pagination={txPagi} onPageChange={(p) => fetchTx(p)} /></Card> },
        ]} />
      ) : (
        <Card variant="borderless" style={{ textAlign: 'center', padding: 48, borderRadius: 8 }}><Empty description="Vui lòng chọn cửa hàng" /></Card>
      )}
    </>
  );
}
