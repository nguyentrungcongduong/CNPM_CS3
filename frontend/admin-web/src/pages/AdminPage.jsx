import React from 'react';
import { Typography } from 'antd';
const { Title } = Typography;

const AdminPage = () => (
  <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
    <Title level={2}>Khu vực chỉ dành cho Admin</Title>
    <p>Chỉ người dùng có quyền quản trị viên mới truy cập được trang này.</p>
  </div>
);

export default AdminPage;
