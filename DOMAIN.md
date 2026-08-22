# Domain Model & Lifecycles — Reservy

Reservy models service booking with generic, domain-driven entities decoupled from any single vertical (such as salons, clinics, consultants, gyms, or tutors).

---

## 1. Core Domain Entities

### Organization & Tenancy
- **Tenant**: Top-level account entity for multi-organization companies.
- **Organization**: The business profile (`name`, `slug`, `timezone`, `currency`, `locale`).
- **Location**: Physical branch or virtual venue (`address`, `phone`, `timezone`).
- **User & Membership**: System identity mapped to organizations via roles (`OWNER`, `MANAGER`, `STAFF`, `RECEPTIONIST`).

### Catalog & Staff
- **ServiceCategory**: Grouping of services (`name`, `sortOrder`).
- **Service**: Bookable service item (`durationMinutes`, `price`, `depositAmount`, `bufferBeforeMinutes`, `bufferAfterMinutes`).
- **StaffMember**: Service provider (`displayName`, `bio`, `avatarUrl`, `isBookable`, `isActive`).
- **StaffService**: Many-to-many relationship with optional custom price & duration overrides.
- **Resource**: Rooms, chairs, equipment, or courts (`type`, `capacity`, `isActive`).

### Availability & Scheduling
- **StaffSchedule**: Weekly working shift intervals (`shiftsJson`, `breaksJson`, `isDayOff`).
- **BlockedPeriod**: Time-off, maintenance, or manual blocks (`startAt`, `endAt`, `reason`).

### Booking Domain
- **Customer**: Organization-scoped customer profile (`fullName`, `phone`, `notes`, `metadataJson`).
- **Booking**:
  - `code`: User-facing alphanumeric code (e.g. `BK-8F2K9D`).
  - `accessToken`: Cryptographic token for unauthenticated customer status tracking.
  - Snapshots: `serviceNameSnapshot`, `staffNameSnapshot`, `priceSnapshot`, `durationSnapshot`.
  - Timestamps: `startAt`, `endAt`, `cancelledAt`, `completedAt`.

### Payment & Audit
- **CardAccount**: Organization bank card account details (`cardNumber`, `cardHolderName`, `bankName`).
- **Payment**: Monetary transaction record (`method`, `amount`, `status`, `referenceNumber`).
- **PaymentProof**: Customer receipt upload (`fileUrl`, `mimeType`, `fileSize`, `reviewStatus`, `rejectionReason`).
- **AuditLog**: Immutable historical audit trail for sensitive administrative operations.

---

## 2. Booking State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT
    PENDING_PAYMENT --> PAYMENT_SUBMITTED : Receipt Uploaded
    PENDING_PAYMENT --> PAYMENT_REVIEW : Under Review
    PENDING_PAYMENT --> CONFIRMED : Manual Confirmation
    PENDING_PAYMENT --> CANCELLED : Customer / Admin Cancel
    PENDING_PAYMENT --> REJECTED : Booking Rejected

    PAYMENT_SUBMITTED --> PAYMENT_REVIEW
    PAYMENT_SUBMITTED --> CONFIRMED : Admin Approves Receipt
    PAYMENT_SUBMITTED --> REJECTED : Admin Rejects Receipt
    PAYMENT_SUBMITTED --> CANCELLED

    CONFIRMED --> IN_PROGRESS : Appointment Starts
    CONFIRMED --> COMPLETED : Service Finished
    CONFIRMED --> NO_SHOW : Customer Did Not Arrive
    CONFIRMED --> CANCELLED : Cancelled

    IN_PROGRESS --> COMPLETED
    IN_PROGRESS --> NO_SHOW

    REJECTED --> PENDING_PAYMENT : Re-upload Receipt
    REJECTED --> CANCELLED

    COMPLETED --> [*]
    CANCELLED --> [*]
    NO_SHOW --> [*]
```

---

## 3. Payment State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> PROOF_SUBMITTED : File Uploaded
    PROOF_SUBMITTED --> UNDER_REVIEW
    PROOF_SUBMITTED --> VERIFIED : Admin Approves
    PROOF_SUBMITTED --> REJECTED : Admin Rejects
    UNDER_REVIEW --> VERIFIED
    UNDER_REVIEW --> REJECTED
    REJECTED --> PROOF_SUBMITTED : Customer Resubmits
    VERIFIED --> REFUNDED : Refund Processed
    REFUNDED --> [*]
```

---

## 4. Money & Currency Architecture
- Money is stored strictly as integer values in smallest units (Tomans/Rials). Floating-point variables are prohibited for currency calculation.
- Display formatting (`formatToman`) is isolated to the presentation layer.
