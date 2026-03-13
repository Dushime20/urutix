import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Warning,
  TrendingUp,
  Upload,
  Verified,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface KycQuickStatusCardProps {
  profile: any;
  metrics: any;
  onAction: () => void;
}

export const KycQuickStatusCard: React.FC<KycQuickStatusCardProps> = ({
  profile,
  metrics,
  onAction,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <CheckCircle className="text-green-500" />;
      case 'pending': return <Schedule className="text-orange-500" />;
      case 'under_review': return <TrendingUp className="text-blue-500" />;
      case 'rejected': return <Warning className="text-red-500" />;
      default: return <Schedule className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'under_review': return 'info';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'Verification complete! You have full access.';
      case 'pending': return 'Your documents are being reviewed.';
      case 'under_review': return 'Verification in progress.';
      case 'rejected': return 'Please review and resubmit documents.';
      default: return 'Start your verification process.';
    }
  };

  const completionRate = metrics?.completionRate || 0;
  const status = profile?.kycStatus || 'NOT_STARTED';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 shadow-xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="w-16 h-16 bg-blue-600">
                {getStatusIcon(status)}
              </Avatar>
              {status === 'APPROVED' && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Verified className="text-white w-4 h-4" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Typography variant="h6" className="font-black text-slate-900 mb-1">
                Quick Status
              </Typography>
              <Chip 
                label={status.replace('_', ' ')}
                color={getStatusColor(status)}
                className="font-bold"
                size="small"
              />
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <Typography variant="body2" className="font-bold text-slate-700">
                Completion Progress
              </Typography>
              <Typography variant="body2" className="font-bold text-blue-600">
                {completionRate}%
              </Typography>
            </div>
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
          </div>

          {/* Status Message */}
          <Typography variant="body2" className="text-slate-600 mb-6 leading-relaxed">
            {getStatusMessage(status)}
          </Typography>

          <Divider className="mb-6" />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <Typography variant="h4" className="font-black text-blue-600 mb-1">
                {metrics?.documentsUploaded || 0}
              </Typography>
              <Typography variant="caption" className="text-slate-500 font-medium">
                Documents
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h4" className="font-black text-green-600 mb-1">
                {metrics?.complianceScore || 0}
              </Typography>
              <Typography variant="caption" className="text-slate-500 font-medium">
                Score
              </Typography>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            variant="contained" 
            fullWidth
            size="large"
            startIcon={status === 'APPROVED' ? <Star /> : <Upload />}
            onClick={onAction}
            className={`rounded-2xl py-3 font-black ${
              status === 'APPROVED' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {status === 'APPROVED' ? 'View Details' : 'Upload Documents'}
          </Button>

          {/* Estimated Time */}
          {status !== 'APPROVED' && metrics?.estimatedCompletion && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2">
                <Schedule className="text-amber-600 w-4 h-4" />
                <Typography variant="caption" className="text-amber-800 font-bold">
                  Est. completion: {metrics.estimatedCompletion}
                </Typography>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};