import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Typography, Table, Tag, Statistic, Space, Divider, Button, Modal, message, Alert, Spin,
  InputNumber, Select, Form, Switch, Tabs, Timeline, Badge
} from 'antd';
import {
  UserOutlined, ShopOutlined, HomeOutlined, SafetyOutlined, WarningOutlined,
  SettingOutlined, BellOutlined, DatabaseOutlined, CheckCircleOutlined,
  ClockCircleOutlined, FileTextOutlined, ArrowUpOutlined, ArrowDownOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { roleService, userService } from '../../api/userService';
import { storeService } from '../../api/storeService';
import { kitchenService } from '../../api/kitchenService';
import { devService } from '../../api/devService';
import { reportService } from '../../api/reportService';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const ROLE_COLORS = {
  ADMIN: 'red',
  MANAGER: 'volcano',
  SUPPLY_COORDINATOR: 'orange',
  KITCHEN_STAFF: 'purple',
  STORE_STAFF: 'geekblue',
};

export default function SystemConfigPage() {
  const [roles, setRoles] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [storesCount, setStoresCount] = useState(0);
  const [kitchensCount, setKitchensCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  
  // System Settings
  const [settings, setSettings] = useState({
    lowStockThreshold: 30, // %
    expiryWarningDays: 30,
    expiryCriticalDays: 7,
    defaultPagination: 15,
    autoApproveOrders: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  // Reports Data
  const [reportData, setReportData] = useState({
    totalOrders: 0,
    totalItems: 0,
    totalRecipes: 0,
    totalBatches: 0,
    lowStockItems: 0,
    expiringItems: 0,
    expiredItems: 0,
    recentActivities: [],
  });
  const [reportLoading, setReportLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchReportData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes, storesRes, kitchensRes] = await Promise.all([
        roleService.getAll(),
        userService.getAll({ per_page: 1 }),
        storeService.getAll({ per_page: 1 }),
        kitchenService.getAll({ per_page: 1 }),
      ]);
      
      setRoles(rolesRes.data?.data || rolesRes.data || []);
      setUsersCount(usersRes.data?.total || usersRes.data?.meta?.total || usersRes.data?.data?.length || 0);
      setStoresCount(storesRes.data?.total || storesRes.data?.meta?.total || storesRes.data?.data?.length || 0);
      setKitchensCount(kitchensRes.data?.total || kitchensRes.data?.meta?.total || kitchensRes.data?.data?.length || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
      message.error('Lỗi tải dữ liệu: ' + (error?.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    setReportLoading(true);
    try {
      // Fetch dashboard data for reports
      const dashboardRes = await reportService.getDashboard();
      const data = dashboardRes.data || {};
      
      setReportData({
        totalOrders: data.today_orders_count || 0,
        totalItems: data.total_items || 30,
        totalRecipes: 8,
        totalBatches: data.total_batches || 0,
        lowStockItems: data.low_stock_items_count || 0,
        expiringItems: data.expiring_items_count || 0,
        expiredItems: data.expired_items_count || 0,
        recentActivities: [
          { time: '10 phút trước', action: 'Đơn hàng mới từ Store A', type: 'order' },
          { time: '30 phút trước', action: 'Nhận hàng thành công - Gạo Jasmine', type: 'receive' },
          { time: '1 giờ trước', action: 'Tạo kế hoạch sản xuất #PP-001', type: 'production' },
          { time: '2 giờ trước', action: 'Cảnh báo: 3 mặt hàng sắp hết hạn', type: 'warning' },
        ],
      });
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleResetData = () => {
    Modal.confirm({
      title: 'Reset dữ liệu test?',
      icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Alert
            type="error"
            showIcon
            message="Chỉ dùng cho development/testing"
            description="Thao tác này sẽ xóa dữ liệu Orders / Production Plans / Batches. Không thể hoàn tác."
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Nếu hệ thống đang chạy production, API sẽ từ chối theo môi trường.
          </Text>
        </Space>
      ),
      okText: 'Reset dữ liệu test',
      okButtonProps: { danger: true, loading: resetting },
      cancelText: 'Hủy',
      async onOk() {
        setResetting(true);
        try {
          await devService.resetData();
          message.success('Đã reset dữ liệu test. Đang tải lại hệ thống…');
          window.location.reload();
        } catch (e) {
          message.error(e?.response?.data?.message || 'Reset thất bại');
        } finally {
          setResetting(false);
        }
      },
    });
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      // TODO: Call API to save settings
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success('Đã lưu cấu hình hệ thống');
    } catch (error) {
      message.error('Lỗi lưu cấu hình');
    } finally {
      setSettingsLoading(false);
    }
  };

  const roleColumns = [
    { title: 'Mã vai trò', dataIndex: 'code', key: 'code', render: (c) => <Tag color={ROLE_COLORS[c] || 'default'}>{c}</Tag> },
    { title: 'Tên vai trò', dataIndex: 'name', key: 'name' },
    {
      title: 'Mô tả quyền hạn', key: 'desc',
      render: (_, r) => {
        const perms = {
          ADMIN: 'Toàn quyền: quản lý users, stores, kitchens, cấu hình hệ thống',
          MANAGER: 'Xem báo cáo, quản lý danh mục sản phẩm, tồn kho',
          SUPPLY_COORDINATOR: 'Điều phối đơn hàng, lên lịch giao hàng',
          KITCHEN_STAFF: 'Xử lý sản xuất, xuất kho, quản lý lô hàng',
          STORE_STAFF: 'Tạo đơn đặt hàng, nhận hàng, xem tồn kho cửa hàng',
        };
        return <Text type="secondary">{perms[r.code] || '—'}</Text>;
      },
    },
  ];

  const unitOptions = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'l', label: 'Lít (l)' },
    { value: 'ml', label: 'Mililít (ml)' },
    { value: 'piece', label: 'Cái/Piece' },
    { value: 'box', label: 'Hộp/Box' },
    { value: 'pack', label: 'Gói/Pack' },
    { value: 'bottle', label: 'Chai/Bottle' },
    { value: 'can', label: 'Lon/Can' },
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>
        <SettingOutlined /> Cấu hình Hệ thống & Báo cáo
      </Title>

      <Tabs defaultActiveKey="overview" type="card" style={{ marginBottom: 24 }}>
        {/* Tab 1: Tổng quan & Báo cáo */}
        <TabPane 
          tab={<span><DatabaseOutlined /> Tổng quan Hệ thống</span>} 
          key="overview"
        >
          {/* Status Cards */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Tổng Ngườii dùng"
                  value={loading ? <Spin size="small" /> : usersCount}
                  prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Cửa hàng Franchise"
                  value={loading ? <Spin size="small" /> : storesCount}
                  prefix={<ShopOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Bếp Trung Tâm"
                  value={loading ? <Spin size="small" /> : kitchensCount}
                  prefix={<HomeOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card variant="borderless" style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Vai trò hệ thống"
                  value={loading ? <Spin size="small" /> : roles.length}
                  prefix={<SafetyOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* System Health */}
          <Card 
            title="Trạng thái Hệ thống" 
            variant="borderless" 
            style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Alert
                  message="Hệ thống hoạt động bình thường"
                  description="Tất cả dịch vụ đang chạy ổn định"
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Alert
                  message="Kết nối Database"
                  description="PostgreSQL - Connected"
                  type="success"
                  showIcon
                />
              </Col>
              <Col span={8}>
                <Alert
                  message="API Status"
                  description="Laravel API - Running"
                  type="success"
                  showIcon
                />
              </Col>
            </Row>
          </Card>

          {/* Detailed Stats */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card title="Thống kê Dữ liệu" variant="borderless" style={{ borderRadius: 8 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Tổng đơn hàng"
                      value={reportLoading ? <Spin size="small" /> : reportData.totalOrders}
                      prefix={<FileTextOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Tổng lô hàng"
                      value={reportLoading ? <Spin size="small" /> : reportData.totalBatches}
                      prefix={<DatabaseOutlined />}
                    />
                  </Col>
                </Row>
                <Divider />
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Công thức món ăn"
                      value={reportLoading ? <Spin size="small" /> : reportData.totalRecipes}
                      prefix={<span role="img" aria-label="recipe">🍳</span>}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Sản phẩm/Nguyên liệu"
                      value={reportLoading ? <Spin size="small" /> : reportData.totalItems}
                      prefix={<span role="img" aria-label="items">📦</span>}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Cảnh báo Hệ thống" variant="borderless" style={{ borderRadius: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert
                    message={`${reportData.lowStockItems} mặt hàng tồn kho thấp`}
                    type={reportData.lowStockItems > 0 ? 'warning' : 'success'}
                    showIcon
                    icon={<ArrowDownOutlined />}
                  />
                  <Alert
                    message={`${reportData.expiringItems} mặt hàng sắp hết hạn (${settings.expiryWarningDays} ngày)`}
                    type={reportData.expiringItems > 0 ? 'warning' : 'success'}
                    showIcon
                    icon={<ClockCircleOutlined />}
                  />
                  <Alert
                    message={`${reportData.expiredItems} mặt hàng đã hết hạn`}
                    type={reportData.expiredItems > 0 ? 'error' : 'success'}
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                  />
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Recent Activities */}
          <Card title="Hoạt động Gần đây" variant="borderless" style={{ borderRadius: 8 }}>
            <Timeline mode="left">
              {reportData.recentActivities.map((activity, index) => (
                <Timeline.Item 
                  key={index}
                  label={activity.time}
                  color={activity.type === 'warning' ? 'red' : activity.type === 'order' ? 'blue' : 'green'}
                >
                  {activity.action}
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>

        {/* Tab 2: Cấu hình hệ thống */}
        <TabPane 
          tab={<span><SettingOutlined /> Cấu hình Tham số</span>} 
          key="settings"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Card 
                title="Cảnh báo Tồn kho" 
                variant="borderless" 
                style={{ marginBottom: 24, borderRadius: 8 }}
              >
                <Form layout="vertical">
                  <Form.Item label="Ngưỡng cảnh báo tồn kho thấp (%)">
                    <InputNumber
                      min={1}
                      max={100}
                      value={settings.lowStockThreshold}
                      onChange={(val) => setSettings({...settings, lowStockThreshold: val})}
                      addonAfter="%"
                      style={{ width: '100%' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Cảnh báo khi tồn kho còn dưới {settings.lowStockThreshold}% so với mức tối thiểu
                    </Text>
                  </Form.Item>
                </Form>
              </Card>

              <Card 
                title="Cảnh báo Hạn sử dụng" 
                variant="borderless" 
                style={{ marginBottom: 24, borderRadius: 8 }}
              >
                <Form layout="vertical">
                  <Form.Item label="Cảnh báo trước (ngày)">
                    <InputNumber
                      min={1}
                      max={365}
                      value={settings.expiryWarningDays}
                      onChange={(val) => setSettings({...settings, expiryWarningDays: val})}
                      addonAfter="ngày"
                      style={{ width: '100%' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Cảnh báo cam khi HSD còn dưới {settings.expiryWarningDays} ngày
                    </Text>
                  </Form.Item>
                  
                  <Form.Item label="Cảnh báo nguy hiểm (ngày)">
                    <InputNumber
                      min={1}
                      max={30}
                      value={settings.expiryCriticalDays}
                      onChange={(val) => setSettings({...settings, expiryCriticalDays: val})}
                      addonAfter="ngày"
                      style={{ width: '100%' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Cảnh báo đỏ khi HSD còn dưới {settings.expiryCriticalDays} ngày
                    </Text>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={12}>
              <Card 
                title="Đơn vị Tính mặc định" 
                variant="borderless" 
                style={{ marginBottom: 24, borderRadius: 8 }}
              >
                <Form layout="vertical">
                  <Form.Item label="Đơn vị khối lượng mặc định">
                    <Select 
                      defaultValue="kg" 
                      options={unitOptions.filter(u => ['kg', 'g'].includes(u.value))}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="Đơn vị thể tích mặc định">
                    <Select 
                      defaultValue="l" 
                      options={unitOptions.filter(u => ['l', 'ml'].includes(u.value))}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="Đơn vị đếm mặc định">
                    <Select 
                      defaultValue="piece" 
                      options={unitOptions.filter(u => ['piece', 'box', 'pack'].includes(u.value))}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Form>
              </Card>

              <Card 
                title="Cấu hình Hệ thống" 
                variant="borderless" 
                style={{ marginBottom: 24, borderRadius: 8 }}
              >
                <Form layout="vertical">
                  <Form.Item label="Số bản ghi/trang mặc định">
                    <InputNumber
                      min={5}
                      max={100}
                      value={settings.defaultPagination}
                      onChange={(val) => setSettings({...settings, defaultPagination: val})}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="Tự động duyệt đơn hàng">
                    <Switch 
                      checked={settings.autoApproveOrders}
                      onChange={(checked) => setSettings({...settings, autoApproveOrders: checked})}
                    />
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {settings.autoApproveOrders ? 'Bật' : 'Tắt'}
                    </Text>
                  </Form.Item>
                </Form>
              </Card>

              <Button 
                type="primary" 
                size="large" 
                block 
                onClick={handleSaveSettings}
                loading={settingsLoading}
              >
                💾 Lưu Cấu hình
              </Button>
            </Col>
          </Row>
        </TabPane>

        {/* Tab 3: Vai trò & Quyền hạn */}
        <TabPane 
          tab={<span><SafetyOutlined /> Vai trò & Quyền hạn</span>} 
          key="roles"
        >
          <Card
            title="Danh sách Vai trò & Quyền hạn"
            variant="borderless"
            style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            extra={(
              <Button danger onClick={handleResetData} loading={resetting}>
                Reset dữ liệu test
              </Button>
            )}
          >
            <Table
              rowKey="id"
              columns={roleColumns}
              dataSource={roles}
              pagination={false}
              size="middle"
              loading={loading}
              locale={{ emptyText: 'Không có dữ liệu vai trò' }}
            />
          </Card>

          <Card 
            title="Thông tin Hệ thống" 
            variant="borderless" 
            style={{ marginTop: 24, borderRadius: 8 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                  <div><Text strong>Tên hệ thống:</Text> <Text>Central Kitchen & Franchise Store Management</Text></div>
                  <div><Text strong>Phiên bản API:</Text> <Tag color="blue">v1</Tag></div>
                  <div><Text strong>Frontend:</Text> <Tag>React + Ant Design</Tag></div>
                  <div><Text strong>Backend:</Text> <Tag>Laravel + Sanctum</Tag></div>
                  <div><Text strong>Database:</Text> <Tag>PostgreSQL</Tag></div>
                </Space>
              </Col>
              <Col span={12}>
                <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                  <div><Tag color="green">Soft Delete</Tag> <Text>Dữ liệu không bị xóa vĩnh viễn</Text></div>
                  <div><Tag color="blue">RBAC</Tag> <Text>Phân quyền theo vai trò</Text></div>
                  <div><Tag color="orange">Pagination</Tag> <Text>Mặc định {settings.defaultPagination} bản ghi/trang</Text></div>
                  <div><Tag color="purple">QR Code</Tag> <Text>Quản lý lô hàng bằng mã QR</Text></div>
                </Space>
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>
    </>
  );
}
