import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  TrendingUp,
  Security,
  Schedule,
  CheckCircle,
  Star,
  Shield,
  Timeline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface KycAnalyticsTabProps {
  metrics: any;
  profile: any;
}

export const KycAnalyticsTab: React.FC<KycAnalyticsTabProps> = ({
  metrics,
  profile,
}) => {
  const getVerificationMetrics = () => {
    return [
      {
        title: 'Identity Score',
        value: profile?.identityVerified ? 100 : 0,
        max: 100,
        color: 'success',
        icon: <Security />,
      },
      {
        title: 'Address Score',
        value: profile?.addressVerified ? 100 : 0,
        max: 100,
        color: 'info',
        icon: <CheckCircle />,
      },
      {
        title: 'Business Score',
        value: profile?.businessVerified ? 100 : 0,
        max: 100,
        color: 'warning',
        icon: <Star />,
      },
      {
        title: 'Financial Score',
        value: profile?.financialVerified ? 100 : 0,
        max: 100,
        color: 'primary',
        icon: <TrendingUp />,
      },
    ];
  };

  const getTimelineData = () => {
    const events = [];
    
    if (profile?.createdAt) {
      events.push({
        date: new Date(profile.createdAt),
        title: 'Account Created',
        description: 'KYC process initiated',
        type: 'info',
      });
    }
    
    if (profile?.kycSubmittedAt) {
      events.push({
        date: new Date(profile.kycSubmittedAt),
        title: 'KYC Submitted',
        description: 'Initial verification documents submitted',
        type: 'warning',
      });
    }
    
    if (profile?.kycVerifiedAt) {
      events.push({
        date: new Date(profile.kycVerifiedAt),
        title: 'Verification Complete',
        description: 'All verification requirements met',
        type: 'success',
      });
    }
    
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const verificationMetrics = getVerificationMetrics();
  const timelineEvents = getTimelineData();

  return (
    <div className="space-y-8">
      {/* Verification Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pl-1">
          Verification Breakdown
        </Typography>
        
        <Grid container spacing={4}>
          {verificationMetrics.map((metric, index) => (
            <Grid size={{ xs: 12, sm: 6 }} key={metric.title}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="border border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-xl ${
                        metric.color === 'success' ? 'bg-green-50 text-green-600' :
                        metric.color === 'info' ? 'bg-blue-50 text-blue-600' :
                        metric.color === 'warning' ? 'bg-orange-50 text-orange-600' :
                        'bg-purple-50 text-purple-600'
                      }`}>
                        {metric.icon}
                      </div>
                      <div className="flex-1">
                        <Typography className="text-base font-black text-slate-800 tracking-tight mb-1">
                          {metric.title}
                        </Typography>
                        <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                          {metric.value}% Complete
                        </Typography>
                      </div>
                      <Chip 
                        label={metric.value === 100 ? 'Complete' : 'Pending'}
                        color={metric.value === 100 ? 'success' : 'default'}
                        className="font-bold"
                      />
                    </div>
                    
                    <LinearProgress 
                      variant="determinate" 
                      value={metric.value}
                      className="h-2 rounded-full bg-slate-100"
                      sx={{
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 
                            metric.color === 'success' ? '#10b981' :
                            metric.color === 'info' ? '#3b82f6' :
                            metric.color === 'warning' ? '#f59e0b' :
                            '#8b5cf6',
                          borderRadius: '9999px',
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Verification Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pl-1">
          Verification Timeline
        </Typography>
        
        <Card className="border border-slate-200">
          <CardContent className="p-8">
            {timelineEvents.length > 0 ? (
              <div className="space-y-6">
                {timelineEvents.map((event, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      event.type === 'success' ? 'bg-green-100 text-green-600' :
                      event.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {event.type === 'success' ? <CheckCircle /> :
                       event.type === 'warning' ? <Schedule /> :
                       <Timeline />}
                    </div>
                    
                    <div className="flex-1 border-l-2 border-slate-100 pl-4 py-1">
                      <div className="flex flex-col mb-1">
                        <Typography className="text-sm font-black text-slate-800 tracking-tight">
                          {event.title}
                        </Typography>
                        <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {event.date.toLocaleDateString()}
                        </Typography>
                      </div>
                      <Typography className="text-[11px] font-bold text-slate-500 leading-relaxed">
                        {event.description}
                      </Typography>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Timeline className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <Typography variant="h6" className="text-slate-600 font-bold mb-2">
                  No Timeline Data
                </Typography>
                <Typography variant="body2" className="text-slate-500">
                  Your verification timeline will appear here as you progress.
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pl-1">
          Performance Insights
        </Typography>
        
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <Typography className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                    Completion Rate
                  </Typography>
                </div>
                
                <Typography variant="h3" className="font-black text-blue-600 mb-2">
                  {metrics?.completionRate || 0}%
                </Typography>
                
                <Typography variant="body2" className="text-slate-600 mb-4">
                  You're {metrics?.completionRate > 50 ? 'ahead of' : 'behind'} the average completion rate
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={metrics?.completionRate || 0}
                  className="h-2 rounded-full bg-blue-100"
                  sx={{
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#2563eb',
                      borderRadius: '9999px',
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Shield className="w-5 h-5" />
                  </div>
                  <Typography className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                    Security Level
                  </Typography>
                </div>
                
                <Typography variant="h3" className="font-black text-green-600 mb-2">
                  {profile?.kycRequirementLevel || 'BASIC'}
                </Typography>
                
                <Typography variant="body2" className="text-slate-600 mb-4">
                  Current verification tier and access level
                </Typography>
                
                <div className="flex gap-2">
                  {['BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM'].map((level, idx) => (
                    <div 
                      key={level}
                      className={`h-2 flex-1 rounded-full ${
                        idx <= (['BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM'].indexOf(profile?.kycRequirementLevel || 'BASIC'))
                          ? 'bg-green-500' 
                          : 'bg-green-100'
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </div>
  );
};