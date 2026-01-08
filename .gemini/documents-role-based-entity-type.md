# Document Upload Enhancement - Role-Based Entity Type

## Overview
Implemented a role-based entity type system for the document upload functionality. The entity type field is now automatically set based on the logged-in user's role and is read-only, preventing users from uploading documents for entity types that don't match their role.

## Changes Made

### 1. **Added Role-to-Entity Type Mapping**
   - Created a helper function `getRoleBasedEntityType()` that maps user roles to entity types:
     - `CARGO_OWNER` → `CARGO`
     - `TRUCK_OWNER` → `VEHICLE`
     - `FLEET_OWNER` → `VEHICLE`
     - `DRIVER` → `DRIVER`
     - `AGENT` → `USER`
     - `LENDER` → `USER`
     - Default: `CARGO`

### 2. **Integrated Authentication Context**
   - Imported and used `useAuth()` hook to access the current user's information
   - Retrieved user role to determine the appropriate entity type

### 3. **Modified Entity Type Field in Upload Form**
   - **Before**: Editable dropdown with all entity type options
   - **After**: Read-only input field displaying the role-based entity type
   - Added visual indicators:
     - Gray background (`bg-gray-100`)
     - Disabled cursor (`cursor-not-allowed`)
     - Help text showing the user's role
     - Context-sensitive help icon message explaining why the field is locked

### 4. **Updated Entity Type Determination Logic**
   - Priority order for entity type:
     1. `entityTypeOverride` (if provided as prop)
     2. `urlEntityType` (from URL parameters)
     3. `roleBasedEntityType` (derived from user's role)

## User Experience

### For Cargo Owners
- Entity Type: **Cargo** (read-only)
- Help text: "This is automatically set based on your role (CARGO_OWNER). As a Cargo Owner, you can only upload Cargo documents."

### For Truck/Fleet Owners
- Entity Type: **Vehicle** (read-only)
- Help text: "This is automatically set based on your role (TRUCK_OWNER). As a Fleet/Truck Owner, you can only upload Vehicle documents."

### For Drivers
- Entity Type: **Driver** (read-only)
- Help text: "This is automatically set based on your role (DRIVER). As a Driver, you can only upload Driver documents."

### For Other Roles (Agent, Lender)
- Entity Type: **User** (read-only)
- Help text: "This is automatically set based on your role. You can upload documents for your specific entity type."

## Files Modified

1. **`src/pages/DocumentsPage.tsx`**
   - Added `useAuth` import
   - Created `getRoleBasedEntityType()` helper function
   - Modified entity type initialization
   - Converted entity type select field to read-only input
   - Added role-based help text and visual indicators

## Testing Recommendations

### Test Scenario 1: Cargo Owner
1. Log in as a cargo owner
2. Navigate to Documents page
3. Click "Upload Document"
4. Verify:
   - Entity Type field shows "Cargo"
   - Field is grayed out and not editable
   - Help text indicates "Based on your role: CARGO_OWNER"
   - Hover over help icon to see detailed explanation

### Test Scenario 2: Truck/Fleet Owner
1. Log in as a truck/fleet owner
2. Navigate to Documents page
3. Click "Upload Document"
4. Verify:
   - Entity Type field shows "Vehicle"
   - Field is grayed out and not editable
   - Help text indicates the appropriate role

### Test Scenario 3: Driver
1. Log in as a driver
2. Navigate to Documents page
3. Click "Upload Document"
4. Verify:
   - Entity Type field shows "Driver"
   - Field is grayed out and not editable
   - Help text indicates "Based on your role: DRIVER"

### Test Scenario 4: Document Upload Flow
1. As any role, open the upload modal
2. Fill in all required fields (leaving entity type as auto-populated)
3. Upload a document
4. Verify the document is created with the correct entity type

## Benefits

1. **Improved Data Integrity**: Users can only upload documents for entity types that match their role
2. **Better User Experience**: Clear indication of why the field is pre-filled and locked
3. **Reduced Errors**: Prevents accidental uploads to wrong entity types
4. **Security**: Enforces role-based access control at the UI level
5. **Clarity**: Users immediately understand what type of documents they can upload

## Future Enhancements

- Add role-based filtering to show only relevant entity types in the entity selector
- Implement backend validation to enforce entity type restrictions
- Add audit logging for document uploads by role
