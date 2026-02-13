# 🏢 TENANT_ADMIN Implementation Plan

## Overview

This document outlines the complete implementation plan for TENANT_ADMIN role features, focusing on the three critical priorities:

1. **User Management** (CRITICAL - 2 weeks)
2. **Bid Management** (HIGH - 1 week)
3. **Tenant Settings** (HIGH - 1-2 weeks)

---

## Phase 1: User Management (CRITICAL)

### Backend Status: ✅ READY

The backend already has the necessary APIs:

**Existing Endpoints:**
```
POST   /users/tenant/:tenantId/user          - Create user
POST   /users/tenant/:tenantId/admin         - Create tenant admin
GET    /users/tenant/:tenantId               - Get all tenant users
GET    /users/tenant/:tenantId/role/:role    - Get users by role
GET    /users/check-tenant-role/:role        - Validate role
```

**Missing Endpoints (Need to Add):**
```
PUT    /users/:userId                        - Update user
DELETE /users/:userId                        - Delete user
PATCH  /users/:userId/status                 - Update user status
PATCH  /users/:userId/role                   - Change user role
POST   /users/:userId/reset-password         - Reset password
```

### Frontend Implementation

#### 1. Create User Management Tab

**Location:** `frontend/src/components/TenantDashboard/`

**New Files to Create:**
```
TenantDashboard/
├── UserManagement/
│   ├── UserManagement.tsx          (Main component)
│   ├── UserList.tsx                (User list table)
│   ├── CreateUserModal.tsx         (Create user form)
│   ├── EditUserModal.tsx           (Edit user form)
│   ├── DeleteUserModal.tsx         (Delete confirmation)
│   ├── UserDetailsDrawer.tsx       (User details sidebar)
│   └── UserFilters.tsx             (Filter by role/status)
```

#### 2. User List Component

**Features:**
- Table with columns: Name, Email, Role, Status, Created Date, Actions
- Search by name/email
- Filter by role (CARGO_OWNER, TRUCK_OWNER, DRIVER, AGENT, LENDER, BROKER)
- Filter by status (ACTIVE, INACTIVE, SUSPENDED)
- Pagination
- Sort by any column
- Bulk actions (activate/deactivate multiple users)

**Actions per row:**
- View details
- Edit user
- Change status (activate/deactivate/suspend)
- Reset password
- Delete user

#### 3. Create User Modal

**Form Fields:**
- Email (required, validated)
- First Name (required)
- Last Name (required)
- Phone Number (optional, validated)
- Role (required, dropdown):
  - CARGO_OWNER
  - TRUCK_OWNER
  - DRIVER
  - AGENT
  - LENDER
  - BROKER
- Company Name (optional, shown for CARGO_OWNER, TRUCK_OWNER, BROKER)
- Initial Password (required, with strength indicator)
- Status (default: ACTIVE)

**Validation:**
- Email format
- Phone number format (international)
- Password strength (min 8 chars, uppercase, lowercase, number, special char)
- Required fields

**Success:**
- Show success message
- Refresh user list
- Close modal
- Option to create another user

#### 4. Edit User Modal

**Editable Fields:**
- First Name
- Last Name
- Phone Number
- Company Name
- Role (with confirmation if changing)
- Status

**Non-editable:**
- Email (display only)
- Created Date (display only)

#### 5. User Details Drawer

**Sections:**
- **Basic Info:** Name, email, phone, role, status
- **Company Info:** Company name (if applicable)
- **Account Info:** Created date, last login, email verified
- **Activity:** Recent actions, login history
- **Statistics:** (role-specific)
  - CARGO_OWNER: Total loads, active loads, total spent
  - TRUCK_OWNER: Total trucks, active trucks, total earned
  - DRIVER: Total trips, completed trips, rating

**Actions:**
- Edit user
- Change status
- Reset password
- Delete user

---

## Phase 2: Bid Management (HIGH)

### Backend Status: ⚠️ PARTIAL

**Existing Endpoints:**
```
GET    /bidding/load/:loadId/bids           - Get bids for a load
POST   /bidding/bid                         - Create bid (TRUCK_OWNER)
```

**Missing Endpoints (Need to Add):**
```
GET    /bidding/tenant/:tenantId/bids       - Get all bids in tenant
POST   /bidding/bid/:bidId/accept           - Accept bid (TENANT_ADMIN)
POST   /bidding/bid/:bidId/reject           - Reject bid (TENANT_ADMIN)
GET    /bidding/bid/:bidId                  - Get bid details
```

### Frontend Implementation

#### 1. Add Bid Management to Cargo Tab

**Location:** `frontend/src/components/TenantDashboard/CargoAnalytics.tsx`

**Modifications:**
- Add "Bids" button to each load row
- Click opens bid management drawer

#### 2. Bid Management Drawer

**New File:** `frontend/src/components/TenantDashboard/BidManagement/BidManagementDrawer.tsx`

**Features:**
- Show all bids for selected load
- Bid comparison table
- Accept/reject actions
- Bid history

**Bid List Columns:**
- Truck Owner name
- Truck details (type, capacity)
- Bid amount
- Estimated delivery time
- Truck owner rating
- Status (PENDING, ACCEPTED, REJECTED)
- Actions

**Bid Comparison View:**
- Side-by-side comparison of top 3 bids
- Highlight best price
- Highlight fastest delivery
- Highlight highest rated truck owner
- Recommendation badge

**Actions:**
- Accept bid (with confirmation)
- Reject bid (with optional reason)
- View truck owner profile
- View truck details
- Contact truck owner

#### 3. Bid Notifications

**Feature:** Real-time notifications when new bids arrive

**Implementation:**
- WebSocket connection for real-time updates
- Toast notification when new bid received
- Badge count on Cargo tab
- Sound notification (optional, user preference)

---

## Phase 3: Tenant Settings (HIGH)

### Backend Status: ❌ MISSING

**Need to Create:**
```
GET    /tenants/:tenantId/settings          - Get tenant settings
PUT    /tenants/:tenantId/settings/profile  - Update company profile
PUT    /tenants/:tenantId/settings/billing  - Update billing settings
PUT    /tenants/:tenantId/settings/notifications - Update notification preferences
PUT    /tenants/:tenantId/settings/workflows - Update workflow settings
POST   /tenants/:tenantId/logo              - Upload company logo
```

### Frontend Implementation

#### 1. Settings Page

**Location:** `frontend/src/pages/TenantSettings.tsx`

**Navigation:** Click settings icon in TenantHeader

**Tabs:**
1. Company Profile
2. Billing & Payments
3. Notifications
4. Workflows & Approvals
5. Integrations

#### 2. Company Profile Tab

**Sections:**

**Company Information:**
- Company Name (editable)
- Company Logo (upload)
- Business Type (dropdown)
- Registration Number (editable)
- Tax ID (editable)
- Website (editable)

**Contact Information:**
- Primary Email (editable)
- Primary Phone (editable)
- Support Email (editable)
- Support Phone (editable)

**Address:**
- Street Address (editable)
- City (editable)
- State/Province (editable)
- Postal Code (editable)
- Country (dropdown)

**Actions:**
- Save changes
- Cancel
- Reset to defaults

#### 3. Billing & Payments Tab

**Sections:**

**Billing Information:**
- Billing Email (editable)
- Billing Address (editable)
- Payment Terms (dropdown: Net 15, Net 30, Net 60)

**Payment Methods:**
- List of saved payment methods
- Add new payment method
- Set default payment method
- Remove payment method

**Invoice Preferences:**
- Invoice Frequency (dropdown: Weekly, Monthly, Quarterly)
- Invoice Format (dropdown: PDF, Excel)
- Auto-send invoices (toggle)
- CC recipients (email list)

**Subscription:**
- Current plan (display)
- Billing cycle (display)
- Next billing date (display)
- Upgrade/downgrade plan (button)

#### 4. Notifications Tab

**Sections:**

**Email Notifications:**
- New user registered (toggle)
- New load created (toggle)
- New bid received (toggle)
- Bid accepted/rejected (toggle)
- Trip started/completed (toggle)
- Payment received (toggle)
- Document expiring (toggle)
- System alerts (toggle)

**SMS Notifications:**
- Critical alerts only (toggle)
- All notifications (toggle)
- Phone number for SMS (editable)

**In-App Notifications:**
- Desktop notifications (toggle)
- Sound notifications (toggle)
- Notification frequency (dropdown: Real-time, Hourly digest, Daily digest)

**Notification Recipients:**
- Add email addresses to receive notifications
- Role-based notification routing

#### 5. Workflows & Approvals Tab

**Sections:**

**Approval Workflows:**
- Load approval required (toggle)
- Bid approval required (toggle)
- Payment approval required (toggle)
- User creation approval required (toggle)

**Approval Chain:**
- Define approval hierarchy
- Add approvers
- Set approval thresholds (e.g., loads > $10,000 require approval)

**Automation Rules:**
- Auto-accept bids below threshold (toggle + amount)
- Auto-reject bids above threshold (toggle + amount)
- Auto-assign drivers (toggle + rules)

---

## Implementation Timeline

### Week 1-2: User Management (CRITICAL)

**Week 1:**
- Day 1-2: Backend - Add missing user endpoints (update, delete, status, role, password reset)
- Day 3-4: Frontend - Create UserManagement component structure
- Day 5: Frontend - Implement UserList with search/filter

**Week 2:**
- Day 1-2: Frontend - Create/Edit user modals
- Day 3: Frontend - Delete confirmation and user details drawer
- Day 4: Frontend - API integration and testing
- Day 5: Testing, bug fixes, polish

### Week 3: Bid Management (HIGH)

- Day 1-2: Backend - Add bid management endpoints
- Day 3-4: Frontend - Bid management drawer and comparison view
- Day 5: Real-time notifications, testing

### Week 4-5: Tenant Settings (HIGH)

**Week 4:**
- Day 1-2: Backend - Create tenant settings endpoints
- Day 3-5: Frontend - Company Profile and Billing tabs

**Week 5:**
- Day 1-2: Frontend - Notifications and Workflows tabs
- Day 3-4: API integration and testing
- Day 5: Final testing, bug fixes, documentation

---

## Technical Stack

### Frontend

**UI Components:**
- React Hook Form (form management)
- Yup (validation)
- React Table or TanStack Table (data tables)
- Headless UI or Radix UI (modals, drawers, dropdowns)
- React Hot Toast (notifications)
- React Icons (icons)

**State Management:**
- React Query (data fetching, caching)
- Zustand or Context API (global state)

**File Upload:**
- React Dropzone (drag-and-drop)
- AWS S3 or similar (storage)

### Backend

**Framework:** NestJS (already in use)

**Validation:** class-validator, class-transformer

**File Upload:** multer, @nestjs/platform-express

**Real-time:** Socket.io (already in use)

---

## API Endpoints Summary

### User Management

```typescript
// Create user
POST /users/tenant/:tenantId/user
Body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyName?: string;
  phoneNumber?: string;
}

// Update user
PUT /users/:userId
Body: {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  companyName?: string;
  role?: UserRole;
}

// Delete user
DELETE /users/:userId

// Update user status
PATCH /users/:userId/status
Body: {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// Change user role
PATCH /users/:userId/role
Body: {
  role: UserRole;
}

// Reset password
POST /users/:userId/reset-password
Body: {
  newPassword: string;
}

// Get tenant users
GET /users/tenant/:tenantId
Query: ?role=CARGO_OWNER&status=ACTIVE&search=john&page=1&limit=10

// Get user details
GET /users/:userId
```

### Bid Management

```typescript
// Get all bids in tenant
GET /bidding/tenant/:tenantId/bids
Query: ?status=PENDING&loadId=xxx&page=1&limit=10

// Get bids for load
GET /bidding/load/:loadId/bids

// Get bid details
GET /bidding/bid/:bidId

// Accept bid
POST /bidding/bid/:bidId/accept
Body: {
  notes?: string;
}

// Reject bid
POST /bidding/bid/:bidId/reject
Body: {
  reason?: string;
}
```

### Tenant Settings

```typescript
// Get tenant settings
GET /tenants/:tenantId/settings

// Update company profile
PUT /tenants/:tenantId/settings/profile
Body: {
  companyName?: string;
  businessType?: string;
  registrationNumber?: string;
  taxId?: string;
  website?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

// Upload company logo
POST /tenants/:tenantId/logo
Body: FormData with file

// Update billing settings
PUT /tenants/:tenantId/settings/billing
Body: {
  billingEmail?: string;
  billingAddress?: Address;
  paymentTerms?: string;
  invoiceFrequency?: string;
  invoiceFormat?: string;
  autoSendInvoices?: boolean;
}

// Update notification settings
PUT /tenants/:tenantId/settings/notifications
Body: {
  emailNotifications?: {
    newUser?: boolean;
    newLoad?: boolean;
    newBid?: boolean;
    // ... more
  };
  smsNotifications?: {
    enabled?: boolean;
    phoneNumber?: string;
  };
}

// Update workflow settings
PUT /tenants/:tenantId/settings/workflows
Body: {
  approvalWorkflows?: {
    loadApprovalRequired?: boolean;
    bidApprovalRequired?: boolean;
    // ... more
  };
  automationRules?: {
    autoAcceptBidsBelow?: number;
    autoRejectBidsAbove?: number;
  };
}
```

---

## Testing Checklist

### User Management

- [ ] Create user with all roles
- [ ] Create user with duplicate email (should fail)
- [ ] Update user information
- [ ] Change user role
- [ ] Change user status (activate/deactivate/suspend)
- [ ] Delete user
- [ ] Reset user password
- [ ] Search users by name/email
- [ ] Filter users by role
- [ ] Filter users by status
- [ ] Pagination works correctly
- [ ] Sorting works correctly
- [ ] Bulk actions work

### Bid Management

- [ ] View all bids for a load
- [ ] Accept bid
- [ ] Reject bid
- [ ] Bid comparison view
- [ ] Real-time bid notifications
- [ ] Bid history
- [ ] Filter bids by status

### Tenant Settings

- [ ] Update company profile
- [ ] Upload company logo
- [ ] Update billing settings
- [ ] Add/remove payment methods
- [ ] Update notification preferences
- [ ] Update workflow settings
- [ ] Settings persist after page refresh
- [ ] Validation works correctly

---

## Security Considerations

### Authorization

- Only TENANT_ADMIN can access user management
- Only TENANT_ADMIN can accept/reject bids
- Only TENANT_ADMIN can update tenant settings
- Users can only be managed within their own tenant
- Proper role-based access control (RBAC)

### Validation

- Email format validation
- Phone number validation
- Password strength requirements
- Input sanitization
- SQL injection prevention
- XSS prevention

### Data Protection

- Passwords hashed with bcrypt
- Sensitive data encrypted
- Audit logs for all actions
- Soft deletes (data retention)
- GDPR compliance

---

## Success Criteria

### User Management

- ✅ TENANT_ADMIN can create users with all roles
- ✅ TENANT_ADMIN can edit user information
- ✅ TENANT_ADMIN can delete users
- ✅ TENANT_ADMIN can change user status
- ✅ TENANT_ADMIN can reset passwords
- ✅ Search and filter work correctly
- ✅ All actions are logged
- ✅ UI is responsive and intuitive

### Bid Management

- ✅ TENANT_ADMIN can view all bids
- ✅ TENANT_ADMIN can accept/reject bids
- ✅ Bid comparison helps decision-making
- ✅ Real-time notifications work
- ✅ All actions are logged

### Tenant Settings

- ✅ TENANT_ADMIN can update all settings
- ✅ Settings persist correctly
- ✅ Validation prevents invalid data
- ✅ UI is clear and organized

---

## Next Steps

1. **Review this plan** - Confirm priorities and timeline
2. **Start with User Management** - Highest priority
3. **Backend first** - Add missing endpoints
4. **Frontend next** - Build UI components
5. **Test thoroughly** - Ensure quality
6. **Deploy incrementally** - Phase by phase

---

**Document Version:** 1.0  
**Created:** February 12, 2026  
**Status:** Ready for Implementation
