import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Person,
  Email,
  Phone,
  Business,
  Security,
  LocationOn,
  AccountBalance,
  CheckCircle,
  Schedule,
  Star,
  Verified,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface KycProfileTabProps {
  profile: any;
}

export const KycProfileTab: React.FC<KycProfileTabProps> = ({ profile }) => {
  if (!profile) {
    return (
      <div className="text-center py-20">
        <Person className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <Typography variant="h6" className="text-slate-600 font-bold mb-2">
          No Profile Data
        </Typography>
        <Typography variant="body2" className="text-slate-500">
          Complete your verification to view detailed profile information.
        </Typography>
      </div>
    );
  }

  const getStatusColor = (verified: boolean) => {
    return verified ? 'success' : 'default';
  };

  const getStatusIcon = (verified: boolean) => {
    return verified ? <CheckCircle className="text-green-500" /> : <Schedule className="text-orange-500" />;
  };

  const verificationSections = [
    {
      title: 'Identity Verification',
      verified: profile.identityVerified,
      icon: <Security />,
      items: [
        { label: 'Government ID', status: profile.identityVerified },
        { label: 'Biometric Verification', status: profile.identityVerified },
        { label: 'Identity Cross-Check', status: profile.identityVerified },
      ]
    },
    {
      title: 'Address Verification',
      verified: profile.addressVerified,
      icon: <LocationOn />,
      items: [
        { label: 'Proof of Address', status: profile.addressVerified },
        { label: 'Address Validation', status: profile.addressVerified },
        { label: 'Utility Bill Verification', status: profile.addressVerified },
      ]
    },
    {
      title: 'Financial Verification',
      verified: profile.financialVerified,
      icon: <AccountBalance />,
      items: [
        { label: 'Bank Account Verification', status: profile.financialVerified },
        { label: 'Financial Standing Check', status: profile.financialVerified },
        { label: 'Credit Assessment', status: profile.financialVerified },
      ]
    },
    {
      title: 'Business Verification',
      verified: profile.businessVerified,
      icon: <Business />,
      items: [
        { label: 'Business Registration', status: profile.businessVerified },
        { label: 'Tax ID Verification', status: profile.businessVerified },
        { label: 'Business License Check', status: profile.businessVerified },
      ]
    },
  ];

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <CardContent className="p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <Avatar 
                  className="w-20 h-20 bg-blue-600 text-white text-2xl font-bold"
                  src={profile.avatarUrl}
                >
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </Avatar>
                {profile.identityVerified && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
                    <Verified className="text-white w-4 h-4" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <Typography variant="h4" className="font-black text-slate-900 mb-2 tracking-tight">
                  {profile.firstName} {profile.lastName}
                </Typography>
                <div className="flex items-center gap-3 mb-3">
                  <Chip 
                    label={profile.kycStatus || 'Pending'}
                    color={getStatusColor(profile.identityVerified)}
                    className="font-bold"
                  />
                  <Chip 
                    label={`Level: ${profile.kycRequirementLevel || 'BASIC'}`}
                    variant="outlined"
                    className="font-bold"
                  />
                  <Chip 
                    label={`Score: ${profile.complianceScore || 0}`}
                    variant="outlined"
                    className="font-bold"
                    icon={<Star />}
                  />
                </div>
                
                {profile.companyName && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Business className="w-3.5 h-3.5" />
                    <Typography className="text-[10px] font-black uppercase tracking-widest">
                      {profile.companyName}
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            {profile.kycStatus === 'APPROVED' && (
              <Alert severity="success" className="rounded-xl">
                <Typography variant="body2" className="font-medium">
                  ✅ Your verification is complete! You have full access to all platform features.
                </Typography>
              </Alert>
            )}

            {profile.kycStatus === 'REJECTED' && (
              <Alert severity="error" className="rounded-xl">
                <Typography variant="body2" className="font-medium">
                  ❌ Verification requires attention. Please review the feedback and resubmit required documents.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-1">
          Contact Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Email className="text-blue-600 w-5 h-5" />
                  </div>
                  <div>
                    <Typography className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Email Address
                    </Typography>
                    <Typography className="text-sm font-black text-slate-800 tracking-tight">
                      {profile.user?.email || 'Not provided'}
                    </Typography>
                  </div>
                </div>
                <Chip 
                  label={profile.user?.emailVerifiedAt ? 'Verified' : 'Unverified'}
                  color={profile.user?.emailVerifiedAt ? 'success' : 'warning'}
                  size="small"
                  className="font-bold"
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Phone className="text-green-600 w-5 h-5" />
                  </div>
                  <div>
                    <Typography className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Phone Number
                    </Typography>
                    <Typography className="text-sm font-black text-slate-800 tracking-tight">
                      {profile.user?.phone || 'Not provided'}
                    </Typography>
                  </div>
                </div>
                <Chip 
                  label={profile.user?.phoneVerifiedAt ? 'Verified' : 'Unverified'}
                  color={profile.user?.phoneVerifiedAt ? 'success' : 'warning'}
                  size="small"
                  className="font-bold"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* Verification Status Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pl-1">
          Verification Details
        </Typography>
        
        <Grid container spacing={4}>
          {verificationSections.map((section, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={section.title}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`border-2 ${
                  section.verified 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-slate-200 bg-white'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        section.verified ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {section.icon}
                      </div>
                      <div className="flex-1">
                        <Typography className="text-base font-black text-slate-800 tracking-tight">
                          {section.title}
                        </Typography>
                      </div>
                      {getStatusIcon(section.verified)}
                    </div>
                    
                    <List dense className="space-y-1">
                      {section.items.map((item, idx) => (
                        <ListItem key={idx} className="px-0">
                          <ListItemIcon className="min-w-0 mr-3">
                            <div className={`w-2 h-2 rounded-full ${
                              item.status ? 'bg-green-500' : 'bg-slate-300'
                            }`} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={item.label}
                            primaryTypographyProps={{
                              className: `text-xs font-bold tracking-tight ${
                                item.status ? 'text-slate-700' : 'text-slate-400'
                              }`
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Additional Information */}
      {(profile.bio || profile.websiteUrl) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Typography variant="h6" className="font-black text-slate-900 mb-4">
            Additional Information
          </Typography>
          
          <Card className="border border-slate-200">
            <CardContent className="p-6">
              {profile.bio && (
                <div className="mb-4">
                  <Typography variant="body2" className="text-slate-500 font-medium mb-2">
                    Biography
                  </Typography>
                  <Typography variant="body1" className="text-slate-700 leading-relaxed">
                    {profile.bio}
                  </Typography>
                </div>
              )}
              
              {profile.websiteUrl && (
                <div>
                  <Typography variant="body2" className="text-slate-500 font-medium mb-2">
                    Website
                  </Typography>
                  <Typography variant="body1" className="text-blue-600 font-medium">
                    {profile.websiteUrl}
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};