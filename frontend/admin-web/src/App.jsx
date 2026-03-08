import { useState, useEffect } from 'react'
import { Layout, Menu, Breadcrumb, Button, Space, Card, Typography, Spin } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import './App.css'

const { Header, Content, Footer, Sider } = Layout
const { Title, Text } = Typography

// Auth Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const DashboardContent = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return (
        <div style={{ padding: 24, minHeight: 400, background: '#fff', borderRadius: 8 }}>
            <Title level={2}>Chào mừng {user.full_name}!</Title>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
              <Card title="Thông tin cá nhân" bordered={false} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Vai trò:</strong> {user.role?.name}</p>
                {user.store && <p><strong>Cửa hàng:</strong> {user.store.name}</p>}
                {user.warehouse && <p><strong>Kho:</strong> {user.warehouse.name}</p>}
              </Card>
            </Space>
          </div>
    )
}

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const items = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'users', icon: <UserOutlined />, label: 'Hệ thống' },
    { key: 'inventory', icon: <ShopOutlined />, label: 'Kho & Batch' },
    { key: 'orders', icon: <FileTextOutlined />, label: 'Đơn hàng' },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 10 }}>
        <div className="logo-container">
          <Text strong style={{ 
            fontSize: collapsed ? '14px' : '18px',
            color: '#1890ff',
            transition: 'all 0.3s'
          }}>
            {collapsed ? 'CNPM' : 'ADMIN CNPM'}
          </Text>
        </div>
        <Menu 
          theme="light" 
          defaultSelectedKeys={['dashboard']} 
          mode="inline" 
          items={items} 
          style={{ borderRight: 0, marginTop: 16 }}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: 0, 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingRight: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          zIndex: 1
        }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '16px', width: 64, height: 64 }} />
          <Space>
            <Text strong>{user.full_name}</Text>
            <Button icon={<LogoutOutlined />} type="link" onClick={handleLogout}>Thoát</Button>
          </Space>
        </Header>
        <Content style={{ margin: '16px 24px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>Admin</Breadcrumb.Item>
            <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
          </Breadcrumb>
          <DashboardContent />
        </Content>
        <Footer style={{ textAlign: 'center', color: '#8c8c8c' }}>CNPM_CS3 ©{new Date().getFullYear()}</Footer>
      </Layout>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
