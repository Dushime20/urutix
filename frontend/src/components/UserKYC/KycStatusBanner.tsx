import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  LinearProgress,
  Typography,
  Card,
  CardContent,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  Info,
  ExpandMore,
  ExpandLess,
  Upload,
  Visibility,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { userKycApi, type UserKycProfile } from '../../services/userKycApi';

interface KycStatusBannerProps {
  onStartKyc?: () => void;
  onViewKyc?: () => void;
  compact?: boolean;
  showActions?: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'VERIFIED':
      return {
        color: 'success' as const,
        icon: CheckCircle,
        title: 'KYC Verified',
        message: 'Your identity has been successfully verified',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
      };
    case 'UNDER_REVIEW':
      return {
        color: 'warning' as const,
        icon: Info,
        title: 'KYC Under Review',
        message: 'Your documents are being reviewed by our team',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
      };
    case 'REJECTED':
      return {
        color: 'error' as const,
        icon: Error,
        title: 'KYC Rejected',
        message: 'Please review and resubmit your documents',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
      };
    default:
      return {
        color: 'warning' as const,
        icon: Warning,
        title: 'KYC Required',
        message: 'Complete your identity verification to access all features',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
      };
  }
};

export const KycStatusBanner: React.FC<KycStatusBannerProps> = ({
  onStartKyc,
  onViewKyc,
  compact = false,
  showActions = true,
}) => {
  const { user } = useAuth();
  const [kycProfile, setKycProfile] = useState<UserKycProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKycProfile();
  }, [user]);

  const loadKycProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await userKycApi.getMyKyc();
      setKycProfile(response.data);
    } catch (error: any) {
      console.error('Failed to load KYC profile:', error);
      setError(error.response?.data?.message || 'Failed to load KYC status');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionPercentage = () => {
    if (!kycProfile) return 0;
    
    // If KYC is verified, return 100%
    if (kycProfile.kycStatus === 'VERIFIED') return 100;
    
    const checks = [
      kycProfile.identityVerified,
      kycProfile.addressVerified,
      kycProfile.financialVerified,
      kycProfile.businessVerified,
      kycProfile.backgroundCheckCompleted,
    ];
    
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <LinearProgress sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Loading KYC status...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" className="mb-4">
        <AlertTitle>Unable to load KYC status</AlertTitle>
        {error}
      </Alert>
    );
  }

  const status = kycProfile?.kycStatus || 'PENDING';
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;
  const completionPercentage = calculateCompletionPercentage();

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} mb-4`}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <StatusIcon className={config.textColor} fontSize="small" />
            <Typography variant="body2" className={config.textColor} fontWeight="medium">
              {config.title}
            </Typography>
            {status !== 'VERIFIED' && (
              <Chip
                label={`${completionPercentage}% Complete`}
                size="small"
                color={config.color}
                variant="outlined"
              />
            )}
          </Box>
          {showActions && status !== 'VERIFIED' && (
            <Button
              size="small"
              variant="outlined"
              color={config.color}
              onClick={status === 'PENDING' ? onStartKyc : onViewKyc}
              startIcon={status === 'PENDING' ? <Upload /> : <Visibility />}
            >
              {status === 'PENDING' ? 'Start KYC' : 'View Status'}
            </Button>
          )}
        </Box>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className={`border-l-4 ${config.borderColor.replace('border-', 'border-l-')}`}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <StatusIcon color={config.color} fontSize="large" />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {config.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {config.message}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              {status !== 'VERIFIED' && (
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="h6" color={config.color}>
                    {completionPercentage}%
                  </Typography>
                </Box>
              )}
              {showActions && (
                <Box display="flex" gap={1}>
                  {status === 'PENDING' && (
                    <Button
                      variant="contained"
                      color={config.color}
                      onClick={onStartKyc}
                      startIcon={<Upload />}
                    >
                      Start KYC
                    </Button>
                  )}
                  {status !== 'PENDING' && (
                    <Button
                      variant="outlined"
                      color={config.color}
                      onClick={onViewKyc}
                      startIcon={<Visibility />}
                    >
                      View Details
                    </Button>
                  )}
                  <IconButton
                    onClick={() => setExpanded(!expanded)}
                    size="small"
                  >
                    {expanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>

          {status !== 'VERIFIED' && (
            <Box mb={2}>
              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                color={config.color}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Collapse in={expanded}>
                  <Box mt={3} pt={3} borderTop="1px solid" borderColor="divider">
                    <Typography variant="subtitle2" gutterBottom>
                      Verification Status
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {[
                        { label: 'Identity', verified: kycProfile?.identityVerified },
                        { label: 'Address', verified: kycProfile?.addressVerified },
                        { label: 'Financial', verified: kycProfile?.financialVerified },
                        { label: 'Business', verified: kycProfile?.businessVerified },
                        { label: 'Background', verified: kycProfile?.backgroundCheckCompleted },
                      ].map((item) => (
                        <Chip
                          key={item.label}
                          label={item.label}
                          color={item.verified ? 'success' : 'default'}
                          variant={item.verified ? 'filled' : 'outlined'}
                          size="small"
                          icon={item.verified ? <CheckCircle /> : undefined}
                        />
                      ))}
                    </Box>
                    
                    {kycProfile?.kycNotes && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Notes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {kycProfile.kycNotes}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        KYC Level: {kycProfile?.kycRequirementLevel || 'Not Set'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Compliance Score: {kycProfile?.complianceScore || 0}/100
                      </Typography>
                    </Box>
                  </Box>
                </Collapse>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};