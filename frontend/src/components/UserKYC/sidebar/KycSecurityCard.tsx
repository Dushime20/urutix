import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Shield,
  Lock,
  Security,
  Verified,
  CloudUpload,
  Fingerprint,
  VpnKey,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export const KycSecurityCard: React.FC = () => {
  const securityFeatures = [
    {
      icon: <Lock className="text-blue-600" />,
      title: 'End-to-End Encryption',
      description: 'All documents encrypted in transit and at rest',
    },
    {
      icon: <Fingerprint className="text-green-600" />,
      title: 'Biometric Verification',
      description: 'Advanced identity verification technology',
    },
    {
      icon: <VpnKey className="text-purple-600" />,
      title: 'Multi-Factor Authentication',
      description: 'Additional security layers for account access',
    },
    {
      icon: <CloudUpload className="text-orange-600" />,
      title: 'Secure Cloud Storage',
      description: 'Documents stored in SOC 2 compliant infrastructure',
    },
  ];

  const complianceStandards = [
    { name: 'ISO 27001', status: 'Certified' },
    { name: 'SOC 2 Type II', status: 'Compliant' },
    { name: 'GDPR', status: 'Compliant' },
    { name: 'PCI DSS', status: 'Level 1' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 shadow-xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
              <Shield className="text-white w-6 h-6" />
            </div>
            <div>
              <Typography variant="h6" className="font-black text-slate-900">
                Security & Compliance
              </Typography>
              <Typography variant="caption" className="text-slate-600 font-medium">
                Enterprise-grade protection
              </Typography>
            </div>
          </div>

          {/* Security Features */}
          <div className="mb-6">
            <Typography className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              Security Features
            </Typography>
            <List dense className="space-y-1">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ListItem className="px-0 py-3 bg-white rounded-xl border border-slate-100 mb-2">
                    <ListItemIcon className="min-w-0 mr-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                        {feature.icon}
                      </div>
                    </ListItemIcon>
                    <ListItemText 
                      primary={feature.title}
                      secondary={feature.description}
                      primaryTypographyProps={{
                        className: "text-sm font-bold text-slate-900"
                      }}
                      secondaryTypographyProps={{
                        className: "text-xs text-slate-600 mt-1"
                      }}
                    />
                  </ListItem>
                </motion.div>
              ))}
            </List>
          </div>

          <Divider className="mb-6" />

          {/* Compliance Standards */}
          <div className="mb-6">
            <Typography className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              Compliance Standards
            </Typography>
            <div className="grid grid-cols-2 gap-3">
              {complianceStandards.map((standard, index) => (
                <motion.div
                  key={standard.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-3 bg-white rounded-xl border border-slate-100 text-center"
                >
                  <CheckCircle className="text-green-500 w-5 h-5 mx-auto mb-2" />
                  <Typography variant="body2" className="font-bold text-slate-900 mb-1">
                    {standard.name}
                  </Typography>
                  <Chip 
                    label={standard.status}
                    size="small"
                    color="success"
                    className="font-bold text-xs"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trust Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Verified className="text-green-600 w-5 h-5" />
              </div>
              <div className="flex-1">
                <Typography variant="body2" className="font-bold text-green-900 mb-1">
                  Bank-Level Security
                </Typography>
                <Typography variant="caption" className="text-green-700">
                  Your data is protected with the same security standards used by major financial institutions.
                </Typography>
              </div>
            </div>
          </div>

          {/* Data Retention Notice */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-2">
              <Security className="text-blue-600 w-4 h-4 flex-shrink-0 mt-0.5" />
              <Typography variant="caption" className="text-blue-800 font-medium leading-relaxed">
                Documents are automatically deleted after verification completion or 90 days of inactivity, whichever comes first.
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};