import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CloudUpload,
  Description,
  CheckCircle,
  Warning,
  Delete,
  Visibility,
  InsertDriveFile,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { userKycApi } from '../../../services/userKycApi';

interface KycUploadInterfaceProps {
  requirements: any;
  onUploadComplete: () => void;
}

interface UploadFile {
  file: File;
  documentType: string;
  documentCategory: string;
  notes: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

export const KycUploadInterface: React.FC<KycUploadInterfaceProps> = ({
  requirements,
  onUploadComplete,
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedDocCategory, setSelectedDocCategory] = useState('');
  const [notes, setNotes] = useState('');

  const documentCategories = [
    { value: 'IDENTITY', label: 'Identity Documents' },
    { value: 'ADDRESS', label: 'Address Verification' },
    { value: 'FINANCIAL', label: 'Financial Documents' },
    { value: 'BUSINESS', label: 'Business Documents' },
    { value: 'PROFESSIONAL', label: 'Professional Certificates' },
    { value: 'VEHICLE', label: 'Vehicle Documents' },
    { value: 'MEDICAL', label: 'Medical Certificates' },
    { value: 'REGULATORY', label: 'Regulatory Documents' },
    { value: 'OTHER', label: 'Other Documents' },
  ];

  const documentTypes = [
    // Identity Documents
    { value: 'IDENTITY_DOCUMENT', label: 'Government ID', category: 'IDENTITY' },
    { value: 'PASSPORT', label: 'Passport', category: 'IDENTITY' },
    { value: 'DRIVER_LICENSE', label: 'Driver License', category: 'IDENTITY' },
    
    // Address Documents
    { value: 'PROOF_OF_ADDRESS', label: 'Proof of Address', category: 'ADDRESS' },
    { value: 'UTILITY_BILL', label: 'Utility Bill', category: 'ADDRESS' },
    
    // Business Documents
    { value: 'BUSINESS_LICENSE', label: 'Business License', category: 'BUSINESS' },
    { value: 'TAX_CERTIFICATE', label: 'Tax Certificate', category: 'BUSINESS' },
    { value: 'TRADE_LICENSE', label: 'Trade License', category: 'BUSINESS' },
    
    // Financial Documents
    { value: 'BANK_STATEMENT', label: 'Bank Statement', category: 'FINANCIAL' },
    { value: 'CREDIT_REPORT', label: 'Credit Report', category: 'FINANCIAL' },
    { value: 'FINANCIAL_STATEMENT', label: 'Financial Statement', category: 'FINANCIAL' },
    
    // Professional Documents
    { value: 'PROFESSIONAL_CERTIFICATE', label: 'Professional Certificate', category: 'PROFESSIONAL' },
    { value: 'BROKER_LICENSE', label: 'Broker License', category: 'PROFESSIONAL' },
    { value: 'FINANCIAL_LICENSE', label: 'Financial License', category: 'PROFESSIONAL' },
    
    // Vehicle Documents
    { value: 'VEHICLE_REGISTRATION', label: 'Vehicle Registration', category: 'VEHICLE' },
    { value: 'INSURANCE_CERTIFICATE', label: 'Insurance Certificate', category: 'VEHICLE' },
    { value: 'SAFETY_CERTIFICATE', label: 'Safety Certificate', category: 'VEHICLE' },
    
    // Other
    { value: 'OTHER', label: 'Other Document', category: 'OTHER' },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      documentType: selectedDocType,
      documentCategory: selectedDocCategory,
      notes: notes,
      uploading: false,
      uploaded: false,
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, [selectedDocType, selectedDocCategory, notes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: !selectedDocType || !selectedDocCategory,
  });

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (index: number) => {
    const fileData = uploadFiles[index];
    
    setUploadFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, uploading: true, error: undefined } : f
    ));

    try {
      const documentData = {
        documentType: fileData.documentType,
        documentCategory: fileData.documentCategory,
        documentName: fileData.file.name,
        filePath: `/uploads/${fileData.file.name}`, // This would be handled by actual file upload
        fileSize: fileData.file.size,
        mimeType: fileData.file.type,
        notes: fileData.notes,
      };

      await userKycApi.createDocument(documentData);
      
      setUploadFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, uploading: false, uploaded: true } : f
      ));
    } catch (error: any) {
      setUploadFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          uploading: false, 
          error: error.response?.data?.message || 'Upload failed' 
        } : f
      ));
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = uploadFiles.filter(f => !f.uploaded && !f.uploading);
    
    for (let i = 0; i < uploadFiles.length; i++) {
      if (!uploadFiles[i].uploaded && !uploadFiles[i].uploading) {
        await uploadFile(i);
      }
    }
    
    // Check if all files are uploaded
    const allUploaded = uploadFiles.every(f => f.uploaded);
    if (allUploaded && uploadFiles.length > 0) {
      setTimeout(() => {
        onUploadComplete();
      }, 1000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    return '📎';
  };

  const filteredDocTypes = documentTypes.filter(type => 
    !selectedDocCategory || type.category === selectedDocCategory
  );

  return (
    <div className="space-y-8">
      {/* Upload Configuration */}
      <div>
        <Typography variant="h6" className="font-black text-slate-900 mb-6">
          Document Upload Configuration
        </Typography>
        
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Document Category</InputLabel>
              <Select
                value={selectedDocCategory}
                onChange={(e) => {
                  setSelectedDocCategory(e.target.value);
                  setSelectedDocType(''); // Reset doc type when category changes
                }}
                label="Document Category"
              >
                {documentCategories.map(category => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth disabled={!selectedDocCategory}>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                label="Document Type"
              >
                {filteredDocTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information about this document..."
            />
          </Grid>
        </Grid>
      </div>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : selectedDocType && selectedDocCategory
                ? 'border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50'
                : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
            }
          `}
        >
          <input {...getInputProps()} />
          
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <CloudUpload className="w-10 h-10 text-blue-600" />
          </div>
          
          {selectedDocType && selectedDocCategory ? (
            <>
              <Typography variant="h5" className="font-bold text-slate-900 mb-2">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </Typography>
              <Typography variant="body1" className="text-slate-600 mb-4">
                or click to browse your computer
              </Typography>
              <Typography variant="body2" className="text-slate-500">
                Supports: PDF, JPG, PNG, DOC, DOCX (Max 10MB per file)
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h5" className="font-bold text-slate-700 mb-2">
                Select Document Type First
              </Typography>
              <Typography variant="body1" className="text-slate-500">
                Choose a document category and type before uploading files
              </Typography>
            </>
          )}
        </div>
      </motion.div>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <Typography variant="h6" className="font-black text-slate-900">
              Files to Upload ({uploadFiles.length})
            </Typography>
            <Button
              variant="contained"
              onClick={uploadAllFiles}
              disabled={uploadFiles.every(f => f.uploaded || f.uploading)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2 font-bold"
            >
              Upload All Files
            </Button>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence>
              {uploadFiles.map((fileData, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">
                          {getFileIcon(fileData.file.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Typography variant="body1" className="font-bold text-slate-900">
                              {fileData.file.name}
                            </Typography>
                            <Chip 
                              label={fileData.documentType.replace(/_/g, ' ')}
                              size="small"
                              className="font-bold"
                            />
                            {fileData.uploaded && (
                              <Chip 
                                label="Uploaded"
                                color="success"
                                size="small"
                                icon={<CheckCircle />}
                                className="font-bold"
                              />
                            )}
                          </div>
                          
                          <Typography variant="body2" className="text-slate-600 mb-2">
                            {formatFileSize(fileData.file.size)} • {fileData.documentCategory}
                          </Typography>
                          
                          {fileData.notes && (
                            <Typography variant="caption" className="text-slate-500">
                              Notes: {fileData.notes}
                            </Typography>
                          )}
                          
                          {fileData.uploading && (
                            <LinearProgress className="mt-2 rounded-full" />
                          )}
                          
                          {fileData.error && (
                            <Alert severity="error" className="mt-2 rounded-xl">
                              {fileData.error}
                            </Alert>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {!fileData.uploaded && !fileData.uploading && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => uploadFile(index)}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                            >
                              Upload
                            </Button>
                          )}
                          
                          <IconButton
                            size="small"
                            onClick={() => removeFile(index)}
                            className="text-slate-400 hover:text-red-500"
                            disabled={fileData.uploading}
                          >
                            <Delete />
                          </IconButton>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Required Documents Reminder */}
      {requirements?.requiredDocuments?.length > 0 && (
        <Alert severity="info" className="rounded-xl">
          <Typography variant="body2" className="font-medium mb-2">
            📋 Required Documents for Your Verification Level:
          </Typography>
          <div className="flex flex-wrap gap-2">
            {requirements.requiredDocuments.map((doc: string) => (
              <Chip 
                key={doc}
                label={doc.replace(/_/g, ' ')}
                size="small"
                variant="outlined"
                className="font-bold"
              />
            ))}
          </div>
        </Alert>
      )}
    </div>
  );
};