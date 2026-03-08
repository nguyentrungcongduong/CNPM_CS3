import { FiUsers, FiMapPin, FiPackage, FiTrendingUp } from 'react-icons/fi';

const stats = [
  { label: 'Tổng Users', value: '156', icon: FiUsers, color: '#0f766e' },
  { label: 'Cửa hàng', value: '24', icon: FiMapPin, color: '#7c3aed' },
  { label: 'Bếp trung tâm', value: '3', icon: FiPackage, color: '#dc2626' },
  { label: 'Đơn hôm nay', value: '342', icon: FiTrendingUp, color: '#059669' },
];

export default function Dashboard() {
  return (
    <div className="dashboard">
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: `${color}20`, color }}>
              <Icon size={24} />
            </div>
            <div>
              <p className="stat-value">{value}</p>
              <p className="stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-cards">
        <div className="card">
          <h3>Chào mừng đến Hệ thống CKF</h3>
          <p>
            Central Kitchen and Franchise Store Management System - Hệ thống quản lý 
            Bếp Trung Tâm và Cửa hàng Franchise. Sử dụng menu bên trái để điều hướng.
          </p>
        </div>
      </div>
    </div>
  );
}
