Hệ thống Central Kitchen and Franchise Store Management System là một nền tảng phần mềm trung tâm giúp đồng bộ toàn bộ hoạt động giữa bếp trung tâm và các cửa hàng franchise: đặt hàng, sản xuất, tồn kho, giao hàng và kiểm soát chất lượng.
Vấn đề chính hiện tại là quy trình vận hành rời rạc (Excel, giấy tờ, nhiều phần mềm khác nhau) gây thiếu đồng bộ dữ liệu, dự báo sai nhu cầu và khó kiểm soát chuỗi cung ứng.

Giải pháp là xây dựng một hệ thống quản lý tập trung theo thời gian thực giúp:

Đồng bộ tồn kho và đơn hàng

Tối ưu kế hoạch sản xuất

Kiểm soát chất lượng và hạn sử dụng

Minh bạch quy trình giao nhận

Cung cấp dashboard quản trị toàn chuỗi

Dưới góc nhìn Business Analyst, hệ thống này có thể được mô tả bằng BRD + Process Model + Use Cases theo framework chuẩn.

1. Business Context
   Business Model

Chuỗi franchise có 3 lớp vận hành chính:

1️⃣ Central Kitchen

Sản xuất

Sơ chế nguyên liệu

Quản lý batch / lot

Kiểm soát chất lượng

2️⃣ Distribution Layer

Tổng hợp nhu cầu từ các cửa hàng

Lập kế hoạch sản xuất

Điều phối giao hàng

3️⃣ Franchise Stores

Đặt nguyên liệu

Quản lý tồn kho

Bán hàng cho khách

👉 Nếu không có hệ thống tập trung → supply chain bị rời rạc.

2. Problem Analysis
   Các vấn đề hiện tại
   Problem Impact
   Thông tin tồn kho không đồng bộ thiếu hoặc dư nguyên liệu
   Dự báo nhu cầu kém sản xuất sai số
   Không kiểm soát hạn sử dụng tăng lãng phí
   Quy trình giao nhận thủ công dễ tranh chấp
   Thiếu dashboard quản trị quản lý không có dữ liệu
   Root Causes

1️⃣ Không có central database

2️⃣ Quy trình order → production → delivery không kết nối

3️⃣ Không có real-time inventory tracking

3. High-Level Solution Architecture
   Core Modules
   Module Description
   Order Management cửa hàng đặt nguyên liệu
   Production Planning lập kế hoạch sản xuất
   Inventory Management tồn kho bếp + cửa hàng
   Distribution Management giao hàng
   Quality & Batch Tracking quản lý lô và hạn sử dụng
   Analytics & Reporting dashboard
4. AS-IS Process (Current Situation)

Theo mô hình Process Modelling Template .

Current Workflow
Step Actor Action Tool
1 Store gửi order Excel / Zalo
2 Coordinator tổng hợp Excel
3 Kitchen sản xuất giấy
4 Warehouse xuất kho manual
5 Delivery giao hàng giấy
6 Store xác nhận call / chat
Bottlenecks

dữ liệu nhập nhiều lần

thiếu tracking đơn hàng

khó kiểm soát inventory

thiếu forecasting

5. TO-BE Process (Future System)
   Digital Workflow
   Step Actor Action System
   1 Store tạo order mobile/web
   2 System tổng hợp nhu cầu auto
   3 Kitchen lập kế hoạch sản xuất production module
   4 Warehouse xuất kho inventory system
   5 Delivery tracking logistics module
   6 Store xác nhận nhận hàng mobile app
   Improvements

real-time data

automatic planning

inventory sync

traceability

6. Key Use Cases

Dựa trên framework Use Case template .

Use Case 1: Create Supply Order

Actor: Franchise Store Staff

Main Flow

User login

Select products

Enter quantity

Submit order

System send to kitchen

Output

Order status:

Pending

Processing

Ready

Delivered

Use Case 2: Production Planning

Actor: Central Kitchen Staff

Flow:

System aggregate store orders

Calculate total demand

Generate production plan

Assign production batches

Use Case 3: Delivery Tracking

Actor: Supply Coordinator

Flow:

Create delivery schedule

Assign driver

Update delivery status

Store confirm receiving

7. Data Model (Core Entities)
   Main Objects
   Entity Description
   Store cửa hàng franchise
   Product nguyên liệu / bán thành phẩm
   Recipe công thức
   Inventory tồn kho
   Order đơn đặt hàng
   Production Batch lô sản xuất
   Delivery giao hàng
8. Key KPIs
   KPI Meaning
   Order Fulfillment Rate % đơn giao đúng
   Production Accuracy sản xuất đúng nhu cầu
   Inventory Turnover vòng quay tồn kho
   Waste Rate tỷ lệ hao hụt
   Delivery On-time Rate giao đúng giờ
9. System Benefits
   Operational

giảm 10–30% waste

giảm manual work

Financial

tối ưu inventory

giảm chi phí logistics

Strategic

dễ mở rộng franchise

kiểm soát chất lượng

10. Suggested System Architecture
    Franchise App
    │
    │
    API Gateway
    │
    ────────────────────────
    Order Service
    Inventory Service
    Production Service
    Delivery Service
    Analytics Service
    ────────────────────────
    Database
