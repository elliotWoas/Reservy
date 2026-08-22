# REST API Specification — Reservy

Base URL: `http://localhost:4000`

---

## 1. Public Booking Endpoints (Customer Facing)

### `GET /public/organizations/:slug`
Fetches business public storefront profile, active categories, public services, staff members, and card payment info.

### `GET /public/organizations/:slug/availability`
Calculates and returns available slots.
- **Query Params**:
  - `serviceId` (required)
  - `staffId` (optional)
  - `date` (required, format: `YYYY-MM-DD`)

### `POST /public/organizations/:slug/bookings`
Creates a booking and returns the created booking entity, tracking token, and bank card information.
- **Body**:
  ```json
  {
    "serviceId": "uuid",
    "staffId": "uuid",
    "startAt": "2026-08-25T10:00:00.000Z",
    "customerName": "علی احمدی",
    "customerPhone": "09121234567",
    "customerEmail": "ali@example.com",
    "notes": "توضیحات"
  }
  ```

### `GET /bookings/token/:token`
Fetches booking details by secure access token without requiring login.

### `POST /payments/upload`
Uploads receipt image/PDF via `multipart/form-data` with field name `receipt`. Returns `{ fileUrl, mimeType, size }`.

### `POST /public/payments/proof`
Submits uploaded payment proof for admin review.
- **Body**:
  ```json
  {
    "bookingId": "uuid",
    "fileUrl": "/uploads/uuid.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 245120,
    "amount": 350000
  }
  ```

---

## 2. Authentication & IAM

### `POST /auth/register`
Registers a new owner user and creates an organization and main location.

### `POST /auth/login`
Authenticates with email and password. Returns JWT token, user profile, and memberships.

### `GET /auth/me`
Fetches authenticated user profile and active organization context.

---

## 3. Business Dashboard Endpoints

### Catalog
- `GET /catalog/services`: List services
- `POST /catalog/services`: Create service
- `PATCH /catalog/services/:id`: Update service
- `DELETE /catalog/services/:id`: Delete service
- `GET /catalog/staff`: List staff members
- `POST /catalog/staff`: Create staff member
- `PATCH /catalog/staff/:id`: Update staff member
- `GET /catalog/categories`: List service categories
- `POST /catalog/categories`: Create category

### Availability & Schedule
- `GET /availability/staff/:staffId/schedule`: Get 7-day schedule
- `PUT /availability/staff/:staffId/schedule`: Update weekly shifts & breaks
- `GET /availability/blocked-periods`: List blocked periods
- `POST /availability/blocked-periods`: Create blocked period

### Bookings & Payments
- `GET /bookings`: List bookings (filterable by date, status, staff, search)
- `POST /bookings`: Create manual appointment from dashboard
- `PATCH /bookings/:id/status`: Update booking status (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`)
- `GET /payments`: List payments for review
- `POST /payments/:id/verify`: Approve or reject receipt proof (`APPROVED` or `REJECTED`)

### CRM & Reports
- `GET /crm`: List customer CRM profiles with stats
- `PATCH /crm/:id/notes`: Update customer staff notes
- `GET /reporting/summary`: Real-time dashboard metrics
- `GET /reporting/performance`: Top services and staff reports

### Organization Settings
- `GET /organizations/current`: Get organization settings
- `PATCH /organizations/current`: Update organization profile
- `POST /organizations/card-accounts`: Configure Card-to-Card bank account

---

## 4. Platform Super Admin

- `GET /admin/overview`: Platform-wide metrics and tenant list
- `PATCH /admin/organizations/:id/status`: Activate or suspend an organization
