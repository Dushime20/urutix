import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Cancel,
  Upload,
  Visibility,
  Info,
  Person,
  LocationOn,
  AccountBalance,
  Work,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { userKycApi, type UserKycProfile, type UserKycDocument, type KycRequirements } from '../../services/userKycApi';
import { UserKycForm } from './UserKycForm';
import { DocumentUpload } from './DocumentUpload';

export const UserKycDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kycData, setKycData] = useState<{
    profile: UserKycProfile;
    documents: UserKycDocument[];
    requirements: KycRequirements;
  } | null>(null);
  const [showKycForm, setShowKycForm] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  useEffect(() => {
    loadKycData();
  }, []);

  const loadKycData = async () => {
    try {
      setLoading(true);
      const response = await userKycApi.getMyKyc();
      setKycData(response.data);
    } catch (error: any) {
      console.error('Failed to load KYC data', error);
    } finally {
      setLoading(false);
    }
  };


  const calculateCompletionPercentage = () => {
    if (!kycData) return 0;
    
    const { profile, requirements } = kycData;
    let completed = 0;
    let total = 0;

    // Check basic information
    if (profile.kycData?.firstName) completed++;
    total++;

    // Check verification flags
    const verificationChecks = [
      profile.identityVerified,
      profile.addressVerified,
      profile.financialVerified,
      profile.businessVerified,
    ];

    completed += verificationChecks.filter(Boolean).length;
    total += verificationChecks.length;

    // Check required documents - improved logic
    const requiredDocs = requirements.requiredDocuments || [];
    const uploadedDocs = kycData.documents.map(doc => doc.documentType);
    
    // Create a mapping for document type matching
    const documentMapping = {
      'BUSINESS_REGISTRATION': ['BUSINESS_REGISTRATION', 'BUSINESS_CERTIFICATE'],
      'TAX_CERTIFICATE': ['TAX_CERTIFICATE', 'TAX_REGISTRATION'],
      'AUTHORIZED_REPRESENTATIVE_ID': ['AUTHORIZED_REPRESENTATIVE_ID', 'NATIONAL_ID', 'IDENTITY_DOCUMENT'],
      'IDENTITY_DOCUMENT': ['IDENTITY_DOCUMENT', 'NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE'],
      'ADDRESS_PROOF': ['ADDRESS_PROOF', 'UTILITY_BILL', 'BANK_STATEMENT'],
      'BANK_STATEMENT': ['BANK_STATEMENT', 'FINANCIAL_STATEMENT']
    };
    
    requiredDocs.forEach(requiredDocType => {
      const acceptableTypes = documentMapping[requiredDocType] || [requiredDocType];
      const hasMatchingDoc = uploadedDocs.some(uploadedType => 
        acceptableTypes.includes(uploadedType)
      );
      if (hasMatchingDoc) completed++;
      total++;
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Verification Hub...</p>
      </div>
    );
  }

  return (
    <Box className="space-y-8">
      {/* Verification Summary Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Card */}
          <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30">
                       <CheckCircle className="text-white w-5 h-5" />
                    </div>
                    <Typography variant="h6" className="text-slate-900 font-black tracking-tight">
                       Verification Status
                    </Typography>
                  </div>
                  <Chip
                    label={kycData?.profile.kycStatus.replace('_', ' ')}
                    className={`font-black text-[10px] uppercase tracking-widest px-3 border-none ${
                        kycData?.profile.kycStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 
                        kycData?.profile.kycStatus === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  />
                </div>

                <div className="mb-10">
                   <div className="flex items-end justify-between mb-3 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                      <span>Completion</span>
                      <span className="text-primary-600 text-sm font-black">{calculateCompletionPercentage()}%</span>
                   </div>
                   <div className="h-4 w-full bg-slate-50 rounded-full p-1 border border-slate-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateCompletionPercentage()}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full shadow-sm"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Score</p>
                      <p className="text-xl font-black text-slate-900">{kycData?.profile.complianceScore}<span className="text-sm font-medium text-slate-400">/100</span></p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Level</p>
                      <p className="text-xl font-black text-slate-900">{kycData?.profile.kycRequirementLevel}</p>
                   </div>
                </div>
              </div>
          </div>

          {/* Verification Checklist */}
          <div className="bg-slate-900 rounded-[40px] p-8 border border-white/5 shadow-2xl shadow-primary-900/20">
              <Typography variant="h6" className="text-white font-black tracking-tight mb-8">
                 Identity & Compliance
              </Typography>
              
              <div className="space-y-4">
                 {[
                   { label: 'Identity', verified: kycData?.profile.identityVerified, icon: <Person /> },
                   { label: 'Residential', verified: kycData?.profile.addressVerified, icon: <LocationOn /> },
                   { label: 'Financial', verified: kycData?.profile.financialVerified, icon: <AccountBalance /> },
                   { label: 'Background', verified: kycData?.profile.backgroundCheckCompleted, icon: <Work /> },
                 ].map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-3xl border transition-all flex items-center justify-between ${
                        item.verified ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-50'
                    }`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              item.verified ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/40'
                          }`}>
                             {React.cloneElement(item.icon as React.ReactElement, { sx: { fontSize: 18 } })}
                          </div>
                          <span className="text-sm font-bold text-white tracking-tight">{item.label}</span>
                       </div>
                       {item.verified ? (
                         <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="text-emerald-500 w-4 h-4" />
                         </div>
                       ) : (
                         <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                            <Warning className="text-white/20 w-3 h-3" />
                         </div>
                       )}
                    </div>
                 ))}
              </div>
          </div>
      </div>

      {/* Documents Grid */}
      <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
             <div>
                <Typography variant="h5" className="text-slate-900 font-black tracking-tight mb-2">
                   Verification Documents
                </Typography>
                <Typography variant="body2" className="text-slate-500 font-medium">
                   Manage and review all uploaded documents for compliance.
                </Typography>
             </div>
             <Button
                variant="contained"
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-2xl px-6 py-3 font-black normal-case shadow-lg shadow-primary-600/30"
                startIcon={<Upload className="w-4 h-4" />}
                onClick={() => setShowDocumentUpload(true)}
              >
                Upload New
              </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {kycData?.documents.map((doc) => (
                <div key={doc.id} className="p-6 rounded-[32px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary-100 transition-all group shadow-sm hover:shadow-xl hover:shadow-primary-600/5">
                   <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-slate-100 text-primary-600 shadow-sm group-hover:scale-110 transition-transform">
                         <Info />
                      </div>
                      <Chip 
                        label={doc.verified ? 'Verified' : 'Pending'} 
                        size="small"
                        className={`font-black text-[9px] uppercase tracking-widest ${
                            doc.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        } border-none`}
                      />
                   </div>
                   
                   <Typography variant="subtitle1" className="text-slate-900 font-black truncate mb-1">
                      {doc.documentName}
                   </Typography>
                   <Typography className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-6">
                      {doc.documentType.replace(/_/g, ' ')}
                   </Typography>

                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 italic">
                         Added {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                      <Tooltip title="View Document">
                        <IconButton size="small" className="bg-white border border-slate-100 text-primary-600 shadow-sm hover:bg-primary-50">
                          <Visibility className="w-4 h-4" />
                        </IconButton>
                      </Tooltip>
                   </div>
                </div>
             ))}
             {(!kycData?.documents || kycData.documents.length === 0) && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
                   <Upload className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                   <Typography className="text-slate-400 font-bold">No documents uploaded yet</Typography>
                </div>
             )}
          </div>
      </div>

      {/* KYC Form Dialog */}
      <Dialog
        open={showKycForm}
        onClose={() => setShowKycForm(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "rounded-[40px] overflow-hidden" }}
      >
        <div className="bg-primary-900 px-8 py-6 flex items-center justify-between text-white">
          <Typography variant="h5" className="font-black">Submit Verification</Typography>
          <IconButton onClick={() => setShowKycForm(false)} className="text-white/50 hover:text-white">
            <Cancel />
          </IconButton>
        </div>
        <DialogContent className="p-8">
          <UserKycForm
            onSubmissionComplete={() => {
              setShowKycForm(false);
              loadKycData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog
        open={showDocumentUpload}
        onClose={() => setShowDocumentUpload(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: "rounded-[40px] overflow-hidden" }}
      >
        <div className="bg-primary-900 px-7 py-5 flex items-center justify-between text-white">
          <Typography variant="h6" className="font-black">Upload Evidence</Typography>
          <IconButton onClick={() => setShowDocumentUpload(false)} className="text-white/50 hover:text-white">
            <Cancel />
          </IconButton>
        </div>
        <DialogContent className="p-7">
          <DocumentUpload
            requirements={kycData?.requirements}
            onUploadComplete={() => {
              setShowDocumentUpload(false);
              loadKycData();
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};