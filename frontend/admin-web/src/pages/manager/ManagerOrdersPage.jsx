import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Badge,
  Modal,
  Empty,
  message,
} from 'antd';
import {
  FileSearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { managerOrderService } from '../../api/managerOrderService';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  PROCESSING: 'blue',
  COMPLETED: 'purple',
};

const STATUS_LABELS = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn tất',
};

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await managerOrderService.list({
          page,
          per_page: pagination.pageSize,
        });
        const payload = res.data || res;
        setOrders(payload.data || []);
        setPagination((prev) => ({
          ...prev,
          current: payload.current_page,
          total: payload.total,
        }));
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize],
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const openDetail = (record) => {
    setSelected(record);
    setDetailOpen(true);
  };

  const handleApprove = async (record) => {
    Modal.confirm({
      title: 'Duyệt đơn hàng',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: `Xác nhận duyệt đơn ${record.order_code}?`,
      okText: 'Duyệt đơn',
      cancelText: 'Hủy',
      async onOk() {
        await managerOrderService.approve(record.id);
        message.success('Đã duyệt đơn hàng');
        fetchOrders(pagination.current);
      },
    });
  };

  const handleReject = async (record) => {
    let reason = '';
    const modal = Modal.confirm({
      title: 'Từ chối đơn hàng',
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <Text>Vui lòng nhập lý do từ chối (không bắt buộc):</Text>
          <textarea
            style={{ width: '100%', marginTop: 8 }}
            rows={3}
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </div>
      ),
      okText: 'Từ chối đơn',
      cancelText: 'Hủy',
      async onOk() {
        modal.update({ okButtonProps: { loading: true } });
        try {
          await managerOrderService.reject(record.id, { cancel_reason: reason || null });
          message.success('Đã từ chối đơn hàng');
          fetchOrders(pagination.current);
        } finally {
          modal.update({ okButtonProps: { loading: false } });
        }
      },
    });
  };

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      key: 'order_code',
      width: 140,
      render: (code) => <Tag color="geekblue">{code}</Tag>,
    },
    {
      title: 'Cửa hàng',
      key: 'store',
      render: (_, r) =>
        r.store ? (
          <span>
            <Tag color="geekblue" style={{ marginRight: 4 }}>{r.store.code}</Tag>
            {r.store.name}
          </span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Thời gian tạo',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 180,
      render: (v) =>
        v ? new Date(v).toLocaleString('vi-VN') : '—',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (v) => (v ? v : <Text type="secondary">Không có</Text>),
    },
    {
      title: 'Số mặt hàng',
      key: 'items_count',
      width: 120,
      align: 'center',
      render: (_, r) => (
        <Badge count={r.items?.length || 0} style={{ backgroundColor: '#1890ff' }} />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 220,
      render: (_, record) => {
        const isPending = record.status === 'PENDING';
        return (
          <Space>
            <Button
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() => openDetail(record)}
            >
              Xem
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              disabled={!isPending}
              onClick={() => handleApprove(record)}
            >
              Duyệt
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              disabled={!isPending}
              onClick={() => handleReject(record)}
            >
              Từ chối
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>
        Đơn hàng từ cửa hàng
      </Title>

      <Card
        variant="borderless"
        style={{
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0',
          marginBottom: 16,
        }}
        bodyStyle={{ padding: 18 }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space direction="vertical" size={2}>
            <Text strong>Quản lý phê duyệt đơn hàng</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Xem, duyệt hoặc từ chối các đơn đặt hàng do các cửa hàng gửi lên.
            </Text>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchOrders(pagination.current)}>
            Làm mới
          </Button>
        </Space>
      </Card>

      <Card
        variant="borderless"
        style={{
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          size="middle"
          locale={{
            emptyText: (
              <Empty description="Chưa có đơn hàng nào từ cửa hàng" />
            ),
          }}
          pagination={{
            ...pagination,
            showTotal: (t) => `Tổng ${t} đơn`,
            onChange: (page) => fetchOrders(page),
          }}
        />
      </Card>

      <Modal
        open={detailOpen}
        footer={null}
        onCancel={() => setDetailOpen(false)}
        width={720}
        title={selected ? `Chi tiết đơn ${selected.order_code}` : 'Chi tiết đơn hàng'}
      >
        {selected ? (
          <>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Card size="small" bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
                <Space direction="vertical" size={4}>
                  <Text>
                    <strong>Cửa hàng:</strong>{' '}
                    {selected.store ? `${selected.store.code} - ${selected.store.name}` : '—'}
                  </Text>
                  <Text>
                    <strong>Thời gian tạo:</strong>{' '}
                    {selected.order_date
                      ? new Date(selected.order_date).toLocaleString('vi-VN')
                      : '—'}
                  </Text>
                  <Text>
                    <strong>Ghi chú:</strong>{' '}
                    {selected.note || <Text type="secondary">Không có</Text>}
                  </Text>
                </Space>
              </Card>

              <Card size="small" bordered={false} title="Danh sách mặt hàng">
                <Table
                  rowKey="id"
                  dataSource={selected.items || []}
                  size="small"
                  pagination={false}
                  locale={{ emptyText: <Empty description="Chưa có mặt hàng" /> }}
                  columns={[
                    {
                      title: 'Mã hàng',
                      key: 'code',
                      width: 120,
                      render: (_, r) =>
                        r.item ? <Tag color="geekblue">{r.item.code}</Tag> : '—',
                    },
                    {
                      title: 'Tên hàng',
                      key: 'name',
                      render: (_, r) =>
                        r.item ? r.item.name : '—',
                    },
                    {
                      title: 'Số lượng đặt',
                      dataIndex: 'ordered_quantity',
                      key: 'ordered_quantity',
                      align: 'right',
                      render: (v, r) =>
                        v != null ? `${Number(v).toFixed(3)} ${r.unit}` : '—',
                    },
                    {
                      title: 'Ghi chú dòng',
                      dataIndex: 'note',
                      key: 'note',
                      ellipsis: true,
                    },
                  ]}
                />
              </Card>
            </Space>
          </>
        ) : (
          <Empty description="Không có dữ liệu đơn hàng" />
        )}
      </Modal>
    </>
  );
}

