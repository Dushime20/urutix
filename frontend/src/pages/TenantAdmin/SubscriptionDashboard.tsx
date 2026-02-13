import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  People,
  AttachMoney,
  Assessment,
} from '@mui/icons-material';
import { tenantSubscriptionApi, SubscriptionOverview } from '../../services/tenantSubscriptionApi';

const SubscriptionDashboard: React.FC = () => {
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, expiringData] = await Promise.all([
        tenantSubscriptionApi.getSubscriptionOverview(),
        tenantSubscriptionApi.getExpiringSubscriptions(30),
      ]);
      setOverview(overviewData);
      setExpiringSubscriptions(expiringData.subscriptions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!overview) {
    return <Alert severity="info">No data available</Alert>;
  }

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Subscription Dashboard
      </Typography>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`${overview.totalRevenue.toLocaleString()} RWF`}
            icon={<AttachMoney sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Subscribers"
            value={overview.totalSubscribers}
            icon={<People sx={{ color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Plans"
            value={overview.activePlans}
            icon={<Assessment sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Expiring Soon"
            value={expiringSubscriptions.length}
            icon={<TrendingUp sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Plans Performance */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Plans Performance
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plan Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Active Subscribers</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overview.plans.map((plan) => (
                  <TableRow key={plan.planId}>
                    <TableCell>{plan.planName}</TableCell>
                    <TableCell>
                      <Chip
                        label={plan.status}
                        color={plan.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{plan.activeSubscribers}</TableCell>
                    <TableCell align="right">
                      {plan.revenue.toLocaleString()} RWF
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Expiring Subscriptions */}
      {expiringSubscriptions.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Expiring Subscriptions (Next 30 Days)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Expires At</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expiringSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>{sub.user?.email || 'N/A'}</TableCell>
                      <TableCell>{sub.plan?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(sub.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sub.status}
                          color={sub.status === 'ACTIVE' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SubscriptionDashboard;
