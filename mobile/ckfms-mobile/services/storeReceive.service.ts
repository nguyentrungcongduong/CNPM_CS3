import api from './api';

/**
 * Service cho Store nhận hàng từ QR Code
 */
export const storeReceiveService = {
  /**
   * Lấy thông tin batch từ mã QR
   * @param {string} batchCode - Mã lô hàng (batch_code)
   * @returns {Promise<Object>} Thông tin batch
   */
  getBatchInfo: async (batchCode: string) => {
    // Encode batchCode để tránh lỗi với ký tự đặc biệt
    const encoded = encodeURIComponent(batchCode.trim());
    console.log('[API] Fetching batch:', encoded);
    const response = await api.get(`/store/batches/${encoded}`);
    return response.data;
  },

  /**
   * Xác nhận nhận hàng từ batch
   * @param {Object} data - Dữ liệu nhận hàng
   * @param {string} data.batch_code - Mã lô hàng
   * @param {number} data.quantity - Số lượng nhận
   * @param {string} [data.quality_feedback] - Phản hồi chất lượng (optional)
   * @returns {Promise<Object>} Kết quả nhận hàng
   */
  receiveBatch: async (data: {
    batch_code: string;
    quantity: number;
    quality_feedback?: string;
  }) => {
    const response = await api.post('/store/receive-batch', data);
    return response.data;
  },
};
