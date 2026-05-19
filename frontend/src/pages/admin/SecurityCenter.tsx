import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
} from '@mui/material';
import ModernLoader from '../../components/common/ModernLoader';
import { TranslatedText } from '../../components/translated-text';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Block as BlockIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
} from '@mui/icons-material';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';
import { DataCard } from '../../components/EnliteUI/Cards/DataCard';
import * as adminApi from '../../services/adminApi';

// Interfaces matching backend
interface FailedLoginAttempt {
  id: string;
  userId: string | null;
  tenantId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  attemptCount: number;
}

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string | null;
  tenantId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  details: Record<string, any>;
}

interface UserSession {
  sessionId: string;
  userId: string;
  tenantId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  startedAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  };
}

interface FlaggedAccount {
  userId: string;
  tenantId: string | null;
  failedAttempts: number;
  lastAttempt: Date;
  ipAddresses: string[];
}

interface PermissionChange {
  id: string;
  actor: string;
  action: string;
  resource: string;
  changes: Record<string, any>;
  timestamp: Date;
  ipAddress: string | null;
}

const SecurityCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Security Events
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  
  // Failed Logins
  const [failedLogins, setFailedLogins] = useState<FailedLoginAttempt[]>([]);
  
  // Active Sessions
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  
  // Flagged Accounts
  const [flaggedAccounts, setFlaggedAccounts] = useState<FlaggedAccount[]>([]);
  
  // Permission History
  const [permissionHistory, setPermissionHistory] = useState<PermissionChange[]>([]);

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [selectedSeverity]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSecurityEvents(),
        fetchFailedLogins(),
        fetchActiveSessions(),
        fetchFlaggedAccounts(),
        fetchPermissionHistory(),
      ]);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch security data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      const data = await adminApi.fetchSecurityEvents(selectedSeverity);
      setSecurityEvents(data);
    } catch (err) {
      console.error('Failed to fetch security events:', err);
    }
  };

  const fetchFailedLogins = async () => {
    try {
      const data = await adminApi.fetchFailedLogins();
      setFailedLogins(data);
    } catch (err) {
      console.error('Failed to fetch failed logins:', err);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const data = await adminApi.fetchActiveSessions();
      setActiveSessions(data);
    } catch (err) {
      console.error('Failed to fetch active sessions:', err);
    }
  };

  const fetchFlaggedAccounts = async () => {
    try {
      const data = await adminApi.fetchFlaggedAccounts();
      setFlaggedAccounts(data);
    } catch (err) {
      console.error('Failed to fetch flagged accounts:', err);
    }
  };

  const fetchPermissionHistory = async () => {
    try {
      const data = await adminApi.fetchPermissionHistory();
      setPermissionHistory(data);
    } catch (err) {
      console.error('Failed to fetch permission history:', err);
    }
  };

  const handleTerminateSession = async () => {
    if (!selectedSession) return;
    
    try {
      await adminApi.terminateSession(selectedSession);
      
      setTerminateDialogOpen(false);
      setSelectedSession(null);
      fetchActiveSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to terminate session');
    }
  };

  const handleExportSecurityLogs = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const csvData = await adminApi.exportSecurityLogs(
        startDate.toISOString(),
        endDate.toISOString()
      );

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `security-logs-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export security logs:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
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

  const getSeverityIcon = (severity: string) => {
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    
    // Enhanced browser detection with version
    // Check Edge first (before Chrome, as Edge contains "Chrome" in UA)
    if (userAgent.includes('Edg/')) {
      const match = userAgent.match(/Edg\/([\d.]+)/);
      return match ? `Edge ${match[1].split('.')[0]}` : 'Edge';
    }
    
    // Check Chrome (but not Edge or other Chromium browsers)
    if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
      const match = userAgent.match(/Chrome\/([\d.]+)/);
      return match ? `Chrome ${match[1].split('.')[0]}` : 'Chrome';
    }
    
    // Check Firefox
    if (userAgent.includes('Firefox/')) {
      const match = userAgent.match(/Firefox\/([\d.]+)/);
      return match ? `Firefox ${match[1].split('.')[0]}` : 'Firefox';
    }
    
    // Check Safari (but not Chrome, as Chrome contains "Safari" in UA)
    if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
      const match = userAgent.match(/Version\/([\d.]+)/);
      return match ? `Safari ${match[1].split('.')[0]}` : 'Safari';
    }
    
    // Check Opera
    if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) {
      const match = userAgent.match(/(?:OPR|Opera)\/([\d.]+)/);
      return match ? `Opera ${match[1].split('.')[0]}` : 'Opera';
    }
    
    // Check for mobile browsers
    if (userAgent.includes('Mobile')) {
      if (userAgent.includes('Safari')) return 'Mobile Safari';
      if (userAgent.includes('Chrome')) return 'Mobile Chrome';
      return 'Mobile Browser';
    }
    
    return 'Other';
  };

  if (loading && securityEvents.length === 0) {
    return (
      <Box p={3}>
        <ModernLoader isLoading={true} type="page" showStats={true} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            <TranslatedText text="Security Center" />
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <TranslatedText text="Monitor security events, sessions, and access patterns" />
          </Typography>
        </Box>
        <Box>
          <Tooltip title={<TranslatedText text="Refresh" />}>
            <IconButton onClick={fetchAllData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={<TranslatedText text="Export Security Logs" />}>
            <IconButton onClick={handleExportSecurityLogs} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={<TranslatedText text="Security Events" />}
            value={securityEvents.length.toString()}
            trend="stable"
            color="primary"
            icon={<SecurityIcon />}
            variant="classic"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={<TranslatedText text="Failed Logins" />}
            value={failedLogins.length.toString()}
            trend={failedLogins.length > 10 ? 'up' : 'stable'}
            color={failedLogins.length > 10 ? 'warning' : 'success'}
            icon={<ErrorIcon />}
            variant="classic"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={<TranslatedText text="Active Sessions" />}
            value={activeSessions.length.toString()}
            trend="stable"
            color="info"
            icon={<ComputerIcon />}
            variant="classic"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={<TranslatedText text="Flagged Accounts" />}
            value={flaggedAccounts.length.toString()}
            trend={flaggedAccounts.length > 0 ? 'up' : 'stable'}
            color={flaggedAccounts.length > 0 ? 'error' : 'success'}
            icon={<PersonIcon />}
            variant="classic"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={<TranslatedText text="Security Events" />} />
          <Tab label={<TranslatedText text="Failed Logins" />} />
          <Tab label={<TranslatedText text="Active Sessions" />} />
          <Tab label={<TranslatedText text="Flagged Accounts" />} />
          <Tab label={<TranslatedText text="Permission History" />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <DataCard title={<TranslatedText text="Security Events" />}>
          <Box mb={2}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel><TranslatedText text="Filter by Severity" /></InputLabel>
              <Select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                label="Filter by Severity"
              >
                <MenuItem value=""><TranslatedText text="All" /></MenuItem>
                <MenuItem value="low"><TranslatedText text="Low" /></MenuItem>
                <MenuItem value="medium"><TranslatedText text="Medium" /></MenuItem>
                <MenuItem value="high"><TranslatedText text="High" /></MenuItem>
                <MenuItem value="critical"><TranslatedText text="Critical" /></MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><TranslatedText text="Severity" /></TableCell>
                  <TableCell><TranslatedText text="Event Type" /></TableCell>
                  <TableCell><TranslatedText text="User ID" /></TableCell>
                  <TableCell><TranslatedText text="Tenant ID" /></TableCell>
                  <TableCell><TranslatedText text="IP Address" /></TableCell>
                  <TableCell><TranslatedText text="Timestamp" /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {securityEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Chip
                        icon={getSeverityIcon(event.severity)}
                        label={event.severity.toUpperCase()}
                        color={getSeverityColor(event.severity) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{event.eventType}</TableCell>
                    <TableCell>{event.userId || 'N/A'}</TableCell>
                    <TableCell>{event.tenantId || 'N/A'}</TableCell>
                    <TableCell>{event.ipAddress || 'N/A'}</TableCell>
                    <TableCell>{formatDate(event.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {securityEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <TranslatedText text="No security events found" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DataCard>
      )}

      {activeTab === 1 && (
        <DataCard title={<TranslatedText text="Failed Login Attempts" />}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><TranslatedText text="User ID" /></TableCell>
                  <TableCell><TranslatedText text="Tenant ID" /></TableCell>
                  <TableCell><TranslatedText text="Attempts" /></TableCell>
                  <TableCell><TranslatedText text="IP Address" /></TableCell>
                  <TableCell><TranslatedText text="Browser" /></TableCell>
                  <TableCell><TranslatedText text="Last Attempt" /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {failedLogins.map((login) => (
                  <TableRow key={login.id}>
                    <TableCell>{login.userId || <TranslatedText text="Unknown" />}</TableCell>
                    <TableCell>{login.tenantId || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={login.attemptCount}
                        color={login.attemptCount > 5 ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{login.ipAddress || 'N/A'}</TableCell>
                    <TableCell>{formatUserAgent(login.userAgent)}</TableCell>
                    <TableCell>{formatDate(login.timestamp)}</TableCell>
                  </TableRow>
                ))}
                {failedLogins.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <TranslatedText text="No failed login attempts" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DataCard>
      )}

      {activeTab === 2 && (
        <DataCard title={<TranslatedText text="Active User Sessions" />}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><TranslatedText text="User ID" /></TableCell>
                  <TableCell><TranslatedText text="Tenant ID" /></TableCell>
                  <TableCell><TranslatedText text="IP Address" /></TableCell>
                  <TableCell><TranslatedText text="Browser" /></TableCell>
                  <TableCell><TranslatedText text="Started At" /></TableCell>
                  <TableCell><TranslatedText text="Last Activity" /></TableCell>
                  <TableCell><TranslatedText text="Actions" /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeSessions.map((session) => (
                  <TableRow key={session.sessionId}>
                    <TableCell>{session.userId}</TableCell>
                    <TableCell>{session.tenantId || 'N/A'}</TableCell>
                    <TableCell>{session.ipAddress || 'N/A'}</TableCell>
                    <TableCell>{formatUserAgent(session.userAgent)}</TableCell>
                    <TableCell>{formatDate(session.startedAt)}</TableCell>
                    <TableCell>{formatDate(session.lastActivity)}</TableCell>
                    <TableCell>
                      <Tooltip title={<TranslatedText text="Terminate Session" />}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedSession(session.sessionId);
                            setTerminateDialogOpen(true);
                          }}
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {activeSessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <TranslatedText text="No active sessions" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DataCard>
      )}

      {activeTab === 3 && (
        <DataCard title={<TranslatedText text="Flagged Accounts" />}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <TranslatedText text="Accounts with more than 5 failed login attempts in the last 15 minutes" />
          </Alert>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><TranslatedText text="User ID" /></TableCell>
                  <TableCell><TranslatedText text="Tenant ID" /></TableCell>
                  <TableCell><TranslatedText text="Failed Attempts" /></TableCell>
                  <TableCell><TranslatedText text="IP Addresses" /></TableCell>
                  <TableCell><TranslatedText text="Last Attempt" /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flaggedAccounts.map((account) => (
                  <TableRow key={account.userId}>
                    <TableCell>{account.userId}</TableCell>
                    <TableCell>{account.tenantId || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={account.failedAttempts}
                        color="error"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{account.ipAddresses.join(', ')}</TableCell>
                    <TableCell>{formatDate(account.lastAttempt)}</TableCell>
                  </TableRow>
                ))}
                {flaggedAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <TranslatedText text="No flagged accounts" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DataCard>
      )}

      {activeTab === 4 && (
        <DataCard title={<TranslatedText text="Permission Change History" />}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><TranslatedText text="Actor" /></TableCell>
                  <TableCell><TranslatedText text="Action" /></TableCell>
                  <TableCell><TranslatedText text="Resource" /></TableCell>
                  <TableCell><TranslatedText text="IP Address" /></TableCell>
                  <TableCell><TranslatedText text="Timestamp" /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissionHistory.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell>{change.actor}</TableCell>
                    <TableCell>{change.action}</TableCell>
                    <TableCell>{change.resource}</TableCell>
                    <TableCell>{change.ipAddress || 'N/A'}</TableCell>
                    <TableCell>{formatDate(change.timestamp)}</TableCell>
                  </TableRow>
                ))}
                {permissionHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <TranslatedText text="No permission changes" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DataCard>
      )}

      {/* Terminate Session Dialog */}
      <Dialog open={terminateDialogOpen} onClose={() => setTerminateDialogOpen(false)}>
        <DialogTitle><TranslatedText text="Terminate Session" /></DialogTitle>
        <DialogContent>
          <Typography>
            <TranslatedText text="Are you sure you want to terminate this session? The user will be logged out immediately." />
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTerminateDialogOpen(false)}>
            <TranslatedText text="Cancel" />
          </Button>
          <Button onClick={handleTerminateSession} color="error" variant="contained">
            <TranslatedText text="Terminate" />
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityCenter;
