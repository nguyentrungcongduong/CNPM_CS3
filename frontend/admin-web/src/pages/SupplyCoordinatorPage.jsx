import React from 'react';
import { Card, Typography, Row, Col, Button, Space, Statistic } from 'antd';
import { FileTextOutlined, BarChartOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const SupplyCoordinatorPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Title level={3} style={{ marginBottom: 4 }}>Khu vực điều phối cung ứng</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Tổng quan hoạt động điều phối — chọn chức năng bên dưới hoặc từ menu bên trái.
      </Text>

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
    </div>
  );
};

export default SupplyCoordinatorPage;
