import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const ROLES = ['admin', 'manager', 'staff', 'viewer'];

const initialUsers = [
  { id: 1, name: 'Nguyễn Văn A', email: 'admin@ckf.vn', role: 'admin', phone: '0901234567' },
  { id: 2, name: 'Trần Thị B', email: 'manager1@ckf.vn', role: 'manager', phone: '0912345678' },
  { id: 3, name: 'Lê Văn C', email: 'staff1@ckf.vn', role: 'staff', phone: '0923456789' },
];

export default function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'staff', phone: '' });

  const openAdd = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', role: 'staff', phone: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, phone: user.phone || '' });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...form } : u));
    } else {
      setUsers([...users, { id: Date.now(), ...form }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Bạn có chắc muốn xóa user này?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Quản lý Users</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          <FiPlus /> Thêm User
        </button>
      </div>
      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Role</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id}>
                <td>{idx + 1}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
                <td>
                  <button className="btn-icon" onClick={() => openEdit(user)} title="Sửa">
                    <FiEdit2 />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(user.id)} title="Xóa">
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingUser ? 'Chỉnh sửa User' : 'Thêm User mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Họ tên</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Nhập họ tên"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="email@example.com"
                  disabled={!!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="0901234567"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
