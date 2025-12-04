# UrutiX Frontend Application

## Overview

UrutiX is a comprehensive fleet and cargo management platform built with React, TypeScript, and modern web technologies. The frontend application provides role-based dashboards for multiple user types including Cargo Owners, Fleet Owners, Drivers, Lenders, Tenant Admins, and System Administrators.

## Technology Stack

### Core Technologies
- **React 18.2.0** - UI library
- **TypeScript 5.2.2** - Type safety
- **Vite 5.0.8** - Build tool and dev server
- **React Router DOM 6.20.1** - Client-side routing
- **TanStack React Query 5.17.9** - Server state management and data fetching

### UI & Styling
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-label`
  - `@radix-ui/react-select`
  - `@radix-ui/react-slot`
- **Lucide React** - Icon library
- **React Icons** - Additional icon sets

### Forms & Validation
- **React Hook Form 7.62.0** - Form state management
- **Zod 4.0.17** - Schema validation
- **@hookform/resolvers** - Form validation resolvers

### Data Visualization
- **Chart.js 4.4.1** - Charting library
- **React Chart.js 2** - React wrapper for Chart.js
- **Recharts 2.15.4** - Composable charting library

### Maps & Location
- **Leaflet 1.9.4** - Interactive maps
- **React Leaflet 4.2.1** - React wrapper for Leaflet

### Utilities
- **Axios 1.6.2** - HTTP client
- **Moment 2.30.1** - Date manipulation
- **React Hot Toast 2.4.1** - Toast notifications
- **React Dropzone 14.2.3** - File upload handling
- **jsPDF 3.0.3** - PDF generation
- **html2canvas 1.4.1** - HTML to canvas conversion

### Analytics
- **PostHog JS 1.259.0** - Product analytics

## Project Structure

```
frontend/
├── src/
│   ├── assets/              # Static assets (images, logos)
│   ├── components/          # Reusable React components
│   │   ├── AdminDashboard/  # Admin-specific components
│   │   ├── Bidding/         # Bidding and auction components
│   │   ├── CargoDashboard/  # Cargo management components
│   │   ├── CargoOwnerJourney/ # Cargo owner onboarding flow
│   │   ├── Dashboard/       # Dashboard components
│   │   ├── DriverDashboard/ # Driver-specific components
│   │   ├── FleetDashboard/  # Fleet management components
│   │   ├── InsuranceManagement/ # Insurance features
│   │   ├── Layout/          # Layout components (sidebars, headers)
│   │   ├── LenderDashboard/ # Lender-specific components
│   │   ├── Lending/         # Lending feature components
│   │   ├── LoanRequest/    # Loan request components
│   │   ├── MatchingInterface/ # Cargo-truck matching UI
│   │   ├── Onboarding/      # User onboarding components
│   │   ├── TenantAdmin/    # Tenant admin components
│   │   ├── TenantDashboard/ # Tenant dashboard components
│   │   ├── TripTracker/    # Trip tracking components
│   │   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   │   └── ...
│   ├── config/              # Configuration files
│   │   └── environment.ts   # Environment variables and API config
│   ├── constants/           # Application constants
│   │   ├── cargo.ts         # Cargo-related constants
│   │   └── locations.ts     # Location constants
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx  # Authentication state management
│   │   ├── AdminLayoutContext.tsx
│   │   └── CargoOwnerLayoutContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useConfirmDialog.tsx
│   │   ├── useOptimisticLocking.ts
│   │   ├── useSearchParamsState.ts
│   │   └── useZodForm.ts
│   ├── pages/               # Page components (route handlers)
│   │   ├── admin/           # Admin pages
│   │   ├── dashboard/       # Unified dashboard pages
│   │   │   ├── account/     # Account management
│   │   │   ├── analytics/   # Analytics pages
│   │   │   ├── cargos/       # Cargo management pages
│   │   │   ├── documents/   # Document management
│   │   │   ├── financial/   # Financial management
│   │   │   ├── notifications/ # Notification center
│   │   │   ├── reputation/  # Ratings and reputation
│   │   │   └── tracking/     # Trip tracking and routes
│   │   └── ...              # Other page components
│   ├── services/            # API service layer
│   │   ├── api.ts           # Main API client and endpoints
│   │   ├── adminApi.ts      # Admin API methods
│   │   ├── analyticsApi.ts  # Analytics API
│   │   ├── cargoApi.ts      # Cargo API
│   │   ├── driverApi.ts     # Driver API
│   │   ├── fleetApi.ts      # Fleet API
│   │   ├── lending/         # Lending API
│   │   ├── notifications/  # Notifications API
│   │   └── ...
│   ├── types/               # TypeScript type definitions
│   │   ├── apiResponse.ts   # API response types
│   │   ├── cargo.ts         # Cargo types
│   │   ├── fleet.ts         # Fleet types
│   │   ├── loanRequest.ts   # Loan request types
│   │   ├── tenant.ts        # Tenant types
│   │   └── index.ts         # Type exports
│   ├── utils/               # Utility functions
│   │   ├── cn.ts            # Class name utility (clsx/tailwind-merge)
│   │   ├── error.ts         # Error handling utilities
│   │   ├── posthog.ts       # PostHog analytics utilities
│   │   └── url.ts           # URL utilities
│   ├── App.tsx              # Main app component with routing
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── public/                   # Public static files
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Architecture & Flow

### Application Entry Point

1. **main.tsx** - Initializes React app, renders `<App />` into root DOM element
2. **App.tsx** - Sets up:
   - React Query client for data fetching
   - AuthProvider for authentication state
   - React Router for navigation
   - Toast notifications
   - Lazy-loaded route components

### Authentication Flow

1. **AuthContext** (`contexts/AuthContext.tsx`):
   - Manages user authentication state
   - Handles login, registration, logout
   - Manages JWT tokens (access & refresh)
   - Automatic token refresh on 401 errors
   - Persists user data in localStorage
   - Integrates with PostHog for analytics

2. **Authentication Process**:
   ```
   User Login → API Call → Store Tokens → Set User State → Redirect to Dashboard
   ```

3. **Token Management**:
   - Access tokens stored in localStorage
   - Automatic refresh via axios interceptor
   - Multi-tenant support via `X-Tenant-ID` header
   - Token expiration handling

### Routing Structure

The application uses **React Router v6** with nested routes and role-based layouts:

#### Route Categories:

1. **Public Routes**:
   - `/` - Home page
   - `/auth` - Authentication (login/register)

2. **Cargo Owner Routes** (`/dashboard` or `/cargo-owner`):
   - Dashboard overview
   - Cargo management (create, list, active)
   - Bidding system
   - Analytics and reports
   - Financial management
   - Document management
   - Trip tracking
   - Transaction flow (booking, contracts, payments, escrow)

3. **Fleet Owner Routes** (`/fleet` or `/dashboard/fleet`):
   - Fleet dashboard
   - Truck management
   - Driver management
   - Trip management
   - Bids and available loads
   - Analytics
   - Safety management
   - Financial management

4. **Driver Routes** (`/dashboard/driver`):
   - Driver dashboard
   - Current trips
   - Cargo details
   - Earnings overview
   - Safety metrics
   - Documents

5. **Admin Routes** (`/admin`):
   - System administration
   - User management
   - Tenant management
   - Fleet management
   - Analytics and monitoring
   - Bidding management
   - Dispute resolution
   - Financial oversight

6. **Lender Routes** (`/lender`):
   - Loan request management
   - Active loans
   - Disbursements and repayments
   - Portfolio analytics
   - Risk analysis
   - Borrower management

7. **Tenant Admin Routes** (`/tenant-admin`):
   - Tenant-specific dashboard
   - Fleet operations
   - Cargo operations
   - Analytics and reports

### Layout System

Each role has a dedicated layout component that provides:
- **Sidebar Navigation** - Role-specific menu items
- **Header** - Search, notifications, user menu
- **Main Content Area** - Renders child routes via `<Outlet />`

Layout Components:
- `CargoOwnerLayout` - For cargo owners
- `FleetOwnerLayout` - For fleet owners
- `DriverLayout` - For drivers
- `AdminLayout` - For system administrators
- `LenderLayout` - For lenders
- `TenantAdminLayout` - For tenant administrators

### Data Fetching Pattern

The application uses **TanStack React Query** for all server state management:

1. **Query Pattern**:
   ```typescript
   const { data, isLoading, error } = useQuery({
     queryKey: ['resource', id, filters],
     queryFn: () => api.getResource(id, filters),
     staleTime: 5 * 60 * 1000, // 5 minutes
     retry: 1,
   });
   ```

2. **Mutation Pattern**:
   ```typescript
   const mutation = useMutation({
     mutationFn: (data) => api.createResource(data),
     onSuccess: () => {
       queryClient.invalidateQueries(['resource']);
     },
   });
   ```

3. **Features**:
   - Automatic caching and refetching
   - Optimistic updates
   - Error handling
   - Loading states
   - Request deduplication

### API Service Layer

**Centralized API Client** (`services/api.ts`):
- Axios instance with base configuration
- Request interceptor for:
  - Adding JWT tokens
  - Adding multi-tenant headers (`X-Tenant-ID`)
- Response interceptor (handled by AuthContext for token refresh)

**API Modules**:
- `authAPI` - Authentication endpoints
- `tripsAPI` - Trip management
- `fleetAPI` - Fleet and driver management
- `cargoAPI` - Cargo operations
- `financialAPI` - Financial transactions
- `lendingAPI` - Lending operations
- `analyticsAPI` - Analytics data
- `matchingAPI` - Cargo-truck matching
- `notificationsAPI` - Notification management
- And more...

### State Management

1. **Server State**: React Query (TanStack Query)
   - All API data
   - Caching and synchronization
   - Background refetching

2. **Client State**: React Context + Local State
   - `AuthContext` - Authentication state
   - `CargoOwnerLayoutContext` - Layout preferences
   - Component-level `useState` for UI state

3. **Form State**: React Hook Form
   - Form validation with Zod
   - Optimistic updates
   - Error handling

### Component Architecture

#### Component Hierarchy:
```
App
├── QueryClientProvider
├── AuthProvider
│   └── Router
│       └── Routes
│           └── Layout Components
│               └── Page Components
│                   └── Feature Components
│                       └── UI Components
```

#### Component Types:

1. **Layout Components** - Structure and navigation
2. **Page Components** - Route handlers, data fetching
3. **Feature Components** - Business logic (dashboards, forms)
4. **UI Components** - Reusable UI primitives (buttons, inputs, modals)

### Key Features

#### 1. Multi-Tenant Support
- Tenant isolation via `X-Tenant-ID` header
- Tenant-specific data and configurations
- Tenant admin dashboard

#### 2. Role-Based Access Control
- Different layouts and routes per role
- Role-specific features and permissions
- Protected routes with authentication

#### 3. Cargo Management
- Create, edit, and manage cargo shipments
- Enhanced cargo forms with location enrichment
- Cargo templates for quick creation
- Cargo matching with trucks

#### 4. Fleet Management
- Truck registration and management
- Driver management
- Maintenance tracking
- Safety management
- Insurance management

#### 5. Bidding System
- Cargo owners can publish loads for bidding
- Fleet owners can bid on available loads
- Auction management
- Bid analytics

#### 6. Transaction Flow
- Match results and booking confirmation
- Contract negotiation
- Payment processing
- Escrow management
- Trip tracking
- Delivery confirmation
- Settlement processing
- Dispute resolution

#### 7. Financial Management
- Payment tracking
- Loan requests and management
- Financial reports
- Analytics and insights

#### 8. Document Management
- Document upload and management
- OCR capabilities
- Document categorization by entity type
- Document status tracking

#### 9. Analytics & Reporting
- Dashboard analytics
- Revenue tracking
- Trip analytics
- Fleet performance
- User analytics
- Custom reports

#### 10. Real-time Features
- WebSocket support for live updates
- Trip tracking
- Notification system
- Real-time matching

### Build Configuration

#### Vite Configuration (`vite.config.ts`):
- **Path Aliases**: `@/` for `src/` directory
- **Code Splitting**: Manual chunks for vendor libraries
- **Dev Server**: Port 5713 with API proxy to `localhost:3000`
- **Build Optimization**: Separate chunks for large libraries (charts, maps)

#### Code Splitting Strategy:
- `react-vendor` - React core libraries
- `form-vendor` - Form handling libraries
- `ui-vendor` - UI component libraries
- `chartjs` & `recharts` - Chart libraries (separate chunks)
- `leaflet` & `react-leaflet` - Map libraries (separate chunks)
- `export-vendor` - PDF/export libraries
- `query-vendor` - React Query
- `utils-vendor` - Utility libraries
- `analytics-vendor` - PostHog

### Styling System

**Tailwind CSS** with custom configuration:
- Custom color palette (primary, secondary, success, warning, error)
- Custom animations (fade-in, slide-up, slide-down)
- Responsive design utilities
- Dark mode support (via classes)

**Component Styling**:
- Utility-first approach with Tailwind
- Custom UI components in `components/ui/`
- Consistent design system

### Environment Configuration

Environment variables (via `config/environment.ts`):
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_POSTHOG_API_KEY` - PostHog analytics key
- `VITE_ENABLE_ANALYTICS` - Enable/disable analytics
- `VITE_APP_NAME` - Application name
- `VITE_APP_ENV` - Environment (development/production)
- `VITE_ENABLE_DEBUG` - Debug mode

### Development Workflow

1. **Development Server**:
   ```bash
   npm run dev
   ```
   - Starts Vite dev server on port 5713
   - Hot module replacement (HMR)
   - API proxy to backend

2. **Build for Production**:
   ```bash
   npm run build
   ```
   - TypeScript compilation
   - Vite build with optimizations
   - Code splitting and minification

3. **Linting**:
   ```bash
   npm run lint
   ```
   - ESLint with TypeScript support

4. **Preview Production Build**:
   ```bash
   npm run preview
   ```

### Error Handling

1. **API Errors**:
   - Axios interceptors handle 401 errors (token refresh)
   - React Query error boundaries
   - Toast notifications for user feedback

2. **Component Errors**:
   - ErrorBoundary component for React errors
   - Graceful fallbacks

3. **Form Validation**:
   - Zod schema validation
   - Field-level error messages
   - Form-level error handling

### Performance Optimizations

1. **Code Splitting**:
   - Lazy loading of route components
   - Manual vendor chunk splitting
   - Dynamic imports for heavy libraries

2. **Data Fetching**:
   - React Query caching
   - Request deduplication
   - Background refetching
   - Stale-while-revalidate pattern

3. **Rendering**:
   - React.memo for expensive components
   - useMemo/useCallback for expensive computations
   - Virtual scrolling for large lists

### Testing & Quality

- TypeScript for type safety
- ESLint for code quality
- Component structure for testability

### Deployment

The application is configured for deployment on:
- **Vercel** (via `vercel.json`)
- **Netlify** (via `public/_redirects`)
- Any static hosting service

Build output goes to `dist/` directory.

## Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- Backend API running on `http://localhost:3000` (or configured via env)

### Installation

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   # or
   pnpm install
   ```

2. Configure environment variables:
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_POSTHOG_API_KEY=your_posthog_key_here
   VITE_ENABLE_ANALYTICS=true
   VITE_APP_NAME=UrutiX
   VITE_APP_ENV=development
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open browser:
   Navigate to `http://localhost:5713`

## Key Design Patterns

1. **Container/Presentational Pattern**: Pages fetch data, components present UI
2. **Custom Hooks**: Reusable logic (useAuth, useSearchParamsState)
3. **Compound Components**: Complex UI components (modals, forms)
4. **Provider Pattern**: Context providers for global state
5. **Service Layer Pattern**: API calls abstracted in service modules

## Best Practices

1. **Type Safety**: All components and functions are typed
2. **Code Organization**: Feature-based folder structure
3. **Reusability**: Shared components in `components/ui/`
4. **Performance**: Lazy loading and code splitting
5. **Accessibility**: Radix UI components for accessibility
6. **Error Handling**: Comprehensive error boundaries and fallbacks

## Future Enhancements

- Unit and integration tests
- E2E testing with Playwright/Cypress
- Storybook for component documentation
- Performance monitoring
- Enhanced offline support
- Progressive Web App (PWA) features
