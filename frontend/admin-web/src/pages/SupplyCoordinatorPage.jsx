import React from 'react';
import { Typography } from 'antd';
const { Title } = Typography;

const SupplyCoordinatorPage = () => (
  <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
    <Title level={2}>Khu vực điều phối cung ứng</Title>
    <p>Chỉ người dùng có vai trò "Supply Coordinator" mới truy cập được trang này.</p>
  </div>
);

export default SupplyCoordinatorPage;
