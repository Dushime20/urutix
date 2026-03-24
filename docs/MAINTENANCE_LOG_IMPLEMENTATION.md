# Maintenance Log Implementation Plan

This plan outlines the steps to fully implement vehicle maintenance logs, transitioning from the current mock UI to a data-driven, functional feature.

## 1. Backend: Data Infrastructure & API

### 1.1 MaintenanceLog Entity
Create `backend/src/entities/maintenance-log.entity.ts`:
- Fields: `id`, `tenantId`, `truckId`, `driverId`, `taskType`, `serviceDate`, `providerName`, `status` (PENDING, IN_PROGRESS, COMPLETED), `cost`, `description`, `odometerReading`.
- Relation to `Truck`.

### 1.2 Maintenance Module
- **DTOs**: `CreateMaintenanceLogDto`, `UpdateMaintenanceLogDto`.
- **Service**: Implement methods to `createLog`, `getLogsByTruck`, `getLogsByDriver`.
- **Controller**: 
  - `GET /api/maintenance/truck/:truckId` (Allow: ADMIN, MANAGER, DRIVER)
  - `POST /api/maintenance/report` (Allow: DRIVER) - For quick fault reporting.
  - `PUT /api/maintenance/:id` (Allow: ADMIN, MANAGER) - For status updates.

## 2. Frontend: API Integration

### 2.1 Service Layer
Update `frontend/src/services/driverApi.ts`:
- `getMaintenanceHistory(truckId: string)`
- `reportTruckFault(data: any)`

## 3. Frontend: UI Enhancements

### 3.1 Data Synchronization
- Update `MyTruck.tsx` to fetch real service history using `useQuery`.
- Handle loading/empty states for vehicles with no logs.

### 3.2 Fault Reporting Flow
- Create a new `MaintenanceTicketModal.tsx`.
- Connect the "Open Maintenance Ticket" button in `MyTruck.tsx` to this modal.
- Implement form submission to the new backend endpoint.

## 4. Testing & Verification
- Verify that a driver can report a fault and see it appear in the history list.
- Ensure the "Truck Health" metrics reflect the status of the latest logs.
