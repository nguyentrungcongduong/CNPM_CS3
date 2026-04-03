import React, { useCallback, useEffect, useState } from 'react';
import { Card, Typography, Row, Col, Button, Space, Statistic, Spin, Alert } from 'antd';
import { BarChartOutlined, CheckCircleOutlined, CarOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { coordinatorOrderService } from '../api/coordinatorOrderService';
import { ORDER_STATUS } from '../constants/orderStatus';

const { Title, Text } = Typography;

const SupplyCoordinatorPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pendingConfirm: 0, // Chờ duyệt
    inTransit: 0, // Đang giao
    delivered: 0, // Hoàn thành
  });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Demo-friendly: dùng số lượng theo trạng thái hiện tại (không cần lọc "hôm nay")
      const [submittedRes, inDeliveryRes, completedRes] = await Promise.all([
        coordinatorOrderService.list({
          page: 1,
          per_page: 1,
          status: ORDER_STATUS.SUBMITTED,
        }),
        coordinatorOrderService.list({
          page: 1,
          per_page: 1,
          status: ORDER_STATUS.IN_DELIVERY,
        }),
        coordinatorOrderService.list({
          page: 1,
          per_page: 1,
          status: ORDER_STATUS.COMPLETED,
        }),
      ]);

      const submittedPg = submittedRes?.data || submittedRes;
      const inDeliveryPg = inDeliveryRes?.data || inDeliveryRes;
      const completedPg = completedRes?.data || completedRes;

      setStats({
        pendingConfirm: Number(submittedPg?.total ?? 0),
        inTransit: Number(inDeliveryPg?.total ?? 0),
        delivered: Number(completedPg?.total ?? 0),
      });
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Không thể tải số liệu coordinator');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <Title level={3} style={{ marginBottom: 4 }}>Khu vực điều phối cung ứng</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Tổng quan hoạt động điều phối — chọn chức năng bên dưới hoặc từ menu bên trái.
      </Text>

      {error && (
        <Alert type="error" showIcon message="Lỗi tải số liệu" description={error} style={{ marginBottom: 12 }} />
      )}

      <Spin spinning={loading && !error}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card
              bordered={false}
              style={{ borderRadius: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              onClick={() => navigate('/supply/orders')}
            >
              <Statistic
                title="Chờ duyệt"
                value={stats.pendingConfirm}
                prefix={<CheckCircleOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16', fontSize: 26 }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              bordered={false}
              style={{ borderRadius: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              onClick={() => navigate('/supply/delivery/tracking')}
            >
              <Statistic
                title="Đang giao"
                value={stats.inTransit}
                prefix={<CarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: 26 }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              bordered={false}
              style={{ borderRadius: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              onClick={() => navigate('/supply/delivery/tracking')}
            >
              <Statistic
                title="Hoàn thành"
                value={stats.delivered}
                prefix={<CarOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: 26 }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            hoverable
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer' }}
            onClick={() => navigate('/supply/orders')}
          >
            <Space size="large">
              <div style={{ fontSize: 40, color: '#1890ff' }}>
                <CheckCircleOutlined />
              </div>
              <div>
                <Text strong style={{ fontSize: 16, display: 'block' }}>Duyệt đơn hàng</Text>
                <Text type="secondary">
                  Xem, xác nhận, từ chối hoặc hủy đơn từ các cửa hàng.
                  Điều chỉnh số lượng khi thiếu hàng.
                </Text>
                <br />
                <Button type="primary" size="small" style={{ marginTop: 12 }}
                  onClick={(e) => { e.stopPropagation(); navigate('/supply/orders'); }}>
                  Đi đến trang duyệt đơn
                </Button>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            bordered={false}
            hoverable
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer' }}
            onClick={() => navigate('/supply/summary')}
          >
            <Space size="large">
              <div style={{ fontSize: 40, color: '#722ed1' }}>
                <BarChartOutlined />
              </div>
              <div>
                <Text strong style={{ fontSize: 16, display: 'block' }}>Tổng hợp nhu cầu</Text>
                <Text type="secondary">
                  Tổng hợp tất cả đơn từ các cửa hàng.
                  Xem nhu cầu theo mặt hàng và cửa hàng để lập kế hoạch sản xuất.
                </Text>
                <br />
                <Button size="small" style={{ marginTop: 12 }}
                  onClick={(e) => { e.stopPropagation(); navigate('/supply/summary'); }}>
                  Đi đến tổng hợp
                </Button>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchStats} loading={loading}>
          Làm mới số liệu
        </Button>
      </div>
    </div>
  );
};

export default SupplyCoordinatorPage;
