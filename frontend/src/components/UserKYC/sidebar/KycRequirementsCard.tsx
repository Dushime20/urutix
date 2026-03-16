import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Info,
  CheckCircle,
  Description,
  Security,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface KycRequirementsCardProps {
  requirements: any;
}

export const KycRequirementsCard: React.FC<KycRequirementsCardProps> = ({
  requirements,
}) => {
  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'basic': return 'default';
      case 'standard': return 'info';
      case 'enhanced': return 'warning';
      case 'premium': return 'success';
      default: return 'default';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'basic': return '🥉';
      case 'standard': return '🥈';
      case 'enhanced': return '🥇';
      case 'premium': return '💎';
      default: return '📋';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="bg-white border border-slate-100 shadow-xl rounded-[32px] overflow-hidden">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[16px] bg-primary-50 text-primary-600 flex items-center justify-center">
                <Security className="w-5 h-5" />
              </div>
              <Typography className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                Requirements
              </Typography>
            </div>
            <Chip 
              label={`${getLevelIcon(requirements.requirementLevel)} ${requirements.requirementLevel}`}
              color={getLevelColor(requirements.requirementLevel)}
              className="font-bold"
              size="small"
            />
          </div>

          {/* Required Documents */}
          <Box className="mb-6">
            <Typography className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 pl-1">
              Required Documents
            </Typography>
            <div className="space-y-2">
              {requirements.requiredDocuments.map((doc: string, index: number) => (
                <motion.div
                  key={doc}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                  <Typography className="text-[11px] font-black text-slate-700 flex-1 tracking-tight">
                    {doc.replace(/_/g, ' ')}
                  </Typography>
                  <Description className="text-slate-400 w-4 h-4" />
                </motion.div>
              ))}
            </div>
          </Box>

          <Divider className="mb-6" />

          {/* Verification Steps */}
          <Box className="mb-6">
            <Typography className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 pl-1">
              Verification Process
            </Typography>
            <List dense className="space-y-2">
              {requirements.verificationSteps.map((step: string, index: number) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ListItem className="px-0 py-2">
                    <ListItemIcon className="min-w-0 mr-3">
                      <div className="w-7 h-7 rounded-[12px] bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black border border-emerald-100">
                        {index + 1}
                      </div>
                    </ListItemIcon>
                    <ListItemText 
                      primary={step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      primaryTypographyProps={{
                        className: "text-[11px] font-black text-slate-700 tracking-tight"
                      }}
                    />
                  </ListItem>
                </motion.div>
              ))}
            </List>
          </Box>

          {/* Auto Approval Status */}
          {requirements.autoApprovalEligible !== undefined && (
            <>
              <Divider className="mb-6" />
              <Box className="mb-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className={`p-2 rounded-lg ${
                    requirements.autoApprovalEligible 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    {requirements.autoApprovalEligible ? <CheckCircle /> : <Star />}
                  </div>
                  <div className="flex-1">
                    <Typography variant="body2" className="font-bold text-slate-900 mb-1">
                      {requirements.autoApprovalEligible ? 'Auto-Approval Eligible' : 'Manual Review Required'}
                    </Typography>
                    <Typography variant="caption" className="text-slate-600">
                      {requirements.autoApprovalEligible 
                        ? 'Instant verification upon document upload'
                        : 'Documents will be reviewed by our team'
                      }
                    </Typography>
                  </div>
                </div>
              </Box>
            </>
          )}

          {/* Description */}
          {requirements.description && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <div className="flex gap-3">
                <Info className="text-amber-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                <Typography variant="body2" className="text-amber-800 font-medium leading-relaxed">
                  {requirements.description}
                </Typography>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};