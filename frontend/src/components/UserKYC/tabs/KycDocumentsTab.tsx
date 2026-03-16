import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Description,
  CheckCircle,
  Schedule,
  MoreVert,
  Download,
  Delete,
  Visibility,
  CloudUpload,
  InsertDriveFile,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { EnhancedTable } from '../../EnliteUI/Tables/EnhancedTable';

interface KycDocumentsTabProps {
  documents: any[];
  requirements: any;
  onUpload: () => void;
}

export const KycDocumentsTab: React.FC<KycDocumentsTabProps> = ({
  documents,
  requirements,
  onUpload,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, _doc: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (verified: boolean) => {
    return verified ? 'success' : 'warning';
  };

  const getStatusIcon = (verified: boolean) => {
    return verified ? <CheckCircle className="text-green-500" /> : <Schedule className="text-orange-500" />;
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('word')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const requiredDocTypes = requirements?.requiredDocuments || [];
  const uploadedDocTypes = documents.map(doc => doc.documentType);
  const missingDocTypes = requiredDocTypes.filter((type: string) => !uploadedDocTypes.includes(type));
  const completionRate = requiredDocTypes.length > 0 
    ? ((requiredDocTypes.length - missingDocTypes.length) / requiredDocTypes.length) * 100 
    : 0;

  const tableColumns = [
    {
      key: 'documentName',
      label: 'Document',
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getDocumentIcon(row.mimeType)}</div>
          <div>
            <Typography variant="body2" className="font-bold text-slate-900">
              {value}
            </Typography>
            <Typography variant="caption" className="text-slate-500">
              {row.documentType?.replace(/_/g, ' ')}
            </Typography>
          </div>
        </div>
      ),
    },
    {
      key: 'fileSize',
      label: 'Size',
      render: (value: number) => (
        <Typography variant="body2" className="font-medium text-slate-600">
          {formatFileSize(value || 0)}
        </Typography>
      ),
    },
    {
      key: 'verified',
      label: 'Status',
      render: (value: boolean) => (
        <Chip 
          label={value ? 'Verified' : 'Pending'}
          color={getStatusColor(value)}
          size="small"
          className="font-bold"
          icon={getStatusIcon(value)}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Uploaded',
      render: (value: string) => (
        <Typography variant="body2" className="text-slate-600">
          {new Date(value).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <IconButton 
          size="small"
          onClick={(e) => handleMenuOpen(e, row)}
          className="text-slate-400 hover:text-slate-600"
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Upload Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">
                  Document Upload Progress
                </Typography>
                <Typography className="text-sm font-black text-slate-700 tracking-tight">
                  {documents.length} of {requiredDocTypes.length} required documents uploaded
                </Typography>
              </div>
              
              <div className="text-right">
                <Typography variant="h3" className="font-black text-primary-600 mb-0 tracking-tighter">
                  {Math.round(completionRate)}%
                </Typography>
                <Typography className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Complete
                </Typography>
              </div>
            </div>

            <Box className="mb-6">
              <LinearProgress 
                variant="determinate" 
                value={completionRate}
                className="h-3 rounded-full bg-blue-100"
                sx={{
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#2563eb',
                    borderRadius: '9999px',
                  }
                }}
              />
            </Box>

            {missingDocTypes.length > 0 && (
              <Alert severity="warning" className="rounded-xl mb-4">
                <Typography variant="body2" className="font-medium">
                  Missing {missingDocTypes.length} required document(s): {missingDocTypes.join(', ').replace(/_/g, ' ')}
                </Typography>
              </Alert>
            )}

            <Button 
              variant="contained" 
              onClick={onUpload}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-[16px] px-8 py-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-100"
            >
              Upload Documents
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Required Documents */}
      {requiredDocTypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-1">
            Required Documents
          </Typography>
          
          <Grid container spacing={3}>
            {requiredDocTypes.map((docType: string, index: number) => {
              const isUploaded = uploadedDocTypes.includes(docType);
              const uploadedDoc = documents.find(doc => doc.documentType === docType);
              
              return (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={docType}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className={`border-2 transition-all duration-300 ${
                      isUploaded 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-slate-200 bg-white hover:border-blue-200'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${
                            isUploaded ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Description />
                          </div>
                          <div className="flex-1">
                            <Typography className="text-base font-black text-slate-800 tracking-tight mb-1">
                              {docType.replace(/_/g, ' ')}
                            </Typography>
                            
                            {isUploaded ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="text-green-500 w-4 h-4" />
                                  <Typography variant="body2" className="text-green-700 font-medium">
                                    Uploaded
                                  </Typography>
                                </div>
                                <Typography variant="caption" className="text-slate-600 block">
                                  {uploadedDoc?.documentName}
                                </Typography>
                                <Chip 
                                  label={uploadedDoc?.verified ? 'Verified' : 'Pending Review'}
                                  color={uploadedDoc?.verified ? 'success' : 'warning'}
                                  size="small"
                                  className="font-bold"
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Schedule className="text-orange-500 w-4 h-4" />
                                  <Typography variant="body2" className="text-orange-700 font-medium">
                                    Required
                                  </Typography>
                                </div>
                                <Button 
                                  size="small"
                                  variant="outlined"
                                  onClick={onUpload}
                                  className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-[12px] px-6 py-2 text-[10px] font-black uppercase tracking-widest"
                                >
                                  Upload
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </motion.div>
      )}

      {/* Documents Table */}
      {documents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-1">
            Uploaded Documents
          </Typography>
          
          <EnhancedTable
            columns={tableColumns}
            data={documents}
            hoverable
            emptyMessage="No documents uploaded yet"
          />
        </motion.div>
      )}

      {/* Document Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          className: "rounded-xl shadow-xl border border-slate-200"
        }}
      >
        <MenuItem onClick={handleMenuClose} className="gap-3">
          <Visibility className="w-4 h-4" />
          View
        </MenuItem>
        <MenuItem onClick={handleMenuClose} className="gap-3">
          <Download className="w-4 h-4" />
          Download
        </MenuItem>
        <MenuItem onClick={handleMenuClose} className="gap-3 text-red-600">
          <Delete className="w-4 h-4" />
          Delete
        </MenuItem>
      </Menu>

      {/* Empty State */}
      {documents.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <InsertDriveFile className="w-12 h-12 text-slate-400" />
          </div>
          <Typography variant="h5" className="text-slate-900 font-bold mb-3">
            No Documents Uploaded
          </Typography>
          <Typography variant="body1" className="text-slate-500 mb-8 max-w-md mx-auto">
            Upload your verification documents to complete the KYC process and unlock all platform features.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<CloudUpload />}
            onClick={onUpload}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 py-4 font-black"
          >
            Start Document Upload
          </Button>
        </motion.div>
      )}
    </div>
  );
};