import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  Alert,
  Avatar,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CheckCircle,
  Schedule,
  Warning,
  TrendingUp,
  Security,
  Business,
  AccountBalance,
  LocationOn,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface KycOverviewTabProps {
  profile: any;
  requirements: any;
  metrics: any;
}

export const KycOverviewTab: React.FC<KycOverviewTabProps> = ({
  profile,
  requirements,
  metrics,
}) => {
  const getVerificationSteps = () => {
    const steps = [
      {
        id: 'identity',
        label: 'Identity Verification',
        completed: profile?.identityVerified || false,
        icon: <Security />,
        description: 'Government-issued ID verification',
      },
      {
        id: 'address',
        label: 'Address Verification',
        completed: profile?.addressVerified || false,
        icon: <LocationOn />,
        description: 'Proof of residence confirmation',
      },
      {
        id: 'business',
        label: 'Business Verification',
        completed: profile?.businessVerified || false,
        icon: <Business />,
        description: 'Business registration and licenses',
      },
      {
        id: 'financial',
        label: 'Financial Verification',
        completed: profile?.financialVerified || false,
        icon: <AccountBalance />,
        description: 'Bank account and financial standing',
      },
    ];

    return steps;
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

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <CheckCircle className="text-green-500" />;
      case 'pending': return <Schedule className="text-orange-500" />;
      case 'under_review': return <TrendingUp className="text-blue-500" />;
      case 'rejected': return <Warning className="text-red-500" />;
      default: return <Schedule className="text-gray-500" />;
    }
  };

  const verificationSteps = getVerificationSteps();
  const completedSteps = verificationSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / verificationSteps.length) * 100;

  return (
    <div className="space-y-8">
      {/* Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 bg-blue-600">
                  {getStatusIcon(profile?.kycStatus)}
                </Avatar>
                <div>
                  <Typography variant="h5" className="font-black text-slate-900 mb-1">
                    Verification Status
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Chip 
                      label={profile?.kycStatus || 'Not Started'}
                      color={getStatusColor(profile?.kycStatus)}
                      className="font-bold"
                    />
                    <Chip 
                      label={`${metrics?.completionRate || 0}% Complete`}
                      variant="outlined"
                      className="font-bold"
                    />
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <Typography variant="h3" className="font-black text-blue-600 mb-1">
                  {metrics?.complianceScore || 0}
                </Typography>
                <Typography variant="body2" className="text-slate-600 font-medium">
                  Compliance Score
                </Typography>
              </div>
            </div>

            <Box className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <Typography variant="body2" className="font-bold text-slate-700">
                  Overall Progress
                </Typography>
                <Typography variant="body2" className="font-bold text-blue-600">
                  {completedSteps}/{verificationSteps.length} Steps
                </Typography>
              </div>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage}
                className="h-3 rounded-full bg-blue-100"
                sx={{
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#2563eb',
                    borderRadius: '9999px',
                  }
                }}
              />
            </Box>

            {profile?.kycStatus === 'PENDING' && (
              <Alert severity="info" className="rounded-xl">
                <Typography variant="body2" className="font-medium">
                  Your verification is under review. Expected completion: {metrics?.estimatedCompletion || '2-3 days'}
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Verification Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Typography variant="h6" className="font-black text-slate-900 mb-6">
          Verification Checklist
        </Typography>
        
        <Grid container spacing={3}>
          {verificationSteps.map((step, index) => (
            <Grid size={{ xs: 12, sm: 6 }} key={step.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`border-2 transition-all duration-300 ${
                  step.completed 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-slate-200 bg-white hover:border-blue-200'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        step.completed ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Typography variant="h6" className="font-bold text-slate-900">
                            {step.label}
                          </Typography>
                          {step.completed && (
                            <CheckCircle className="text-green-500 w-5 h-5" />
                          )}
                        </div>
                        <Typography variant="body2" className="text-slate-600 mb-3">
                          {step.description}
                        </Typography>
                        <Chip 
                          label={step.completed ? 'Completed' : 'Pending'}
                          size="small"
                          color={step.completed ? 'success' : 'default'}
                          className="font-bold"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Star className="text-purple-600 w-6 h-6" />
              <Typography variant="h6" className="font-black text-slate-900">
                Recommended Next Steps
              </Typography>
            </div>
            
            <div className="space-y-3">
              {!profile?.identityVerified && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-purple-100">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <Typography variant="body2" className="font-medium text-slate-700">
                    Upload a government-issued photo ID (passport, driver's license, or national ID)
                  </Typography>
                </div>
              )}
              
              {!profile?.addressVerified && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-purple-100">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <Typography variant="body2" className="font-medium text-slate-700">
                    Provide proof of address (utility bill, bank statement, or lease agreement)
                  </Typography>
                </div>
              )}
              
              {requirements?.requiredDocuments?.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-purple-100">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <Typography variant="body2" className="font-medium text-slate-700">
                    Complete document upload for {requirements.requiredDocuments.length} required document types
                  </Typography>
                </div>
              )}
            </div>

            <Divider className="my-6" />
            
            <div className="flex gap-3">
              <Button 
                variant="contained" 
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-2 font-bold"
              >
                Continue Verification
              </Button>
              <Button 
                variant="outlined" 
                className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl px-6 py-2 font-bold"
              >
                View Requirements
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};