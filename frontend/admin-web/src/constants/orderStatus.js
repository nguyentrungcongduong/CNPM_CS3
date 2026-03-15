/**
 * orderStatus.js
 * Single source of truth for Order Status constants used across the frontend.
 *
 * Full flow:
 * DRAFT → SUBMITTED → CONFIRMED → IN_PRODUCTION → READY → IN_DELIVERY → DELIVERED → COMPLETED
 * Side exits: REJECTED, CANCELLED
 */

export const ORDER_STATUS = {
  DRAFT:         'DRAFT',
  SUBMITTED:     'SUBMITTED',
  CONFIRMED:     'CONFIRMED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  READY:         'READY',
  IN_DELIVERY:   'IN_DELIVERY',
  DELIVERED:     'DELIVERED',
  COMPLETED:     'COMPLETED',
  REJECTED:      'REJECTED',
  CANCELLED:     'CANCELLED',
};

/** Ant Design Tag colors per status */
export const STATUS_COLORS = {
  DRAFT:         'default',
  SUBMITTED:     'gold',
  CONFIRMED:     'blue',
  IN_PRODUCTION: 'purple',
  READY:         'cyan',
  IN_DELIVERY:   'orange',
  DELIVERED:     'lime',
  COMPLETED:     'green',
  REJECTED:      'red',
  CANCELLED:     'volcano',
  // Legacy
  PENDING:       'orange',
  APPROVED:      'blue',
  PROCESSING:    'purple',
};

/** Vietnamese labels per status */
export const STATUS_LABELS = {
  DRAFT:         'Nháp',
  SUBMITTED:     'Chờ xác nhận',
  CONFIRMED:     'Đã xác nhận',
  IN_PRODUCTION: 'Đang sản xuất',
  READY:         'Sẵn sàng',
  IN_DELIVERY:   'Đang giao',
  DELIVERED:     'Đã giao',
  COMPLETED:     'Hoàn thành',
  REJECTED:      'Bị từ chối',
  CANCELLED:     'Đã hủy',
  // Legacy
  PENDING:       'Chờ duyệt',
  APPROVED:      'Đã duyệt',
  PROCESSING:    'Đang xử lý',
};

/**
 * Ordered steps for the progress stepper (happy path only).
 * Used to render an Ant Design Steps component.
 */
export const ORDER_STEPS = [
  { key: ORDER_STATUS.DRAFT,         label: 'Nháp' },
  { key: ORDER_STATUS.SUBMITTED,     label: 'Gửi đơn' },
  { key: ORDER_STATUS.CONFIRMED,     label: 'Xác nhận' },
  { key: ORDER_STATUS.IN_PRODUCTION, label: 'Sản xuất' },
  { key: ORDER_STATUS.READY,         label: 'Sẵn sàng' },
  { key: ORDER_STATUS.IN_DELIVERY,   label: 'Vận chuyển' },
  { key: ORDER_STATUS.DELIVERED,     label: 'Đã giao' },
  { key: ORDER_STATUS.COMPLETED,     label: 'Hoàn thành' },
];

/**
 * Returns the current step index for the stepper (-1 for terminal error statuses).
 */
export function getStepIndex(status) {
  if ([ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED].includes(status)) return -1;
  return ORDER_STEPS.findIndex((s) => s.key === status);
}
