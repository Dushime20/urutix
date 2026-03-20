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
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';
import { DataCard } from '../../components/EnliteUI/Cards/DataCard';
import { TranslatedText } from '../../components/translated-text';
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

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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

      {/* Server Metrics */}
      <Typography variant="h6" gutterBottom>
        <TranslatedText text="Server Metrics" />
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="CPU Usage" />}
            value={`${metrics.server.cpuUsage.toFixed(1)}%`}
            trend={metrics.server.cpuUsage > 70 ? 'up' : 'stable'}
            color={metrics.server.cpuUsage > 90 ? 'error' : metrics.server.cpuUsage > 70 ? 'warning' : 'success'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="Memory Usage" />}
            value={`${metrics.server.memoryUsage.toFixed(1)}%`}
            trend={metrics.server.memoryUsage > 80 ? 'up' : 'stable'}
            color={metrics.server.memoryUsage > 95 ? 'error' : metrics.server.memoryUsage > 80 ? 'warning' : 'success'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="Disk Usage" />}
            value={formatBytes(metrics.server.diskUsage)}
            trend="stable"
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="Network I/O" />}
            value={`${formatBytes(metrics.server.networkIn)} / ${formatBytes(metrics.server.networkOut)}`}
            trend="stable"
            color="info"
          />
        </Grid>
      </Grid>

      {/* Database Metrics */}
      <Typography variant="h6" gutterBottom>
        <TranslatedText text="Database Metrics" />
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="Connections" />}
            value={metrics.database.connectionCount.toString()}
            trend="stable"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="Active Queries" />}
            value={metrics.database.activeQueries.toString()}
            trend="stable"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="Avg Query Time" />}
            value={`${metrics.database.avgQueryTime.toFixed(1)}ms`}
            trend={metrics.database.avgQueryTime > 100 ? 'up' : 'stable'}
            color={metrics.database.avgQueryTime > 500 ? 'error' : metrics.database.avgQueryTime > 100 ? 'warning' : 'success'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="Slow Queries" />}
            value={metrics.database.slowQueries.toString()}
            trend={metrics.database.slowQueries > 10 ? 'up' : 'stable'}
            color={metrics.database.slowQueries > 50 ? 'error' : metrics.database.slowQueries > 10 ? 'warning' : 'success'}
          />
        </Grid>
      </Grid>

      {/* API Metrics */}
      <Typography variant="h6" gutterBottom>
        <TranslatedText text="API Metrics" />
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="Requests/Min" />}
            value={metrics.api.requestsPerMinute.toString()}
            trend="stable"
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="Avg Response Time" />}
            value={`${metrics.api.avgResponseTime.toFixed(1)}ms`}
            trend={metrics.api.avgResponseTime > 200 ? 'up' : 'stable'}
            color={metrics.api.avgResponseTime > 1000 ? 'error' : metrics.api.avgResponseTime > 200 ? 'warning' : 'success'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="Error Rate" />}
            value={`${metrics.api.errorRate.toFixed(2)}%`}
            trend={metrics.api.errorRate > 1 ? 'up' : 'stable'}
            color={metrics.api.errorRate > 5 ? 'error' : metrics.api.errorRate > 1 ? 'warning' : 'success'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={<TranslatedText text="P95 Response" />}
            value={`${metrics.api.p95ResponseTime.toFixed(1)}ms`}
            trend="stable"
            color="secondary"
          />
        </Grid>
      </Grid>

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
