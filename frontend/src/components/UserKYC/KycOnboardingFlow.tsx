import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle,
  Upload,
  Description as FileText,
  Shield,
  AccessTime as Clock,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { userKycApi, type KycRequirements } from '../../services/userKycApi';
import { UserKycForm } from './UserKycForm';

interface KycOnboardingFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
}

const steps = [
  'Welcome',
  'Requirements',
  'Complete KYC',
  'Verification'
];

export const KycOnboardingFlow: React.FC<KycOnboardingFlowProps> = ({
  onComplete,
  onSkip,
  showSkipOption = true,
}) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [requirements, setRequirements] = useState<KycRequirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKycForm, setShowKycForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequirements();
  }, [user]);

  const loadRequirements = async () => {
    if (!user?.role) return;
    
    try {
      setLoading(true);
      const response = await userKycApi.getKycRequirements(user.role);
      setRequirements(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load KYC requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onComplete?.();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleStartKyc = () => {
    setShowKycForm(true);
  };

  const handleKycComplete = () => {
    setShowKycForm(false);
    setActiveStep(3); // Move to verification step
  };

  const renderWelcomeStep = () => (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8"
    >
      <Shield sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome to KYC Verification
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        To ensure security and compliance, we need to verify your identity. 
        This process helps protect all users on our platform.
      </Typography>
      <Box mt={4}>
        <Alert severity="info" sx={{ textAlign: 'left', mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Why do we need KYC?
          </Typography>
          <Typography variant="body2">
            • Prevent fraud and money laundering<br/>
            • Comply with financial regulations<br/>
            • Protect your account and transactions<br/>
            • Enable full platform features
          </Typography>
        </Alert>
      </Box>
    </motion.div>
  );

  const renderRequirementsStep = () => (
    <motion.div
      key="requirements"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-4"
    >
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        KYC Requirements for {user?.role}
      </Typography>
      
      {requirements && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip
                  label={requirements.requirementLevel}
                  color="primary"
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary">
                  Verification Level
                </Typography>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Required Documents:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                {requirements.requiredDocuments.map((doc) => (
                  <Chip
                    key={doc}
                    label={doc}
                    size="small"
                    icon={<FileText />}
                    variant="outlined"
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Verification Steps:
              </Typography>
              <Box>
                {requirements.verificationSteps.map((step) => (
                  <Box key={step} display="flex" alignItems="center" gap={2} mb={1}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2">
                      {step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {requirements.description && (
            <Alert severity="info">
              {requirements.description}
            </Alert>
          )}
        </Box>
      )}
    </motion.div>
  );

  const renderKycStep = () => (
    <motion.div
      key="kyc-form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8"
    >
      <Upload sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Complete Your KYC
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Click the button below to start the KYC verification process. 
        You'll need to provide personal information and upload required documents.
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={handleStartKyc}
        startIcon={<Upload />}
        sx={{ mt: 2 }}
      >
        Start KYC Process
      </Button>
    </motion.div>
  );

  const renderVerificationStep = () => (
    <motion.div
      key="verification"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8"
    >
      <Clock sx={{ fontSize: 64, color: 'warning.main', mb: 3 }} />
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Verification in Progress
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Thank you for submitting your KYC information. Our team will review 
        your documents and notify you once verification is complete.
      </Typography>
      <LinearProgress sx={{ mt: 3, mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        This process typically takes 1-3 business days
      </Typography>
    </motion.div>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderRequirementsStep();
      case 2:
        return renderKycStep();
      case 3:
        return renderVerificationStep();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <LinearProgress sx={{ width: '100%', maxWidth: 300 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 4 }}>
        <Typography variant="h6">Error Loading KYC Requirements</Typography>
        {error}
      </Alert>
    );
  }

  return (
    <Box maxWidth="md" mx="auto" p={3}>
      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <AnimatePresence mode="wait">
            {renderStepContent(activeStep)}
          </AnimatePresence>

          <Box display="flex" justifyContent="space-between" mt={4}>
            <Box>
              {showSkipOption && activeStep < 2 && (
                <Button onClick={onSkip} color="inherit">
                  Skip for Now
                </Button>
              )}
            </Box>
            
            <Box display="flex" gap={2}>
              {activeStep > 0 && activeStep < 3 && (
                <Button onClick={handleBack}>
                  Back
                </Button>
              )}
              
              {activeStep < 2 && (
                <Button variant="contained" onClick={handleNext}>
                  {activeStep === 1 ? 'Continue' : 'Next'}
                </Button>
              )}
              
              {activeStep === 3 && (
                <Button variant="contained" onClick={onComplete}>
                  Complete Onboarding
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* KYC Form Dialog */}
      <Dialog
        open={showKycForm}
        onClose={() => setShowKycForm(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight="bold">
            KYC Verification Form
          </Typography>
        </DialogTitle>
        <DialogContent>
          <UserKycForm onSubmissionComplete={handleKycComplete} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowKycForm(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};