import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';
import { useAuth } from '../../contexts/AuthContext';

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
      id={`advanced-analytics-tabpanel-${index}`}
      aria-labelledby={`advanced-analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

import DataCard from '../../components/EnliteUI/Cards/DataCard';

// ML Pipeline Tab Component
const MLPipelineTab: React.FC<{ mlConfig: any; setMlConfig: any }> = ({ mlConfig, setMlConfig }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<any>(null);

  const handleTrainModel = async () => {
    setIsTraining(true);
    try {
      // Simulate ML model training
      await new Promise(resolve => setTimeout(resolve, 3000));
      setTrainingResult({
        success: true,
        modelId: 'ML-NODE-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        accuracy: 0.89 + (Math.random() * 0.05),
        trainingDataSize: mlConfig.trainingSize,
        features: mlConfig.features
      });
    } catch (error) {
      setTrainingResult({
        success: false,
        error: 'AI TRAINING ISSUE'
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">AI Model Setup</h5>
      </div>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
            <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-5 tracking-widest">Model Configuration</h6>
            
            <div className="space-y-4">
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Model Class</InputLabel>
                <Select
                  value={mlConfig.modelType}
                  onChange={(e) => setMlConfig({...mlConfig, modelType: e.target.value})}
                  label="Model Class"
                  sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'white' }}
                >
                  <MenuItem value="cost_prediction">Cost Prediction</MenuItem>
                  <MenuItem value="demand_forecast">Demand Forecast</MenuItem>
                  <MenuItem value="route_optimization">Route Optimization</MenuItem>
                </Select>
              </FormControl>
  
              <TextField
                fullWidth
                size="small"
                label="TRAINING DATA SIZE"
                type="number"
                value={mlConfig.trainingSize}
                onChange={(e) => setMlConfig({...mlConfig, trainingSize: parseInt(e.target.value)})}
                InputProps={{ sx: { borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'white' } }}
                InputLabelProps={{ sx: { fontSize: '10px', fontWeight: 'bold' } }}
              />
  
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Feature Set:</p>
                <div className="flex flex-wrap gap-2">
                  {mlConfig.features.map((feature: string) => (
                    <span key={feature} className="px-2 py-1 bg-white border border-slate-200 rounded text-[8px] font-black text-[#345E85] uppercase tracking-tighter">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
  
              <button
                onClick={handleTrainModel}
                disabled={isTraining}
                className="w-full py-2.5 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isTraining ? <CircularProgress size={14} thickness={6} sx={{ color: 'white' }} /> : <MLIcon sx={{ fontSize: 14 }} />}
                {isTraining ? 'Starting Training...' : 'Start AI Training'}
              </button>
            </div>
          </div>
        </Grid>
  
        <Grid size={{ xs: 12, md: 6 }}>
          <div className="bg-white rounded-2xl border border-slate-100 p-6 h-full flex flex-col">
            <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-5 tracking-widest">AI Prediction Results</h6>
            
            {trainingResult ? (
              trainingResult.success ? (
                <div className="space-y-6">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">AI Model Ready</span>
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

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Model Confidence</span>
                      <span className="text-[10px] font-black">{(trainingResult.accuracy * 100).toFixed(0)}%</span>
                    </div>
                    <LinearProgress
                      variant="determinate"
                      value={trainingResult.accuracy * 100}
                      sx={{ height: 4, borderRadius: 2, backgroundColor: 'slate.50', '& .MuiLinearProgress-bar': { backgroundColor: '#345E85' } }}
                    />
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
                  Adjust settings and start training to see results.
                </p>
              </div>
            )}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

// Real-time Processing Tab Component
const RealTimeProcessingTab: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Live Data Center</h5>
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`py-1.5 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
            isMonitoring ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
          }`}
        >
          {isMonitoring ? 'Stop Tracking' : 'Start Live Tracking'}
        </button>
      </div>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <div className="space-y-3">
            {['cost_alert', 'performance_drop', 'demand_spike', 'route_anomaly'].map((streamType) => (
              <div key={streamType} className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-100 transition-all shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <div>
                    <h6 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">
                      {streamType.replace('_', ' ')}
                    </h6>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Live data tracking active</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Throughput</p>
                    <p className="text-[10px] font-black text-slate-900">{isMonitoring ? '940 evt/m' : '0'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isMonitoring ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {isMonitoring ? 'ACTIVE' : 'STANDBY'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <div className="bg-[#345E85] rounded-3xl p-6 text-white shadow-xl shadow-blue-100">
            <h6 className="text-[10px] font-black text-blue-200 uppercase mb-6 tracking-widest">System Status</h6>
            
            <div className="space-y-4">
               <div>
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-[9px] font-black uppercase text-blue-300 tracking-tighter">Response Time</span>
                   <span className="text-[10px] font-black">150ms</span>
                 </div>
                 <LinearProgress variant="determinate" value={85} sx={{ height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#4ade80' } }} />
               </div>
               
               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                 <div>
                   <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest mb-1">Global Uptime</p>
                   <p className="text-[12px] font-black">99.99%</p>
                 </div>
                 <div>
                   <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest mb-1">Error Rate</p>
                   <p className="text-[12px] font-black">0.01%</p>
                 </div>
               </div>
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

// API Marketplace Tab Component
const ApiMarketplaceTab: React.FC = () => {
  const [apiKeys] = useState([
    { id: '1', name: 'PRODUCTION VECTOR', permissions: ['analytics:cost_trends', 'analytics:market_data'], active: true },
    { id: '2', name: 'SANDBOX KERNEL', permissions: ['analytics:cost_trends'], active: true }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">API Access Settings</h5>
        <button className="py-1.5 px-4 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
          Generate New API Key <ApiIcon sx={{ fontSize: 12 }} />
        </button>
      </div>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h6 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">
                      {key.name}
                    </h6>
                    <p className="text-[8px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full w-fit">ID: {key.id.padStart(4, '0')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${key.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {key.active ? 'OPERATIONAL' : 'DISABLED'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Permissions:</p>
                  <div className="flex flex-wrap gap-2">
                    {key.permissions.map((permission) => (
                      <span key={permission} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[8px] font-black text-[#345E85] uppercase tracking-tighter">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
            <h6 className="text-[10px] font-black text-slate-900 uppercase mb-4 tracking-widest">API Usage Details</h6>
            
            <div className="mb-6">
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Daily Requests</p>
               <h4 className="text-3xl font-black text-[#345E85]">1,247</h4>
            </div>

            <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Rate Limit Utilization</span>
                 <span className="text-[10px] font-black text-[#345E85]">65%</span>
               </div>
               <LinearProgress
                  variant="determinate"
                  value={65}
                  sx={{ height: 6, borderRadius: 3, backgroundColor: 'white', border: '1px solid #f1f5f9', '& .MuiLinearProgress-bar': { backgroundColor: '#345E85' } }}
                />
                <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">650 / 1000 REQ WINDOW</p>
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

// Advanced Settings Tab Component
const AdvancedSettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Advanced Settings</h5>
      </div>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-5 tracking-widest">System Automation</h6>
            
            <div className="space-y-4">
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Auto-update Frequency</InputLabel>
                <Select defaultValue="weekly" label="Auto-update Frequency" sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                  <MenuItem value="daily">Daily Update</MenuItem>
                  <MenuItem value="weekly">Weekly Update</MenuItem>
                  <MenuItem value="monthly">Monthly Update</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Accuracy Required</InputLabel>
                <Select defaultValue="0.8" label="Accuracy Required" sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                  <MenuItem value="0.7">70% Accuracy</MenuItem>
                  <MenuItem value="0.8">80% Accuracy</MenuItem>
                  <MenuItem value="0.9">90% Accuracy</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-5 tracking-widest">Alert Settings</h6>
            
            <div className="space-y-4">
              <TextField
                fullWidth
                size="small"
                label="COST ALERT LEVEL (₦)"
                type="number"
                defaultValue={10000}
                InputProps={{ sx: { borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' } }}
                InputLabelProps={{ sx: { fontSize: '10px', fontWeight: 'bold' } }}
              />

              <TextField
                fullWidth
                size="small"
                label="DELAY ALERT LEVEL (%)"
                type="number"
                defaultValue={20}
                InputProps={{ sx: { borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' } }}
                InputLabelProps={{ sx: { fontSize: '10px', fontWeight: 'bold' } }}
              />

              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Alert Frequency</InputLabel>
                <Select defaultValue="immediate" label="Alert Frequency" sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                  <MenuItem value="immediate">Real-time alerts</MenuItem>
                  <MenuItem value="hourly">Hourly Summary</MenuItem>
                  <MenuItem value="daily">Daily Summary</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export const AdvancedAnalytics: React.FC = () => {
  useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [mlConfig, setMlConfig] = useState({
    modelType: 'cost_prediction',
    trainingSize: 1000,
    features: ['DISTANCE MAP', 'LOAD WEIGHT', 'CARGO CLASS', 'TEMPORAL CYCLE']
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Advanced Analytics Overview Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="AI MODELS"
            value="3"
            subtitle="ACTIVE AI MODELS"
            icon={<MLIcon />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="LIVE DATA"
            value="5"
            subtitle="ACTIVE TRACKING"
            icon={<RealtimeIcon />}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="API KEYS"
            value="2"
            subtitle="ACTIVE API KEYS"
            icon={<ApiIcon />}
            color="secondary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="PREDICTIONS TODAY"
            value="127"
            subtitle="AI PREDICTIONS MADE"
            icon={<TrendingUpIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Advanced Capabilities Center */}
      <DataCard
        title="ADVANCED DATA CENTER"
        subtitle="AI models, live data tracking, and API settings"
      >
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
            <Tab label="AI Models" />
            <Tab label="Live Data" />
            <Tab label="API Marketplace" />
            <Tab label="Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <MLPipelineTab mlConfig={mlConfig} setMlConfig={setMlConfig} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <RealTimeProcessingTab />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ApiMarketplaceTab />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <AdvancedSettingsTab />
        </TabPanel>
      </DataCard>
    </div>
  );
};

export default AdvancedAnalytics;