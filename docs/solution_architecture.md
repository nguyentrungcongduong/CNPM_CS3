High-Level Architecture (React + Laravel)
graph TD

subgraph Clients
A[Admin / Manager Web - React Desktop]
B[Staff Web - React Mobile-First]
C[Mobile App - React Native]
end

subgraph Backend_Laravel
D[Laravel API + JWT Auth]

subgraph Modules
E[Auth & User Module]
F[Inventory & Batch Module]
G[Order & Production Module]
H[Recipe / BOM Module]
I[Logistics & Notification Module]
end

J[Eloquent ORM]
end

subgraph Database
K[(PostgreSQL)]
L[(Redis Cache - Optional)]
end

A & B & C --> D
D --> E & F & G & H & I
E & F & G & H & I --> J
J --> K
D --> L


2. Tech Stack (Updated)
Layer   Technology  Purpose
Web Admin   React + Ant Design  Dashboard, reports
Staff Web   React + Tailwind + Ant Mobile   Mobile-first operations
Mobile App  React Native    Camera, push notification
Backend Laravel 11 (PHP 8.3)    REST API + Business logic
Authentication  Laravel Sanctum / JWT   Role-based access
Database    PostgreSQL  Transactional data
Cache   Redis   Performance
Queue   Laravel Queue (Redis)   Notifications / async jobs
QR  html5-qrcode / react-native-camera  Scan batch
3. Laravel Modular Structure

Laravel không có module sẵn, nhưng có thể tổ chức theo Domain Modules.

app
 ├ Modules
 │   ├ Auth
 │   │   ├ Controllers
 │   │   ├ Services
 │   │   ├ Models
 │   │
 │   ├ Inventory
 │   │   ├ BatchController
 │   │   ├ InventoryService
 │   │   ├ Models
 │   │
 │   ├ Orders
 │   │   ├ OrderController
 │   │   ├ ProductionService
 │   │
 │   ├ Catalog
 │   │   ├ ItemController
 │   │   ├ RecipeService
 │   │
 │   └ Logistics
 │       ├ DeliveryController
 │       ├ NotificationService
 │
 ├ Models
 ├ Middleware
 └ Policies

Laravel dùng:

Controller → Service → Model (Eloquent)
4. Authentication & RBAC

Laravel hỗ trợ RBAC rất tốt.

Roles
Admin
Manager
SupplyCoordinator
CentralKitchenStaff
StoreStaff
Middleware
Route::middleware(['role:admin'])
Route::middleware(['role:store'])
Route::middleware(['role:kitchen'])

API structure:

/api/admin/*
/api/manager/*
/api/store/*
/api/kitchen/*
5. Database Design (PostgreSQL)

Core tables:

Users & Roles
users
roles
role_user
Catalog
items
recipes
recipe_items
Inventory
warehouses
inventory
batches
inventory_transactions
Orders
orders
order_items
production_plans
Logistics
deliveries
delivery_items
6. QR Code Workflow
Step 1 – Kitchen Production

Kitchen staff:

Complete Production
↓
Create Batch
↓
Generate QR Code

QR content example:

{
 batch: "BATCH_2026_001",
 product: "Sauce",
 exp: "2026-04-01"
}

Laravel API:

POST /api/kitchen/batch/create
Step 2 – Delivery

Coordinator assigns delivery.

batch → delivery manifest
Step 3 – Store Receiving

Store staff scans QR.

React Native:

Camera → scan QR

API call:

POST /api/store/receive-batch
{
 batch_id: "BATCH_2026_001",
 store_id: "STORE_A"
}

Backend logic:

update batch status
increase store inventory
decrease kitchen inventory
log transaction
7. Real-Time Updates

Option 1 (simple):

Polling API

Option 2 (better):

Laravel WebSockets

Kitchen production done
→ broadcast event
→ React dashboard update

Laravel libraries:

Laravel Echo
Pusher / Soketi