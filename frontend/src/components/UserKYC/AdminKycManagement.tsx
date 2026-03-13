import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Cancel,
  Visibility,
  Edit,
  Refresh,
  TrendingUp,
  People,
  Assignment,
  VerifiedUser,
} from '@mui/icons-material';
import { userKycApi, type UserKycProfile, type KycStats } from '../../services/userKycApi';

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
      id={`kyc-tabpanel-${index}`}
      aria-labelledby={`kyc-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AdminKycManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserKycProfile[]>([]);
  const [stats, setStats] = useState<KycStats | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('UNDER_REVIEW');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserKycProfile | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        userKycApi.getUsersByKycStatus(selectedStatus, selectedRole || undefined),
        userKycApi.getKycStats(selectedRole || undefined),
      ]);
      
      setUsers(usersResponse.data);
      setStats(statsResponse.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load KYC data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedUser || !newStatus) return;

    try {
      await userKycApi.updateUserKycStatus(selectedUser.id, newStatus, statusNotes);
      setShowStatusDialog(false);
      setSelectedUser(null);
      setNewStatus('');
      setStatusNotes('');
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'success';
      case 'UNDER_REVIEW':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderStatsCards = () => {
    if (!stats) return null;

    const statCards = [
      { label: 'Total Users', value: stats.total, icon: <People />, color: 'primary' },
      { label: 'Pending', value: stats.pending, icon: <Assignment />, color: 'warning' },
      { label: 'Under Review', value: stats.underReview, icon: <TrendingUp />, color: 'info' },
      { label: 'Verified', value: stats.verified, icon: <VerifiedUser />, color: 'success' },
      { label: 'Rejected', value: stats.rejected, icon: <Cancel />, color: 'error' },
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={card.label}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" color={`${card.color}.main`}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.label}
                    </Typography>
                  </Box>
                  <Box color={`${card.color}.main`}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                <MenuItem value="VERIFIED">Verified</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                label="Role"
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="TRUCK_OWNER">Truck Owner</MenuItem>
                <MenuItem value="CARGO_OWNER">Cargo Owner</MenuItem>
                <MenuItem value="BROKER">Broker</MenuItem>
                <MenuItem value="DRIVER">Driver</MenuItem>
                <MenuItem value="AGENT">Agent</MenuItem>
                <MenuItem value="LENDER">Lender</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadData}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderUsersTable = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Users - {selectedStatus.replace('_', ' ')}
        </Typography>
        
        {loading ? (
          <LinearProgress />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requirement Level</TableCell>
                  <TableCell>Compliance Score</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.user?.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.user?.role} 
                        size="small" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.kycStatus.replace('_', ' ')}
                        color={getStatusColor(user.kycStatus) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.kycRequirementLevel}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {user.complianceScore}/100
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={user.complianceScore}
                          sx={{ width: 60, height: 6 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {user.kycSubmittedAt ? 
                        new Date(user.kycSubmittedAt).toLocaleDateString() : 
                        'Not submitted'
                      }
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Status">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewStatus(user.kycStatus);
                              setShowStatusDialog(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderRoleStats = () => {
    if (!stats?.byRole) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            KYC Status by Role
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(stats.byRole).map(([role, count]) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={role}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" color="primary">
                    {count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {role.replace('_', ' ')}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        KYC Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="User Management" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderStatsCards()}
        {renderRoleStats()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderFilters()}
        {renderUsersTable()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          KYC Analytics
        </Typography>
        <Alert severity="info">
          Analytics dashboard coming soon...
        </Alert>
      </TabPanel>

      {/* Status Update Dialog */}
      <Dialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update KYC Status</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="body1" gutterBottom>
                User: {selectedUser.firstName} {selectedUser.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Status: {selectedUser.kycStatus}
              </Typography>
              
              <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  label="New Status"
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                  <MenuItem value="VERIFIED">Verified</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about this status change..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatusDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusUpdate}
            disabled={!newStatus}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};