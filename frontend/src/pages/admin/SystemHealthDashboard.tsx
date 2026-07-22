import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DataCard } from '../../components/EnliteUI/Cards/DataCard';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';
import {
  fetchCurrentSystemHealth,
  fetchHistoricalSystemHealth,
  exportSystemHealthMetrics,
} from '../../services/adminApi';

// Interfaces matching backend
interface DatabaseMetrics {
  connectionCount: number;
  activeQueries: number;
  avgQueryTime: number;
  slowQueries: number;
  diskUsage: number;
}

interface ApiMetrics {
  requestsPerMinute: number;
  avgResponseTime: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

interface ServerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
}

interface SystemMetrics {
  timestamp: Date;
  database: DatabaseMetrics;
  api: ApiMetrics;
  server: ServerMetrics;
}

interface ThresholdViolation {
  metricType: string;
  metricName: string;
  currentValue: number;
  thresholdValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

interface MetricTimeSeries {
  timestamp: Date;
  metricType: string;
  metricName: string;
  value: number;
}

const SystemHealthDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [violations, setViolations] = useState<ThresholdViolation[]>([]);
  const [historicalData, setHistoricalData] = useState<MetricTimeSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Auto-refresh every 30 seconds (Requirement 1.5)
  useEffect(() => {
    fetchCurrentMetrics();
    fetchThresholdViolations();
    fetchHistoricalData();

    const interval = setInterval(() => {
      fetchCurrentMetrics();
      fetchThresholdViolations();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchCurrentMetrics = async () => {
    try {
      const data = await fetchCurrentSystemHealth();
      setMetrics(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchThresholdViolations = async () => {
    try {
      // Note: fetchCurrentSystemHealth returns metrics, not violations
      // Threshold violations would need a separate API endpoint
      // For now, we'll skip this or implement client-side threshold checking
      setViolations([]);
    } catch (err) {
      console.error('Failed to fetch threshold violations:', err);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // Last 24 hours

      const data = await fetchHistoricalSystemHealth(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setHistoricalData(data);
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
    }
  };

  const handleExport = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const csvData = await exportSystemHealthMetrics(
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Create download link
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system-metrics-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export metrics:', err);
    }
  };

  const getStatusIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="warning" />;
      case 'medium':
        return <WarningIcon color="info" />;
      default:
        return <CheckCircleIcon color="success" />;
    }
  };

  const getStatusColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'success';
    }
  };

  const prepareChartData = (metricName: string) => {
    return historicalData
      .filter(m => m.metricName === metricName)
      .map(m => ({
        time: new Date(m.timestamp).toLocaleTimeString(),
        value: m.value,
      }))
      .slice(-20); // Last 20 data points
  };

  if (loading) {
    return (
      <Box p={3}>
        <ModernLoader isLoading={true} type="page" showStats={true} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box p={3}>
        <Alert severity="info"><TranslatedText text="No metrics available" /></Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            <TranslatedText text="System Health Dashboard" />
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <TranslatedText text="Last updated" />: {lastUpdate.toLocaleString()}
          </Typography>
        </Box>
        <Box>
          <Tooltip title={<TranslatedText text="Refresh" />}>
            <IconButton onClick={fetchCurrentMetrics} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={<TranslatedText text="Export CSV" />}>
            <IconButton onClick={handleExport} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Threshold Violations Alert */}
      {violations.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {violations.length} <TranslatedText text="Threshold Violation" />{violations.length > 1 ? 's' : ''} <TranslatedText text="Detected" />
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
            {violations.map((violation, index) => (
              <Chip
                key={index}
                icon={getStatusIcon(violation.severity)}
                label={`${violation.metricType}.${violation.metricName}: ${violation.currentValue.toFixed(2)}`}
                color={getStatusColor(violation.severity) as any}
                size="small"
              />
            ))}
          </Box>
        </Alert>
      )}

      {/* Historical Trends */}
      <Typography variant="h6" gutterBottom>
        <TranslatedText text="Historical Trends (Last 24 Hours)" />
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <DataCard title={<TranslatedText text="CPU Usage Over Time" />}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={prepareChartData('cpuUsage')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </DataCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <DataCard title={<TranslatedText text="Memory Usage Over Time" />}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={prepareChartData('memoryUsage')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="value" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </DataCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <DataCard title={<TranslatedText text="Database Query Time" />}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={prepareChartData('avgQueryTime')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#ffc658" name="Avg Query Time (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </DataCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <DataCard title={<TranslatedText text="API Response Time" />}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={prepareChartData('avgResponseTime')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#ff7300" name="Avg Response Time (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </DataCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemHealthDashboard;
