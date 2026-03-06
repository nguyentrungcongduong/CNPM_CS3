dùng Ant Design (AntD) với phong cách Data-Density (mật độ dữ liệu cao).
Dưới đây là mã nguồn mẫu cho màn hình "Quản lý đơn đặt hàng" (dành cho Store Staff hoặc Coordinator). Giao diện này hội tụ đủ các yếu tố: Sidebar, Breadcrumb, Filter bar, và Table dữ liệu.

1. Cấu trúc Component React (Dùng Ant Design)
   Bạn bảo thành viên làm Frontend cài thư viện: npm install antd @ant-design/icons
   code
   Jsx
   import React, { useState } from 'react';
   import {
   Layout, Menu, Breadcrumb, Table, Tag, Space,
   Button, Input, Select, DatePicker, Card, Statistic, Row, Col
   } from 'antd';
   import {
   ShoppingCartOutlined, PackageOutlined, UserOutlined,
   SearchOutlined, PlusOutlined, FilterOutlined
   } from '@ant-design/icons';

const { Header, Content, Sider } = Layout;
const { RangePicker } = DatePicker;

const OrderManagement = () => {
// 1. Mock Data (Dữ liệu mẫu nhìn thực tế)
const dataSource = [
{
key: '1',
orderCode: 'ORD-20231027-001',
storeName: 'Franchise Quận 1',
orderDate: '2023-10-27 08:30',
totalItems: 12,
status: 'SHIPPING',
priority: 'HIGH',
},
{
key: '2',
orderCode: 'ORD-20231027-042',
storeName: 'Franchise Thủ Đức',
orderDate: '2023-10-27 09:15',
totalItems: 5,
status: 'PENDING',
priority: 'NORMAL',
},
{
key: '3',
orderCode: 'ORD-20231026-115',
storeName: 'Franchise Quận 7',
orderDate: '2023-10-26 14:00',
totalItems: 20,
status: 'COMPLETED',
priority: 'NORMAL',
},
];

// 2. Cấu hình cột (Định nghĩa rõ ràng, dùng Tag cho trạng thái)
const columns = [
{
title: 'Mã đơn hàng',
dataIndex: 'orderCode',
key: 'orderCode',
render: (text) => <a style={{ fontWeight: 'bold' }}>{text}</a>,
},
{
title: 'Cửa hàng',
dataIndex: 'storeName',
key: 'storeName',
},
{
title: 'Ngày đặt',
dataIndex: 'orderDate',
key: 'orderDate',
},
{
title: 'Số lượng món',
dataIndex: 'totalItems',
key: 'totalItems',
align: 'center',
},
{
title: 'Trạng thái',
dataIndex: 'status',
key: 'status',
render: (status) => {
let color = status === 'COMPLETED' ? 'green' : status === 'SHIPPING' ? 'blue' : 'orange';
return <Tag color={color} style={{ borderRadius: 2 }}>{status.toUpperCase()}</Tag>;
},
},
{
title: 'Thao tác',
key: 'action',
render: () => (
<Space size="middle">
<Button type="link" size="small">Chi tiết</Button>
<Button type="link" size="small" danger>Hủy</Button>
</Space>
),
},
];

return (
<Layout style={{ minHeight: '100vh' }}>
{/_ Sidebar - Thanh bên trái màu tối chuẩn Enterprise _/}
<Sider theme="dark" width={240}>

<div style={{ height: 64, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', background: '#002140' }}>
CK MANAGEMENT
</div>
<Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
<Menu.Item key="1" icon={<ShoppingCartOutlined />}>Quản lý đơn hàng</Menu.Item>
<Menu.Item key="2" icon={<PackageOutlined />}>Quản lý kho</Menu.Item>
<Menu.Item key="3" icon={<UserOutlined />}>Nhân sự</Menu.Item>
</Menu>
</Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <Breadcrumb items={[{ title: 'Hệ thống' }, { title: 'Đơn hàng nội bộ' }]} />
           <div><UserOutlined /> Admin</div>
        </Header>

        <Content style={{ margin: '24px' }}>
          {/* Section 1: Thống kê nhanh (KPI Cards) */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card bordered={false} bodyStyle={{ padding: '12px 24px' }}>
                <Statistic title="Đơn chờ duyệt" value={12} valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} bodyStyle={{ padding: '12px 24px' }}>
                <Statistic title="Đang giao" value={5} valueStyle={{ color: '#1890ff' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} bodyStyle={{ padding: '12px 24px' }}>
                <Statistic title="Hoàn tất hôm nay" value={48} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
          </Row>

          {/* Section 2: Bộ lọc & Bảng dữ liệu chính */}
          <Card bordered={false}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Input placeholder="Tìm mã đơn hàng..." prefix={<SearchOutlined />} style={{ width: 200 }} />
                <Select placeholder="Trạng thái" style={{ width: 150 }}>
                  <Select.Option value="pending">Chờ duyệt</Select.Option>
                  <Select.Option value="shipping">Đang giao</Select.Option>
                </Select>
                <RangePicker style={{ width: 250 }} />
                <Button icon={<FilterOutlined />}>Lọc</Button>
              </Space>
              <Button type="primary" icon={<PlusOutlined />}>Tạo đơn mới</Button>
            </div>

            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={{ pageSize: 10 }}
              size="middle" // Làm bảng gọn hơn, chuyên nghiệp hơn
            />
          </Card>
        </Content>
      </Layout>
    </Layout>

);
};

export default OrderManagement;

Sidebar màu tối (Navy/Dark Blue): Đây là màu "quyền lực" của các phần mềm B2B. Nó tạo cảm giác tin cậy và phân cấp rõ ròng.

Sử dụng Table trung tâm: AI hay làm các ô Card vuông vức chiếm chỗ. Hệ thống quản lý thực tế dùng Table để nhân viên nhìn được 20-30 đơn hàng cùng lúc mà không cần cuộn trang nhiều.

Hệ thống Statistic Cards: Đưa các con số quan trọng lên đầu (Đơn chờ, đơn giao) giúp Manager nắm bắt tình hình trong 3 giây.

Breadcrumb & Layout chặt chẽ: Khoảng cách giữa các phần tử (Padding/Margin) vừa phải, không bị thừa thãi.

Tag màu phẳng (Flat Tags): Không bo tròn quá mức, không có bóng đổ (shadow) màu mè.

3. Gợi ý cho nhóm 4 người:
   Người làm Web Admin: Sử dụng mẫu này làm Frame chung (Master Layout). Các trang khác chỉ việc thay nội dung trong phần <Content>.
   Người làm Mobile (React Native): Cũng nên giữ bảng màu Navy và White này. Dùng Card lớn hơn cho Mobile để dễ bấm, nhưng icon và font chữ phải đồng nhất với Web.
