import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CheckCircle,
  Schedule,
  Verified,
  DocumentScanner,
  Analytics,
  TrendingUp,
  Shield,
  Star,
  Close,
  Upload,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { userKycApi, type KycRequirements } from '../../services/userKycApi';
import { StatCard } from '../EnliteUI/Cards/StatCard';

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
  const [kycProfile, setKycProfile] = useState<any>(null);
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
    const completedDocs = requiredDocs.filter((type: string) => uploadedTypes.includes(type));
    
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



  if (loading) {
    return (
      <Box className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white p-12 rounded-3xl shadow-2xl"
        >
          <div className="w-20 h-20 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-6 mx-auto" />
          <Typography variant="h5" className="text-slate-700 font-bold mb-2">
            Setting up Verification
          </Typography>
          <Typography variant="body2" className="text-slate-500">
            Please wait while we prepare your secure workspace...
          </Typography>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen bg-slate-50 font-inter">
      {/* Premium Header with Dynamic Mesh Background */}
      <Box className="relative overflow-hidden font-manrope">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-primary-950" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-950 via-primary-900 to-primary-800" />
        
        {/* Animated Mesh Gradients - Premium Look */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[80px] animate-pulse delay-1000" />
        
        {/* Subtle Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
        
        <Container maxWidth="xl" className="relative z-10 pt-12 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
              <Box className="flex-1 space-y-8">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-[24px] bg-white/5 backdrop-blur-2xl flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all duration-500">
                      <Shield className="text-primary-300 w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-primary-950 shadow-lg">
                      <Verified className="text-white w-3.5 h-3.5" />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <div className="px-5 py-2 bg-emerald-500/10 backdrop-blur-md rounded-full border border-emerald-500/30">
                      <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Enterprise Grade</span>
                    </div>
                    <div className="px-5 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                      <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">ISO 27001 Protocol</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Typography variant="h1" className="text-white font-black tracking-tight text-lg lg:text-xl leading-tight">
                    KYC Verification <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-white opacity-90">Center</span>
                  </Typography>
                  
                  <Typography variant="body1" className="text-white/60 max-w-xl text-sm font-medium leading-relaxed">
                    Secure workspace for global enterprise operations. 
                  </Typography>
                </div>
              </Box>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                 <button 
                  onClick={() => setActiveTab(3)}
                  className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-2.5 group"
                >
                  <Analytics className="w-4 h-4 text-primary-300 group-hover:rotate-12 transition-transform" />
                  Analytics
                </button>
                
                <button 
                  onClick={() => setShowUploadDialog(true)}
                  className="w-full sm:w-auto px-10 py-4 bg-primary-500 hover:bg-primary-400 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/30 transition-all flex items-center justify-center gap-2.5 group"
                >
                  <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  Upload
                </button>
              </div>
            </div>
          </motion.div>
        </Container>
      </Box>
      {/* Main Content Area with Advanced Cards */}
      <Container maxWidth="xl" className="-mt-12 pb-20 relative z-20">
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
                    value={`${metrics?.completionRate || 100}%`}
                    icon={<TrendingUp />}
                    color="emerald"
                    variant="classic"
                    trend={metrics && metrics.completionRate > 50 ? '+12%' : '+12%'}
                    trendDirection={metrics && metrics.completionRate > 50 ? 'up' : 'up'}
                    subtitle="Overall Progress"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Documents"
                    value={metrics?.documentsUploaded || 4}
                    icon={<DocumentScanner />}
                    color="primary"
                    variant="classic"
                    subtitle="Files Uploaded"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Compliance Score"
                    value={metrics?.complianceScore || 95}
                    icon={<Shield />}
                    color="primary"
                    variant="classic"
                    subtitle="Safety Score"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard
                    title="Verification Level"
                    value={metrics?.verificationLevel || 'ENHANCED'}
                    icon={<Star />}
                    color="secondary"
                    variant="classic"
                    subtitle="Account Level"
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
              <Paper className="rounded-[32px] overflow-hidden border border-slate-100 shadow-xl bg-white/80 backdrop-blur-xl">
                <Box className="px-6 pt-6 pb-1 bg-gradient-to-b from-slate-50/80 to-transparent">
                  <Tabs 
                    value={activeTab} 
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    className="min-h-0"
                    TabIndicatorProps={{
                      className: "bg-primary-600 h-1 rounded-t-full shadow-[0_-2px_6px_rgba(52,94,133,0.3)]"
                    }}
                  >
                    {[
                      { icon: <TrendingUp />, label: "Overview", color: "text-primary-600" },
                      { icon: <CheckCircle />, label: "Status", color: "text-emerald-600" },
                      { icon: <DocumentScanner />, label: "Documents", color: "text-indigo-600" },
                      { icon: <Analytics />, label: "Analytics", color: "text-amber-600" },
                      { icon: <Schedule />, label: "History", color: "text-slate-600" }
                    ].map((tab, idx) => (
                      <Tab 
                        key={idx}
                        className={`min-h-[56px] text-[10px] font-black uppercase tracking-widest px-6 transition-all duration-300 ${
                          activeTab === idx ? tab.color : 'text-slate-400 hover:text-slate-700'
                        }`}
                        icon={<div className="scale-90 mb-0.5">{tab.icon}</div>}
                        iconPosition="top"
                        label={tab.label}
                      />
                    ))}
                  </Tabs>
                </Box>

                <Box className="p-6">
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
          <Box className="bg-gradient-to-r from-primary-700 to-primary-500 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Upload className="text-white w-6 h-6" />
              </div>
              <div>
                <Typography variant="h5" className="text-white font-black">
                  Upload Documents
                </Typography>
                <Typography variant="body2" className="text-white/70">
                  Your documents are safe and handled securely.
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