import { FiBell, FiUser } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Tổng quan',
  '/users': 'Quản lý Users',
  '/stores-kitchens': 'Cửa hàng & Bếp',
  '/system-config': 'Cấu hình hệ thống',
};

export default function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Hệ thống';

  return (
    <header className="header">
      <h1 className="page-title">{title}</h1>
      <div className="header-actions">
        <button className="icon-btn" title="Thông báo">
          <FiBell size={20} />
        </button>
        <button className="user-btn">
          <FiUser size={18} />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
}
