import React from 'react';
import { Typography } from 'antd';
const { Title } = Typography;

const StorePage = () => (
  <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
    <Title level={2}>Khu vực cửa hàng</Title>
    <p>Chỉ người dùng thuộc vai trò "Store Staff" mới truy cập được trang này.</p>
  </div>
);

export default StorePage;
