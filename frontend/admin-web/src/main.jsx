import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import vi_VN from 'antd/locale/vi_VN'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <ConfigProvider locale={vi_VN}>
    <App />
  </ConfigProvider>,
)
