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
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet, Link } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ForbiddenPage from './pages/Forbidden'
import AdminPage from './pages/AdminPage'
import ManagerPage from './pages/ManagerPage'
import StorePage from './pages/StorePage'
import SupplyCoordinatorPage from './pages/SupplyCoordinatorPage'
import KitchenStaffPage from './pages/KitchenStaffPage'
import './App.css'

const { Header, Content, Footer, Sider } = Layout
const { Title, Text } = Typography

// Auth + role wrapper
// supports both element wrapping (children) and nested routes (Outlet)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleCode = user?.role?.code || null;
    if (!roleCode || !allowedRoles.includes(roleCode)) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  // if children provided (used as element wrapper) render them
  if (children) {
    return children;
  }

  // otherwise assume this is a parent route and render nested routes
  return <Outlet />;
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

  // build menu items conditionally based on role
  const items = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
    { key: 'admin', icon: <UserOutlined />, label: <Link to="/admin">Admin Area</Link>, roles: ['ADMIN'] },
    { key: 'manager', icon: <ShopOutlined />, label: <Link to="/manager">Manager Area</Link>, roles: ['MANAGER'] },
    { key: 'supply', icon: <ShopOutlined />, label: <Link to="/supply">Supply Coord</Link>, roles: ['SUPPLY_COORDINATOR'] },
    { key: 'kitchen', icon: <ShopOutlined />, label: <Link to="/kitchen">Kitchen Staff</Link>, roles: ['CENTRAL_KITCHEN_STAFF'] },
    { key: 'store', icon: <FileTextOutlined />, label: <Link to="/store">Store Area</Link>, roles: ['STORE_STAFF'] },
  ].filter(item => !item.roles || item.roles.includes(user.role?.code));

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
          {/* outlet for nested routes */}
          <Outlet />
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
        <Route path="/forbidden" element={<ForbiddenPage />} />
        {/* authenticated area */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<DashboardContent />} />

            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="manager"
              element={
                <ProtectedRoute allowedRoles={["MANAGER"]}>
                  <ManagerPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="supply"
              element={
                <ProtectedRoute allowedRoles={["SUPPLY_COORDINATOR"]}>
                  <SupplyCoordinatorPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="kitchen"
              element={
                <ProtectedRoute allowedRoles={["CENTRAL_KITCHEN_STAFF"]}>
                  <KitchenStaffPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="store"
              element={
                <ProtectedRoute allowedRoles={["STORE_STAFF"]}>
                  <StorePage />
                </ProtectedRoute>
              }
            />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
