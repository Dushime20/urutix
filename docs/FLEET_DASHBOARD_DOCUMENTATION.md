# Fleet Dashboard Documentation

## Overview

The Fleet Dashboard is a comprehensive fleet management system built for truck owners and fleet operators. It provides a complete interface for managing trucks, drivers, and fleet operations with real-time tracking, analytics, and administrative capabilities.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [Data Models](#data-models)
4. [API Integration](#api-integration)
5. [Routing Structure](#routing-structure)
6. [Features](#features)
7. [Usage Guide](#usage-guide)
8. [Development Guide](#development-guide)
9. [API Reference](#api-reference)

## Architecture Overview

The Fleet Dashboard follows a modular architecture with clear separation of concerns:

```
frontend/src/
├── components/
│   ├── Layout/
│   │   ├── FleetOwnerLayout.tsx      # Main layout wrapper
│   │   └── FleetOwnerSidebar.tsx     # Navigation sidebar
│   └── FleetDashboard/
│       ├── FleetDashboard.tsx        # Main dashboard component
│       ├── FleetFilters.tsx          # Search and filtering
│       ├── FleetTable.tsx            # Data display component
│       ├── FleetModal.tsx            # Detail view modal
│       ├── FleetForm.tsx             # Create/edit forms
│       └── FleetSkeleton.tsx         # Loading states
├── pages/
│   └── FleetDashboard.tsx            # Page wrapper
├── services/
│   └── fleetApi.ts                   # API service layer
└── types/
    └── fleet.ts                      # TypeScript definitions
```

## Component Structure

### 1. FleetOwnerLayout.tsx
**Purpose**: Main layout wrapper for fleet owner interface

**Features**:
- Responsive header with search functionality
- User menu with profile and logout options
- Notification system
- Collapsible sidebar integration

**Props**: None (uses context for authentication)

**Key Methods**:
- `toggleSidebar()` - Toggle sidebar visibility
- `handleLogout()` - User logout functionality

### 2. FleetOwnerSidebar.tsx
**Purpose**: Navigation sidebar with fleet-specific menu items

**Features**:
- Organized navigation sections
- Collapsible design
- Active state indicators
- Role-based menu items

**Props**:
```typescript
interface FleetOwnerSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}
```

**Navigation Sections**:
- Fleet Management
- Driver Management
- Analytics & Reports
- Operations
- Financial Management
- Account & Settings
- Reputation & Rewards
- Safety & Compliance

### 3. FleetDashboard.tsx
**Purpose**: Main dashboard component with fleet management functionality

**Features**:
- Tab navigation (Trucks/Drivers)
- Interactive map with fleet locations
- Real-time data updates
- CRUD operations
- Export functionality
- Infinite scroll pagination

**State Management**:
```typescript
const [fleetItems, setFleetItems] = useState<FleetItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState<'trucks' | 'drivers'>('trucks');
const [view, setView] = useState<'grid' | 'list'>('list');
```

**Key Methods**:
- `loadFleetItems()` - Fetch fleet data with pagination
- `handleCreateFleetItem()` - Create new fleet item
- `handleUpdateFleetItem()` - Update existing fleet item
- `handleDeleteFleetItem()` - Delete fleet item
- `handleExport()` - Export fleet data to CSV

### 4. FleetFilters.tsx
**Purpose**: Advanced filtering and search functionality

**Features**:
- Search by name, license, or location
- Status filtering
- Location filtering
- Active filter display
- Clear filters functionality

**Props**:
```typescript
interface FleetFiltersProps {
  filters: FleetFiltersType;
  setFilters: (filters: FleetFiltersType) => void;
  search: string;
  setSearch: (search: string) => void;
  activeTab: 'trucks' | 'drivers';
}
```

### 5. FleetTable.tsx
**Purpose**: Data display component with grid and list views

**Features**:
- Responsive table design
- Grid and list view modes
- Action buttons (Edit, Delete, View)
- Status indicators
- Contact information display

**Props**:
```typescript
interface FleetTableProps {
  fleetItems: FleetItem[];
  lastFleetItemRef: (node: HTMLElement | null) => void;
  view: 'grid' | 'list';
  activeTab: 'trucks' | 'drivers';
  onRowClick: (item: FleetItem) => void;
  onBulkAction: (action: 'delete' | 'export' | 'update', selectedIds: string[]) => void;
  onEditFleetItem: (item: FleetItem) => void;
  onDeleteFleetItem: (itemId: string) => void;
}
```

### 6. FleetModal.tsx
**Purpose**: Detailed view modal for fleet items

**Features**:
- Comprehensive item details
- Contact information
- Vehicle/Driver specific information
- Document management
- Timestamps

**Props**:
```typescript
interface FleetModalProps {
  fleetItem: FleetItem | null;
  onClose: () => void;
  activeTab: 'trucks' | 'drivers';
}
```

### 7. FleetForm.tsx
**Purpose**: Create and edit forms for fleet items

**Features**:
- Dynamic form fields based on item type
- Validation
- Contact information management
- Loading states

**Props**:
```typescript
interface FleetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData: FleetItem | null;
  mode: 'create' | 'edit';
  activeTab: 'trucks' | 'drivers';
}
```

## Data Models

### FleetItem Interface
```typescript
interface FleetItem {
  id: string;
  type: 'truck' | 'driver';
  name: string;
  status: FleetStatus;
  currentLocation?: {
    coordinates: {
      coordinates: number[];
    };
    address?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Truck specific fields
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  capacity?: number;
  fuelType?: string;
  currentDriver?: {
    id: string;
    name: string;
  };
  
  // Driver specific fields
  firstName?: string;
  lastName?: string;
  licenseNumber?: string;
  licenseType?: string;
  experience?: number;
  currentTruck?: {
    id: string;
    licensePlate: string;
  };
  
  // Common fields
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  documents?: FleetDocument[];
  maintenance?: MaintenanceRecord[];
  trips?: TripRecord[];
}
```

### FleetStatus Enum
```typescript
enum FleetStatus {
  AVAILABLE = 'available',
      IN_TRANSIT = 'IN_TRANSIT',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
  ASSIGNED = 'assigned',
  ON_BREAK = 'on_break'
}
```

### FleetFilters Interface
```typescript
interface FleetFilters {
  status?: FleetStatus;
  location?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  type?: 'truck' | 'driver';
}
```

## API Integration

### fleetApi.ts Service

**Key Functions**:

1. **fetchFleet()**
   ```typescript
   fetchFleet(
     page: number = 1,
     search: string = '',
     filters: FleetFilters = {},
     type: 'trucks' | 'drivers' = 'trucks'
   ): Promise<FleetData>
   ```

2. **createFleetItem()**
   ```typescript
   createFleetItem(data: any, type: 'trucks' | 'drivers'): Promise<FleetItem>
   ```

3. **updateFleetItem()**
   ```typescript
   updateFleetItem(id: string, data: any, type: 'trucks' | 'drivers'): Promise<FleetItem>
   ```

4. **deleteFleetItem()**
   ```typescript
   deleteFleetItem(id: string, type: 'trucks' | 'drivers'): Promise<void>
   ```

5. **exportFleet()**
   ```typescript
   exportFleet(search: string, filters: FleetFilters, type: 'trucks' | 'drivers'): Promise<void>
   ```

6. **subscribeFleetUpdates()**
   ```typescript
   subscribeFleetUpdates(callback: (update: Partial<FleetItem>) => void): () => void
   ```

## Routing Structure

### Fleet Routes
```
/dashboard/fleet/
├── / (Dashboard)
├── /trucks (Truck Management)
├── /drivers (Driver Management)
├── /trucks/create (Add Truck)
├── /drivers/create (Add Driver)
├── /assignments (Driver Assignments)
├── /analytics (Fleet Analytics)
├── /reports (Financial Reports)
├── /history (Trip History)
├── /tracking (Live Tracking)
├── /routes (Route Planning)
├── /maintenance (Vehicle Maintenance)
├── /payments (Payment Management)
├── /revenue (Revenue Reports)
├── /profile (User Profile)
├── /settings (Account Settings)
├── /notifications (Notifications)
├── /support (Help & Support)
├── /ratings (Driver Ratings)
├── /rewards (Rewards)
├── /scoring (Credit Scoring)
├── /safety (Safety Records)
└── /insurance (Insurance Management)
```

## Features

### 1. Fleet Management
- **Truck Management**: Add, edit, delete trucks with detailed information
- **Driver Management**: Manage driver profiles, licenses, and assignments
- **Status Tracking**: Real-time status updates for all fleet items
- **Location Tracking**: Interactive map with current fleet locations

### 2. Search and Filtering
- **Advanced Search**: Search by name, license plate, or location
- **Status Filtering**: Filter by availability, in-transit, maintenance, etc.
- **Location Filtering**: Filter by geographic location
- **Active Filters**: Visual display of applied filters with easy removal

### 3. Data Visualization
- **Interactive Map**: Real-time fleet location tracking using Leaflet
- **Grid/List Views**: Toggle between different data display modes
- **Status Indicators**: Color-coded status badges
- **Contact Information**: Quick access to phone and email

### 4. CRUD Operations
- **Create**: Add new trucks and drivers with comprehensive forms
- **Read**: View detailed information in modal dialogs
- **Update**: Edit existing fleet items with form validation
- **Delete**: Remove fleet items with confirmation

### 5. Export Functionality
- **CSV Export**: Export filtered data to CSV format
- **Customizable Fields**: Select specific fields for export
- **Date Stamping**: Automatic filename generation with timestamps

### 6. Real-time Updates
- **Live Status**: Real-time status updates
- **Location Updates**: Live location tracking
- **Notification System**: Real-time notifications for important events

## Usage Guide

### For Fleet Owners

#### 1. Getting Started
1. Log in with your fleet owner credentials
2. You'll be redirected to `/dashboard/fleet`
3. The dashboard shows an overview of your fleet

#### 2. Managing Trucks
1. Click on the "Trucks" tab
2. Use the search bar to find specific trucks
3. Click "Add Truck" to register a new vehicle
4. Fill in the required information (name, license plate, etc.)
5. Use the filters to view trucks by status or location

#### 3. Managing Drivers
1. Click on the "Drivers" tab
2. Add new drivers with their license information
3. Assign drivers to trucks using the assignments feature
4. Track driver status and experience

#### 4. Monitoring Fleet
1. Use the interactive map to see all fleet locations
2. Monitor real-time status updates
3. Export data for reporting purposes
4. Use analytics to track performance

#### 5. Maintenance Tracking
1. Access the maintenance section
2. Schedule vehicle maintenance
3. Track maintenance costs and history
4. Set up maintenance reminders

### For Developers

#### 1. Adding New Features
1. Create new components in `components/FleetDashboard/`
2. Add types to `types/fleet.ts`
3. Update API service in `services/fleetApi.ts`
4. Add routes in `App.tsx`

#### 2. Customizing the Dashboard
1. Modify `FleetDashboard.tsx` for layout changes
2. Update `FleetOwnerSidebar.tsx` for navigation changes
3. Customize forms in `FleetForm.tsx`
4. Adjust filters in `FleetFilters.tsx`

#### 3. API Integration
1. Replace mock data in `fleetApi.ts` with real API calls
2. Update error handling for production
3. Implement real-time updates using WebSocket
4. Add authentication headers to API calls

## Development Guide

### Prerequisites
- Node.js 16+
- React 18+
- TypeScript 4.5+
- Tailwind CSS 3.0+

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Project Structure
```
frontend/src/
├── components/
│   ├── Layout/           # Layout components
│   └── FleetDashboard/   # Fleet-specific components
├── pages/                # Page components
├── services/             # API services
├── types/                # TypeScript definitions
└── utils/                # Utility functions
```

### Key Dependencies
- **React Router**: Navigation and routing
- **React Query**: Data fetching and caching
- **Leaflet**: Interactive maps
- **React Icons**: Icon library
- **Tailwind CSS**: Styling framework

### State Management
The application uses React's built-in state management:
- `useState` for local component state
- `useEffect` for side effects
- `useCallback` for performance optimization
- Context API for global state (authentication)

### Error Handling
- Error boundaries for component-level error handling
- Try-catch blocks in async operations
- User-friendly error messages
- Loading states for better UX

### Performance Optimization
- React.memo for component memoization
- useCallback for function memoization
- useMemo for expensive calculations
- Lazy loading for route-based code splitting
- Infinite scroll for large datasets

## API Reference

### Fleet API Endpoints

#### GET /api/fleet/trucks
**Description**: Get all trucks with pagination and filtering

**Query Parameters**:
- `page` (number): Page number for pagination
- `search` (string): Search term
- `status` (string): Filter by status
- `location` (string): Filter by location

**Response**:
```json
{
  "items": [
    {
      "id": "string",
      "type": "truck",
      "name": "string",
      "status": "string",
      "licensePlate": "string",
      "make": "string",
      "model": "string",
      "year": "number",
      "capacity": "number",
      "fuelType": "string",
      "currentLocation": {
        "coordinates": [number, number],
        "address": "string"
      },
      "currentDriver": {
        "id": "string",
        "name": "string"
      },
      "contactInfo": {
        "phone": "string",
        "email": "string"
      },
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "hasMore": "boolean",
  "total": "number"
}
```

#### GET /api/fleet/drivers
**Description**: Get all drivers with pagination and filtering

**Query Parameters**: Same as trucks endpoint

**Response**: Similar structure with driver-specific fields

#### POST /api/fleet/trucks
**Description**: Create a new truck

**Request Body**:
```json
{
  "name": "string",
  "licensePlate": "string",
  "make": "string",
  "model": "string",
  "year": "number",
  "capacity": "number",
  "fuelType": "string",
  "contactInfo": {
    "phone": "string",
    "email": "string"
  }
}
```

#### POST /api/fleet/drivers
**Description**: Create a new driver

**Request Body**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "licenseNumber": "string",
  "licenseType": "string",
  "experience": "number",
  "contactInfo": {
    "phone": "string",
    "email": "string"
  }
}
```

#### PATCH /api/fleet/trucks/{id}
**Description**: Update an existing truck

#### PATCH /api/fleet/drivers/{id}
**Description**: Update an existing driver

#### DELETE /api/fleet/trucks/{id}
**Description**: Delete a truck

#### DELETE /api/fleet/drivers/{id}
**Description**: Delete a driver

### WebSocket Events

#### Fleet Status Updates
```json
{
  "type": "fleet_status_update",
  "data": {
    "id": "string",
    "status": "string",
    "currentLocation": {
      "coordinates": [number, number],
      "address": "string"
    }
  }
}
```

#### New Fleet Item
```json
{
  "type": "fleet_item_created",
  "data": {
    "item": "FleetItem"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Map Not Loading
- Check if Leaflet CSS is imported
- Verify map container has proper dimensions
- Ensure coordinates are in correct format [lng, lat]

#### 2. Real-time Updates Not Working
- Check WebSocket connection
- Verify event subscription
- Check browser console for errors

#### 3. Form Validation Errors
- Ensure all required fields are filled
- Check field types (number vs string)
- Verify email format

#### 4. Export Not Working
- Check browser download permissions
- Verify CSV data format
- Check file size limits

### Debug Mode
Enable debug mode by setting:
```javascript
localStorage.setItem('debug', 'true');
```

### Performance Monitoring
Use React DevTools Profiler to monitor component performance and identify bottlenecks.

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Testing
- Write unit tests for utility functions
- Test component rendering
- Test API integration
- Test error scenarios

### Documentation
- Update this documentation for new features
- Add JSDoc comments for functions
- Include usage examples
- Document breaking changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Contact the development team 