import { useState } from 'react';
import { FiSave } from 'react-icons/fi';

export default function SystemConfig() {
  const [config, setConfig] = useState({
    siteName: 'Central Kitchen & Franchise',
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    enableNotifications: true,
    maintenanceMode: false,
  });

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Cấu hình đã được lưu thành công!');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Cấu hình hệ thống</h2>
        <button className="btn btn-primary" onClick={handleSubmit}>
          <FiSave /> Lưu cấu hình
        </button>
      </div>

      <form onSubmit={handleSubmit} className="config-form">
        <div className="card">
          <h3>Cài đặt chung</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Tên hệ thống</label>
              <input
                type="text"
                value={config.siteName}
                onChange={e => handleChange('siteName', e.target.value)}
                placeholder="Tên hiển thị"
              />
            </div>
            <div className="form-group">
              <label>Múi giờ</label>
              <select value={config.timezone} onChange={e => handleChange('timezone', e.target.value)}>
                <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (GMT+7)</option>
                <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="form-group">
              <label>Đơn vị tiền tệ</label>
              <select value={config.currency} onChange={e => handleChange('currency', e.target.value)}>
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Bảo mật</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Số lần đăng nhập thất bại tối đa</label>
              <input
                type="number"
                min="3"
                max="10"
                value={config.maxLoginAttempts}
                onChange={e => handleChange('maxLoginAttempts', +e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Timeout phiên (phút)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={config.sessionTimeout}
                onChange={e => handleChange('sessionTimeout', +e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Khác</h3>
          <div className="form-row checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.enableNotifications}
                onChange={e => handleChange('enableNotifications', e.target.checked)}
              />
              Bật thông báo
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={e => handleChange('maintenanceMode', e.target.checked)}
              />
              Chế độ bảo trì
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
