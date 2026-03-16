import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Alert,
} from '@mui/material';
import {
  History,
  Upload,
  CheckCircle,
  Warning,
  Schedule,
  Person,
  Security,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { EnhancedTable } from '../../EnliteUI/Tables/EnhancedTable';
import { userKycApi } from '../../../services/userKycApi';

export const KycActivityTab: React.FC = () => {
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLog();
  }, []);

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      const response = await userKycApi.getMyAuditLog();
      setAuditLog(response.data || []);
    } catch (error) {
      console.error('Failed to load audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'DOCUMENT_UPLOADED': return <Upload className="text-blue-500" />;
      case 'DOCUMENT_VERIFIED': return <CheckCircle className="text-green-500" />;
      case 'DOCUMENT_REJECTED': return <Warning className="text-red-500" />;
      case 'SUBMITTED': return <Person className="text-blue-500" />;
      case 'APPROVED': return <CheckCircle className="text-green-500" />;
      case 'REJECTED': return <Warning className="text-red-500" />;
      case 'UNDER_REVIEW': return <Schedule className="text-orange-500" />;
      case 'IDENTITY_VERIFIED': return <Security className="text-green-500" />;
      case 'ADDRESS_VERIFIED': return <Security className="text-green-500" />;
      case 'FINANCIAL_VERIFIED': return <Security className="text-green-500" />;
      case 'BUSINESS_VERIFIED': return <Security className="text-green-500" />;
      default: return <History className="text-slate-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'APPROVED':
      case 'DOCUMENT_VERIFIED':
      case 'IDENTITY_VERIFIED':
      case 'ADDRESS_VERIFIED':
      case 'FINANCIAL_VERIFIED':
      case 'BUSINESS_VERIFIED':
        return 'success';
      case 'REJECTED':
      case 'DOCUMENT_REJECTED':
        return 'error';
      case 'UNDER_REVIEW':
      case 'SUBMITTED':
        return 'warning';
      case 'DOCUMENT_UPLOADED':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatActionText = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const tableColumns = [
    {
      key: 'action',
      label: 'Activity',
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 bg-slate-100">
            {getActionIcon(value)}
          </Avatar>
          <div>
            <Typography variant="body2" className="font-bold text-slate-900">
              {formatActionText(value)}
            </Typography>
            <Chip 
              label={value}
              size="small"
              color={getActionColor(value)}
              className="font-bold text-xs"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'notes',
      label: 'Description',
      render: (value: string) => (
        <Typography variant="body2" className="text-slate-600 max-w-xs">
          {value || 'No additional details'}
        </Typography>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date & Time',
      render: (value: string) => (
        <div>
          <Typography variant="body2" className="font-medium text-slate-900">
            {new Date(value).toLocaleDateString()}
          </Typography>
          <Typography variant="caption" className="text-slate-500">
            {new Date(value).toLocaleTimeString()}
          </Typography>
        </div>
      ),
    },
    {
      key: 'metadata',
      label: 'Details',
      render: (value: any) => (
        <div className="space-y-1">
          {value && Object.keys(value).length > 0 ? (
            Object.entries(value).slice(0, 2).map(([key, val]: [string, any]) => (
              <div key={key} className="text-xs">
                <span className="font-medium text-slate-600">{key}:</span>
                <span className="text-slate-500 ml-1">{String(val)}</span>
              </div>
            ))
          ) : (
            <Typography variant="caption" className="text-slate-400">
              No metadata
            </Typography>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <Typography variant="h6" className="text-slate-600 font-bold mb-2">
          Loading Activity Log
        </Typography>
        <Typography variant="body2" className="text-slate-500">
          Retrieving your verification history...
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Activity Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                <History className="text-blue-600 w-8 h-8" />
              </div>
              <div>
                <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">
                  Activity Timeline
                </Typography>
                <Typography className="text-sm font-black text-slate-800 tracking-tight">
                  Verification activities and status changes
                </Typography>
              </div>
            </div>

            {auditLog.length > 0 && (
              <Alert severity="info" className="rounded-xl">
                <Typography variant="body2" className="font-medium">
                  📊 {auditLog.length} activities recorded • Last activity: {
                    auditLog[0] ? new Date(auditLog[0].createdAt).toLocaleDateString() : 'N/A'
                  }
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pl-1">
          Recent Activities
        </Typography>
        
        <EnhancedTable
          columns={tableColumns}
          data={auditLog}
          loading={loading}
          emptyMessage="No activity recorded yet"
          hoverable
          striped
        />
      </motion.div>

      {/* Activity Summary */}
      {auditLog.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography variant="h6" className="font-black text-slate-900 mb-6">
            Activity Summary
          </Typography>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Documents Uploaded',
                count: auditLog.filter(log => log.action === 'DOCUMENT_UPLOADED').length,
                color: 'bg-blue-50 text-blue-600',
                icon: <Upload />,
              },
              {
                label: 'Documents Verified',
                count: auditLog.filter(log => log.action === 'DOCUMENT_VERIFIED').length,
                color: 'bg-green-50 text-green-600',
                icon: <CheckCircle />,
              },
              {
                label: 'Status Changes',
                count: auditLog.filter(log => ['SUBMITTED', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(log.action)).length,
                color: 'bg-orange-50 text-orange-600',
                icon: <Schedule />,
              },
              {
                label: 'Verifications',
                count: auditLog.filter(log => log.action.includes('_VERIFIED')).length,
                color: 'bg-purple-50 text-purple-600',
                icon: <Security />,
              },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="border border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${item.color}`}>
                        {item.icon}
                      </div>
                      <div>
                        <Typography variant="h4" className="font-black text-slate-900 mb-0 tracking-tighter">
                          {item.count}
                        </Typography>
                        <Typography className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {item.label}
                        </Typography>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {auditLog.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <History className="w-12 h-12 text-slate-400" />
          </div>
          <Typography variant="h5" className="text-slate-900 font-bold mb-3">
            No Activity Yet
          </Typography>
          <Typography variant="body1" className="text-slate-500 mb-8 max-w-md mx-auto">
            Your verification activities and status changes will appear here as you progress through the KYC process.
          </Typography>
        </motion.div>
      )}
    </div>
  );
};