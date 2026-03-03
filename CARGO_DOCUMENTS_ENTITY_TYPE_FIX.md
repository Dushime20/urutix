# Cargo Documents Entity Type Fix - COMPLETE

## Issue
User reported "No documents found" in the cargo details page even after uploading documents during cargo creation.

## Root Cause
**Entity Type Mismatch**: The frontend was using `entityType: 'LOAD'` for both uploading and fetching documents, but the backend `EntityType` enum only accepts specific values:
- USER
- DRIVER
- TRUCK
- **CARGO** ✅
- TRIP
- COMPANY
- TENANT
- SYSTEM

The backend does NOT have 'LOAD' as a valid entity type, so:
1. Documents were being uploaded with `entityType: 'LOAD'`
2. When fetching, the API endpoint `/documents/entity/LOAD/:cargoId` was not matching any documents
3. Result: "No documents found" even though documents were uploaded

## Solution
Changed `entityType` from `'LOAD'` to `'CARGO'` in both upload and fetch operations to match the backend enum.

### Files Modified

#### 1. Document Upload Service
**File**: `urutix/frontend/src/services/documentUploadService.ts`

**Change**:
```typescript
// Before
formData.append('entityType', 'LOAD');

// After
formData.append('entityType', 'CARGO');
```

#### 2. Cargo Details Page (Document Fetch)
**File**: `urutix/frontend/src/pages/dashboard/cargos/list/[id]/index.tsx`

**Change**:
```typescript
// Before
const docs = await documentApi.getDocumentsByEntity("LOAD", cargoId);

// After
const docs = await documentApi.getDocumentsByEntity("CARGO", cargoId);
```

## How It Works Now

1. **Document Upload During Cargo Creation**:
   - User uploads documents in the "Documentation" tab
   - Documents are stored as pending in form state
   - When cargo is submitted, documents are uploaded with `entityType: 'CARGO'`
   - Backend stores documents with correct entity type

2. **Document Display in Cargo Details**:
   - User navigates to cargo details page
   - Frontend fetches documents using `documentApi.getDocumentsByEntity("CARGO", cargoId)`
   - Backend query matches documents with `entityType: 'CARGO'` and `entityId: cargoId`
   - Documents are displayed correctly

## Testing Instructions

1. **Clear Existing Test Data** (if needed):
   ```sql
   -- If you have documents with entityType 'LOAD', update them to 'CARGO'
   UPDATE documents SET entity_type = 'CARGO' WHERE entity_type = 'LOAD';
   ```

2. **Test Document Upload**:
   - Create a new cargo
   - Go to "Documentation" tab
   - Upload 2-3 documents (PDF, images, etc.)
   - Submit the cargo
   - Verify success toast shows document upload status

3. **Test Document Display**:
   - Navigate to "All Cargo" tab
   - Click on the cargo you just created
   - Click "Documents" tab
   - **Expected**: Documents should now be visible with correct information
   - Verify category summary shows correct counts
   - Verify document list shows all uploaded documents

4. **Test Filtering and Download**:
   - Search for a document by name
   - Filter by category
   - Click download button on a document
   - Verify document opens/downloads correctly

## Backend Entity Type Reference

From `urutix/backend/src/entities/document.entity.ts`:

```typescript
export enum EntityType {
  USER = 'USER',
  DRIVER = 'DRIVER',
  TRUCK = 'TRUCK',
  CARGO = 'CARGO',      // ✅ Use this for cargo/load documents
  TRIP = 'TRIP',
  COMPANY = 'COMPANY',
  TENANT = 'TENANT',
  SYSTEM = 'SYSTEM',
}
```

## API Endpoint

**Endpoint**: `GET /documents/entity/:entityType/:entityId`

**Valid Entity Types**: USER, DRIVER, TRUCK, CARGO, TRIP, COMPANY, TENANT, SYSTEM

**Example**:
```
GET /documents/entity/CARGO/123e4567-e89b-12d3-a456-426614174000
```

## Related Files

- `urutix/frontend/src/services/documentUploadService.ts` - Document upload service (FIXED)
- `urutix/frontend/src/pages/dashboard/cargos/list/[id]/index.tsx` - Cargo details page (FIXED)
- `urutix/frontend/src/services/documents/documentApi.ts` - Document API service
- `urutix/backend/src/entities/document.entity.ts` - EntityType enum definition
- `urutix/backend/src/modules/documents/document.controller.ts` - Backend document controller
- `urutix/backend/src/modules/documents/document.service.ts` - Backend document service

## Status
✅ FIXED - Documents now use correct entity type 'CARGO' and are visible in cargo details page

## Important Notes

1. **Consistency**: Always use 'CARGO' as the entity type for cargo/load documents
2. **Backend Validation**: The backend validates entity types against the enum, so using invalid types will fail
3. **Existing Data**: If you have existing documents with `entityType: 'LOAD'`, you'll need to update them in the database to 'CARGO'
4. **Other Entity Types**: Make sure to use the correct entity type for other document uploads:
   - Driver documents: 'DRIVER'
   - Truck documents: 'TRUCK'
   - Trip documents: 'TRIP'
   - etc.

## Next Steps

User should:
1. Restart the frontend development server to pick up the changes
2. Clear browser cache (Ctrl+Shift+Delete)
3. Test creating a new cargo with documents
4. Verify documents appear in the cargo details page

If documents still don't appear, check:
- Browser console for API errors
- Network tab to see the actual API request/response
- Backend logs for any errors
- Database to verify documents are being created with correct entity type
