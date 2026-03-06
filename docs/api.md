Thiết kế API là khâu cực kỳ quan trọng để Frontend (React/React Native) và Backend (Spring Boot) "hiểu nhau". Với một hệ thống quản lý (ERP/SCM), API cần được thiết kế theo chuẩn RESTful, rõ ràng và bảo mật.

Dưới đây là bản thiết kế API phân theo từng Module nghiệp vụ:

1. Cấu trúc Response chung (Best Practice)

Để team dễ xử lý, tất cả API nên trả về một cấu trúc đồng nhất:

code
JSON
download
content_copy
expand_less
{
"success": true,
"message": "Thao tác thành công",
"data": { ... }, // Dữ liệu trả về
"timestamp": "2023-10-27T10:00:00"
} 2. Chi tiết các Endpoint API (v1)
A. Module Xác thực (Authentication)

POST /api/v1/auth/login: Đăng nhập, trả về JWT Token và thông tin Role.

POST /api/v1/auth/logout: Đăng xuất (hủy token).

GET /api/v1/users/me: Lấy thông tin người dùng đang đăng nhập.

B. Module Danh mục & Công thức (Catalog & BOM) - Role: Admin/Manager

GET /api/v1/items: Lấy danh sách nguyên liệu & sản phẩm (có phân trang, filter).

POST /api/v1/items: Tạo mới nguyên liệu/sản phẩm.

GET /api/v1/items/{id}/bom: Xem công thức chế biến của sản phẩm đó.

PUT /api/v1/items/{id}/bom: Cập nhật định mức nguyên liệu.

C. Module Đơn hàng nội bộ (Ordering) - Role: Store/Coordinator

POST /api/v1/orders: Store Staff tạo đơn đặt hàng mới gửi về Bếp.

GET /api/v1/orders: Coordinator xem danh sách đơn hàng từ tất cả store.

GET /api/v1/orders/store/{storeId}: Store Staff xem lịch sử đơn hàng của riêng mình.

PATCH /api/v1/orders/{id}/status: Cập nhật trạng thái đơn (Duyệt, Đang nấu, Đang giao).

D. Module Sản xuất & Lô hàng (Production & Batch) - Role: CK Staff

POST /api/v1/production/complete: Bếp xác nhận nấu xong.

Input: orderId, quantity.

Output: Trả về thông tin Batch (Mã QR) để in tem.

GET /api/v1/batches/{batchCode}: Quét mã QR để xem thông tin lô hàng (Tên hàng, HSD, xuất xứ).

E. Module Tồn kho & Giao nhận (Inventory) - Role: CK/Store Staff

GET /api/v1/inventory/stocks: Xem tồn kho hiện tại (tùy theo warehouse của user).

POST /api/v1/inventory/receive: (Cực quan trọng) Nhận hàng bằng cách quét mã QR.

Body: { "batchCode": "BATCH123", "storeId": "STORE_01" }.

Logic: Hệ thống tự động cộng kho Store và trừ kho Bếp.

POST /api/v1/inventory/check: Lưu biên bản kiểm kê kho định kỳ.

F. Module Báo cáo (Reporting) - Role: Manager/Admin

GET /api/v1/reports/kpi-summary: Trả về các con số cho Card thống kê (Đơn mới, Doanh thu, Hao hụt).

GET /api/v1/reports/stock-fluctuation: Trả về dữ liệu biểu đồ biến động kho.

3. Ví dụ luồng gọi API (Sequence) cho tính năng "Nhận hàng"

Để demo tính năng quét QR, trình tự gọi API sẽ như sau:

Mobile App: Gọi GET /api/v1/batches/{batchCode} để kiểm tra thông tin lô hàng xem có đúng món mình đặt không.

Mobile App: Hiển thị thông tin lên màn hình cho nhân viên xác nhận.

Mobile App: Gọi POST /api/v1/inventory/receive để chốt nhập kho.

Backend: Xử lý Transaction (Update 2 bảng kho) -> Trả về success: true.

4. Một số lưu ý kỹ thuật cho Team:

Phân quyền (RBAC): Backend phải check quyền cho từng Endpoint. Ví dụ: Nhân viên Store không được phép gọi API POST /api/v1/items (tạo sản phẩm).

Validation: Tất cả API POST/PUT phải có validation dữ liệu (không được để trống số lượng, ngày tháng phải đúng định dạng).

Soft Delete: Không nên xóa cứng dữ liệu khỏi DB. Hãy dùng một cột is_deleted để ẩn dữ liệu đi, nhằm phục vụ việc truy xuất báo cáo lịch sử sau này.

Versioning: Luôn bắt đầu bằng /api/v1/ để sau này có nâng cấp hệ thống lên bản v2 thì các App cũ vẫn chạy được.
