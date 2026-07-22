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
  Warning as WarningIcon,
  Lightbulb as InsightIcon,
  AutoFixHigh as OptimizeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsApi } from '../../services/analyticsApi';
import DataCard from '../../components/EnliteUI/Cards/DataCard';

// ── Currency ──────────────────────────────────────────────────────────────────
const CURRENCY_SYMBOL = '$';
const fmtMoney = (v: number | null | undefined) => {
  if (v == null || isNaN(v)) return `${CURRENCY_SYMBOL}—`;
  return `${CURRENCY_SYMBOL}${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
// ─────────────────────────────────────────────────────────────────────────────

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AIInsights: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const { error: dashboardError, refetch: refetchDashboard } = useQuery({
    queryKey: ['analytics', 'ai', 'dashboard', user?.tenantId],
    queryFn: async () => {
      const raw = await analyticsApi.getAIDashboardSummary();
      // Normalize: backend returns { insights, latestPrediction, activeAlerts, generatedAt }
      // Frontend expects: { totalInsights, activeAlerts, summary: { potentialSavings }, latestPrediction }
      return {
        totalInsights: raw?.totalInsights ?? raw?.insights?.summary?.totalInsights ?? 0,
        activeAlerts: raw?.activeAlerts ?? 0,
        latestPrediction: raw?.latestPrediction ?? raw?.insights?.costPredictions ?? null,
        summary: {
          potentialSavings: raw?.summary?.potentialSavings
            ?? raw?.insights?.summary?.potentialSavings
            ?? 0,
          keyRecommendations: raw?.summary?.keyRecommendations
            ?? raw?.insights?.summary?.keyRecommendations
            ?? [],
        },
      };
    },
    enabled: !!user?.tenantId,
    retry: (failureCount, error: any) => error?.response?.status !== 403 && failureCount < 2,
  });

  const { data: comprehensiveInsights, refetch: refetchInsights } = useQuery({
    queryKey: ['analytics', 'ai', 'comprehensive', user?.tenantId],
    queryFn: () => analyticsApi.getComprehensiveAIInsights(),
    enabled: !!user?.tenantId,
    retry: (failureCount, error: any) => error?.response?.status !== 403 && failureCount < 2,
  });

  const { data: costPredictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['analytics', 'ai', 'predictions', 'costs', user?.tenantId],
    queryFn: () => analyticsApi.getCostPredictions(),
    enabled: !!user?.tenantId,
    retry: (failureCount, error: any) => error?.response?.status !== 403 && failureCount < 2,
  });

  const { data: riskAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['analytics', 'ai', 'alerts', user?.tenantId],
    queryFn: () => analyticsApi.getRiskAlerts(),
    enabled: !!user?.tenantId,
    retry: (failureCount, error: any) => error?.response?.status !== 403 && failureCount < 2,
  });

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    try {
      await analyticsApi.generateNewInsights();
      await Promise.all([refetchDashboard(), refetchInsights()]);
    } catch {
      // silently fail — data may still be stale but usable
    } finally {
      setIsGenerating(false);
    }
  };

  if (dashboardError) {
    return (
      <div className="p-6">
        <Alert severity="error" sx={{ borderRadius: '12px' }}>
          Failed to load AI insights: {(dashboardError as any)?.message ?? 'Unknown error'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── AI Assistant ────────────────────────────────────────────────────── */}
      <DataCard title="AI ANALYTICS ASSISTANT" subtitle="AI-powered predictions and suggestions">
        <div className="flex justify-end mb-4 -mt-10 mr-2">
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="py-1.5 px-4 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {isGenerating ? <CircularProgress size={10} sx={{ color: 'white' }} /> : <OptimizeIcon sx={{ fontSize: 12 }} />}
            {isGenerating ? 'Generating...' : 'Update Insights'}
          </button>
        </div>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{ '& .MuiTab-root': { fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', minHeight: '48px' } }}
          >
            <Tab label="Cost Predictions" />
            <Tab label="Recommendations" />
            <Tab label="Risk Alerts" />
            <Tab label="Route Savings" />
          </Tabs>
        </Box>

        {/* Cost Predictions */}
        <TabPanel value={tabValue} index={0}>
          <div className="space-y-6">
            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">30-Day Cost Forecast</h5>
            {predictionsLoading ? (
              <Box display="flex" justifyContent="center" p={4}><CircularProgress size={24} /></Box>
            ) : costPredictions ? (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <div className="p-6 rounded-2xl bg-slate-900 text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <h6 className="text-[10px] font-black text-blue-400 uppercase mb-4 tracking-widest">Predicted Average Cost</h6>
                      <div className="mb-6">
                        <span className="text-3xl font-black">{fmtMoney(costPredictions.prediction)}</span>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Estimated average cost</p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Confidence Level</span>
                            <span className="text-[10px] font-black">{costPredictions.confidence != null ? `${(costPredictions.confidence * 100).toFixed(0)}%` : '—'}</span>
                          </div>
                          <LinearProgress
                            variant="determinate"
                            value={(costPredictions.confidence ?? 0) * 100}
                            sx={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#60a5fa' } }}
                          />
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          costPredictions.trend === 'increasing' ? 'bg-rose-500/20 text-rose-400' :
                          costPredictions.trend === 'decreasing' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          Trend: {costPredictions.trend ?? 'stable'}
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                  </div>
                </Grid>
                {costPredictions.baseline != null && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 h-full flex flex-col justify-center gap-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Baseline (Current Avg)</p>
                        <p className="text-2xl font-black text-slate-900">{fmtMoney(costPredictions.baseline)}</p>
                      </div>
                      {costPredictions.reason && (
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reasoning</p>
                          <p className="text-[10px] font-bold text-slate-600 leading-relaxed">{costPredictions.reason}</p>
                        </div>
                      )}
                    </div>
                  </Grid>
                )}
              </Grid>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Forecast models generating... More completed shipments will improve accuracy.
              </div>
            )}
          </div>
        </TabPanel>

        {/* Recommendations */}
        <TabPanel value={tabValue} index={1}>
          <div className="space-y-6">
            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Actionable Suggestions</h5>
            {comprehensiveInsights?.summary?.keyRecommendations?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comprehensiveInsights.summary.keyRecommendations.map((rec: string, i: number) => (
                  <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100 border-l-4 border-l-[#345E85] flex gap-4 items-start shadow-sm">
                    <InsightIcon sx={{ fontSize: 16 }} className="text-[#345E85] mt-1 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No active recommendations. Core systems stable.
              </div>
            )}
          </div>
        </TabPanel>

        {/* Risk Alerts */}
        <TabPanel value={tabValue} index={2}>
          <div className="space-y-6">
            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Active Risks & Issues</h5>
            {alertsLoading ? (
              <Box display="flex" justifyContent="center" p={4}><CircularProgress size={24} /></Box>
            ) : riskAlerts && riskAlerts.length > 0 ? (
              <div className="space-y-3">
                {riskAlerts.map((alert: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border flex gap-4 ${
                    alert.severity === 'high'   ? 'bg-rose-50 border-rose-100' :
                    alert.severity === 'medium' ? 'bg-amber-50 border-amber-100' :
                    'bg-blue-50 border-blue-100'
                  }`}>
                    <WarningIcon sx={{ fontSize: 18 }} className={
                      alert.severity === 'high'   ? 'text-rose-500 mt-1' :
                      alert.severity === 'medium' ? 'text-amber-500 mt-1' :
                      'text-blue-500 mt-1'
                    } />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest">{alert.type?.replace(/_/g, ' ') ?? 'Alert'}</span>
                        {alert.confidence != null && (
                          <span className="text-[8px] font-black text-slate-400">Accuracy: {(alert.confidence * 100).toFixed(0)}%</span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest leading-relaxed">{alert.message ?? '—'}</p>
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

        {/* Route Savings */}
        <TabPanel value={tabValue} index={3}>
          <div className="space-y-6">
            <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Route Savings Opportunities</h5>
            {comprehensiveInsights?.routeOptimizations?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comprehensiveInsights.routeOptimizations.map((opt: any, i: number) => (
                  <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-[#345E85] transition-all shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h6 className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{opt.route ?? '—'}</h6>
                      <span className="px-2 py-0.5 rounded bg-[#345E85]/10 text-[#345E85] text-[8px] font-black uppercase tracking-widest">
                        {fmtMoney(opt.potentialSavings)} savings
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4 leading-relaxed line-clamp-2">
                      {opt.issue ?? '—'}
                    </p>
                    <div className="space-y-2">
                      {opt.recommendations?.slice(0, 2).map((rec: string, ri: number) => (
                        <div key={ri} className="flex gap-2 items-start text-[9px] font-black text-[#345E85] uppercase tracking-tighter">
                          <span>→</span><span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Analyzing your routes for savings opportunities...
              </div>
            )}
          </div>
        </TabPanel>
      </DataCard>
    </div>
  );
};

export default AIInsights;
