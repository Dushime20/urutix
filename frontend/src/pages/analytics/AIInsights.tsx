import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import { CheckCircle2 } from 'lucide-react';
import {
  Psychology as AIIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Lightbulb as InsightIcon,
  AutoFixHigh as OptimizeIcon,
} from '@mui/icons-material';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsApi } from '../../services/analyticsApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-insights-tabpanel-${index}`}
      aria-labelledby={`ai-insights-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

import DataCard from '../../components/EnliteUI/Cards/DataCard';

export const AIInsights: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Fetch AI insights data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['analytics', 'ai', 'dashboard', user?.tenantId],
    queryFn: () => analyticsApi.getAIDashboardSummary(),
    enabled: !!user?.tenantId
  });

  const { data: comprehensiveInsights } = useQuery({
    queryKey: ['analytics', 'ai', 'comprehensive', user?.tenantId],
    queryFn: () => analyticsApi.getComprehensiveAIInsights(),
    enabled: !!user?.tenantId
  });

  const { data: costPredictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['analytics', 'ai', 'predictions', 'costs', user?.tenantId],
    queryFn: () => analyticsApi.getCostPredictions(),
    enabled: !!user?.tenantId
  });

  const { data: riskAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['analytics', 'ai', 'alerts', user?.tenantId],
    queryFn: () => analyticsApi.getRiskAlerts(),
    enabled: !!user?.tenantId
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (dashboardError) {
    return (
      <div className="p-6">
        <Alert severity="error" sx={{ borderRadius: '12px' }}>
          Failed to load AI insights: {(dashboardError as any).message}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* AI Dashboard Overview Cards */}
      {dashboardLoading ? (
        <Grid container spacing={3}>
           {[1,2,3,4].map(i => (
             <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
               <div className="h-32 bg-white rounded-3xl border border-slate-100 animate-pulse" />
             </Grid>
           ))}
        </Grid>
      ) : dashboardData && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="TOTAL INSIGHTS"
              value={dashboardData.totalInsights}
              subtitle="AI RECOMMENDATIONS"
              icon={<AIIcon />}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="ACTIVE ALERTS"
              value={dashboardData.activeAlerts}
              subtitle="ISSUES DETECTED"
              icon={<WarningIcon />}
              color="error"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="ESTIMATED SAVINGS"
              value={`₦${dashboardData.summary?.potentialSavings?.toLocaleString() || 0}`}
              subtitle="TOTAL POTENTIAL SAVINGS"
              icon={<TrendingUpIcon />}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="CONFIDENCE LEVEL"
              value={`${(dashboardData.latestPrediction?.confidence * 100 || 0).toFixed(0)}%`}
              subtitle="AVERAGE ACCURACY"
              icon={<InsightIcon />}
              color="secondary"
            />
          </Grid>
        </Grid>
      )}

      {/* AI Assistant */}
      <DataCard
        title="AI ANALYTICS ASSISTANT"
        subtitle="AI-powered predictions and suggestions"
      >
        <div className="flex justify-end mb-4 -mt-10 mr-2">
            <button
              onClick={() => {}}
              className="py-1.5 px-4 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
            >
              Update Insights <OptimizeIcon sx={{ fontSize: 12 }} />
            </button>
        </div>

        <Box sx={{ borderBottom: 1, borderColor: 'slate.100', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            sx={{
                '& .MuiTab-root': {
                  fontSize: '9px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  minHeight: '48px',
                  color: 'slate.400'
                }
            }}
          >
            <Tab label="Predictions" />
            <Tab label="Recommendations" />
            <Tab label="Safety & Risks" />
            <Tab label="Route Suggestions" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <div className="space-y-6">
            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Cost Forecast</h5>
            
            {predictionsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress size={24} />
              </Box>
            ) : costPredictions ? (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <div className="p-6 rounded-2xl bg-slate-900 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                      <h6 className="text-[10px] font-black text-blue-400 uppercase mb-4 tracking-widest">30-Day Cost Forecast</h6>
                      <div className="mb-6">
                        <span className="text-3xl font-black">₦{costPredictions.prediction?.toLocaleString() || 0}</span>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Estimated average cost</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Confidence Level</span>
                            <span className="text-[10px] font-black">{((costPredictions.confidence || 0) * 100).toFixed(0)}%</span>
                          </div>
                          <LinearProgress
                            variant="determinate"
                            value={(costPredictions.confidence || 0) * 100}
                            sx={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: 'blue.400' } }}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            costPredictions.trend === 'increasing' ? 'bg-rose-500/20 text-rose-400' :
                            costPredictions.trend === 'decreasing' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            Trend: {costPredictions.trend || 'STABLE'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                  </div>
                </Grid>
              </Grid>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Forecast models generating... More completed shipments will improve accuracy.
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <div className="space-y-6">
            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Actionable Suggestions</h5>
            
            {comprehensiveInsights?.summary?.keyRecommendations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comprehensiveInsights.summary.keyRecommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="p-5 bg-white rounded-2xl border border-slate-100 flex gap-4 items-start shadow-sm border-l-4 border-l-[#345E85]">
                     <div className="mt-1">
                       <InsightIcon sx={{ fontSize: 16 }} className="text-[#345E85]" />
                     </div>
                     <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
                       {recommendation}
                     </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No active strategy recommendations. Core systems stable.
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
           <div className="space-y-6">
            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Active Risks & Issues</h5>
            
            {alertsLoading ? (
               <Box display="flex" justifyContent="center" p={4}>
                 <CircularProgress size={24} />
               </Box>
            ) : riskAlerts && riskAlerts.length > 0 ? (
              <div className="space-y-3">
                {riskAlerts.map((alert: any, index: number) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border flex gap-4 ${
                      alert.severity === 'high' ? 'bg-rose-50 border-rose-100' : alert.severity === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
                    }`}
                  >
                    <div className="mt-1">
                      <WarningIcon sx={{ fontSize: 18 }} className={alert.severity === 'high' ? 'text-rose-500' : alert.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[9px] font-black uppercase tracking-widest">{alert.type?.replace('_', ' ')}</span>
                         {alert.confidence && (
                           <span className="text-[8px] font-black text-slate-400">Accuracy: {(alert.confidence * 100).toFixed(0)}%</span>
                         )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              ) : (
                <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                   <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                     System running smoothly. No issues detected.
                   </p>
                </div>
              )}
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <div className="space-y-6">
            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Savings Opportunities</h5>
            
            {comprehensiveInsights?.routeOptimizations && comprehensiveInsights.routeOptimizations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comprehensiveInsights.routeOptimizations.map((optimization: any, index: number) => (
                  <div key={index} className="p-6 bg-white rounded-2xl border border-slate-100 group hover:border-[#345E85] transition-all shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h6 className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{optimization.route}</h6>
                      <span className="px-2 py-0.5 rounded bg-[#345E85]/10 text-[#345E85] text-[8px] font-black uppercase tracking-widest">
                        ₦{optimization.potentialSavings?.toLocaleString() || 0} SAVINGS
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4 leading-relaxed line-clamp-2">
                      {optimization.issue}
                    </p>
                    
                    <div className="space-y-2">
                       {optimization.recommendations?.slice(0, 2).map((rec: string, recIndex: number) => (
                        <div key={recIndex} className="flex gap-2 items-start text-[9px] font-black text-[#345E85] uppercase tracking-tighter">
                          <span>→</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Looking for savings... Analyzing your data...
              </div>
            )}
          </div>
        </TabPanel>
      </DataCard>
    </div>
  );
};

export default AIInsights;