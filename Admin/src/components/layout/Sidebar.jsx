import { NavLink } from 'react-router-dom';
import { 
  FiLayout, FiUsers, FiMapPin, FiSettings, 
  FiHome, FiChevronLeft, FiChevronRight 
} from 'react-icons/fi';
import { useState } from 'react';

const menuItems = [
  { path: '/', icon: FiHome, label: 'Tổng quan' },
  { path: '/users', icon: FiUsers, label: 'Quản lý Users' },
  { path: '/stores-kitchens', icon: FiMapPin, label: 'Cửa hàng & Bếp' },
  { path: '/system-config', icon: FiSettings, label: 'Cấu hình hệ thống' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <FiLayout className="logo-icon" />
        {!collapsed && (
          <span className="logo-text">CKF Admin</span>
        )}
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="nav-icon" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      <button 
        className="collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>
    </aside>
  );
}
