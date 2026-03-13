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
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Person,
  Upload,
  History,
  Dashboard,
  Info,
  ExpandMore,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { userKycApi, type UserKycProfile, type KycRequirements } from '../../services/userKycApi';
import { KycStatusBanner } from './KycStatusBanner';
import { UserKycForm } from './UserKycForm';
import { UserKycDashboard } from './UserKycDashboard';
import { DocumentUpload } from './DocumentUpload';


export const KycManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [kycProfile, setKycProfile] = useState<UserKycProfile | null>(null);
  const [requirements, setRequirements] = useState<KycRequirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKycForm, setShowKycForm] = useState(false);

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
    } catch (error: any) {
      console.error('Failed to load KYC data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleKycSubmissionComplete = () => {
    setShowKycForm(false);
    loadKycData();
  };


  if (loading) {
    return (
      <Box className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4 mx-auto" />
          <Typography variant="h6" className="text-slate-600 font-medium">
            Preparing Verification Center...
          </Typography>
        </motion.div>
      </Box>
    );
  }

  const hasSubmittedKyc = kycProfile && kycProfile.kycSubmittedAt;

  return (
    <Box className="min-h-screen bg-[#f8fafc]">
      {/* Premium Header Section */}
      <Box className="relative overflow-hidden bg-primary-900 pt-16 pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-600/10 rounded-full blur-[120px] translate-y-1/2"></div>
        </div>
        
        <Container maxWidth="xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
              <Box>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Person className="text-white w-6 h-6" />
                  </div>
                  <Chip 
                    label="Compliance High" 
                    size="small" 
                    className="bg-emerald-500/20 text-emerald-400 border-none font-bold text-[10px] uppercase tracking-widest" 
                  />
                </div>
                <Typography variant="h3" className="text-white font-black tracking-tight mb-2">
                  Verification Center
                </Typography>
                <Typography variant="body1" className="text-white/60 max-w-xl font-medium">
                  Manage your secure identity and business verification to unlock premium platform features and increased limits.
                </Typography>
              </Box>
              
              <div className="flex gap-3">
                <Button 
                  variant="outlined" 
                  className="border-white/20 text-white hover:bg-white/10 rounded-2xl px-6 py-2.5 normal-case font-bold"
                  startIcon={<History className="w-4 h-4" />}
                  onClick={() => setActiveTab(3)}
                >
                  View Logs
                </Button>
                {!hasSubmittedKyc && (
                  <Button 
                    variant="contained" 
                    className="bg-white text-primary-900 hover:bg-blue-50 rounded-2xl px-8 py-2.5 normal-case font-black shadow-xl shadow-black/20"
                    startIcon={<Upload className="w-4 h-4" />}
                    onClick={() => setShowKycForm(true)}
                  >
                    Start Verification
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="xl" className="-mt-16 pb-20 relative z-20">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Paper className="rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl shadow-slate-200/50 bg-white">
                <Box className="px-8 pt-8 pb-0 border-b border-slate-100">
                  <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    className="min-h-0"
                    TabIndicatorProps={{
                      className: "bg-primary-600 h-1 rounded-t-full"
                    }}
                  >
                    {[
                      { icon: <Dashboard className="w-5 h-5" />, label: "Overview" },
                      { icon: <Person className="w-5 h-5" />, label: "Status Details", disabled: !hasSubmittedKyc },
                      { icon: <Upload className="w-5 h-5" />, label: "Upload Center" },
                      { icon: <History className="w-5 h-5" />, label: "Audit Trail", disabled: !hasSubmittedKyc }
                    ].map((tab, idx) => (
                      <Tab 
                        key={idx}
                        disabled={tab.disabled}
                        className={`min-h-[56px] text-sm font-bold normal-case px-6 transition-all ${
                          activeTab === idx ? 'text-primary-600 opacity-100' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        icon={tab.icon}
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
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        {hasSubmittedKyc ? (
                          <UserKycDashboard />
                        ) : (
                          <div className="py-12 text-center">
                            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-300">
                              <Person sx={{ fontSize: 48 }} />
                            </div>
                            <Typography variant="h5" className="text-slate-900 font-bold mb-3">
                              Get Verified Today
                            </Typography>
                            <Typography variant="body1" className="text-slate-500 mb-8 max-w-sm mx-auto">
                              Your account is currently restricted. Complete verification to access all features.
                            </Typography>
                            <Button
                              variant="contained"
                              className="bg-primary-600 hover:bg-primary-700 text-white rounded-2xl px-10 py-4 font-black normal-case shadow-xl shadow-primary-600/20"
                              onClick={() => setShowKycForm(true)}
                            >
                              Unlock Full Access
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 1 && (
                      <motion.div
                        key="kyc-details"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <UserKycDashboard />
                      </motion.div>
                    )}

                    {activeTab === 2 && (
                      <motion.div
                        key="documents"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <DocumentUpload />
                      </motion.div>
                    )}

                    {activeTab === 3 && (
                      <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <div className="py-20 text-center">
                          <History className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                          <Typography variant="h6" className="text-slate-800 font-bold mb-2">
                             Verification Audit Log
                          </Typography>
                          <Typography variant="body2" className="text-slate-500">
                            A detailed record of your verification history will appear here.
                          </Typography>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </Paper>
            </motion.div>
          </Grid>

          {/* Sidebar Area */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Quick Status */}
              <KycStatusBanner
                onStartKyc={() => setShowKycForm(true)}
                onViewKyc={() => setActiveTab(1)}
              />

              {/* Requirements Sidebar Card */}
              {requirements && (
                <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                   <div className="flex items-center justify-between mb-6">
                      <Typography variant="h6" className="text-slate-900 font-black tracking-tight">
                        Requirements
                      </Typography>
                      <Chip 
                        label={requirements.requirementLevel} 
                        className="bg-primary-50 text-primary-700 font-bold border-none"
                        size="small"
                      />
                   </div>
                   
                   <div className="space-y-6">
                      <Box>
                        <Typography className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                           Mandatory Files
                        </Typography>
                        <div className="flex flex-wrap gap-2">
                          {requirements.requiredDocuments.map((doc) => (
                             <div key={doc} className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                                <span className="text-xs font-bold text-slate-600">{doc.replace(/_/g, ' ')}</span>
                             </div>
                          ))}
                        </div>
                      </Box>
                      
                      <Box>
                        <Typography className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                           Verification Workflow
                        </Typography>
                        <div className="space-y-3">
                           {requirements.verificationSteps.map((step, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                 <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold border border-emerald-100">
                                    {idx + 1}
                                 </div>
                                 <span className="text-sm font-medium text-slate-700 capitalize">
                                    {step.replace(/_/g, ' ')}
                                 </span>
                              </div>
                           ))}
                        </div>
                      </Box>

                      {requirements.description && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                          <div className="flex gap-3">
                             <Info className="text-amber-600 w-5 h-5 flex-shrink-0" />
                             <Typography variant="body2" className="text-amber-800 font-medium leading-relaxed">
                                {requirements.description}
                             </Typography>
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </motion.div>
          </Grid>
        </Grid>

        {/* KYC Form Dialog */}
        <Dialog
          open={showKycForm}
          onClose={() => setShowKycForm(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            className: "rounded-[40px] overflow-hidden"
          }}
        >
          <Box className="bg-primary-900 px-8 py-6 flex items-center justify-between">
            <Typography variant="h5" className="text-white font-black">
              Verification Wizard
            </Typography>
            <IconButton onClick={() => setShowKycForm(false)} className="text-white/50 hover:text-white">
               <ExpandMore className="rotate-180" />
            </IconButton>
          </Box>
          <DialogContent className="p-8">
            <UserKycForm onSubmissionComplete={handleKycSubmissionComplete} />
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};