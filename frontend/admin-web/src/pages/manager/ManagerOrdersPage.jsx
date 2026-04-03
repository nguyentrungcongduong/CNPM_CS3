import React, { useCallback, useEffect, useState } from "react";
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
} from "antd";
import { FileSearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { managerOrderService } from "../../api/managerOrderService";
import { OrderStatusBadge } from "../../components/OrderStatus";

const { Title, Text } = Typography;

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
        const page = res?.data ?? res;
        setOrders(page?.data ?? []);
        setPagination((prev) => ({
          ...prev,
          current: page?.current_page ?? 1,
          total: page?.total ?? 0,
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

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "order_code",
      key: "order_code",
      width: 140,
      render: (code) => <Tag color="geekblue">{code}</Tag>,
    },
    {
      title: "Cửa hàng",
      key: "store",
      render: (_, r) =>
        r.store ? (
          <span>
            <Tag color="geekblue" style={{ marginRight: 4 }}>
              {r.store.code}
            </Tag>
            {r.store.name}
          </span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Thời gian tạo",
      dataIndex: "order_date",
      key: "order_date",
      width: 180,
      render: (v) => (v ? new Date(v).toLocaleString("vi-VN") : "—"),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      render: (v) => (v ? v : <Text type="secondary">Không có</Text>),
    },
    {
      title: "Số mặt hàng",
      key: "items_count",
      width: 120,
      align: "center",
      render: (_, r) => (
        <Badge
          count={r.items?.length || 0}
          style={{ backgroundColor: "#1890ff" }}
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status) => <OrderStatusBadge status={status} />,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          icon={<FileSearchOutlined />}
          onClick={() => openDetail(record)}
        >
          Xem
        </Button>
      ),
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
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid #f0f0f0",
          marginBottom: 16,
        }}
        bodyStyle={{ padding: 18 }}
      >
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space direction="vertical" size={2}>
            <Text strong>Theo dõi đơn từ cửa hàng</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Chỉ xem trạng thái; xác nhận đơn do Điều phối cung ứng (SUBMITTED
              → CONFIRMED).
            </Text>
          </Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchOrders(pagination.current)}
          >
            Làm mới
          </Button>
        </Space>
      </Card>

      <Card
        variant="borderless"
        style={{
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid #f0f0f0",
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
            emptyText: <Empty description="Chưa có đơn hàng nào từ cửa hàng" />,
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
        title={
          selected ? `Chi tiết đơn ${selected.order_code}` : "Chi tiết đơn hàng"
        }
      >
        {selected ? (
          <>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Card
                size="small"
                bordered={false}
                style={{ background: "#fafafa", borderRadius: 8 }}
              >
                <Space direction="vertical" size={4}>
                  <Text>
                    <strong>Cửa hàng:</strong>{" "}
                    {selected.store
                      ? `${selected.store.code} - ${selected.store.name}`
                      : "—"}
                  </Text>
                  <Text>
                    <strong>Trạng thái:</strong>{" "}
                    <OrderStatusBadge status={selected.status} />
                  </Text>
                  <Text>
                    <strong>Thời gian tạo:</strong>{" "}
                    {selected.order_date
                      ? new Date(selected.order_date).toLocaleString("vi-VN")
                      : "—"}
                  </Text>
                  <Text>
                    <strong>Ghi chú:</strong>{" "}
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
                  locale={{
                    emptyText: <Empty description="Chưa có mặt hàng" />,
                  }}
                  columns={[
                    {
                      title: "Mã hàng",
                      key: "code",
                      width: 120,
                      render: (_, r) =>
                        r.item ? (
                          <Tag color="geekblue">{r.item.code}</Tag>
                        ) : (
                          "—"
                        ),
                    },
                    {
                      title: "Tên hàng",
                      key: "name",
                      render: (_, r) => (r.item ? r.item.name : "—"),
                    },
                    {
                      title: "Số lượng đặt",
                      dataIndex: "ordered_quantity",
                      key: "ordered_quantity",
                      align: "right",
                      render: (v, r) =>
                        v != null ? `${Number(v).toFixed(3)} ${r.unit}` : "—",
                    },
                    {
                      title: "Ghi chú dòng",
                      dataIndex: "note",
                      key: "note",
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
