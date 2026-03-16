import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Timeline as OperationalIcon,
  Psychology as AIIcon,
  Handyman as AdvancedIcon,
} from '@mui/icons-material';
import FinancialAnalytics from './analytics/FinancialAnalytics';
import OperationalAnalytics from './analytics/OperationalAnalytics';
import AIInsights from './analytics/AIInsights';
import AdvancedAnalytics from './analytics/AdvancedAnalytics';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Analytics: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-inter">
      <div className="max-w-[1536px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">
              Analytics <span className="text-primary-600">Hub</span>
            </h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              See how your business is doing, track operations, and get AI suggestions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              Refresh Data
            </button>
          </div>
        </div>

        <Paper 
          elevation={0} 
          variant="outlined" 
          sx={{ 
            borderRadius: '24px', 
            overflow: 'hidden',
            borderColor: 'slate.200',
            backgroundColor: 'white',
            mb: 4
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, backgroundColor: 'slate.50/50' }}>
            <Tabs 
              value={value} 
              onChange={handleChange} 
              aria-label="analytics dashboard tabs"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  minHeight: '64px',
                  color: 'slate.500',
                  '&.Mui-selected': {
                    color: 'primary.main',
                  }
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab icon={<AnalyticsIcon sx={{ fontSize: 18 }} />} label="Financial" iconPosition="start" />
              <Tab icon={<OperationalIcon sx={{ fontSize: 18 }} />} label="Operational" iconPosition="start" />
              <Tab icon={<AIIcon sx={{ fontSize: 18 }} />} label="AI Insights" iconPosition="start" />
              <Tab icon={<AdvancedIcon sx={{ fontSize: 18 }} />} label="Advanced Tools" iconPosition="start" />
            </Tabs>
          </Box>

          <Box sx={{ px: { xs: 2, md: 4 }, pb: 4, pt: 2 }}>
            <TabPanel value={value} index={0}>
              <FinancialAnalytics />
            </TabPanel>
            <TabPanel value={value} index={1}>
              <OperationalAnalytics />
            </TabPanel>
            <TabPanel value={value} index={2}>
              <AIInsights />
            </TabPanel>
            <TabPanel value={value} index={3}>
              <AdvancedAnalytics />
            </TabPanel>
          </Box>
        </Paper>
      </div>
    </div>
  );
};

export default Analytics;
