import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import StoresKitchens from './pages/StoresKitchens';
import SystemConfig from './pages/SystemConfig';
import './components/layout/layout.css';
import './pages/pages.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="stores-kitchens" element={<StoresKitchens />} />
          <Route path="system-config" element={<SystemConfig />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
