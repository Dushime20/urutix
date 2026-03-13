import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Dialog,
  DialogContent,
  Chip,
  IconButton,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  Divider,
  Alert,
  Tooltip,
  Badge,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Person,
  Upload,
  History,
  Dashboard,
  Info,
  ExpandMore,
  Security,
  CheckCircle,
  Warning,
  Schedule,
  Verified,
  DocumentScanner,
  Analytics,
  TrendingUp,
  Shield,
  Star,
  Business,
  AccountBalance,
  LocationOn,
  Phone,
  Email,
  Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { userKycApi, type UserKycProfile, type KycRequirements } from '../../services/userKycApi';
import { StatCard } from '../EnliteUI/Cards/StatCard';
import { EnhancedTable } from '../EnliteUI/Tables/EnhancedTable';

// Import tab components
import { KycOverviewTab } from './tabs/KycOverviewTab';
import { KycProfileTab } from './tabs/KycProfileTab';
import { KycDocumentsTab } from './tabs/KycDocumentsTab';
import { KycAnalyticsTab } from './tabs/KycAnalyticsTab';
import { KycActivityTab } from './tabs/KycActivityTab';

// Import sidebar components
import { KycQuickStatusCard } from './sidebar/KycQuickStatusCard';
import { KycRequirementsCard } from './sidebar/KycRequirementsCard';
import { KycSecurityCard } from './sidebar/KycSecurityCard';

// Import upload interface
import { KycUploadInterface } from './upload/KycUploadInterface';

interface KycMetrics {
  completionRate: number;
  documentsUploaded: number;
  verificationLevel: string;
  complianceScore: number;
  lastActivity: string;
  estimatedCompletion: string;
}

export const EnhancedKycVerificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [kycProfile, setKycProfile] = useState<UserKycProfile | null>(null);
  const [requirements, setRequirements] = useState<KycRequirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [metrics, setMetrics] = useState<KycMetrics | null>(null);

  useEffect(() => {
    loadKycData();
  }, [user]);

  const loadKycData = async () => {
    if (!user?.role) return;
    
    try {
      setLoading(true);
      const [profileResponse, requirementsResponse] = await Promise.all([
        userKycApi.getMyKyc().catch(() => ({ data: null })),
        userKycApi.getKycRequirements(user.role),
      ]);
      
      setKycProfile(profileResponse.data);
      setRequirements(requirementsResponse.data);
      
      // Calculate metrics
      if (profileResponse.data) {
        const profile = profileResponse.data.profile;
        const docs = profileResponse.data.documents || [];
        const reqs = requirementsResponse.data;
        
        setMetrics({
          completionRate: calculateCompletionRate(profile, docs, reqs),
          documentsUploaded: docs.length,
          verificationLevel: profile.kycRequirementLevel || 'BASIC',
          complianceScore: profile.complianceScore || 0,
          lastActivity: profile.updatedAt || new Date().toISOString(),
          estimatedCompletion: calculateEstimatedCompletion(profile, reqs),
        });
      }
    } catch (error: any) {
      console.error('Failed to load KYC data', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionRate = (profile: any, documents: any[], requirements: any): number => {
    if (!requirements) return 0;
    
    const requiredDocs = requirements.requiredDocuments || [];
    const uploadedTypes = documents.map(doc => doc.documentType);
    const completedDocs = requiredDocs.filter(type => uploadedTypes.includes(type));
    
    const docProgress = requiredDocs.length > 0 ? (completedDocs.length / requiredDocs.length) * 60 : 0;
    const profileProgress = profile.identityVerified ? 40 : 0;
    
    return Math.min(100, docProgress + profileProgress);
  };

  const calculateEstimatedCompletion = (profile: any, requirements: any): string => {
    if (!requirements) return 'Unknown';
    
    const requiredDocs = requirements.requiredDocuments || [];
    const remainingDocs = requiredDocs.length - (profile.kycDocuments?.length || 0);
    
    if (remainingDocs <= 0) return 'Complete';
    if (remainingDocs <= 2) return '1-2 days';
    if (remainingDocs <= 4) return '3-5 days';
    return '5-7 days';
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
      case 'approved': return <CheckCircle />;
      case 'pending': return <Schedule />;
      case 'under_review': return <Analytics />;
      case 'rejected': return <Warning />;
      default: return <Person />;
    }
  };

  if (loading) {
    return (
      <Box className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white p-12 rounded-3xl shadow-2xl"
        >
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6 mx-auto" />
          <Typography variant="h5" className="text-slate-700 font-bold mb-2">
            Initializing Verification Center
          </Typography>
          <Typography variant="body2" className="text-slate-500">
            Preparing your secure verification environment...
          </Typography>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Premium Header with Glassmorphism */}
      <Box className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 backdrop-blur-sm" />
        
        {/* Animated background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <Container maxWidth="xl" className="relative z-10 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <Box className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <Shield className="text-white w-8 h-8" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Verified className="text-white w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Chip 
                      label="Enterprise Grade" 
                      size="small" 
                      className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-xs" 
                    />
                    <Chip 
                      label="ISO 27001" 
                      size="small" 
                      className="bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold text-xs" 
                    />
                  </div>
                </div>
                
                <Typography variant="h2" className="text-white font-black tracking-tight mb-4 leading-tight">
                  Verification Center
                  <span className="block text-2xl font-medium text-white/70 mt-2">
                    Advanced Identity & Compliance Management
                  </span>
                </Typography>
                
                <Typography variant="body1" className="text-white/80 max-w-2xl font-medium leading-relaxed">
                  Secure, compliant, and streamlined verification process designed for modern businesses. 
                  Complete your verification to unlock premium features and higher transaction limits.
                </Typography>
              </Box>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="outlined" 
                  className="border-white/30 text-white hover:bg-white/10 rounded-2xl px-8 py-3 font-bold backdrop-blur-sm"
                  startIcon={<Analytics />}
                  onClick={() => setActiveTab(3)}
                >
                  View Analytics
                </Button>
                <Button 
                  variant="contained" 
                  className="bg-white text-blue-900 hover:bg-blue-50 rounded-2xl px-10 py-3 font-black shadow-2xl"
                  startIcon={<Upload />}
                  onClick={() => setShowUploadDialog(true)}
                >
                  Upload Documents
                </Button>
              </div>
            </div>
          </motion.div>
        </Container>
      </Box>
      {/* Main Content Area with Advanced Cards */}
      <Container maxWidth="xl" className="-mt-20 pb-20 relative z-20">
        <Grid container spacing={4}>
          {/* Metrics Overview Cards */}
          <Grid size={{ xs: 12 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Completion Rate"
                    value={`${metrics?.completionRate || 0}%`}
                    icon={<TrendingUp />}
                    color="success"
                    trend={metrics?.completionRate > 50 ? '+12%' : undefined}
                    trendDirection={metrics?.completionRate > 50 ? 'up' : 'neutral'}
                    subtitle="Overall Progress"
                    variant="modern"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Documents"
                    value={metrics?.documentsUploaded || 0}
                    icon={<DocumentScanner />}
                    color="info"
                    subtitle="Files Uploaded"
                    variant="modern"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Compliance Score"
                    value={metrics?.complianceScore || 0}
                    icon={<Shield />}
                    color="primary"
                    subtitle="Security Rating"
                    variant="modern"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Verification Level"
                    value={metrics?.verificationLevel || 'BASIC'}
                    icon={<Star />}
                    color="warning"
                    subtitle="Current Tier"
                    variant="modern"
                  />
                </Grid>
              </Grid>
            </motion.div>
          </Grid>

          {/* Main Content Tabs */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Paper className="rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-white/80 backdrop-blur-sm">
                <Box className="px-8 pt-8 pb-0 bg-gradient-to-r from-slate-50 to-blue-50">
                  <Tabs 
                    value={activeTab} 
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    className="min-h-0"
                    TabIndicatorProps={{
                      className: "bg-blue-600 h-1 rounded-t-full"
                    }}
                  >
                    {[
                      { icon: <Dashboard />, label: "Overview", color: "text-blue-600" },
                      { icon: <Person />, label: "Profile Status", color: "text-green-600" },
                      { icon: <DocumentScanner />, label: "Documents", color: "text-purple-600" },
                      { icon: <Analytics />, label: "Analytics", color: "text-orange-600" },
                      { icon: <History />, label: "Activity Log", color: "text-slate-600" }
                    ].map((tab, idx) => (
                      <Tab 
                        key={idx}
                        className={`min-h-[64px] text-sm font-bold normal-case px-8 transition-all ${
                          activeTab === idx ? tab.color : 'text-slate-400 hover:text-slate-600'
                        }`}
                        icon={<div className="text-lg">{tab.icon}</div>}
                        iconPosition="start"
                        label={tab.label}
                      />
                    ))}
                  </Tabs>
                </Box>

                <Box className="p-8">
                  <AnimatePresence mode="wait">
                    {activeTab === 0 && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <KycOverviewTab 
                          profile={kycProfile?.profile} 
                          requirements={requirements}
                          metrics={metrics}
                        />
                      </motion.div>
                    )}

                    {activeTab === 1 && (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <KycProfileTab profile={kycProfile?.profile} />
                      </motion.div>
                    )}

                    {activeTab === 2 && (
                      <motion.div
                        key="documents"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <KycDocumentsTab 
                          documents={kycProfile?.documents || []} 
                          requirements={requirements}
                          onUpload={() => setShowUploadDialog(true)}
                        />
                      </motion.div>
                    )}

                    {activeTab === 3 && (
                      <motion.div
                        key="analytics"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <KycAnalyticsTab metrics={metrics} profile={kycProfile?.profile} />
                      </motion.div>
                    )}

                    {activeTab === 4 && (
                      <motion.div
                        key="activity"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <KycActivityTab />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </Paper>
            </motion.div>
          </Grid>

          {/* Enhanced Sidebar */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Quick Status Card */}
              <KycQuickStatusCard 
                profile={kycProfile?.profile}
                metrics={metrics}
                onAction={() => setShowUploadDialog(true)}
              />

              {/* Requirements Card */}
              {requirements && (
                <KycRequirementsCard requirements={requirements} />
              )}

              {/* Security Features Card */}
              <KycSecurityCard />
            </motion.div>
          </Grid>
        </Grid>

        {/* Upload Dialog */}
        <Dialog
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            className: "rounded-3xl overflow-hidden"
          }}
        >
          <Box className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Upload className="text-white w-6 h-6" />
              </div>
              <div>
                <Typography variant="h5" className="text-white font-black">
                  Document Upload Center
                </Typography>
                <Typography variant="body2" className="text-white/70">
                  Secure, encrypted file upload with instant verification
                </Typography>
              </div>
            </div>
            <IconButton 
              onClick={() => setShowUploadDialog(false)} 
              className="text-white/70 hover:text-white"
            >
              <Close />
            </IconButton>
          </Box>
          <DialogContent className="p-8">
            <KycUploadInterface 
              requirements={requirements}
              onUploadComplete={() => {
                setShowUploadDialog(false);
                loadKycData();
              }}
            />
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};