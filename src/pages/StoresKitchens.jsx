import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPackage } from 'react-icons/fi';

const initialStores = [
  { id: 1, name: 'Cửa hàng Q1', type: 'store', address: '123 Nguyễn Huệ, Q1, HCM', status: 'active' },
  { id: 2, name: 'Cửa hàng Q7', type: 'store', address: '456 Nguyễn Lương Bằng, Q7, HCM', status: 'active' },
];

const initialKitchens = [
  { id: 1, name: 'Bếp Trung Tâm 1', address: '789 Trường Chinh, Tân Bình, HCM', capacity: 500 },
  { id: 2, name: 'Bếp Trung Tâm 2', address: '321 Võ Văn Ngân, Thủ Đức, HCM', capacity: 300 },
];

export default function StoresKitchens() {
  const [activeTab, setActiveTab] = useState('stores');
  const [stores, setStores] = useState(initialStores);
  const [kitchens, setKitchens] = useState(initialKitchens);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [storeForm, setStoreForm] = useState({ name: '', address: '', status: 'active' });
  const [kitchenForm, setKitchenForm] = useState({ name: '', address: '', capacity: 200 });

  const openAddStore = () => {
    setEditItem(null);
    setStoreForm({ name: '', address: '', status: 'active' });
    setShowModal(true);
  };

  const openEditStore = (s) => {
    setEditItem({ ...s, _type: 'store' });
    setStoreForm({ name: s.name, address: s.address, status: s.status });
    setShowModal(true);
  };

  const openAddKitchen = () => {
    setEditItem(null);
    setKitchenForm({ name: '', address: '', capacity: 200 });
    setShowModal(true);
  };

  const openEditKitchen = (k) => {
    setEditItem({ ...k, _type: 'kitchen' });
    setKitchenForm({ name: k.name, address: k.address, capacity: k.capacity });
    setShowModal(true);
  };

  const handleSubmitStore = (e) => {
    e.preventDefault();
    if (editItem?._type === 'store') {
      setStores(stores.map(s => s.id === editItem.id ? { ...s, ...storeForm } : s));
    } else {
      setStores([...stores, { id: Date.now(), type: 'store', ...storeForm }]);
    }
    setShowModal(false);
  };

  const handleSubmitKitchen = (e) => {
    e.preventDefault();
    if (editItem?._type === 'kitchen') {
      setKitchens(kitchens.map(k => k.id === editItem.id ? { ...k, ...kitchenForm } : k));
    } else {
      setKitchens([...kitchens, { id: Date.now(), ...kitchenForm }]);
    }
    setShowModal(false);
  };

  const deleteStore = (id) => {
    if (confirm('Xóa cửa hàng?')) setStores(stores.filter(s => s.id !== id));
  };

  const deleteKitchen = (id) => {
    if (confirm('Xóa bếp?')) setKitchens(kitchens.filter(k => k.id !== id));
  };

  return (
    <div className="page">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'stores' ? 'active' : ''}`}
          onClick={() => setActiveTab('stores')}
        >
          <FiMapPin /> Cửa hàng
        </button>
        <button
          className={`tab ${activeTab === 'kitchens' ? 'active' : ''}`}
          onClick={() => setActiveTab('kitchens')}
        >
          <FiPackage /> Bếp trung tâm
        </button>
      </div>

      {activeTab === 'stores' && (
        <>
          <div className="page-header">
            <h2>Cửa hàng Franchise</h2>
            <button className="btn btn-primary" onClick={openAddStore}>
              <FiPlus /> Thêm cửa hàng
            </button>
          </div>
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên</th>
                  <th>Địa chỉ</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>{s.name}</td>
                    <td>{s.address}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                    <td>
                      <button className="btn-icon" onClick={() => openEditStore(s)}><FiEdit2 /></button>
                      <button className="btn-icon danger" onClick={() => deleteStore(s.id)}><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'kitchens' && (
        <>
          <div className="page-header">
            <h2>Bếp trung tâm</h2>
            <button className="btn btn-primary" onClick={openAddKitchen}>
              <FiPlus /> Thêm bếp
            </button>
          </div>
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên</th>
                  <th>Địa chỉ</th>
                  <th>Sức chứa</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {kitchens.map((k, i) => (
                  <tr key={k.id}>
                    <td>{i + 1}</td>
                    <td>{k.name}</td>
                    <td>{k.address}</td>
                    <td>{k.capacity} suất/ngày</td>
                    <td>
                      <button className="btn-icon" onClick={() => openEditKitchen(k)}><FiEdit2 /></button>
                      <button className="btn-icon danger" onClick={() => deleteKitchen(k.id)}><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (editItem?._type === 'kitchen' || (!editItem && activeTab === 'kitchens') ? (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editItem ? 'Sửa bếp' : 'Thêm bếp mới'}</h3>
            <form onSubmit={handleSubmitKitchen}>
              <div className="form-group">
                <label>Tên bếp</label>
                <input value={kitchenForm.name} onChange={e => setKitchenForm({ ...kitchenForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input value={kitchenForm.address} onChange={e => setKitchenForm({ ...kitchenForm, address: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Sức chứa (suất/ngày)</label>
                <input type="number" min="1" value={kitchenForm.capacity} onChange={e => setKitchenForm({ ...kitchenForm, capacity: +e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editItem ? 'Sửa cửa hàng' : 'Thêm cửa hàng mới'}</h3>
            <form onSubmit={handleSubmitStore}>
              <div className="form-group">
                <label>Tên cửa hàng</label>
                <input value={storeForm.name} onChange={e => setStoreForm({ ...storeForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input value={storeForm.address} onChange={e => setStoreForm({ ...storeForm, address: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select value={storeForm.status} onChange={e => setStoreForm({ ...storeForm, status: e.target.value })}>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm ngưng</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
