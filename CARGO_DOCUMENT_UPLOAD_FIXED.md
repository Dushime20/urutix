# Cargo Document Upload During Creation - FIXED

## Issue
User reported error: "Please save the cargo first before uploading documents" when trying to upload documents during cargo creation, before the cargo was saved.

## Root Cause
The `DocumentUploadSection` component in `urutix/frontend/src/pages/dashboard/cargos/create/components/form/DocumentUploadSection.tsx` had two code paths:

1. **NEW BEHAVIOR** (Pending Documents): Store documents temporarily and upload after cargo is saved
2. **OLD BEHAVIOR** (Immediate Upload): Try to upload immediately, requiring cargo to be saved first

The form was passing the `onRequireSave` callback, which triggered the OLD BEHAVIOR code path instead of the new pending documents feature.

## Solution

### 1. Updated Form Integration
**File**: `urutix/frontend/src/pages/dashboard/cargos/create/components/form/index.tsx`

**Changes**:
- Removed `onRequireSave` callback from DocumentUploadSection props
- Explicitly set `allowPendingDocuments={true}` to enable pending document mode
- Added imports for `PendingDocument` type and `uploadCargoDocumentsWithRetry` function
- Added document upload logic in `handleSubmit` function to upload pending documents after cargo is created

**Before**:
```tsx
<DocumentUploadSection
  cargoId={createdCargoId || initialData?.id || null}
  documents={formData.documents || []}
  onDocumentsChange={(docs) => setFormData(prev => ({ ...prev, documents: docs }))}
  onRequireSave={async () => {
    // This triggered the old behavior
    if (onSaveDraft) {
      try {
        await onSaveDraft(formData);
        return createdCargoId;
      } catch (e) {
        return null;
      }
    }
    return null;
  }}
/>
```

**After**:
```tsx
<DocumentUploadSection
  cargoId={createdCargoId || initialData?.id || null}
  documents={formData.documents || []}
  onDocumentsChange={(docs) => setFormData(prev => ({ ...prev, documents: docs }))}
  allowPendingDocuments={true}
/>
```

### 2. Added Document Upload After Cargo Creation
In the `handleSubmit` function, added logic to upload pending documents after the cargo is successfully created:

```tsx
// Upload pending documents if any
const pendingDocs = (formData.documents || []).filter(
  (doc: any) => 'isPending' in doc && doc.isPending
) as PendingDocument[];

if (pendingDocs.length > 0 && result && result.id) {
  try {
    const uploadResult = await uploadCargoDocumentsWithRetry(
      result.id,
      pendingDocs,
      2, // max retries
      (current, total, status) => {
        console.log(`Uploading documents: ${current}/${total} - ${status}`);
      }
    );

    if (uploadResult.failed > 0) {
      toast.error(
        `${uploadResult.successful} of ${uploadResult.total} documents uploaded. ${uploadResult.failed} failed.`,
        { duration: 5000 }
      );
    } else {
      toast.success(`All ${uploadResult.successful} documents uploaded successfully!`);
    }
  } catch (uploadError) {
    console.error('Failed to upload documents:', uploadError);
    toast.error('Cargo created but some documents failed to upload');
  }
}
```

## How It Works Now

1. **During Cargo Creation**:
   - User can add documents by dragging/dropping or clicking to select files
   - Documents are stored as "pending" in the form state
   - A blue info message shows: "Documents will be uploaded automatically when you save the cargo"
   - Pending documents are marked with an amber badge showing "Pending"

2. **When User Submits Cargo**:
   - Cargo is created first via the API
   - After successful cargo creation, pending documents are automatically uploaded
   - Upload progress is logged to console
   - Success/error toasts inform the user of upload results

3. **User Experience**:
   - No more "Please save the cargo first" error
   - Documents can be added at any time during cargo creation
   - Documents are uploaded automatically after cargo is saved
   - Clear visual feedback with pending badges and info messages

## Files Modified

1. `urutix/frontend/src/pages/dashboard/cargos/create/components/form/index.tsx`
   - Removed `onRequireSave` callback
   - Added `allowPendingDocuments={true}` prop
   - Added document upload logic in `handleSubmit`
   - Added imports for document upload functionality

2. `urutix/frontend/src/pages/dashboard/cargos/create/components/form/DocumentUploadSection.tsx`
   - Already had pending document support (from previous implementation)
   - No changes needed - just needed to be used correctly

## Testing Instructions

1. Navigate to cargo creation page
2. Fill in basic cargo information (title, type, weight, etc.)
3. Go to "Documentation" tab
4. Upload one or more documents (drag & drop or click to select)
5. Verify documents show as "Pending" with amber badge
6. Verify blue info message appears
7. Complete other required fields
8. Click "CREATE CARGO" button
9. Verify cargo is created successfully
10. Verify success toast shows document upload status
11. Check that documents are associated with the created cargo

## Related Files

- `urutix/frontend/src/services/documentUploadService.ts` - Document upload service with retry logic
- `urutix/frontend/src/components/CargoDashboard/DocumentUploadSection.tsx` - Alternative document upload component (used in CreateCargoModal)
- `urutix/frontend/src/components/CargoDashboard/CreateCargoModal.tsx` - Alternative cargo creation modal
- `urutix/backend/src/modules/documents/document.controller.ts` - Backend document upload endpoint

## Status
✅ FIXED - Documents can now be uploaded during cargo creation before the cargo is saved
