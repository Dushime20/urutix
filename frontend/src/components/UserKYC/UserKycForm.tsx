import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CheckCircle } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { userKycApi, type UserKycSubmissionData } from '../../services/userKycApi';

interface UserKycFormProps {
  onSubmissionComplete?: () => void;
}

interface KycFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  nationality: string;
  
  // Contact Information
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  
  // Business Information (for business roles)
  companyName: string;
  businessType: string;
  businessRegistrationNumber: string;
  taxId: string;
  businessAddress: string;
  
  // Financial Information
  bankAccountNumber: string;
  bankName: string;
  bankBranch: string;
  annualIncome: number | '';
  
  // Professional Information
  licenseNumber: string;
  licenseExpiryDate: Date | null;
  yearsOfExperience: number | '';
  previousEmployer: string;
}

const steps = [
  'Personal Information',
  'Contact Information', 
  'Business Information',
  'Financial Information',
  'Representative/Professional Info',
  'Review & Submit'
];

export const UserKycForm: React.FC<UserKycFormProps> = ({ onSubmissionComplete }) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requirements, setRequirements] = useState<any>(null);
  const [existingKycData, setExistingKycData] = useState<any>(null);
  const [formData, setFormData] = useState<KycFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    nationality: '',
    phoneNumber: '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    companyName: '',
    businessType: '',
    businessRegistrationNumber: '',
    taxId: '',
    businessAddress: '',
    bankAccountNumber: '',
    bankName: '',
    bankBranch: '',
    annualIncome: '',
    licenseNumber: '',
    licenseExpiryDate: null,
    yearsOfExperience: '',
    previousEmployer: '',
  });

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    if (!user?.role) return;
    
    try {
      setInitialLoading(true);
      
      // Load KYC requirements
      const requirementsResponse = await userKycApi.getKycRequirements(user.role);
      setRequirements(requirementsResponse.data);
      
      // Try to load existing KYC data
      try {
        const kycResponse = await userKycApi.getMyKyc();
        if (kycResponse.data && kycResponse.data.profile) {
          const profile = kycResponse.data.profile;
          setExistingKycData(profile);
          
          // Pre-populate form with existing data
          const kycData = profile.kycData || {};
          setFormData(prev => ({
            ...prev,
            // Personal Information
            firstName: profile.firstName || kycData.firstName || '',
            lastName: profile.lastName || kycData.lastName || '',
            dateOfBirth: kycData.dateOfBirth ? new Date(kycData.dateOfBirth) : null,
            nationality: kycData.nationality || '',
            
            // Contact Information
            phoneNumber: kycData.phoneNumber || '',
            email: kycData.email || user?.email || '',
            address: profile.address || kycData.address || '',
            city: kycData.city || '',
            state: kycData.state || '',
            country: kycData.country || '',
            postalCode: kycData.postalCode || '',
            
            // Business Information
            companyName: profile.companyName || kycData.companyName || '',
            businessType: kycData.businessType || '',
            businessRegistrationNumber: kycData.businessRegistrationNumber || '',
            taxId: profile.taxId || kycData.taxId || '',
            businessAddress: kycData.businessAddress || '',
            
            // Financial Information
            bankAccountNumber: kycData.bankAccountNumber || '',
            bankName: kycData.bankName || '',
            bankBranch: kycData.bankBranch || '',
            annualIncome: kycData.annualIncome || '',
            
            // Professional Information
            licenseNumber: kycData.licenseNumber || '',
            licenseExpiryDate: kycData.licenseExpiryDate ? new Date(kycData.licenseExpiryDate) : null,
            yearsOfExperience: kycData.yearsOfExperience || '',
            previousEmployer: kycData.previousEmployer || '',
          }));
        }
      } catch (kycError) {
        // No existing KYC data found, which is fine for new users
        console.log('No existing KYC data found');
      }
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load verification requirements');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadKycRequirements = async () => {
    if (!user?.role) return;
    
    try {
      const response = await userKycApi.getKycRequirements(user.role);
      setRequirements(response.data);
    } catch (error) {
      console.error('Failed to load KYC requirements:', error);
    }
  };

  const handleInputChange = (field: keyof KycFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFieldPrePopulated = (field: keyof KycFormData): boolean => {
    if (!existingKycData) return false;
    const kycData = existingKycData.kycData || {};
    
    // Check if field has value from existing data
    switch (field) {
      case 'firstName':
        return !!(existingKycData.firstName || kycData.firstName);
      case 'lastName':
        return !!(existingKycData.lastName || kycData.lastName);
      case 'companyName':
        return !!(existingKycData.companyName || kycData.companyName);
      case 'taxId':
        return !!(existingKycData.taxId || kycData.taxId);
      case 'address':
        return !!(existingKycData.address || kycData.address);
      default:
        return !!kycData[field];
    }
  };

  const getFieldProps = (field: keyof KycFormData, required: boolean = false) => {
    const isPrePopulated = isFieldPrePopulated(field);
    return {
      required,
      InputProps: isPrePopulated ? {
        startAdornment: (
          <Chip 
            size="small" 
            label="Loaded" 
            color="success" 
            variant="outlined"
            sx={{ mr: 1, height: 20, fontSize: '0.7rem' }}
          />
        )
      } : undefined,
      helperText: isPrePopulated ? 'Pre-filled from your existing data' : undefined,
    };
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const submissionData: UserKycSubmissionData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth?.toISOString(),
        licenseExpiryDate: formData.licenseExpiryDate?.toISOString(),
        annualIncome: formData.annualIncome === '' ? undefined : formData.annualIncome,
        yearsOfExperience: formData.yearsOfExperience === '' ? undefined : formData.yearsOfExperience,
      };
      await userKycApi.submitKyc(submissionData);
      setSuccess(true);
      onSubmissionComplete?.();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit KYC data');
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalInformation = () => {
    const isTenantAdmin = user?.role === 'TENANT_ADMIN';
    
    return (
      <Grid container spacing={3}>
        {isTenantAdmin && (
          <Grid size={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Business Representative Information
              </Typography>
              <Typography variant="body2">
                Personal details of the authorized representative who will manage your organization's account.
              </Typography>
            </Alert>
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={isTenantAdmin ? "Representative First Name" : "First Name"}
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            {...getFieldProps('firstName', true)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={isTenantAdmin ? "Representative Last Name" : "Last Name"}
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            {...getFieldProps('lastName', true)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChange={(date) => handleInputChange('dateOfBirth', date)}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  helperText: isFieldPrePopulated('dateOfBirth') ? 'Pre-filled from your existing data' : undefined
                } 
              }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nationality"
            value={formData.nationality}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            {...getFieldProps('nationality')}
          />
        </Grid>
      </Grid>
    );
  };

  const renderContactInformation = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          {...getFieldProps('phoneNumber', true)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          {...getFieldProps('email', true)}
        />
      </Grid>
      <Grid size={12}>
        <TextField
          fullWidth
          label="Address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          multiline
          rows={2}
          {...getFieldProps('address', true)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          fullWidth
          label="City"
          value={formData.city}
          onChange={(e) => handleInputChange('city', e.target.value)}
          {...getFieldProps('city', true)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          fullWidth
          label="State/Province"
          value={formData.state}
          onChange={(e) => handleInputChange('state', e.target.value)}
          {...getFieldProps('state', true)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          fullWidth
          label="Postal Code"
          value={formData.postalCode}
          onChange={(e) => handleInputChange('postalCode', e.target.value)}
          {...getFieldProps('postalCode', true)}
        />
      </Grid>
      <Grid size={12}>
        <TextField
          fullWidth
          label="Country"
          value={formData.country}
          onChange={(e) => handleInputChange('country', e.target.value)}
          {...getFieldProps('country', true)}
        />
      </Grid>
    </Grid>
  );

  const renderBusinessInformation = () => {
    const requiresBusinessInfo = requirements?.verificationSteps?.includes('business_verification');
    const isTenantAdmin = user?.role === 'TENANT_ADMIN';
    
    if (!requiresBusinessInfo && !isTenantAdmin) {
      return (
        <Alert severity="info">
          Business information is not required for your role.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {isTenantAdmin && (
          <>
            <Grid size={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Business Entity Verification
                </Typography>
                <Typography variant="body2">
                  As a tenant admin, you represent a business entity that will onboard and manage other businesses on our platform.
                </Typography>
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Business/Organization Name"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                {...getFieldProps('companyName', true)}
                helperText="Legal name of your business or organization"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Business Type/Industry"
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                {...getFieldProps('businessType', true)}
                helperText="e.g., Logistics Company, Transport Hub, Freight Forwarder"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Business Registration Number"
                value={formData.businessRegistrationNumber}
                onChange={(e) => handleInputChange('businessRegistrationNumber', e.target.value)}
                {...getFieldProps('businessRegistrationNumber', true)}
                helperText="Official business registration/incorporation number"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Tax Identification Number"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                {...getFieldProps('taxId', true)}
                helperText="Business tax ID or VAT number"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Business Address"
                value={formData.businessAddress}
                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                multiline
                rows={2}
                {...getFieldProps('businessAddress', true)}
                helperText="Official registered business address"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Number of Employees"
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) => handleInputChange('yearsOfExperience', Number(e.target.value))}
                {...getFieldProps('yearsOfExperience')}
                helperText="Approximate number of employees in your organization"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Years in Business"
                type="number"
                value={formData.annualIncome}
                onChange={(e) => handleInputChange('annualIncome', Number(e.target.value))}
                {...getFieldProps('annualIncome')}
                helperText="How many years has your business been operating"
              />
            </Grid>
          </>
        )}
        
        {!isTenantAdmin && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                {...getFieldProps('companyName', true)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Business Type"
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                {...getFieldProps('businessType')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Business Registration Number"
                value={formData.businessRegistrationNumber}
                onChange={(e) => handleInputChange('businessRegistrationNumber', e.target.value)}
                {...getFieldProps('businessRegistrationNumber')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Tax ID"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                {...getFieldProps('taxId')}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Business Address"
                value={formData.businessAddress}
                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                multiline
                rows={2}
                {...getFieldProps('businessAddress')}
              />
            </Grid>
          </>
        )}
      </Grid>
    );
  };

  const renderFinancialInformation = () => {
    const requiresFinancialInfo = requirements?.verificationSteps?.includes('financial_verification');
    const isTenantAdmin = user?.role === 'TENANT_ADMIN';
    
    if (!requiresFinancialInfo && !isTenantAdmin) {
      return (
        <Alert severity="info">
          Financial information is not required for your role.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {isTenantAdmin && (
          <>
            <Grid size={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Business Financial Information
                </Typography>
                <Typography variant="body2">
                  Financial details for transaction processing and business verification.
                </Typography>
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Business Bank Account Number"
                value={formData.bankAccountNumber}
                onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                {...getFieldProps('bankAccountNumber', true)}
                helperText="Primary business account for transactions"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bank Name"
                value={formData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                {...getFieldProps('bankName', true)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bank Branch/SWIFT Code"
                value={formData.bankBranch}
                onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                {...getFieldProps('bankBranch')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Annual Business Revenue (USD)"
                type="number"
                value={formData.annualIncome}
                onChange={(e) => handleInputChange('annualIncome', Number(e.target.value))}
                {...getFieldProps('annualIncome')}
                helperText="Approximate annual revenue of your business"
              />
            </Grid>
          </>
        )}
        
        {!isTenantAdmin && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bank Account Number"
                value={formData.bankAccountNumber}
                onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                {...getFieldProps('bankAccountNumber', true)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bank Name"
                value={formData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                {...getFieldProps('bankName', true)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bank Branch"
                value={formData.bankBranch}
                onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                {...getFieldProps('bankBranch')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Annual Income"
                type="number"
                value={formData.annualIncome}
                onChange={(e) => handleInputChange('annualIncome', Number(e.target.value))}
                {...getFieldProps('annualIncome')}
              />
            </Grid>
          </>
        )}
      </Grid>
    );
  };

  const renderProfessionalInformation = () => {
    const isTenantAdmin = user?.role === 'TENANT_ADMIN';
    
    if (isTenantAdmin) {
      return (
        <Grid container spacing={3}>
          <Grid size={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Authorized Representative Information
              </Typography>
              <Typography variant="body2">
                Information about the person authorized to represent your business on the platform.
              </Typography>
            </Alert>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Representative Position/Title"
              value={formData.licenseNumber}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              {...getFieldProps('licenseNumber', true)}
              helperText="e.g., CEO, Managing Director, Operations Manager"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Authorization Document Number"
              value={formData.previousEmployer}
              onChange={(e) => handleInputChange('previousEmployer', e.target.value)}
              {...getFieldProps('previousEmployer')}
              helperText="Board resolution or authorization letter reference"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Authorization Valid Until"
                value={formData.licenseExpiryDate}
                onChange={(date) => handleInputChange('licenseExpiryDate', date)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    helperText: isFieldPrePopulated('licenseExpiryDate') ? 'Pre-filled from your existing data' : 'If applicable'
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Expected Monthly Volume"
              type="number"
              value={formData.yearsOfExperience}
              onChange={(e) => handleInputChange('yearsOfExperience', Number(e.target.value))}
              {...getFieldProps('yearsOfExperience')}
              helperText="Expected number of transactions/shipments per month"
            />
          </Grid>
        </Grid>
      );
    }

    // For other roles, show traditional professional information
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="License Number"
            value={formData.licenseNumber}
            onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
            {...getFieldProps('licenseNumber')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="License Expiry Date"
              value={formData.licenseExpiryDate}
              onChange={(date) => handleInputChange('licenseExpiryDate', date)}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  helperText: isFieldPrePopulated('licenseExpiryDate') ? 'Pre-filled from your existing data' : undefined
                } 
              }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Years of Experience"
            type="number"
            value={formData.yearsOfExperience}
            onChange={(e) => handleInputChange('yearsOfExperience', Number(e.target.value))}
            {...getFieldProps('yearsOfExperience')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Previous Employer"
            value={formData.previousEmployer}
            onChange={(e) => handleInputChange('previousEmployer', e.target.value)}
            {...getFieldProps('previousEmployer')}
          />
        </Grid>
      </Grid>
    );
  };

  const renderReviewAndSubmit = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Information
      </Typography>
      
      {existingKycData && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Updating Existing Verification</Typography>
          <Typography variant="body2">
            Your previous verification data has been loaded. You can update any information before resubmitting.
          </Typography>
        </Alert>
      )}
      
      {requirements && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Verification Level: {requirements.requirementLevel}</Typography>
          <Typography variant="body2">
            Documents to be verified: {requirements.requiredDocuments?.join(', ').replace(/_/g, ' ')}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2">Name:</Typography>
          <Typography>{formData.firstName} {formData.lastName}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2">Email:</Typography>
          <Typography>{formData.email}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2">Phone:</Typography>
          <Typography>{formData.phoneNumber}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2">Address:</Typography>
          <Typography>{formData.address}, {formData.city}, {formData.state}</Typography>
        </Grid>
        {formData.companyName && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2">Company:</Typography>
            <Typography>{formData.companyName}</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPersonalInformation();
      case 1:
        return renderContactInformation();
      case 2:
        return renderBusinessInformation();
      case 3:
        return renderFinancialInformation();
      case 4:
        return renderProfessionalInformation();
      case 5:
        return renderReviewAndSubmit();
      default:
        return null;
    }
  };

  if (initialLoading) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={6}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Loading Verification Form...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {existingKycData ? 'Loading your existing verification data...' : 'Preparing verification requirements...'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Verification Submitted!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Your verification details have been submitted for review. You will be notified once the process is complete.
            </Typography>
            <Chip 
              label="Under Review" 
              color="warning" 
              variant="outlined" 
              sx={{ mt: 2 }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {existingKycData ? 'Update Your KYC Verification' : 'Complete Your KYC Verification'}
        </Typography>
        
        {existingKycData && (
          <Alert severity="info" sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'success.main' }}>
            <Typography variant="subtitle2" color="success.main" fontWeight="bold">
              Existing Data Loaded
            </Typography>
            <Typography variant="body2">
              Your previous verification information has been loaded into the form. You can review and update any details before resubmitting.
            </Typography>
          </Alert>
        )}
        
        {requirements && (
          <Alert severity="info" sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
            <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
              Verification Required: {requirements.requirementLevel}
            </Typography>
            <Typography variant="body2">
              {requirements.description}
            </Typography>
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading 
                ? 'Submitting...' 
                : existingKycData 
                  ? 'Update KYC Verification' 
                  : 'Submit KYC Verification'
              }
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};