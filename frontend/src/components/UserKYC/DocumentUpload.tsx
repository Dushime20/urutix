import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Upload, CloudUpload } from '@mui/icons-material';
import { userKycApi, type KycRequirements } from '../../services/userKycApi';

interface DocumentUploadProps {
  requirements?: KycRequirements;
  onUploadComplete?: () => void;
}

const DOCUMENT_TYPES = {
  // Identity Documents
  IDENTITY_DOCUMENT: 'Identity Document',
  PASSPORT: 'Passport',
  DRIVER_LICENSE: 'Driver License',
  
  // Address Documents
  PROOF_OF_ADDRESS: 'Proof of Address',
  UTILITY_BILL: 'Utility Bill',
  
  // Business Documents
  BUSINESS_LICENSE: 'Business License',
  TAX_CERTIFICATE: 'Tax Certificate',
  TRADE_LICENSE: 'Trade License',
  
  // Financial Documents
  BANK_STATEMENT: 'Bank Statement',
  CREDIT_REPORT: 'Credit Report',
  FINANCIAL_STATEMENT: 'Financial Statement',
  
  // Professional Documents
  PROFESSIONAL_CERTIFICATE: 'Professional Certificate',
  BROKER_LICENSE: 'Broker License',
  FINANCIAL_LICENSE: 'Financial License',
  
  // Vehicle/Transport Documents
  VEHICLE_REGISTRATION: 'Vehicle Registration',
  INSURANCE_CERTIFICATE: 'Insurance Certificate',
  SAFETY_CERTIFICATE: 'Safety Certificate',
  
  // Medical/Health Documents
  MEDICAL_CERTIFICATE: 'Medical Certificate',
  SAFETY_TRAINING_CERTIFICATE: 'Safety Training Certificate',
  
  // Regulatory Documents
  REGULATORY_APPROVAL: 'Regulatory Approval',
  COMPLIANCE_CERTIFICATE: 'Compliance Certificate',
  BONDING_CERTIFICATE: 'Bonding Certificate',
  
  // Other
  EXPERIENCE_CERTIFICATE: 'Experience Certificate',
  PROFESSIONAL_REFERENCE: 'Professional Reference',
  AUDIT_REPORT: 'Audit Report',
  OTHER: 'Other',
};

const DOCUMENT_TYPE_TO_CATEGORY = {
  IDENTITY_DOCUMENT: 'IDENTITY',
  PASSPORT: 'IDENTITY',
  DRIVER_LICENSE: 'IDENTITY',
  PROOF_OF_ADDRESS: 'ADDRESS',
  UTILITY_BILL: 'ADDRESS',
  BUSINESS_LICENSE: 'BUSINESS',
  TAX_CERTIFICATE: 'BUSINESS',
  TRADE_LICENSE: 'BUSINESS',
  BANK_STATEMENT: 'FINANCIAL',
  CREDIT_REPORT: 'FINANCIAL',
  FINANCIAL_STATEMENT: 'FINANCIAL',
  PROFESSIONAL_CERTIFICATE: 'PROFESSIONAL',
  BROKER_LICENSE: 'PROFESSIONAL',
  FINANCIAL_LICENSE: 'PROFESSIONAL',
  VEHICLE_REGISTRATION: 'VEHICLE',
  INSURANCE_CERTIFICATE: 'VEHICLE',
  SAFETY_CERTIFICATE: 'VEHICLE',
  MEDICAL_CERTIFICATE: 'MEDICAL',
  SAFETY_TRAINING_CERTIFICATE: 'MEDICAL',
  REGULATORY_APPROVAL: 'REGULATORY',
  COMPLIANCE_CERTIFICATE: 'REGULATORY',
  BONDING_CERTIFICATE: 'REGULATORY',
  EXPERIENCE_CERTIFICATE: 'PROFESSIONAL',
  PROFESSIONAL_REFERENCE: 'PROFESSIONAL',
  AUDIT_REPORT: 'FINANCIAL',
  OTHER: 'OTHER',
};

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  requirements,
  onUploadComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload only JPEG, PNG, or PDF files');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      setError('Please select a file and document type');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const documentCategory = DOCUMENT_TYPE_TO_CATEGORY[documentType as keyof typeof DOCUMENT_TYPE_TO_CATEGORY];
      
      await userKycApi.uploadDocument(selectedFile, {
        documentType,
        documentCategory,
        expiryDate: expiryDate?.toISOString(),
        metadata: notes ? { notes } : undefined,
      });

      // Reset form
      setSelectedFile(null);
      setDocumentType('');
      setExpiryDate(null);
      setNotes('');
      
      onUploadComplete?.();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDocumentTypes = () => {
    if (!requirements) return Object.entries(DOCUMENT_TYPES);
    
    // Show required documents first, then optional ones
    const requiredTypes = requirements.requiredDocuments || [];
    const optionalTypes = requirements.optionalDocuments || [];
    const allRelevantTypes = [...requiredTypes, ...optionalTypes];
    
    if (allRelevantTypes.length === 0) {
      return Object.entries(DOCUMENT_TYPES);
    }
    
    return Object.entries(DOCUMENT_TYPES).filter(([key]) => 
      allRelevantTypes.includes(key)
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Upload Document
      </Typography>

      {requirements && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Required Documents:</Typography>
          <Typography variant="body2">
            {requirements.requiredDocuments?.join(', ') || 'None specified'}
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: 'center',
              border: dragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
              backgroundColor: dragOver ? '#f5f5f5' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
            
            {selectedFile ? (
              <Box>
                <Typography variant="h6" color="primary">
                  {selectedFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Drop your file here or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: JPEG, PNG, PDF (max 10MB)
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={12}>
          <FormControl fullWidth required>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              label="Document Type"
            >
              {getAvailableDocumentTypes().map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                  {requirements?.requiredDocuments?.includes(key) && (
                    <Typography component="span" color="error" sx={{ ml: 1 }}>
                      (Required)
                    </Typography>
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={12}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Expiry Date (if applicable)"
              value={expiryDate}
              onChange={setExpiryDate}
              slotProps={{ textField: { fullWidth: true } }}
              minDate={new Date()}
            />
          </LocalizationProvider>
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label="Notes (optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes about this document..."
          />
        </Grid>

        <Grid size={12}>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || !documentType || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Upload />}
            fullWidth
            size="large"
          >
            {loading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};