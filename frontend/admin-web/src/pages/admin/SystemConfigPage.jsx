import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Typography, Table, Tag, Statistic, Space, Divider,
} from 'antd';
import {
  UserOutlined, ShopOutlined, HomeOutlined, SafetyOutlined,
} from '@ant-design/icons';
import { roleService } from '../../api/userService';

const { Title, Paragraph, Text } = Typography;

const ROLE_COLORS = {
  ADMIN: 'red',
  MANAGER: 'volcano',
  SUPPLY_COORDINATOR: 'orange',
  KITCHEN_STAFF: 'purple',
  STORE_STAFF: 'geekblue',
};

export default function SystemConfigPage() {
  const [roles, setRoles] = useState([]);

  useEffect(() => { roleService.getAll().then(r => setRoles(r.data)); }, []);

  const roleColumns = [
    { title: 'Mã vai trò', dataIndex: 'code', key: 'code', render: (c) => <Tag color={ROLE_COLORS[c] || 'default'}>{c}</Tag> },
    { title: 'Tên vai trò', dataIndex: 'name', key: 'name' },
    {
      title: 'Mô tả quyền hạn', key: 'desc',
      render: (_, r) => {
        const perms = {
          ADMIN: 'Toàn quyền: quản lý users, stores, kitchens, cấu hình hệ thống',
          MANAGER: 'Xem báo cáo, quản lý danh mục sản phẩm, tồn kho',
          SUPPLY_COORDINATOR: 'Điều phối đơn hàng, lên lịch giao hàng',
          KITCHEN_STAFF: 'Xử lý sản xuất, xuất kho, quản lý lô hàng',
          STORE_STAFF: 'Tạo đơn đặt hàng, nhận hàng, xem tồn kho cửa hàng',
        };
        return <Text type="secondary">{perms[r.code] || '—'}</Text>;
      },
    },
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>Cấu hình Hệ thống</Title>

      {/* Status Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { icon: <UserOutlined />, title: 'Tổng Người dùng', color: '#1890ff', key: 'users' },
          { icon: <ShopOutlined />, title: 'Cửa hàng Franchise', color: '#52c41a', key: 'stores' },
          { icon: <HomeOutlined />, title: 'Bếp Trung Tâm', color: '#722ed1', key: 'kitchens' },
          { icon: <SafetyOutlined />, title: 'Vai trò hệ thống', color: '#fa8c16', value: roles.length },
        ].map((item) => (
          <Col span={6} key={item.key || item.title}>
            <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <Statistic
                title={item.title}
                value={item.value ?? '—'}
                prefix={React.cloneElement(item.icon, { style: { color: item.color } })}
                styles={{ content: { color: item.color } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Architecture info */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Thông tin Hệ thống" variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <div><Text strong>Tên hệ thống:</Text> <Text>Central Kitchen & Franchise Store Management</Text></div>
              <div><Text strong>Phiên bản API:</Text> <Tag color="blue">v1</Tag></div>
              <div><Text strong>Frontend:</Text> <Tag>React + Ant Design</Tag></div>
              <div><Text strong>Backend:</Text> <Tag>Laravel + Sanctum</Tag></div>
              <div><Text strong>Database:</Text> <Tag>PostgreSQL</Tag></div>
              <div><Text strong>Auth:</Text> <Tag>Token-based (Sanctum)</Tag></div>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Quy tắc vận hành" variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <div><Tag color="green">Soft Delete</Tag> <Text>Dữ liệu không bị xóa vĩnh viễn</Text></div>
              <div><Tag color="blue">RBAC</Tag> <Text>Phân quyền theo vai trò</Text></div>
              <div><Tag color="orange">Pagination</Tag> <Text>Mặc định 15 bản ghi/trang</Text></div>
              <div><Tag color="purple">QR Code</Tag> <Text>Quản lý lô hàng bằng mã QR</Text></div>
              <Divider style={{ margin: '8px 0' }} />
              <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
                Mọi thay đổi cấu hình cần được phê duyệt bởi Admin trước khi áp dụng toàn hệ thống.
              </Paragraph>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Roles Table */}
      <Card title="Danh sách Vai trò & Quyền hạn" variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Table
          rowKey="id"
          columns={roleColumns}
          dataSource={roles}
          pagination={false}
          size="middle"
        />
      </Card>
    </>
  );
}
