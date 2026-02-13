# 📚 UrutiX Platform - Complete User Manual

**Version:** 2.0  
**Last Updated:** February 13, 2026  
**Platform:** UrutiX Logistics Management System

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [System Architecture](#system-architecture)
3. [User Roles & Responsibilities](#user-roles--responsibilities)
4. [Detailed Role Workflows](#detailed-role-workflows)
5. [Feature Modules](#feature-modules)
6. [User Credentials](#user-credentials)
7. [Common Workflows](#common-workflows)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 🌐 Platform Overview

### What is UrutiX?

UrutiX is a comprehensive multi-tenant logistics management platform that connects:
- **Cargo Owners** (businesses needing transportation)
- **Truck Owners** (transportation providers)
- **Drivers** (service executors)
- **Brokers** (facilitators and matchmakers)
- **Administrators** (platform and tenant managers)

### Key Features
- Multi-tenant architecture with complete data isolation
- Real-time load tracking and management
- Bidding and auction system
- Fleet management
- Financial management and billing
- Document management
- Analytics and reporting
- Mobile-friendly driver interface

---

## 🏗️ System Architecture

### Multi-Tenancy Model

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATFORM LEVEL                            │
│                   (SUPER_ADMIN)                              │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────────────┐      ┌────────────┐      ┌────────────┐
   │  Tenant A  │      │  Tenant B  │      │  Tenant C  │
   │ (Company 1)│      │ (Company 2)│      │ (Company 3)│
   └────────────┘      └────────────┘      └────────────┘
        │                   │                   │
   ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
   │ TENANT  │         │ TENANT  │         │ TENANT  │
   │  ADMIN  │         │  ADMIN  │         │  ADMIN  │
   └─────────┘         └─────────┘         └─────────┘
        │                   │                   │
   ┌────┴────────────┐      │              ┌────┴────────────┐
   │                 │      │              │                 │
┌──────┐  ┌────────┐ │  ┌──────┐       ┌──────┐  ┌────────┐
│CARGO │  │TRUCK   │ │  │CARGO │       │CARGO │  │TRUCK   │
│OWNER │  │OWNER   │ │  │OWNER │       │OWNER │  │OWNER   │
└──────┘  └────────┘ │  └──────┘       └──────┘  └────────┘
             │       │                              │
          ┌──┴──┐    │                           ┌──┴──┐
          │DRIVER│   │                           │DRIVER│
          └─────┘    │                           └─────┘
                     │
                  ┌──┴──┐
                  │BROKER│
                  └─────┘
```

### Data Isolation
- Each tenant has completely isolated data
- Users can only access data within their tenant
- SUPER_ADMIN can access all tenants for platform management
- Row-level security ensures data privacy

---

## 👥 User Roles & Responsibilities

### Role Hierarchy

```
SUPER_ADMIN (Platform Level)
    ↓
TENANT_ADMIN (Organization Level)
    ↓
┌─────────────┬──────────────┬──────────────┐
│             │              │              │
CARGO_OWNER   TRUCK_OWNER    BROKER         AGENT/LENDER
              │
              ↓
            DRIVER
```

---

## 1️⃣ SUPER_ADMIN (Platform Administrator)

### 👑 Role Overview
The highest level of system access responsible for platform-wide management and configuration.

### 🔑 Credentials
- **Email:** `urutixv@gmail.com`
- **Password:** `Admin123@`
- **Tenant:** Admin Global
- **Access Level:** All tenants and system-wide features

### 📊 Responsibilities

#### Primary Responsibilities:
1. **Tenant Management**
   - Create new tenant organizations
   - Configure tenant settings and limits
   - Suspend or deactivate tenants
   - Monitor tenant usage and performance
   - Manage tenant subscriptions

2. **Platform Configuration**
   - System-wide settings and parameters
   - Feature flags and module enablement
   - Platform updates and maintenance
   - Security configurations
   - API rate limits and quotas

3. **User Management (Cross-Tenant)**
   - Create users in any tenant
   - Reset passwords for any user
   - Manage user roles and permissions
   - Handle account issues and disputes
   - Monitor user activities

4. **System Monitoring**
   - Platform health and performance
   - Database optimization
   - Server resource usage
   - Error logs and debugging
   - Security audit logs

5. **Data Management**
   - System-wide backups
   - Data migration and imports
   - Database maintenance
   - Archive old data
   - Generate platform-wide reports

### ✅ Capabilities

**Can Do:**
- ✅ Access all tenants and their data
- ✅ Create, update, delete tenants
- ✅ Manage all users across all tenants
- ✅ Configure system-wide settings
- ✅ View all loads, trucks, and trips
- ✅ Generate cross-tenant reports
- ✅ Access audit logs
- ✅ Manage platform features
- ✅ Handle escalated support issues
- ✅ Perform system maintenance

**Cannot Do:**
- ❌ Should not handle day-to-day business operations
- ❌ Should not create loads or bids (use tenant accounts)
- ❌ Should not interfere with tenant business unless necessary

### 📱 Dashboard Features

1. **Platform Overview**
   - Total tenants count
   - Active users across platform
   - System health metrics
   - Revenue statistics

2. **Tenant Management**
   - List all tenants
   - Tenant status monitoring
   - Usage statistics per tenant
   - Subscription management

3. **System Analytics**
   - Platform-wide performance
   - User growth trends
   - Revenue trends
   - Feature usage statistics

4. **Support & Maintenance**
   - Support ticket management
   - System logs viewer
   - Maintenance scheduler
   - Backup management

### 🔄 Common Workflows

#### Workflow 1: Onboard New Company
```
1. Login as SUPER_ADMIN
2. Navigate to Tenant Management
3. Click "Create New Tenant"
4. Fill in company details:
   - Company name
   - Contact information
   - Tenant type (ENTERPRISE, SMALL_BUSINESS, etc.)
   - Subscription plan
   - Usage limits
5. Create TENANT_ADMIN user for the company
6. Send welcome email with credentials
7. Monitor initial setup
```

#### Workflow 2: Handle Escalated Issue
```
1. Receive escalation from tenant admin
2. Review issue details and logs
3. Access affected tenant's data
4. Investigate root cause
5. Apply fix or configuration change
6. Verify resolution
7. Document issue and solution
8. Notify tenant admin
```

#### Workflow 3: System Maintenance
```
1. Schedule maintenance window
2. Notify all tenants
3. Create system backup
4. Perform updates/maintenance
5. Run system health checks
6. Verify all services operational
7. Monitor for issues
8. Send completion notification
```

### ⚠️ Best Practices

**Do:**
- ✅ Use SUPER_ADMIN only for platform tasks
- ✅ Create separate tenant accounts for testing
- ✅ Regularly review audit logs
- ✅ Monitor system performance
- ✅ Keep security patches updated
- ✅ Document all major changes
- ✅ Maintain regular backups

**Don't:**
- ❌ Use SUPER_ADMIN for daily operations
- ❌ Share SUPER_ADMIN credentials
- ❌ Make changes without documentation
- ❌ Access tenant data without reason
- ❌ Bypass security protocols

---

## 2️⃣ TENANT_ADMIN (Organization Administrator)

### 🏢 Role Overview
Administrator for a specific tenant organization, managing all users and operations within their company.

### 🔑 Credentials
- **Email:** `tenant.admin@test.com`
- **Password:** `Admin123@`
- **Tenant:** Uruti-X Default
- **Access Level:** Full access within their tenant only

### 📊 Responsibilities

#### Primary Responsibilities:
1. **User Management**
   - Create and manage CARGO_OWNER users
   - Create and manage TRUCK_OWNER users
   - Assign roles and permissions
   - Deactivate or suspend users
   - Reset user passwords
   - Monitor user activities

2. **Business Operations Oversight**
   - Monitor all loads in the tenant
   - Oversee fleet operations
   - Review and approve bids
   - Track financial performance
   - Manage company settings
   - Configure workflows

3. **Fleet Management**
   - View all trucks in the tenant
   - Monitor truck status and utilization
   - Review maintenance schedules
   - Track driver assignments
   - Analyze fleet performance

4. **Cargo Management**
   - View all cargo owners and their loads
   - Monitor load statuses
   - Track delivery performance
   - Review cargo owner ratings
   - Analyze cargo trends

5. **Financial Management**
   - View tenant-wide financial reports
   - Manage invoices and payments
   - Monitor subscription and billing
   - Track revenue and expenses
   - Generate financial reports

6. **Bid Management**
   - View all bids in the tenant
   - Accept or reject bids on behalf of cargo owners
   - Monitor bidding activity
   - Track bid success rates
   - Analyze pricing trends

### ✅ Capabilities

**Can Do:**
- ✅ Create CARGO_OWNER and TRUCK_OWNER users
- ✅ View all data within their tenant
- ✅ Manage company profile and settings
- ✅ Accept/reject bids
- ✅ View all loads, trucks, and trips
- ✅ Generate tenant-wide reports
- ✅ Configure tenant workflows
- ✅ Manage billing and subscriptions
- ✅ Access analytics dashboard
- ✅ Export data and reports

**Cannot Do:**
- ❌ Access other tenants' data
- ❌ Create DRIVER users (TRUCK_OWNER creates drivers)
- ❌ Create BROKER, AGENT, or LENDER users
- ❌ Modify system-wide settings
- ❌ Access platform administration features

### 📱 Dashboard Features

#### 1. Overview Tab
- **Quick Stats Cards**
  - Total revenue
  - Total shipments
  - Active fleet count
  - On-time delivery percentage
  - Customer satisfaction score
  - Fleet utilization rate

- **Charts & Graphs**
  - Weekly revenue trends
  - Fleet utilization over time
  - Performance metrics bar chart
  - Shipment volume trends

- **Recent Activity Feed**
  - Latest shipments
  - Maintenance alerts
  - Payment notifications
  - Dispute updates

#### 2. Users Tab
- **User Management**
  - List all users in tenant
  - Create new users (CARGO_OWNER, TRUCK_OWNER)
  - Edit user profiles
  - Deactivate/suspend users
  - Reset passwords
  - View user activity logs

- **User Statistics**
  - Total users by role
  - Active vs inactive users
  - User growth trends
  - Login activity

#### 3. Bids Tab
- **Bid Overview**
  - Total bids count
  - Pending bids
  - Accepted bids
  - Rejected bids

- **Bid Management**
  - View all bids
  - Filter by status (Pending, Accepted, Rejected)
  - Search by load or truck owner
  - Accept bids (creates trip automatically)
  - Reject bids with reason
  - View bid details

- **Bid Actions**
  - Accept: Changes bid to ACCEPTED, assigns truck, creates trip
  - Reject: Changes bid to REJECTED, notifies truck owner
  - View: Opens detailed bid information drawer

#### 4. Billing Tab
- **Subscription Management**
  - Current plan details
  - Usage limits and progress
  - Available plans comparison
  - Upgrade/downgrade options
  - Next billing date

- **Invoice Management**
  - Create, edit, delete invoices
  - Send invoices to customers
  - Download invoices as PDF
  - Track invoice status (Draft, Sent, Paid, Overdue)
  - Search and filter invoices

- **Payment Management**
  - Record payments
  - View payment history
  - Process refunds
  - Track payment methods
  - Monitor payment status

- **Tax Reports**
  - Generate tax reports
  - View revenue, expenses, taxable income
  - Export reports (PDF, Excel, CSV)
  - Track filing status

#### 5. Fleet Tab
- **Fleet Overview**
  - Total trucks count
  - Active trucks
  - Maintenance due
  - Average utilization
  - Fuel consumption metrics

- **Truck Management**
  - View all trucks in tenant
  - Filter by status (Active, Maintenance, Inactive)
  - Search by truck number or owner
  - View truck details
  - Monitor truck locations
  - Track maintenance schedules

- **Driver Management**
  - View all drivers
  - See driver assignments
  - Track driver performance
  - Monitor driver availability

#### 6. Cargo Tab
- **Two-View System**
  
  **Cargo Owners View:**
  - List all cargo owners
  - View owner statistics (loads, revenue, rating)
  - Filter by status (Active, Suspended, Deactivated)
  - Search by name, email, or company
  - Click owner to view their loads

  **All Loads View:**
  - View all loads or specific owner's loads
  - Filter by load type:
    - All Loads
    - Our Cargo (loads created by tenant's cargo owners)
    - Our Fleet (loads assigned to tenant's trucks)
  - Filter by status (Draft, Published, Assigned, In Transit, Delivered)
  - Search by load number, cargo type, or addresses
  - View load details with badges:
    - 📦 "Our Cargo" (blue badge)
    - 🚛 "Our Fleet" (green badge)

- **Cargo Statistics**
  - Total loads
  - Completed loads
  - Total revenue
  - Total cargo owners

#### 7. Financial Tab
- **Revenue Metrics**
  - Total revenue
  - Monthly revenue trends
  - Revenue by cargo owner
  - Revenue by truck owner
  - Payment status breakdown

- **Expense Tracking**
  - Fuel costs
  - Maintenance costs
  - Driver payments
  - Platform fees
  - Other expenses

- **Profitability Analysis**
  - Gross profit
  - Net profit
  - Profit margins
  - Cost per mile
  - Revenue per truck

#### 8. Operations Tab
- **Performance Metrics**
  - On-time delivery rate
  - Average transit time
  - Damage rate
  - Customer complaints
  - Driver safety score
  - Route efficiency

- **Operational Insights**
  - Popular routes
  - Peak shipping times
  - Capacity utilization
  - Bottleneck identification
  - Efficiency recommendations

### 🔄 Common Workflows

#### Workflow 1: Create New Cargo Owner
```
1. Login as TENANT_ADMIN
2. Navigate to Users tab
3. Click "Create User"
4. Select role: CARGO_OWNER
5. Fill in user details:
   - Email
   - First name, Last name
   - Company name
   - Phone number
6. Set initial password
7. Click "Create User"
8. System sends welcome email
9. User can now login and create loads
```

#### Workflow 2: Accept a Bid
```
1. Navigate to Bids tab
2. View pending bids list
3. Click on bid to view details
4. Review:
   - Bid amount
   - Truck owner details
   - Proposed dates
   - Truck and driver info
5. Click "Accept Bid"
6. Confirm acceptance
7. System automatically:
   - Changes bid status to ACCEPTED
   - Assigns truck to load
   - Creates trip with PLANNED status
   - Notifies truck owner and driver
   - Closes auction
   - Rejects other pending bids
```

#### Workflow 3: Monitor Fleet Performance
```
1. Navigate to Fleet tab
2. View fleet overview statistics
3. Check trucks needing maintenance
4. Review utilization rates
5. Identify underperforming trucks
6. Click on truck for detailed view
7. Review trip history
8. Check maintenance records
9. Generate fleet performance report
```

#### Workflow 4: Generate Financial Report
```
1. Navigate to Financial tab
2. Select date range
3. Choose report type:
   - Revenue report
   - Expense report
   - Profitability report
   - Tax report
4. Apply filters (cargo owner, truck owner, etc.)
5. Click "Generate Report"
6. Review report data
7. Export as PDF, Excel, or CSV
8. Share with stakeholders
```

### ⚠️ Best Practices

**Do:**
- ✅ Regularly review pending bids
- ✅ Monitor user activities
- ✅ Keep company settings updated
- ✅ Review financial reports monthly
- ✅ Track fleet maintenance schedules
- ✅ Respond to disputes promptly
- ✅ Maintain accurate user records
- ✅ Generate regular performance reports

**Don't:**
- ❌ Share admin credentials
- ❌ Create users without proper verification
- ❌ Ignore pending bids for too long
- ❌ Neglect maintenance alerts
- ❌ Bypass approval workflows
- ❌ Make bulk changes without review

---

## 3️⃣ CARGO_OWNER (Shipper/Customer)

### 📦 Role Overview
Businesses or individuals who need to transport cargo from one location to another.

### 🔑 Credentials
- **User 1:** `cargo.owner@test.com` / `test123`
- **User 2:** `cargo.owner2@test.com` / `test123`
- **Tenant:** Uruti-X Default
- **Access Level:** Own cargo and loads only

### 📊 Responsibilities

#### Primary Responsibilities:
1. **Load Management**
   - Create cargo/load requests
   - Specify pickup and delivery locations
   - Define cargo details (type, weight, dimensions)
   - Set pricing and payment terms
   - Publish loads for bidding

2. **Bid Management**
   - Review bids from truck owners
   - Compare bid prices and terms
   - Accept or reject bids
   - Negotiate with truck owners
   - Award loads to best bidders

3. **Shipment Tracking**
   - Monitor load status in real-time
   - Track truck location during transit
   - Receive delivery notifications
   - Confirm deliveries
   - Report issues or delays

4. **Payment Management**
   - Review invoices
   - Make payments for completed trips
   - Track payment history
   - Manage payment methods
   - Request refunds if needed

5. **Performance Management**
   - Rate truck owners and drivers
   - Provide feedback on service
   - Review delivery performance
   - Build preferred transporter list
   - Report disputes

### ✅ Capabilities

**Can Do:**
- ✅ Create and publish cargo loads
- ✅ View and manage own loads
- ✅ Receive and review bids
- ✅ Accept or reject bids
- ✅ Track shipments in real-time
- ✅ Communicate with truck owners/drivers
- ✅ Make payments
- ✅ Rate and review transporters
- ✅ View own shipment history
- ✅ Download invoices and receipts
- ✅ Manage delivery locations
- ✅ Report issues and disputes

**Cannot Do:**
- ❌ View other cargo owners' loads
- ❌ Access truck management features
- ❌ Create or manage trucks
- ❌ Assign drivers
- ❌ View platform-wide data
- ❌ Manage other users

### 📱 Dashboard Features

#### 1. My Loads
- **Load List**
  - All loads created by the cargo owner
  - Filter by status (Draft, Published, Assigned, In Transit, Delivered)
  - Search by load number or cargo type
  - Sort by date, status, or amount

- **Load Details**
  - Load number and title
  - Cargo type and description
  - Weight and dimensions
  - Pickup location and date
  - Delivery location and date
  - Pricing information
  - Special instructions
  - Assigned truck and driver (if any)

#### 2. Create Load
- **Basic Information**
  - Load title
  - Cargo type (Electronics, Food, Construction, etc.)
  - Description
  - Weight (kg)
  - Dimensions (L x W x H)
  - Quantity/units

- **Pickup Details**
  - Pickup address
  - Pickup date and time
  - Contact person
  - Special instructions

- **Delivery Details**
  - Delivery address
  - Delivery date and time
  - Contact person
  - Special instructions

- **Pricing**
  - Base price
  - Currency
  - Payment terms
  - Additional fees

- **Requirements**
  - Truck type needed
  - Special equipment
  - Insurance requirements
  - Certifications needed

#### 3. Bids Received
- **Bid List**
  - All bids for cargo owner's loads
  - Truck owner information
  - Bid amount
  - Proposed dates
  - Truck and driver details
  - Bid status

- **Bid Comparison**
  - Side-by-side comparison
  - Price comparison
  - Delivery time comparison
  - Truck owner ratings
  - Recommendation system

- **Bid Actions**
  - Accept bid
  - Reject bid
  - Request more information
  - Negotiate price
  - View truck owner profile

#### 4. Active Shipments
- **Real-Time Tracking**
  - Current truck location on map
  - Estimated time of arrival
  - Route visualization
  - Status updates
  - Driver contact information

- **Shipment Status**
  - Pickup confirmed
  - In transit
  - Delivery in progress
  - Delivered
  - Proof of delivery

#### 5. Payment & Invoices
- **Pending Payments**
  - Invoices awaiting payment
  - Due dates
  - Amount breakdown
  - Payment methods

- **Payment History**
  - All completed payments
  - Payment dates
  - Amounts paid
  - Payment methods used
  - Receipts and invoices

- **Make Payment**
  - Select invoice
  - Choose payment method
  - Enter payment details
  - Confirm payment
  - Receive confirmation

### 🔄 Common Workflows

#### Workflow 1: Create and Publish a Load
```
1. Login as CARGO_OWNER
2. Navigate to "Create Load"
3. Fill in load details:
   - Title: "Electronics from Nairobi to Mombasa"
   - Cargo type: Electronics
   - Weight: 500 kg
   - Dimensions: 2m x 1m x 1m
4. Enter pickup details:
   - Address: Nairobi Industrial Area
   - Date: Tomorrow, 8:00 AM
   - Contact: John Doe, +254-XXX
5. Enter delivery details:
   - Address: Mombasa Port
   - Date: Tomorrow, 6:00 PM
   - Contact: Jane Smith, +254-XXX
6. Set pricing:
   - Base price: 50,000 RWF
   - Payment terms: Net 30
7. Specify requirements:
   - Truck type: Covered truck
   - Insurance: Required
8. Save as draft (optional)
9. Click "Publish Load"
10. Load is now visible to truck owners
11. Wait for bids to come in
```

#### Workflow 2: Review and Accept a Bid
```
1. Receive notification: "New bid received"
2. Navigate to "Bids Received"
3. View list of bids for your load
4. Click on bid to view details:
   - Truck owner: ABC Transport
   - Bid amount: 45,000 RWF (10% less than asking)
   - Truck: Mercedes Actros, 10-ton capacity
   - Driver: David Kamau, 4.8★ rating
   - Proposed pickup: Tomorrow 8:00 AM
   - Proposed delivery: Tomorrow 5:00 PM
5. Review truck owner profile:
   - Rating: 4.7★
   - Completed trips: 150
   - On-time delivery: 95%
   - Insurance: Valid
6. Compare with other bids
7. Click "Accept Bid"
8. Confirm acceptance
9. System creates trip automatically
10. Receive confirmation notification
11. Driver assigned and notified
12. Track shipment in "Active Shipments"
```

#### Workflow 3: Track Active Shipment
```
1. Navigate to "Active Shipments"
2. Select your shipment
3. View real-time map:
   - Truck current location
   - Route taken
   - Estimated arrival time
4. Check status updates:
   - "Pickup confirmed - 8:15 AM"
   - "In transit - 10:30 AM"
   - "Approaching delivery - 4:45 PM"
5. Contact driver if needed (call/message)
6. Receive delivery notification
7. Review proof of delivery:
   - Photos
   - Signature
   - Delivery notes
8. Confirm delivery
9. Rate driver and truck owner
10. Payment invoice generated
```

#### Workflow 4: Make Payment
```
1. Receive invoice notification
2. Navigate to "Payment & Invoices"
3. View pending invoices
4. Select invoice to pay
5. Review invoice details:
   - Load number
   - Service provided
   - Amount: 45,000 RWF
   - Due date
6. Click "Make Payment"
7. Choose payment method:
   - Credit card
   - Bank transfer
   - Mobile money
8. Enter payment details
9. Confirm payment
10. Receive payment confirmation
11. Download receipt
12. Payment marked as completed
```

### ⚠️ Best Practices

**Do:**
- ✅ Provide accurate load details
- ✅ Set realistic pickup/delivery times
- ✅ Respond to bids promptly
- ✅ Communicate clearly with transporters
- ✅ Confirm deliveries quickly
- ✅ Rate transporters fairly
- ✅ Pay invoices on time
- ✅ Report issues immediately

**Don't:**
- ❌ Provide false cargo information
- ❌ Accept bids without reviewing
- ❌ Delay payment without reason
- ❌ Give unfair ratings
- ❌ Cancel loads without notice
- ❌ Ignore driver communications

---

## 4️⃣ TRUCK_OWNER (Transporter/Carrier)

### 🚛 Role Overview
Transportation companies or individual truck owners who provide cargo transportation services.

### 🔑 Credentials
- **User 1:** `truck.owner@test.com` / `test123`
- **User 2:** `truck.owner2@test.com` / `test123`
- **Tenant:** Uruti-X Default
- **Access Level:** Own fleet and bids only

### 📊 Responsibilities

#### Primary Responsibilities:
1. **Fleet Management**
   - Add and manage trucks
   - Update truck status and availability
   - Schedule maintenance
   - Track truck locations
   - Monitor truck utilization
   - Manage truck documents (registration, insurance)

2. **Driver Management**
   - Create driver accounts
   - Assign drivers to trucks
   - Monitor driver performance
   - Track driver availability
   - Manage driver documents (licenses, certifications)
   - Handle driver payments

3. **Bid Management**
   - Browse available loads
   - Place bids on suitable loads
   - Set competitive pricing
   - Propose pickup/delivery times
   - Track bid status
   - Respond to bid acceptances

4. **Trip Execution**
   - Assign accepted loads to drivers
   - Monitor trip progress
   - Ensure timely deliveries
   - Handle trip issues
   - Collect proof of delivery
   - Complete trip documentation

5. **Financial Management**
   - Track earnings from completed trips
   - Manage payment receipts
   - Pay drivers
   - Track expenses (fuel, maintenance)
   - Generate financial reports
   - Manage invoices

### ✅ Capabilities

**Can Do:**
- ✅ View available cargo loads
- ✅ Place bids on loads
- ✅ Manage own truck fleet
- ✅ Create and manage driver accounts
- ✅ Assign drivers to trucks
- ✅ Assign drivers to trips
- ✅ Track trips and deliveries
- ✅ Receive payments for completed trips
- ✅ View earnings and financial reports
- ✅ Rate and review cargo owners
- ✅ Update truck and driver information
- ✅ Manage truck maintenance schedules
- ✅ View own bid history

**Cannot Do:**
- ❌ Create cargo loads
- ❌ View other truck owners' data
- ❌ Access other truck owners' bids
- ❌ Manage other truck owners' fleets
- ❌ View platform-wide data
- ❌ Create cargo owner accounts

### 📱 Dashboard Features

#### 1. Available Loads
- **Load Marketplace**
  - All published loads needing transportation
  - Filter by:
    - Route (origin/destination)
    - Cargo type
    - Weight range
    - Price range
    - Pickup date
  - Search by location or cargo type
  - Sort by price, date, or distance

- **Load Details**
  - Cargo owner information
  - Cargo details (type, weight, dimensions)
  - Pickup and delivery locations
  - Requested dates
  - Pricing information
  - Special requirements
  - Distance and estimated time

#### 2. My Fleet
- **Truck List**
  - All trucks owned
  - Truck status (Active, Maintenance, Inactive)
  - Current location
  - Assigned driver
  - Utilization rate
  - Next maintenance due

- **Add/Edit Truck**
  - Truck number/plate
  - Make and model
  - Year
  - Capacity (weight, volume)
  - Truck type (Flatbed, Covered, Refrigerated, etc.)
  - Registration details
  - Insurance information
  - Photos

- **Truck Details**
  - Complete truck information
  - Trip history
  - Maintenance records
  - Fuel consumption
  - Earnings generated
  - Current assignment

#### 3. My Drivers
- **Driver List**
  - All drivers employed
  - Driver status (Available, On Trip, Off Duty)
  - Current assignment
  - Performance rating
  - Total trips completed
  - Contact information

- **Add/Edit Driver**
  - First name, Last name
  - Email and phone
  - License number
  - License expiry date
  - Certifications
  - Emergency contact
  - Photo

- **Driver Details**
  - Complete driver information
  - Trip history
  - Performance metrics
  - Earnings
  - Ratings and reviews
  - Documents

#### 4. My Bids
- **Bid List**
  - All bids placed
  - Bid status (Pending, Accepted, Rejected)
  - Load information
  - Bid amount
  - Proposed dates
  - Cargo owner response

- **Place Bid**
  - Select load
  - Enter bid amount
  - Propose pickup date/time
  - Propose delivery date/time
  - Select truck to use
  - Select driver (optional)
  - Add notes or special terms
  - Submit bid

- **Bid Status**
  - Pending: Awaiting cargo owner decision
  - Accepted: Bid won, trip created
  - Rejected: Bid declined
  - Withdrawn: Bid cancelled by truck owner

#### 5. Active Trips
- **Trip List**
  - All ongoing trips
  - Trip status
  - Assigned driver
  - Assigned truck
  - Current location
  - ETA to destination

- **Trip Details**
  - Complete trip information
  - Route map
  - Driver contact
  - Cargo owner contact
  - Pickup/delivery details
  - Status updates
  - Documents

- **Trip Management**
  - Update trip status
  - Communicate with driver
  - Handle issues
  - Upload documents
  - Confirm delivery

#### 6. Earnings & Payments
- **Earnings Overview**
  - Total earnings
  - This month's earnings
  - Pending payments
  - Completed payments
  - Average earnings per trip

- **Payment History**
  - All received payments
  - Payment dates
  - Amounts
  - Associated trips
  - Payment methods
  - Receipts

- **Financial Reports**
  - Revenue by period
  - Expenses breakdown
  - Profit margins
  - Earnings by truck
  - Earnings by driver
  - Export reports

### 🔄 Common Workflows

#### Workflow 1: Add a New Truck
```
1. Login as TRUCK_OWNER
2. Navigate to "My Fleet"
3. Click "Add Truck"
4. Fill in truck details:
   - Plate number: KBZ 123A
   - Make: Mercedes
   - Model: Actros
   - Year: 2020
   - Capacity: 10 tons
   - Type: Covered truck
5. Upload documents:
   - Registration certificate
   - Insurance policy
   - Inspection certificate
6. Upload truck photos
7. Set truck status: Active
8. Click "Save Truck"
9. Truck is now available for assignments
```

#### Workflow 2: Create Driver Account
```
1. Navigate to "My Drivers"
2. Click "Add Driver"
3. Fill in driver details:
   - Name: David Kamau
   - Email: david.kamau@example.com
   - Phone: +254-XXX-XXX-XXX
   - License number: DL-12345
   - License expiry: 2026-12-31
4. Upload documents:
   - Driver's license
   - ID card
   - Certifications
5. Set initial password
6. Click "Create Driver"
7. System sends welcome email to driver
8. Driver can now login and receive assignments
```

#### Workflow 3: Place a Bid on a Load
```
1. Navigate to "Available Loads"
2. Browse or search for suitable loads
3. Filter by route: Nairobi to Mombasa
4. Click on load to view details:
   - Cargo: Electronics, 500 kg
   - Pickup: Tomorrow 8:00 AM
   - Delivery: Tomorrow 6:00 PM
   - Asking price: 50,000 RWF
5. Click "Place Bid"
6. Fill in bid details:
   - Bid amount: 45,000 RWF
   - Proposed pickup: Tomorrow 8:00 AM
   - Proposed delivery: Tomorrow 5:00 PM
   - Select truck: Mercedes Actros (KBZ 123A)
   - Select driver: David Kamau
   - Add notes: "Experienced with electronics"
7. Review bid summary
8. Click "Submit Bid"
9. Receive confirmation
10. Wait for cargo owner response
11. Receive notification when bid is accepted/rejected
```

#### Workflow 4: Manage Accepted Trip
```
1. Receive notification: "Bid accepted!"
2. Navigate to "Active Trips"
3. View new trip details
4. Verify:
   - Driver assigned: David Kamau
   - Truck assigned: Mercedes Actros
   - Pickup location and time
   - Delivery location and time
5. Contact driver to confirm assignment
6. Driver receives trip notification
7. Monitor trip progress:
   - Driver starts trip
   - Pickup confirmed
   - In transit
   - Approaching delivery
   - Delivered
8. Review proof of delivery
9. Confirm trip completion
10. Receive payment
11. Rate cargo owner
```

### ⚠️ Best Practices

**Do:**
- ✅ Keep truck information updated
- ✅ Maintain valid insurance and documents
- ✅ Bid competitively but profitably
- ✅ Assign reliable drivers
- ✅ Monitor trips actively
- ✅ Ensure timely deliveries
- ✅ Maintain trucks regularly
- ✅ Communicate proactively
- ✅ Rate cargo owners fairly
- ✅ Keep drivers informed

**Don't:**
- ❌ Bid on loads you can't fulfill
- ❌ Assign unqualified drivers
- ❌ Neglect truck maintenance
- ❌ Ignore trip updates
- ❌ Delay deliveries without notice
- ❌ Provide false truck information
- ❌ Overload trucks
- ❌ Skip safety checks

---

## 5️⃣ DRIVER

### 👨‍✈️ Role Overview
Individual drivers employed by truck owners who execute transportation trips.

### 🔑 Credentials
- **Driver 1:** `driver1@test.com` / `test123`
- **Driver 2:** `driver2@test.com` / `test123`
- **Tenant:** Uruti-X Default
- **Access Level:** Assigned trips only

### 📊 Responsibilities

#### Primary Responsibilities:
1. **Trip Execution**
   - Accept trip assignments
   - Navigate to pickup location
   - Load cargo safely
   - Transport cargo to destination
   - Unload cargo at delivery location
   - Collect proof of delivery

2. **Status Updates**
   - Update trip status in real-time
   - Report pickup completion
   - Update location during transit
   - Report any delays or issues
   - Confirm delivery completion

3. **Documentation**
   - Take photos of cargo (before/after)
   - Collect delivery signatures
   - Upload proof of delivery
   - Report any damage or discrepancies
   - Complete trip reports

4. **Communication**
   - Communicate with cargo owners
   - Report to truck owner
   - Provide ETA updates
   - Report incidents immediately
   - Respond to inquiries

5. **Safety & Compliance**
   - Follow traffic regulations
   - Maintain vehicle cleanliness
   - Perform pre-trip inspections
   - Report maintenance needs
   - Follow safety protocols

### ✅ Capabilities

**Can Do:**
- ✅ View assigned trips
- ✅ Update trip status
- ✅ Update real-time location
- ✅ Upload delivery proof (photos, signatures)
- ✅ Report incidents or delays
- ✅ View trip history
- ✅ View earnings
- ✅ Communicate with cargo owners
- ✅ Access navigation and route info
- ✅ View trip details
- ✅ Update profile information

**Cannot Do:**
- ❌ Manage trucks
- ❌ Place bids on loads
- ❌ Create trips
- ❌ Access financial data (except own earnings)
- ❌ View other drivers' trips
- ❌ Modify trip details
- ❌ Cancel trips

### 📱 Mobile App Features

#### 1. My Trips
- **Active Trips**
  - Current assignment
  - Trip details
  - Pickup location and time
  - Delivery location and time
  - Cargo information
  - Contact information

- **Upcoming Trips**
  - Future assignments
  - Scheduled dates
  - Route preview
  - Preparation checklist

- **Completed Trips**
  - Trip history
  - Delivery confirmations
  - Earnings per trip
  - Ratings received

#### 2. Trip Details
- **Route Information**
  - Interactive map
  - Turn-by-turn navigation
  - Distance and duration
  - Traffic updates
  - Alternative routes

- **Cargo Information**
  - Cargo type
  - Weight and dimensions
  - Special handling instructions
  - Loading/unloading requirements
  - Safety precautions

- **Contact Information**
  - Cargo owner contact
  - Truck owner contact
  - Emergency contacts
  - Support hotline

#### 3. Trip Status Updates
- **Status Options**
  - Accepted: Trip assignment accepted
  - En Route to Pickup: Heading to pickup location
  - Arrived at Pickup: At pickup location
  - Loading: Loading cargo
  - Pickup Complete: Cargo loaded, ready to depart
  - In Transit: On the way to delivery
  - Arrived at Delivery: At delivery location
  - Unloading: Unloading cargo
  - Delivered: Trip completed

- **Update Process**
  - Select current status
  - Add notes (optional)
  - Take photos (optional)
  - Update location automatically
  - Notify all parties

#### 4. Proof of Delivery
- **Photo Documentation**
  - Take photos of cargo before loading
  - Take photos during transit (if needed)
  - Take photos after unloading
  - Capture any damage or issues

- **Signature Collection**
  - Digital signature pad
  - Recipient name
  - Recipient ID verification
  - Date and time stamp

- **Delivery Notes**
  - Delivery condition
  - Any issues or discrepancies
  - Special notes
  - Recipient feedback

#### 5. Location Tracking
- **GPS Tracking**
  - Real-time location updates
  - Automatic location sharing
  - Route tracking
  - Speed monitoring

- **Privacy Controls**
  - Enable/disable tracking
  - Tracking only during trips
  - Location history

#### 6. Earnings
- **Trip Earnings**
  - Earnings per trip
  - Payment status
  - Payment date
  - Total earnings

- **Summary**
  - Daily earnings
  - Weekly earnings
  - Monthly earnings
  - Year-to-date earnings

### 🔄 Common Workflows

#### Workflow 1: Accept and Start a Trip
```
1. Receive trip assignment notification
2. Open mobile app
3. View trip details:
   - Pickup: Nairobi Industrial Area, 8:00 AM
   - Delivery: Mombasa Port, 6:00 PM
   - Cargo: Electronics, 500 kg
   - Truck: Mercedes Actros (KBZ 123A)
4. Review route and distance
5. Click "Accept Trip"
6. Perform pre-trip inspection:
   - Check truck condition
   - Check fuel level
   - Check tire pressure
   - Check lights and signals
7. Click "Start Trip"
8. Update status: "En Route to Pickup"
9. Use navigation to reach pickup location
10. Update location automatically
```

#### Workflow 2: Complete Pickup
```
1. Arrive at pickup location
2. Update status: "Arrived at Pickup"
3. Contact cargo owner/representative
4. Inspect cargo:
   - Verify cargo type
   - Check weight
   - Check packaging condition
5. Take photos of cargo before loading
6. Update status: "Loading"
7. Load cargo safely
8. Secure cargo properly
9. Take photos of loaded cargo
10. Get loading confirmation signature
11. Update status: "Pickup Complete"
12. Start navigation to delivery location
13. Update status: "In Transit"
```

#### Workflow 3: Handle Delivery
```
1. Approach delivery location
2. Update status: "Arrived at Delivery"
3. Contact recipient
4. Update status: "Unloading"
5. Unload cargo carefully
6. Inspect cargo with recipient:
   - Check for damage
   - Verify quantity
   - Check condition
7. Take photos of unloaded cargo
8. Collect delivery signature:
   - Recipient name
   - Recipient ID
   - Date and time
9. Add delivery notes (if any)
10. Update status: "Delivered"
11. Upload proof of delivery
12. Complete trip report
13. Receive trip completion confirmation
14. View earnings for the trip
```

#### Workflow 4: Report an Issue
```
1. During trip, encounter issue:
   - Traffic delay
   - Vehicle breakdown
   - Cargo damage
   - Weather conditions
2. Click "Report Issue"
3. Select issue type
4. Describe the issue
5. Take photos (if applicable)
6. Add current location
7. Estimate delay time
8. Submit report
9. System notifies:
   - Truck owner
   - Cargo owner
   - Support team
10. Receive instructions
11. Update status as situation changes
12. Resolve issue
13. Continue trip
14. Update final status
```

### ⚠️ Best Practices

**Do:**
- ✅ Update trip status regularly
- ✅ Maintain accurate location tracking
- ✅ Take clear photos for documentation
- ✅ Communicate proactively
- ✅ Follow safety protocols
- ✅ Inspect cargo carefully
- ✅ Report issues immediately
- ✅ Secure cargo properly
- ✅ Be professional with customers
- ✅ Keep truck clean and maintained

**Don't:**
- ❌ Ignore trip assignments
- ❌ Delay status updates
- ❌ Skip photo documentation
- ❌ Ignore safety procedures
- ❌ Overload the truck
- ❌ Speed or drive recklessly
- ❌ Use phone while driving
- ❌ Deviate from route without reason
- ❌ Forget to collect signatures
- ❌ Ignore maintenance issues

---

## 6️⃣ BROKER (Facilitator/Matchmaker)

### 🤝 Role Overview
Professional intermediaries who facilitate connections between cargo owners and truck owners, earning commissions on successful matches.

### 🔑 Credentials
- **Email:** `broker@test.com` / `test123`
- **Tenant:** Broker's own company (tenantId)
- **Client:** Assigned client company (brokerTenantId)
- **Access Level:** Client's loads and own brokerage data

### 📊 Responsibilities

#### Primary Responsibilities:
1. **Load Discovery & Matching**
   - Browse available loads from assigned client
   - Identify suitable transporters
   - Use AI-powered matching recommendations
   - Analyze route optimization opportunities
   - Identify backhaul opportunities

2. **Verification & Due Diligence**
   - Verify transporter insurance
   - Check DOT/MC numbers and licenses
   - Assess transporter creditworthiness
   - Review transporter performance history
   - Ensure compliance with regulations

3. **Deal Facilitation**
   - Create professional contracts
   - Negotiate rates between parties
   - Propose matches to cargo owners
   - Facilitate bid submissions
   - Manage e-signatures

4. **Financial Management**
   - Manage escrow accounts
   - Ensure secure payment holding
   - Release funds upon delivery confirmation
   - Track commission earnings
   - Generate financial reports

5. **Document Management**
   - Prepare Bill of Lading (BOL)
   - Manage Proof of Delivery (POD)
   - Handle invoices and receipts
   - Maintain legal documentation
   - Archive completed transactions

6. **Dispute Resolution**
   - Mediate between cargo owners and transporters
   - Handle delays and damage claims
   - Resolve payment disputes
   - Facilitate fair resolutions
   - Protect all parties' interests

### ✅ Capabilities

**Can Do:**
- ✅ View client's available loads
- ✅ Access smart matching recommendations
- ✅ Verify transporter credentials
- ✅ Create and manage contracts
- ✅ Manage escrow accounts
- ✅ Facilitate negotiations
- ✅ Track commission earnings
- ✅ Resolve disputes
- ✅ Generate performance reports
- ✅ Access market intelligence
- ✅ Manage multi-stop routes
- ✅ View transporter ratings and history

**Cannot Do:**
- ❌ Access other clients' data (only assigned client)
- ❌ Create loads (client does this)
- ❌ Own or manage trucks
- ❌ Execute trips
- ❌ Modify platform settings

### 🏢 Dual Tenant Structure

**Understanding tenantId vs brokerTenantId:**

```
Broker's Company (tenantId)
├── ABC Brokerage Services
├── Broker 1 → Works for Client A (brokerTenantId)
├── Broker 2 → Works for Client B (brokerTenantId)
└── Broker 3 → Works for Client C (brokerTenantId)
```

- **tenantId**: Broker's own brokerage company
- **brokerTenantId**: The client company the broker services

### 📱 Dashboard Features

#### 1. Load Discovery
- **Available Loads**
  - All loads from assigned client
  - Filter by route, cargo type, date
  - Search functionality
  - Load details and requirements

- **Smart Matching**
  - AI-recommended transporters
  - Match score and reasoning
  - Historical performance data
  - Route optimization suggestions

#### 2. Transporter Verification
- **Insurance Verification**
  - Check insurance validity
  - Verify coverage amounts
  - Review policy details
  - Track expiration dates

- **Compliance Checks**
  - DOT/MC number verification
  - License validation
  - Safety ratings
  - Inspection records

- **Credit Assessment**
  - Credit score review
  - Payment history
  - Outstanding debts
  - Risk assessment

#### 3. Contract Management
- **Create Contract**
  - Load details
  - Parties involved
  - Terms and conditions
  - Pricing and payment terms
  - Liability clauses

- **E-Signature**
  - Send for signatures
  - Track signature status
  - Store signed contracts
  - Legal compliance

#### 4. Escrow Management
- **Escrow Accounts**
  - Create escrow for each deal
  - Secure fund holding
  - Release conditions
  - Transaction history

- **Fund Management**
  - Deposit tracking
  - Release upon delivery
  - Dispute holds
  - Commission deduction

#### 5. Market Intelligence
- **Rate Analysis**
  - Real-time market rates
  - Historical pricing trends
  - Route-specific rates
  - Seasonal variations

- **Performance Analytics**
  - Transporter reliability scores
  - On-time delivery rates
  - Damage rates
  - Customer satisfaction

#### 6. Commission Tracking
- **Earnings Dashboard**
  - Total commissions earned
  - Pending commissions
  - Paid commissions
  - Commission rate (5-15%)

- **Deal History**
  - All facilitated deals
  - Success rate
  - Average commission
  - Client breakdown

### 🔄 Complete Broker Workflow

#### Step 1: Discovery
```
1. Login as BROKER
2. View available loads from assigned client
3. Load: "Electronics from Nairobi to Mombasa"
   - Weight: 500 kg
   - Value: 50,000 RWF
   - Pickup: Tomorrow 8:00 AM
4. Click "Find Matches"
```

#### Step 2: Smart Matching
```
1. System analyzes load requirements
2. AI recommends top 3 transporters:
   
   Match 1: ABC Transport (95% match)
   - Rating: 4.8★
   - On-time: 97%
   - Insurance: Valid
   - Estimated rate: 42,000 RWF
   
   Match 2: XYZ Logistics (92% match)
   - Rating: 4.6★
   - On-time: 94%
   - Insurance: Valid
   - Estimated rate: 45,000 RWF
   
   Match 3: DEF Carriers (88% match)
   - Rating: 4.5★
   - On-time: 91%
   - Insurance: Valid
   - Estimated rate: 48,000 RWF

3. Review recommendations
4. Select best match: ABC Transport
```

#### Step 3: Verification
```
1. Verify ABC Transport credentials:
   ✅ Insurance valid until 2027
   ✅ DOT number verified
   ✅ License current
   ✅ Credit score: Good
   ✅ No outstanding disputes
2. Check performance history:
   ✅ 150 completed trips
   ✅ 97% on-time delivery
   ✅ 0.5% damage rate
   ✅ 4.8★ average rating
3. Approve transporter
```

#### Step 4: Negotiation
```
1. Contact ABC Transport
2. Discuss load details
3. Negotiate rate:
   - Asking: 50,000 RWF
   - Transporter quote: 42,000 RWF
   - Negotiated: 45,000 RWF
4. Agree on terms:
   - Pickup: Tomorrow 8:00 AM
   - Delivery: Tomorrow 6:00 PM
   - Insurance: Required
   - Payment: Net 30
5. Confirm with cargo owner
```

#### Step 5: Contract Creation
```
1. Create professional contract
2. Include all terms:
   - Parties: Cargo Owner & ABC Transport
   - Load details
   - Route and dates
   - Price: 45,000 RWF
   - Payment terms
   - Insurance requirements
   - Liability clauses
3. Send for e-signatures:
   - Cargo owner signs
   - Transporter signs
   - Broker witnesses
4. Contract executed
```

#### Step 6: Escrow Setup
```
1. Create escrow account
2. Cargo owner deposits: 45,000 RWF
3. Funds held securely
4. Release conditions:
   - Delivery confirmed
   - POD uploaded
   - No disputes
5. Commission: 6,750 RWF (15%)
```

#### Step 7: Execution Monitoring
```
1. Trip created and assigned
2. Monitor progress:
   - Pickup confirmed ✅
   - In transit ✅
   - Delivery approaching
3. Track real-time location
4. Ensure smooth execution
```

#### Step 8: Delivery & Settlement
```
1. Delivery completed
2. POD uploaded and verified
3. Cargo owner confirms delivery
4. Escrow released:
   - Transporter: 38,250 RWF (85%)
   - Broker commission: 6,750 RWF (15%)
5. Documents archived
6. Deal completed successfully
```

#### Step 9: Issue Resolution (if needed)
```
1. Issue reported: Delay due to traffic
2. Broker mediates:
   - Contact both parties
   - Assess situation
   - Propose solution
3. Resolution:
   - Extend delivery time
   - Adjust payment if needed
   - Document resolution
4. Update escrow terms
5. Continue monitoring
```

### ⚠️ Best Practices

**Do:**
- ✅ Verify all transporter credentials
- ✅ Use AI matching for efficiency
- ✅ Create detailed contracts
- ✅ Manage escrow professionally
- ✅ Communicate proactively
- ✅ Resolve disputes fairly
- ✅ Track all commissions
- ✅ Build strong relationships
- ✅ Maintain documentation
- ✅ Follow legal requirements

**Don't:**
- ❌ Skip verification steps
- ❌ Recommend unqualified transporters
- ❌ Neglect contract details
- ❌ Mismanage escrow funds
- ❌ Take sides in disputes
- ❌ Ignore market rates
- ❌ Overcharge commissions
- ❌ Bypass compliance checks

---

## 📊 Feature Modules Summary

### 1. User Management Module
**Available to:** SUPER_ADMIN, TENANT_ADMIN

**Features:**
- Create and manage users
- Assign roles and permissions
- Deactivate/suspend users
- Reset passwords
- View user activity logs
- User statistics and analytics

### 2. Fleet Management Module
**Available to:** TENANT_ADMIN, TRUCK_OWNER

**Features:**
- Add and manage trucks
- Track truck status and location
- Schedule maintenance
- Monitor utilization rates
- Assign drivers to trucks
- View fleet analytics
- Generate fleet reports

### 3. Cargo Management Module
**Available to:** TENANT_ADMIN, CARGO_OWNER

**Features:**
- Create and publish loads
- View cargo owners and their loads
- Filter by load type (Our Cargo, Our Fleet)
- Track load status
- Monitor delivery performance
- Cargo analytics and reports
- Load history

### 4. Bid Management Module
**Available to:** TENANT_ADMIN, CARGO_OWNER, TRUCK_OWNER, BROKER

**Features:**
- View available loads
- Place bids on loads
- Accept/reject bids
- Track bid status
- Bid comparison tools
- Automated trip creation on acceptance
- Bid analytics

### 5. Trip Management Module
**Available to:** All roles (different views)

**Features:**
- Create and assign trips
- Real-time tracking
- Status updates
- Route navigation
- Proof of delivery
- Trip history
- Performance metrics

### 6. Financial Management Module
**Available to:** TENANT_ADMIN, CARGO_OWNER, TRUCK_OWNER

**Features:**
- Invoice management
- Payment processing
- Revenue tracking
- Expense management
- Financial reports
- Profit analysis
- Payment history

### 7. Billing Management Module
**Available to:** TENANT_ADMIN

**Features:**
- Subscription management
- Invoice creation and sending
- Payment recording
- Tax report generation
- Usage monitoring
- Plan upgrades/downgrades
- Billing history

### 8. Document Management Module
**Available to:** All roles

**Features:**
- Bill of Lading (BOL)
- Proof of Delivery (POD)
- Contracts
- Insurance documents
- Licenses and certifications
- Invoices and receipts
- Document archiving

### 9. Analytics & Reporting Module
**Available to:** SUPER_ADMIN, TENANT_ADMIN

**Features:**
- Dashboard analytics
- Performance metrics
- Revenue trends
- Fleet utilization
- On-time delivery rates
- Customer satisfaction
- Custom reports
- Data export (CSV, Excel, PDF)

### 10. Communication Module
**Available to:** All roles

**Features:**
- In-app messaging
- Email notifications
- SMS alerts
- Push notifications
- Real-time updates
- Support tickets
- Announcement system

---

## 🔄 Common Business Workflows

### Workflow A: Complete Shipment Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CARGO OWNER: Create Load                                 │
│    - Define cargo details                                   │
│    - Set pickup/delivery locations                          │
│    - Set pricing                                            │
│    - Publish load                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. TRUCK OWNERS: View and Bid                               │
│    - Browse available loads                                 │
│    - Review load details                                    │
│    - Place competitive bids                                 │
│    - Wait for response                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CARGO OWNER or TENANT_ADMIN: Review Bids                 │
│    - Compare bids                                           │
│    - Review truck owner ratings                             │
│    - Select best bid                                        │
│    - Accept bid                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SYSTEM: Automatic Actions                                │
│    - Change bid status to ACCEPTED                          │
│    - Assign truck to load                                   │
│    - Create trip with PLANNED status                        │
│    - Notify truck owner and driver                          │
│    - Close auction                                          │
│    - Reject other pending bids                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. TRUCK OWNER: Assign Driver                               │
│    - Review trip details                                    │
│    - Assign driver to trip                                  │
│    - Confirm assignment                                     │
│    - Driver receives notification                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. DRIVER: Execute Trip                                     │
│    - Accept trip assignment                                 │
│    - Navigate to pickup location                            │
│    - Update status: "Arrived at Pickup"                     │
│    - Load cargo and take photos                             │
│    - Update status: "Pickup Complete"                       │
│    - Navigate to delivery location                          │
│    - Update status: "In Transit"                            │
│    - Update location in real-time                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. DRIVER: Complete Delivery                                │
│    - Update status: "Arrived at Delivery"                   │
│    - Unload cargo                                           │
│    - Take photos of delivered cargo                         │
│    - Collect recipient signature                            │
│    - Upload proof of delivery                               │
│    - Update status: "Delivered"                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. CARGO OWNER: Confirm Delivery                            │
│    - Review proof of delivery                               │
│    - Verify cargo condition                                 │
│    - Confirm delivery                                       │
│    - Rate driver and truck owner                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. SYSTEM: Financial Settlement                             │
│    - Generate invoice                                       │
│    - Send invoice to cargo owner                            │
│    - Process payment                                        │
│    - Transfer funds to truck owner                          │
│    - Deduct platform fees                                   │
│    - Update financial records                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. COMPLETION                                              │
│     - Trip marked as COMPLETED                              │
│     - All parties notified                                  │
│     - Documents archived                                    │
│     - Analytics updated                                     │
│     - Ready for next shipment                               │
└─────────────────────────────────────────────────────────────┘
```

### Workflow B: Broker-Facilitated Shipment

```
1. CARGO OWNER creates load
2. BROKER discovers load
3. BROKER uses AI matching to find best transporter
4. BROKER verifies transporter credentials
5. BROKER negotiates rate with transporter
6. BROKER creates professional contract
7. BROKER sets up escrow account
8. CARGO OWNER deposits funds to escrow
9. All parties sign contract
10. TRUCK OWNER assigns driver
11. DRIVER executes trip
12. DRIVER completes delivery
13. BROKER verifies proof of delivery
14. ESCROW releases funds:
    - Transporter receives payment (85%)
    - Broker receives commission (15%)
15. BROKER archives all documents
16. Deal completed
```

---

## 🔐 Security & Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Cannot reuse last 5 passwords

### Account Security
- Enable two-factor authentication (2FA)
- Use strong, unique passwords
- Never share login credentials
- Log out when finished
- Report suspicious activity immediately
- Review login history regularly

### Data Privacy
- All tenant data is isolated
- Row-level security enforced
- Encrypted data transmission (HTTPS)
- Encrypted sensitive data at rest
- Regular security audits
- GDPR compliance

### Role-Based Access Control
- Users can only access data within their role
- Tenant admins cannot access other tenants
- Super admins have audit trail
- All actions are logged
- Permission changes require approval

---

## 🆘 Troubleshooting

### Common Issues

#### Issue 1: Cannot Login
**Symptoms:** Login fails with "Invalid credentials"

**Solutions:**
1. Verify email address is correct
2. Check password (case-sensitive)
3. Try "Forgot Password" to reset
4. Clear browser cache and cookies
5. Try different browser
6. Contact support if issue persists

#### Issue 2: Cannot See Data
**Symptoms:** Dashboard shows no data or empty lists

**Solutions:**
1. Verify you're logged into correct tenant
2. Check if you have proper role permissions
3. Verify data exists in the system
4. Check filters - may be filtering out data
5. Refresh the page
6. Contact tenant admin

#### Issue 3: Bid Not Showing
**Symptoms:** Placed bid doesn't appear in list

**Solutions:**
1. Refresh the page
2. Check bid status filter
3. Verify bid was submitted successfully
4. Check if load is still available
5. Contact support if bid is missing

#### Issue 4: Cannot Upload Documents
**Symptoms:** File upload fails

**Solutions:**
1. Check file size (max 10MB)
2. Verify file format (PDF, JPG, PNG)
3. Check internet connection
4. Try different file
5. Clear browser cache
6. Contact support

#### Issue 5: Payment Not Processed
**Symptoms:** Payment shows as pending

**Solutions:**
1. Verify payment method is valid
2. Check account balance
3. Wait for processing (can take 24-48 hours)
4. Check payment status in billing section
5. Contact financial support

### Getting Help

**Support Channels:**
- **Email:** support@urutix.com
- **Phone:** +254-XXX-XXX-XXX
- **Live Chat:** Available in dashboard
- **Help Center:** help.urutix.com
- **Support Tickets:** Create in dashboard

**Support Hours:**
- Monday - Friday: 8:00 AM - 6:00 PM EAT
- Saturday: 9:00 AM - 2:00 PM EAT
- Sunday: Closed (Emergency support available)

**Response Times:**
- Critical issues: Within 1 hour
- High priority: Within 4 hours
- Normal priority: Within 24 hours
- Low priority: Within 48 hours

---

## 📝 Glossary

### Key Terms

**Tenant**
- An organization or company using the platform
- Has isolated data and users
- Can be ENTERPRISE, SMALL_BUSINESS, INDIVIDUAL, or PARTNER type

**Load**
- A cargo shipment request created by a cargo owner
- Contains pickup/delivery details, cargo information, and pricing
- Can have statuses: DRAFT, CREATED, PUBLISHED, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED

**Bid**
- An offer from a truck owner to transport a load
- Includes proposed price, dates, truck, and driver
- Can have statuses: PENDING, ACCEPTED, REJECTED, WITHDRAWN

**Trip**
- An active transportation assignment
- Created when a bid is accepted
- Tracked from pickup to delivery
- Can have statuses: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED

**Auction**
- The bidding process for a published load
- Remains open until a bid is accepted
- Automatically closes when bid is accepted

**Escrow**
- Secure holding of payment funds
- Protects both cargo owner and transporter
- Released upon delivery confirmation
- Managed by broker in broker-facilitated deals

**Proof of Delivery (POD)**
- Documentation confirming delivery completion
- Includes photos, signature, and notes
- Required for payment release

**Bill of Lading (BOL)**
- Legal document between shipper and carrier
- Details cargo, route, and terms
- Required for transportation

**Commission**
- Fee earned by broker for facilitating deal
- Typically 5-15% of transaction value
- Deducted from escrow upon completion

**Fleet**
- Collection of trucks owned by a truck owner
- Managed as a group
- Tracked for utilization and performance

**Utilization Rate**
- Percentage of time trucks are actively used
- Key performance metric
- Calculated as (active time / total time) × 100

**On-Time Delivery**
- Percentage of deliveries completed on schedule
- Key quality metric
- Affects ratings and reputation

**Multi-Tenancy**
- Architecture allowing multiple organizations on one platform
- Complete data isolation between tenants
- Shared infrastructure, separate data

**Row-Level Security (RLS)**
- Database security ensuring data isolation
- Automatically filters queries by tenantId
- Prevents cross-tenant data access

---

## 📚 Additional Resources

### Documentation
- **API Documentation:** api.urutix.com/docs
- **Developer Guide:** developers.urutix.com
- **Integration Guide:** integrations.urutix.com
- **Mobile App Guide:** mobile.urutix.com

### Training Materials
- **Video Tutorials:** training.urutix.com/videos
- **Webinars:** training.urutix.com/webinars
- **User Guides:** training.urutix.com/guides
- **Best Practices:** training.urutix.com/best-practices

### Community
- **User Forum:** community.urutix.com
- **Feature Requests:** feedback.urutix.com
- **Bug Reports:** bugs.urutix.com
- **Newsletter:** Subscribe at urutix.com/newsletter

---

## 📞 Contact Information

### General Inquiries
- **Email:** info@urutix.com
- **Phone:** +254-XXX-XXX-XXX
- **Website:** www.urutix.com

### Technical Support
- **Email:** support@urutix.com
- **Phone:** +254-XXX-XXX-XXX
- **Live Chat:** Available in dashboard

### Sales & Partnerships
- **Email:** sales@urutix.com
- **Phone:** +254-XXX-XXX-XXX

### Billing & Subscriptions
- **Email:** billing@urutix.com
- **Phone:** +254-XXX-XXX-XXX

---

## 📄 Document Information

**Document Title:** UrutiX Platform - Complete User Manual  
**Version:** 2.0  
**Last Updated:** February 13, 2026  
**Prepared By:** UrutiX Development Team  
**Status:** Complete and Current

### Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Jan 15, 2026 | Initial release | Dev Team |
| 1.5 | Feb 1, 2026 | Added broker role | Dev Team |
| 2.0 | Feb 13, 2026 | Complete rewrite with all features | Dev Team |

---

## ✅ Quick Reference Card

### Login Credentials (Test Environment)

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | urutixv@gmail.com | Admin123@ |
| TENANT_ADMIN | tenant.admin@test.com | Admin123@ |
| CARGO_OWNER | cargo.owner@test.com | test123 |
| TRUCK_OWNER | truck.owner@test.com | test123 |
| DRIVER | driver1@test.com | test123 |
| BROKER | broker@test.com | test123 |

### Key URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3005 |
| API Docs | http://localhost:3005/api |

### Support Contacts

| Type | Contact |
|------|---------|
| Technical | support@urutix.com |
| Billing | billing@urutix.com |
| Sales | sales@urutix.com |
| Emergency | +254-XXX-XXX-XXX |

---

**END OF USER MANUAL**

*This document is confidential and proprietary to UrutiX. Unauthorized distribution is prohibited.*

