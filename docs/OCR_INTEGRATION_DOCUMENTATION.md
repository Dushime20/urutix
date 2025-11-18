# OCR Integration Documentation

## Overview

This document describes the OCR (Optical Character Recognition) integration implemented in the Cargo AI Matching platform. The OCR functionality allows users to upload documents and automatically extract text and structured data from images and PDFs.

## Features

### 🎯 Core Features

1. **Document Upload & Processing**
   - Support for images (JPEG, PNG, GIF)
   - Support for PDF documents
   - File size validation (10MB limit)
   - File type validation

2. **Text Extraction**
   - General text extraction from any document
   - Confidence scoring for extraction quality
   - Multi-page PDF support
   - Image-to-text conversion

3. **Structured Data Extraction**
   - Vehicle Registration documents
   - Insurance Policy documents
   - Driver License documents
   - Maintenance Record documents
   - Inspection Report documents

4. **Document Type Recognition**
   - Automatic document type detection
   - Custom extraction rules per document type
   - Structured data output

## Backend Implementation

### OCR Controller (`backend/src/modules/ocr/ocr.controller.ts`)

```typescript
@Controller('ocr')
export class OcrController {
  // Extract text from URL
  @Post('extract')
  async extractText(@Body() body: { url: string })

  // Upload file and extract text
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndExtract(@UploadedFile() file: Express.Multer.File)

  // Extract specific document data
  @Post('extract-document')
  async extractDocumentData(@Body() body: { url: string; documentType: string })
}
```

### OCR Service (`backend/src/modules/ocr/ocr.service.ts`)

#### Key Methods:

1. **`extractText(url: string)`**
   - Extracts text from URL (image or PDF)
   - Handles both direct text extraction and OCR fallback

2. **`extractFromFile(file: Express.Multer.File)`**
   - Processes uploaded files
   - Supports images and PDFs
   - Returns confidence score

3. **`extractDocumentData(url: string, documentType: string)`**
   - Extracts structured data based on document type
   - Uses regex patterns for data extraction
   - Returns both text and structured data

#### Document Type Extractors:

- **Vehicle Registration**: License plate, VIN, make/model, year, expiry date
- **Insurance Policy**: Policy number, company, coverage amount, premium, dates
- **Driver License**: License number, name, state, expiry date, license class
- **Maintenance Record**: Service type, cost, date, mileage, technician
- **Inspection Report**: Inspection type, result, score, date, inspector

## Frontend Implementation

### OCR API Service (`frontend/src/services/ocrApi.ts`)

```typescript
export const ocrApi = {
  // Extract text from URL
  extractFromUrl(url: string): Promise<OcrExtractionResult>

  // Upload file and extract text
  uploadAndExtract(file: File): Promise<DocumentUploadResult>

  // Extract specific document data
  extractDocumentData(url: string, documentType: string): Promise<OcrExtractionResult>

  // Upload and extract document data
  uploadAndExtractDocument(file: File, documentType: string): Promise<DocumentUploadResult>
}
```

### OCR Upload Component (`frontend/src/components/OCR/OcrDocumentUpload.tsx`)

#### Features:
- Drag & drop file upload
- File type validation
- Image preview
- Processing status indicator
- Results display with confidence scoring
- Copy text and download functionality

#### Props:
```typescript
interface OcrDocumentUploadProps {
  documentType?: string;
  onExtractionComplete?: (result: OcrExtractionResult) => void;
  onClose?: () => void;
}
```

## Integration Points

### 1. Truck Records Integration

The OCR functionality is integrated into the Truck Records page with the following features:

- **Documents Tab**: OCR upload for general documents
- **Maintenance Tab**: OCR upload for maintenance records
- **Inspections Tab**: OCR upload for inspection reports
- **Insurance Tab**: OCR upload for insurance policies

### 2. Document Types Supported

| Document Type | Extracted Fields |
|---------------|------------------|
| Vehicle Registration | License plate, VIN, make/model, year, expiry date |
| Insurance Policy | Policy number, company, coverage, premium, dates |
| Driver License | License number, name, state, expiry, class |
| Maintenance Record | Service type, cost, date, mileage, technician |
| Inspection Report | Type, result, score, date, inspector |

## API Endpoints

### POST `/ocr/extract`
Extract text from URL
```json
{
  "url": "https://example.com/document.pdf"
}
```

### POST `/ocr/upload`
Upload file and extract text
```
Content-Type: multipart/form-data
file: [binary file data]
```

### POST `/ocr/extract-document`
Extract structured data from URL
```json
{
  "url": "https://example.com/document.pdf",
  "documentType": "vehicle_registration"
}
```

## Usage Examples

### 1. Basic Text Extraction

```typescript
import { ocrApi } from '../services/ocrApi';

// Extract text from URL
const result = await ocrApi.extractFromUrl('https://example.com/document.pdf');
console.log(result.text);
console.log(result.confidence);
```

### 2. File Upload and Processing

```typescript
const file = event.target.files[0];
const result = await ocrApi.uploadAndExtract(file);
console.log(result.text);
console.log(result.confidence);
```

### 3. Structured Data Extraction

```typescript
const result = await ocrApi.extractDocumentData(url, 'vehicle_registration');
console.log(result.extractedData);
// Output: { licensePlate: "ABC-123", vin: "1HGBH41JXMN109186", ... }
```

## Error Handling

### Backend Errors
- File type validation
- File size limits (10MB)
- Processing errors with detailed messages
- Graceful fallback for failed extractions

### Frontend Errors
- Network error handling
- File validation errors
- Processing timeout handling
- User-friendly error messages

## Performance Considerations

### Backend
- Async processing for large files
- Memory management for PDF processing
- Temporary file cleanup
- Confidence scoring for quality assessment

### Frontend
- File size validation before upload
- Progress indicators during processing
- Result caching for repeated uploads
- Responsive UI during processing

## Security Considerations

### File Upload Security
- File type validation
- File size limits
- Secure file handling
- Temporary file cleanup

### API Security
- JWT authentication required
- Rate limiting (to be implemented)
- Input validation
- Error message sanitization

## Testing

### Test Routes
- `/dashboard/fleet/ocr-test` - OCR test page
- `/dashboard/fleet/trucks/:truckId/records` - Integrated OCR in truck records

### Test Scenarios
1. Upload image document
2. Upload PDF document
3. Extract vehicle registration data
4. Extract insurance policy data
5. Handle invalid file types
6. Handle large files
7. Test confidence scoring

## Future Enhancements

### Planned Features
1. **Advanced Document Recognition**
   - Machine learning-based document classification
   - Improved accuracy for complex documents

2. **Batch Processing**
   - Multiple file upload
   - Bulk document processing

3. **Real-time Processing**
   - WebSocket integration for real-time updates
   - Progress tracking for large files

4. **Enhanced Data Extraction**
   - More document types
   - Better regex patterns
   - AI-powered data extraction

5. **Integration with External Services**
   - Google Vision API integration
   - AWS Textract integration
   - Azure Computer Vision integration

## Dependencies

### Backend Dependencies
```json
{
  "tesseract.js": "^6.0.1",
  "pdf-parse": "^1.1.1",
  "pdfjs-dist": "^3.11.174",
  "canvas": "^3.1.2",
  "multer": "^1.4.5-lts.1",
  "@types/multer": "^1.4.7"
}
```

### Frontend Dependencies
- React Icons (for UI icons)
- Axios (for API calls)
- File API (for file handling)

## Configuration

### Environment Variables
```env
# OCR Configuration
OCR_MAX_FILE_SIZE=10485760  # 10MB in bytes
OCR_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf
OCR_TEMP_DIR=./temp
```

### File Upload Configuration
```typescript
// Multer configuration
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});
```

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size (max 10MB)
   - Verify file type (images or PDFs only)
   - Check network connection

2. **OCR Processing Fails**
   - Verify image quality (clear, readable text)
   - Check PDF accessibility (not password protected)
   - Ensure sufficient server resources

3. **Low Confidence Scores**
   - Improve image quality
   - Use higher resolution images
   - Ensure good lighting and contrast

4. **Missing Extracted Data**
   - Verify document type selection
   - Check if document format matches expected structure
   - Review regex patterns for specific document types

## Support

For technical support or feature requests related to OCR functionality, please refer to the development team or create an issue in the project repository.

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready 