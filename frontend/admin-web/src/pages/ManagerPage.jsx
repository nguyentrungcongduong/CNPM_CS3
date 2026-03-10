import React from 'react';
import { Typography } from 'antd';
const { Title } = Typography;

const ManagerPage = () => (
  <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
    <Title level={2}>Khu vực quản lý</Title>
    <p>Chỉ người dùng có vai trò "Manager" mới truy cập được trang này.</p>
  </div>
);

export default ManagerPage;
