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
  Verified,
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
      <Card className="bg-white border border-slate-100 shadow-xl rounded-[32px] overflow-hidden">
        <CardContent className="p-6">
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
              <Typography className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
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
              <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Completion Progress
              </Typography>
              <Typography className="text-[10px] font-black text-primary-600 uppercase tracking-widest">
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
            <div className="text-center p-3 bg-slate-50 rounded-[20px] border border-slate-100">
              <Typography variant="h4" className="font-black text-primary-600 mb-0 tracking-tighter">
                {metrics?.documentsUploaded || 0}
              </Typography>
              <Typography className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Documents
              </Typography>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-[20px] border border-slate-100">
              <Typography variant="h4" className="font-black text-emerald-600 mb-0 tracking-tighter">
                {metrics?.complianceScore || 0}
              </Typography>
              <Typography className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Score
              </Typography>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            variant="contained" 
            fullWidth
            onClick={onAction}
            className={`rounded-[20px] py-4 text-[10px] font-black uppercase tracking-widest ${
              status === 'APPROVED' 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-primary-600 hover:bg-primary-700'
            } text-white shadow-lg shadow-primary-100 transition-all`}
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