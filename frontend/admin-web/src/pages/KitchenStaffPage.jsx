import React from 'react';
import { Typography } from 'antd';
const { Title } = Typography;

const KitchenStaffPage = () => (
  <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
    <Title level={2}>Khu vực nhân viên bếp trung tâm</Title>
    <p>Chỉ người dùng có vai trò "Central Kitchen Staff" mới truy cập được trang này.</p>
  </div>
);

export default KitchenStaffPage;
