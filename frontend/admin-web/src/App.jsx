import { useState } from 'react'
import { Layout, Menu, Button, Space, Typography, Breadcrumb } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  HomeOutlined,
  SettingOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet, Link, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ForbiddenPage from './pages/Forbidden'
import ManagerPage from './pages/ManagerPage'
import StorePage from './pages/StorePage'
import SupplyCoordinatorPage from './pages/SupplyCoordinatorPage'
import KitchenStaffPage from './pages/KitchenStaffPage'
import UsersPage from './pages/admin/UsersPage'
import StoresPage from './pages/admin/StoresPage'
import KitchensPage from './pages/admin/KitchensPage'
import SystemConfigPage from './pages/admin/SystemConfigPage'
import RecipesPage from './pages/admin/RecipesPage'
import KitchenInventoryPage from './pages/manager/KitchenInventoryPage'
import StoreInventoryPage from './pages/manager/StoreInventoryPage'
import './App.css'

const { Header, Content, Footer, Sider } = Layout
const { Title, Text } = Typography

// ---- Protected Route ----
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

  if (children) return children;
  return <Outlet />;
};

// ---- Dashboard Home ----
const DashboardContent = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return (
    <div style={{ padding: 24, minHeight: 400, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <Title level={2}>Chào mừng, {user.full_name}! 👋</Title>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Vai trò:</strong> {user.role?.name}</p>
      {user.store && <p><strong>Cửa hàng:</strong> {user.store.name}</p>}
      {user.warehouse && <p><strong>Kho/Bếp:</strong> {user.warehouse.name}</p>}
    </div>
  );
};

// ---- Breadcrumb map ----
const BREADCRUMB_MAP = {
  '/': ['Dashboard'],
  '/admin/users': ['Admin', 'Quản lý Users'],
  '/admin/stores': ['Admin', 'Quản lý Cửa hàng'],
  '/admin/kitchens': ['Admin', 'Quản lý Bếp'],
  '/admin/recipes': ['Admin', 'Quản lý Công thức'],
  '/admin/config': ['Admin', 'Cấu hình hệ thống'],
  '/manager': ['Manager Area'],
  '/manager/kitchen-inventory': ['Manager', 'Tồn kho Bếp Trung Tâm'],
  '/manager/store-inventory': ['Manager', 'Tồn kho Cửa hàng'],
  '/supply': ['Supply Coordinator'],
  '/kitchen': ['Kitchen Staff'],
  '/store': ['Store Area'],
};

// ---- Main Layout ----
function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleCode = user?.role?.code;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Admin submenu items
  const adminSubItems = [
    { key: '/admin/users',   icon: <TeamOutlined />,   label: <Link to="/admin/users">Người dùng</Link> },
    { key: '/admin/stores',  icon: <ShopOutlined />,   label: <Link to="/admin/stores">Cửa hàng</Link> },
    { key: '/admin/kitchens',icon: <HomeOutlined />,   label: <Link to="/admin/kitchens">Bếp Trung Tâm</Link> },
    { key: '/admin/recipes', icon: <FileTextOutlined />,label: <Link to="/admin/recipes">Công thức</Link> },
    { key: '/admin/config',  icon: <SettingOutlined />,label: <Link to="/admin/config">Cấu hình</Link> },
  ];

  // Manager submenu items
  const managerSubItems = [
    { key: '/manager', icon: <ShopOutlined />, label: <Link to="/manager">Manager Home</Link> },
    { key: '/manager/kitchen-inventory', icon: <HomeOutlined />, label: <Link to="/manager/kitchen-inventory">Tồn kho Bếp TT</Link> },
    { key: '/manager/store-inventory', icon: <ShopOutlined />, label: <Link to="/manager/store-inventory">Tồn kho Cửa hàng</Link> },
  ];

  // Build sidebar items based on role
  const items = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
    ...(roleCode === 'ADMIN' ? [{
      key: 'admin-group',
      icon: <UserOutlined />,
      label: 'Quản trị',
      children: adminSubItems,
    }] : []),
    ...(roleCode === 'MANAGER' ? [{
      key: 'manager-group',
      icon: <FileTextOutlined />,
      label: 'Quản lý',
      children: managerSubItems,
    }] : []),
    ...(roleCode === 'SUPPLY_COORDINATOR' ? [{ key: '/supply', icon: <ShopOutlined />, label: <Link to="/supply">Supply Coord</Link> }] : []),
    ...(roleCode === 'CENTRAL_KITCHEN_STAFF' ? [{ key: '/kitchen', icon: <HomeOutlined />, label: <Link to="/kitchen">Kitchen Staff</Link> }] : []),
    ...(roleCode === 'STORE_STAFF' ? [{ key: '/store', icon: <FileTextOutlined />, label: <Link to="/store">Store Area</Link> }] : []),
  ];

  const breadcrumbs = BREADCRUMB_MAP[location.pathname] || ['Dashboard'];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.15)', zIndex: 10 }}
        width={220}
      >
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#001529', borderBottom: '1px solid #002140',
        }}>
          <Text strong style={{ color: '#fff', fontSize: collapsed ? 13 : 16, transition: 'all 0.3s' }}>
            {collapsed ? 'CKFM' : 'CK MANAGEMENT'}
          </Text>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['admin-group']}
          mode="inline"
          items={items}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          padding: '0 24px', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', zIndex: 1,
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 48, height: 48 }}
            />
            <Breadcrumb items={breadcrumbs.map((b, i) => ({ title: b, key: i }))} />
          </Space>
          <Space>
            <UserOutlined style={{ color: '#1890ff' }} />
            <Text strong>{user.full_name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>({user.role?.name})</Text>
            <Button icon={<LogoutOutlined />} type="link" danger onClick={handleLogout}>Thoát</Button>
          </Space>
        </Header>

        <Content style={{ margin: '20px 24px', minHeight: 280 }}>
          <Outlet />
        </Content>

        <Footer style={{ textAlign: 'center', color: '#8c8c8c', background: '#f5f5f5', padding: '12px 24px' }}>
          CNPM_CS3 — Central Kitchen & Franchise Store Management ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}

// ---- App Router ----
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Authenticated area */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<DashboardContent />} />

          {/* Admin routes */}
          <Route path="admin/users"   element={<ProtectedRoute allowedRoles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
          <Route path="admin/stores"  element={<ProtectedRoute allowedRoles={['ADMIN']}><StoresPage /></ProtectedRoute>} />
          <Route path="admin/kitchens" element={<ProtectedRoute allowedRoles={['ADMIN']}><KitchensPage /></ProtectedRoute>} />
          <Route path="admin/recipes" element={<ProtectedRoute allowedRoles={['ADMIN']}><RecipesPage /></ProtectedRoute>} />
          <Route path="admin/config"  element={<ProtectedRoute allowedRoles={['ADMIN']}><SystemConfigPage /></ProtectedRoute>} />

          {/* Manager routes */}
          <Route path="manager" element={<ProtectedRoute allowedRoles={['MANAGER']}><ManagerPage /></ProtectedRoute>} />
          <Route path="manager/kitchen-inventory" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}><KitchenInventoryPage /></ProtectedRoute>} />
          <Route path="manager/store-inventory" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}><StoreInventoryPage /></ProtectedRoute>} />

          {/* Other role routes */}
          <Route path="supply"  element={<ProtectedRoute allowedRoles={['SUPPLY_COORDINATOR']}><SupplyCoordinatorPage /></ProtectedRoute>} />
          <Route path="kitchen" element={<ProtectedRoute allowedRoles={['CENTRAL_KITCHEN_STAFF']}><KitchenStaffPage /></ProtectedRoute>} />
          <Route path="store"   element={<ProtectedRoute allowedRoles={['STORE_STAFF']}><StorePage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
