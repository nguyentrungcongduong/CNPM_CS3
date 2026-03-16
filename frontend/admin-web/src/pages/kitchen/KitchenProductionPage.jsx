import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Modal,
  Empty,
  message,
  DatePicker,
  Drawer,
  Descriptions,
} from 'antd';
import {
  FileSearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { getProductionPlans, createProductionPlan, checkIngredients, updateProductionStatus } from '../../api/productionService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function KitchenProductionPage() {
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState(null);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  const fetchPlans = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, per_page: pagination.pageSize };
      if (filterDate) params.date = filterDate;
      const res = await getProductionPlans(params);
      const payload = res.data || res;
      setPlans(payload.data || []);
      setPagination(p => ({ ...p, current: payload.current_page, total: payload.total }));
    } catch (e) {
      console.error(e);
      message.error('Lỗi khi tải danh sách kế hoạch sản xuất');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize, filterDate]);

  useEffect(() => { fetchPlans(1); }, [fetchPlans]);

  const handleCreatePlan = () => {
    if (!filterDate) {
      message.warning('Vui lòng chọn ngày để tạo kế hoạch');
      return;
    }
    
    Modal.confirm({
      title: 'Tạo kế hoạch sản xuất mới?',
      content: `Hệ thống sẽ tổng hợp tự động các mặt hàng cần sản xuất cho ngày ${filterDate}`,
      async onOk() {
        try {
          await createProductionPlan({ plan_date: filterDate });
          message.success('Tạo kế hoạch thành công');
          fetchPlans(1);
        } catch (e) {
          console.error(e);
          message.error(e.response?.data?.message || 'Lỗi khi tạo kế hoạch');
        }
      }
    });
  };

  const openPlanDetail = async (plan) => {
    setSelectedPlan(plan);
    setDrawerOpen(true);
    setLoadingIngredients(true);
    try {
      const res = await checkIngredients(plan.id);
      setIngredients(res.data || []);
    } catch (e) {
      console.error(e);
      message.error('Lỗi tải danh sách nguyên liệu');
    } finally {
      setLoadingIngredients(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateProductionStatus(id, status);
      message.success('Cập nhật trạng thái thành công');
      fetchPlans(pagination.current);
      if (selectedPlan && selectedPlan.id === id) {
        setSelectedPlan(prev => ({...prev, status}));
      }
    } catch (e) {
      message.error('Lỗi cập nhật trạng thái');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'orange';
      case 'IN_PROGRESS': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'IN_PROGRESS': return 'Đang sản xuất';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const columns = [
    {
      title: 'Mã kế hoạch',
      dataIndex: 'plan_code',
      key: 'plan_code',
      render: code => <Tag color="geekblue">{code}</Tag>
    },
    {
      title: 'Ngày sản xuất',
      dataIndex: 'plan_date',
      key: 'plan_date',
      render: date => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
    },
    {
      title: 'Người tạo',
      dataIndex: 'creator',
      key: 'creator',
      render: creator => creator ? creator.full_name : '—'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<FileSearchOutlined />} onClick={() => openPlanDetail(record)}>
            Chi tiết & Nguyên liệu
          </Button>
          {record.status === 'PENDING' && (
            <Button size="small" type="primary" onClick={() => updateStatus(record.id, 'IN_PROGRESS')}>
              Bắt đầu
            </Button>
          )}
          {record.status === 'IN_PROGRESS' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined/>} onClick={() => updateStatus(record.id, 'COMPLETED')}>
              Hoàn thành
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      <Title level={3} style={{ marginBottom: 16 }}>Kế hoạch sản xuất</Title>

      <Card style={{ marginBottom: 16, borderRadius: 10 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <DatePicker 
              placeholder="Chọn ngày sản xuất" 
              onChange={(d, dString) => setFilterDate(dString)}
            />
            <Button onClick={() => fetchPlans(1)} icon={<ReloadOutlined />}>Tải lại</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePlan} title="Tạo tự động cho ngày đã chọn">Tạo Kế hoạch tự động</Button>
        </Space>
      </Card>

      <Card style={{ borderRadius: 10, padding: 0 }} bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={plans}
          loading={loading}
          pagination={{ ...pagination, onChange: page => fetchPlans(page) }}
        />
      </Card>

      {/* Drawer Chi tiết */}
      <Drawer
        title="Chi tiết kế hoạch"
        width={700}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedPlan && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
             <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Mã KH"><Tag color="geekblue">{selectedPlan.plan_code}</Tag></Descriptions.Item>
              <Descriptions.Item label="Trạng thái"><Tag color={getStatusColor(selectedPlan.status)}>{getStatusLabel(selectedPlan.status)}</Tag></Descriptions.Item>
              <Descriptions.Item label="Ngày">{new Date(selectedPlan.plan_date).toLocaleDateString('vi-VN')}</Descriptions.Item>
            </Descriptions>

            <Card title="Danh sách Cần Sản Xuất" size="small">
              <Table 
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={selectedPlan.items || []}
                columns={[
                  { title: 'Tên món', render: (_, r) => r.item ? r.item.name : '—' },
                  { title: 'Số lượng cần', dataIndex: 'planned_quantity', render: (v, r) => `${Number(v).toFixed(2)} ${r.unit}` }
                ]}
              />
            </Card>

            <Card title="Dự trù Nguyên liệu (BOM)" size="small">
               <Table 
                rowKey={(r, i) => i}
                size="small"
                pagination={false}
                loading={loadingIngredients}
                dataSource={ingredients}
                locale={{ emptyText: <Empty description="Không có nguyên liệu hoặc chưa cấu hình BOM" /> }}
                columns={[
                  { title: 'Nguyên liệu', render: (_, r) => r.item ? r.item.name : '—' },
                  { title: 'Số lượng tổng', render: (_, r) => r.item ? `${Number(r.total_quantity).toFixed(3)} ${r.item.unit}` : r.total_quantity }
                ]}
              />
            </Card>
          </Space>
        )}
      </Drawer>
    </>
  );
}
