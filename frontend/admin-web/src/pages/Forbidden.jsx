import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';

const ForbiddenPage = () => (
  <Result
    status="403"
    title="403"
    subTitle="Bạn không có quyền truy cập trang này."
    extra={
      <Button type="primary">
        <Link to="/">Quay về trang chủ</Link>
      </Button>
    }
  />
);

export default ForbiddenPage;
