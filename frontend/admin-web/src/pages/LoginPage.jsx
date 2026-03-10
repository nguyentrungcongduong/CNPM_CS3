import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/login', values);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      message.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error) {
      // Axios interceptor handles error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: '#f0f2f5' 
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1890ff' }}>CNPM ADMIN</Title>
          <Typography.Text type="secondary">Vui lòng đăng nhập để tiếp tục</Typography.Text>
        </div>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Đăng nhập
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Typography.Text type="secondary">Tài khoản mẫu: admin@example.com / 123456</Typography.Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
