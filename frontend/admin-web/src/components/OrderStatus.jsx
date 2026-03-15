import React from 'react';
import { Tag, Steps, Tooltip } from 'antd';
import {
  EditOutlined,
  SendOutlined,
  CheckCircleOutlined,
  FireOutlined,
  CheckSquareOutlined,
  CarOutlined,
  InboxOutlined,
  TrophyOutlined,
  CloseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { STATUS_COLORS, STATUS_LABELS, ORDER_STEPS, getStepIndex, ORDER_STATUS } from '../constants/orderStatus';

// -----------------------------------------------------------------------
// OrderStatusBadge – renders an Ant Design Tag for a given status
// -----------------------------------------------------------------------
export function OrderStatusBadge({ status, style }) {
  const color = STATUS_COLORS[status] || 'default';
  const label = STATUS_LABELS[status] || status;
  return (
    <Tag color={color} style={{ fontWeight: 600, letterSpacing: '0.02em', ...style }}>
      {label}
    </Tag>
  );
}

// -----------------------------------------------------------------------
// Status icon map
// -----------------------------------------------------------------------
const STATUS_ICONS = {
  DRAFT:         <EditOutlined />,
  SUBMITTED:     <SendOutlined />,
  CONFIRMED:     <CheckCircleOutlined />,
  IN_PRODUCTION: <FireOutlined />,
  READY:         <CheckSquareOutlined />,
  IN_DELIVERY:   <CarOutlined />,
  DELIVERED:     <InboxOutlined />,
  COMPLETED:     <TrophyOutlined />,
  REJECTED:      <CloseCircleOutlined />,
  CANCELLED:     <StopOutlined />,
};

// -----------------------------------------------------------------------
// OrderStatusSteps – renders a Steps progress indicator
// Shows the happy-path steps; marks rejected/cancelled with error state.
// -----------------------------------------------------------------------
export function OrderStatusSteps({ status, size = 'small', direction = 'horizontal' }) {
  const stepIndex = getStepIndex(status);
  const isError = [ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED].includes(status);

  const items = ORDER_STEPS.map((step, idx) => {
    let stepStatus = 'wait';
    if (isError && idx === stepIndex) {
      stepStatus = 'error';
    } else if (idx < stepIndex) {
      stepStatus = 'finish';
    } else if (idx === stepIndex) {
      stepStatus = 'process';
    }

    return {
      key:    step.key,
      title:  step.label,
      icon:   STATUS_ICONS[step.key],
      status: stepStatus,
    };
  });

  // If rejected/cancelled, show a separate error tag after the stepper
  return (
    <div>
      {isError && (
        <div style={{ marginBottom: 8 }}>
          <OrderStatusBadge status={status} />
        </div>
      )}
      <Steps
        size={size}
        direction={direction}
        current={isError ? -1 : stepIndex}
        status={isError ? 'error' : 'process'}
        items={items}
        style={{ overflowX: 'auto' }}
      />
    </div>
  );
}
