import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Typography, Spin, Alert } from "antd";
import {
  UserOutlined,
  ShopOutlined,
  HomeOutlined,
  FileTextOutlined,
  CarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { adminReportService } from "../../api/adminReportService";

const { Title, Text } = Typography;

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminReportService.getOverview();
        setData(res?.data || res);
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e.message ||
            "Không thể tải báo cáo tổng hợp",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const safe = (path, fallback = 0) => {
    return (
      path
        .split(".")
        .reduce(
          (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
          data,
        ) ?? fallback
    );
  };

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>
        Tổng quan Hệ thống (Admin)
      </Title>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Lỗi tải dữ liệu"
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading && !data}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Tổng người dùng"
                value={data ? safe("users.total") : "--"}
                prefix={<UserOutlined />}
              />
              <Text type="secondary">
                Đang hoạt động:{" "}
                <Text strong>{data ? safe("users.active") : "--"}</Text>
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Cửa hàng hoạt động"
                value={data ? safe("stores.active") : "--"}
                prefix={<ShopOutlined />}
              />
              <Text type="secondary">
                Tổng cửa hàng:{" "}
                <Text strong>{data ? safe("stores.total") : "--"}</Text>
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Bếp trung tâm"
                value={data ? safe("kitchens.total") : "--"}
                prefix={<HomeOutlined />}
              />
              <Text type="secondary">
                Đang hoạt động:{" "}
                <Text strong>{data ? safe("kitchens.active") : "--"}</Text>
              </Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Đơn hàng hôm nay"
                value={data ? safe("orders.today") : "--"}
                prefix={<FileTextOutlined />}
              />
              <Text type="secondary">
                Tổng đơn:{" "}
                <Text strong>{data ? safe("orders.total") : "--"}</Text>
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Đơn đã hoàn thành"
                value={data ? safe("orders.completed") : "--"}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Đơn đang giao hàng"
                value={data ? safe("deliveries.in_transit") : "--"}
                prefix={<CarOutlined />}
              />
              <Text type="secondary">
                Đã giao:{" "}
                <Text strong>{data ? safe("deliveries.completed") : "--"}</Text>
              </Text>
            </Card>
          </Col>
        </Row>
      </Spin>
    </>
  );
}
