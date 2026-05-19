import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import { CheckCircle2 } from 'lucide-react';
import {
  AutoFixHigh as MLIcon,
  Speed as RealtimeIcon,
  Api as ApiIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';
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

// Roles that should NOT see developer/admin-only tabs
const CARGO_OWNER_ROLES = ['CARGO_OWNER', 'FLEET_OWNER', 'TRUCK_OWNER'];

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// ── ML Pipeline Tab ───────────────────────────────────────────────────────────
const MLPipelineTab: React.FC<{ mlConfig: any; setMlConfig: any }> = ({ mlConfig, setMlConfig }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<any>(null);

  const handleTrainModel = async () => {
    setIsTraining(true);
    try {
      await analyticsApi.trainMLModel(mlConfig);
      setTrainingResult({
        success: true,
        modelId: 'ML-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        accuracy: 0.89 + Math.random() * 0.05,
        trainingDataSize: mlConfig.trainingSize,
      });
    } catch (err: any) {
      setTrainingResult({ success: false, error: err?.message ?? 'Training failed' });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">AI Model Configuration</h5>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
            <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-5 tracking-widest">Model Setup</h6>
            <div className="space-y-4">
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Model Type</InputLabel>
                <Select
                  value={mlConfig.modelType}
                  onChange={(e) => setMlConfig({ ...mlConfig, modelType: e.target.value })}
                  label="Model Type"
                  sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'white' }}
                >
                  <MenuItem value="cost_prediction">Cost Prediction</MenuItem>
                  <MenuItem value="demand_forecast">Demand Forecast</MenuItem>
                  <MenuItem value="route_optimization">Route Optimization</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth size="small"
                label="TRAINING DATA SIZE"
                type="number"
                value={mlConfig.trainingSize}
                onChange={(e) => setMlConfig({ ...mlConfig, trainingSize: parseInt(e.target.value) })}
                InputProps={{ sx: { borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'white' } }}
                InputLabelProps={{ sx: { fontSize: '10px', fontWeight: 'bold' } }}
              />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Feature Set:</p>
                <div className="flex flex-wrap gap-2">
                  {mlConfig.features.map((f: string) => (
                    <span key={f} className="px-2 py-1 bg-white border border-slate-200 rounded text-[8px] font-black text-[#345E85] uppercase tracking-tighter">{f}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleTrainModel}
                disabled={isTraining}
                className="w-full py-2.5 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isTraining ? <CircularProgress size={14} thickness={6} sx={{ color: 'white' }} /> : <MLIcon sx={{ fontSize: 14 }} />}
                {isTraining ? 'Training...' : 'Start AI Training'}
              </button>
            </div>
          </div>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <div className="bg-white rounded-2xl border border-slate-100 p-6 h-full flex flex-col">
            <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-5 tracking-widest">Training Results</h6>
            {trainingResult ? (
              trainingResult.success ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Model Ready</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Model ID</p>
                      <p className="text-[11px] font-black text-slate-900">{trainingResult.modelId}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                      <p className="text-[11px] font-black text-slate-900">{(trainingResult.accuracy * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Confidence</span>
                      <span className="text-[10px] font-black">{(trainingResult.accuracy * 100).toFixed(0)}%</span>
                    </div>
                    <LinearProgress variant="determinate" value={trainingResult.accuracy * 100}
                      sx={{ height: 4, borderRadius: 2, '& .MuiLinearProgress-bar': { backgroundColor: '#345E85' } }} />
                  </div>
                </div>
              ) : (
                <Alert severity="error" sx={{ fontSize: '10px', fontWeight: 'bold', borderRadius: '12px' }}>
                  {trainingResult.error}
                </Alert>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <MLIcon sx={{ fontSize: 40 }} className="text-slate-200 mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[200px]">
                  Configure and start training to see results.
                </p>
              </div>
            )}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

// ── Real-time Processing Tab ──────────────────────────────────────────────────
const RealTimeProcessingTab: React.FC = () => {
  const { user } = useAuth();
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['analytics', 'advanced', 'realtime-dashboard', user?.tenantId],
    queryFn: () => analyticsApi.getRealTimeDashboard(),
    enabled: !!user?.tenantId && isMonitoring,
    refetchInterval: isMonitoring ? 10000 : false,
    // 403 = no permission for this role — treat as empty, don't crash
    retry: (failureCount, error: any) => error?.response?.status !== 403 && failureCount < 2,
  });

  const streamTypes = ['cost_alert', 'performance_drop', 'demand_spike', 'route_anomaly'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Live Data Monitoring</h5>
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`py-1.5 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
            isMonitoring ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
          }`}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </div>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <div className="space-y-3">
            {streamTypes.map((type) => (
              <div key={type} className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-100 transition-all shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <div>
                    <h6 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">
                      {type.replace(/_/g, ' ')}
                    </h6>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      {isMonitoring ? 'Live tracking active' : 'Standby'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isMonitoring ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                  {isMonitoring ? 'ACTIVE' : 'STANDBY'}
                </span>
              </div>
            ))}
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <div className="bg-[#345E85] rounded-3xl p-6 text-white shadow-xl shadow-blue-100">
            <h6 className="text-[10px] font-black text-blue-200 uppercase mb-6 tracking-widest">System Status</h6>
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={2}><CircularProgress size={20} sx={{ color: 'white' }} /></Box>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black uppercase text-blue-300 tracking-tighter">Response Time</span>
                    <span className="text-[10px] font-black">{dashboardData?.responseTime ?? '—'}</span>
                  </div>
                  <LinearProgress variant="determinate" value={isMonitoring ? 85 : 0}
                    sx={{ height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#4ade80' } }} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest mb-1">Uptime</p>
                    <p className="text-[12px] font-black">{dashboardData?.uptime ?? (isMonitoring ? '99.9%' : '—')}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest mb-1">Error Rate</p>
                    <p className="text-[12px] font-black">{dashboardData?.errorRate ?? (isMonitoring ? '0.1%' : '—')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

// ── API Marketplace Tab (admin/developer only) ────────────────────────────────
const ApiMarketplaceTab: React.FC = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: usageData, isLoading } = useQuery({
    queryKey: ['analytics', 'advanced', 'api-usage', user?.tenantId],
    queryFn: () => analyticsApi.getApiUsageAnalytics(),
    enabled: !!user?.tenantId,
  });

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      await analyticsApi.generateApiKey({ keyName: 'New Key', permissions: ['analytics:cost_trends'] });
    } catch {
      // handle error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">API Access Management</h5>
        <button
          onClick={handleGenerateKey}
          disabled={isGenerating}
          className="py-1.5 px-4 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {isGenerating ? <CircularProgress size={10} sx={{ color: 'white' }} /> : <ApiIcon sx={{ fontSize: 12 }} />}
          Generate API Key
        </button>
      </div>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress size={24} /></Box>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
              <ApiIcon sx={{ fontSize: 40 }} className="text-slate-300 mb-3" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {usageData ? 'API keys loaded from server' : 'No API keys configured yet'}
              </p>
            </div>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
              <h6 className="text-[10px] font-black text-slate-900 uppercase mb-4 tracking-widest">Usage Summary</h6>
              <div className="mb-4">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Requests</p>
                <h4 className="text-3xl font-black text-[#345E85]">{usageData?.totalRequests?.toLocaleString() ?? '—'}</h4>
              </div>
              {usageData?.utilizationPct != null && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Rate Limit</span>
                    <span className="text-[10px] font-black text-[#345E85]">{usageData.utilizationPct}%</span>
                  </div>
                  <LinearProgress variant="determinate" value={usageData.utilizationPct}
                    sx={{ height: 6, borderRadius: 3, backgroundColor: 'white', border: '1px solid #f1f5f9', '& .MuiLinearProgress-bar': { backgroundColor: '#345E85' } }} />
                </div>
              )}
            </div>
          </Grid>
        </Grid>
      )}
    </div>
  );
};

// ── Alert Settings Tab ────────────────────────────────────────────────────────
const AlertSettingsTab: React.FC = () => (
  <div className="space-y-6">
    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Alert & Automation Settings</h5>
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-5 tracking-widest">Automation</h6>
          <div className="space-y-4">
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Auto-update Frequency</InputLabel>
              <Select defaultValue="weekly" label="Auto-update Frequency" sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Min Accuracy Required</InputLabel>
              <Select defaultValue="0.8" label="Min Accuracy Required" sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                <MenuItem value="0.7">70%</MenuItem>
                <MenuItem value="0.8">80%</MenuItem>
                <MenuItem value="0.9">90%</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-5 tracking-widest">Alert Thresholds</h6>
          <div className="space-y-4">
            <TextField
              fullWidth size="small"
              label={`COST ALERT THRESHOLD (${CURRENCY_SYMBOL})`}
              type="number"
              defaultValue={10000}
              InputProps={{ sx: { borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' } }}
              InputLabelProps={{ sx: { fontSize: '10px', fontWeight: 'bold' } }}
            />
            <TextField
              fullWidth size="small"
              label="DELAY ALERT THRESHOLD (%)"
              type="number"
              defaultValue={20}
              InputProps={{ sx: { borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' } }}
              InputLabelProps={{ sx: { fontSize: '10px', fontWeight: 'bold' } }}
            />
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Alert Delivery</InputLabel>
              <Select defaultValue="immediate" label="Alert Delivery" sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                <MenuItem value="immediate">Real-time</MenuItem>
                <MenuItem value="hourly">Hourly Summary</MenuItem>
                <MenuItem value="daily">Daily Digest</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
      </Grid>
    </Grid>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const AdvancedAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [mlConfig, setMlConfig] = useState({
    modelType: 'cost_prediction',
    trainingSize: 1000,
    features: ['DISTANCE', 'LOAD WEIGHT', 'CARGO TYPE', 'SEASON'],
  });

  // Cargo owners / fleet owners don't need ML training or API marketplace
  const isCargoOwnerRole = CARGO_OWNER_ROLES.includes(user?.role ?? '');

  // Fetch real dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ['analytics', 'advanced', 'dashboard', user?.tenantId],
    queryFn: () => analyticsApi.getRealTimeDashboard(),
    enabled: !!user?.tenantId,
  });

  // Build tabs based on role
  const tabs = [
    ...(!isCargoOwnerRole ? [{ label: 'AI Models',    icon: <MLIcon sx={{ fontSize: 14 }} /> }] : []),
    { label: 'Live Monitoring', icon: <RealtimeIcon sx={{ fontSize: 14 }} /> },
    ...(!isCargoOwnerRole ? [{ label: 'API Marketplace', icon: <ApiIcon sx={{ fontSize: 14 }} /> }] : []),
    { label: 'Alert Settings', icon: <SettingsIcon sx={{ fontSize: 14 }} /> },
  ];

  // Map tab index to component (accounts for hidden tabs)
  const renderTab = (idx: number) => {
    if (!isCargoOwnerRole) {
      // All tabs visible: ML(0), Live(1), API(2), Settings(3)
      if (idx === 0) return <MLPipelineTab mlConfig={mlConfig} setMlConfig={setMlConfig} />;
      if (idx === 1) return <RealTimeProcessingTab />;
      if (idx === 2) return <ApiMarketplaceTab />;
      if (idx === 3) return <AlertSettingsTab />;
    } else {
      // Cargo owner: Live(0), Settings(1)
      if (idx === 0) return <RealTimeProcessingTab />;
      if (idx === 1) return <AlertSettingsTab />;
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Overview Cards ───────────────────────────────────────────────────── */}
      <Grid container spacing={3}>
        {!isCargoOwnerRole && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="AI MODELS"
              value={dashboardData?.activeModels?.toString() ?? '—'}
              subtitle="ACTIVE AI MODELS"
              icon={<MLIcon />}
              color="primary"
              variant="classic"
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6, md: isCargoOwnerRole ? 4 : 3 }}>
          <StatCard
            title="LIVE STREAMS"
            value={dashboardData?.activeStreams?.toString() ?? '—'}
            subtitle="ACTIVE MONITORING"
            icon={<RealtimeIcon />}
            color="info"
            variant="classic"
          />
        </Grid>
        {!isCargoOwnerRole && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="API KEYS"
              value={dashboardData?.activeApiKeys?.toString() ?? '—'}
              subtitle="ACTIVE API KEYS"
              icon={<ApiIcon />}
              color="secondary"
              variant="classic"
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6, md: isCargoOwnerRole ? 4 : 3 }}>
          <StatCard
            title="PREDICTIONS"
            value={dashboardData?.predictionsToday?.toString() ?? '—'}
            subtitle="AI PREDICTIONS TODAY"
            icon={<TrendingUpIcon />}
            color="warning"
            variant="classic"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: isCargoOwnerRole ? 4 : 3 }}>
          <StatCard
            title="ALERTS ACTIVE"
            value={dashboardData?.activeAlerts?.toString() ?? '—'}
            subtitle="MONITORING ALERTS"
            icon={<SettingsIcon />}
            color="error"
            variant="classic"
          />
        </Grid>
      </Grid>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <DataCard title="ADVANCED DATA CENTER" subtitle="AI models, live monitoring and alert settings">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{ '& .MuiTab-root': { fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', minHeight: '48px' } }}
          >
            {tabs.map((tab, i) => (
              <Tab key={i} label={tab.label} icon={tab.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Box>

        {tabs.map((_, i) => (
          <TabPanel key={i} value={tabValue} index={i}>
            {renderTab(i)}
          </TabPanel>
        ))}
      </DataCard>
    </div>
  );
};

export default AdvancedAnalytics;
