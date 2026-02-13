import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ToggleOff,
  ToggleOn,
} from '@mui/icons-material';
import { tenantSubscriptionApi, TenantPlan, CreatePlanDto } from '../../services/tenantSubscriptionApi';

const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<TenantPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TenantPlan | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreatePlanDto>({
    name: '',
    description: '',
    targetUser: 'BOTH',
    price: 0,
    currency: 'RWF',
    duration: 'MONTHLY',
    maxShipments: undefined,
    maxTrucks: undefined,
    maxDrivers: undefined,
    maxTransactions: undefined,
    advancedAnalytics: false,
    prioritySupport: false,
    apiAccess: false,
    displayOrder: 0,
    isPopular: false,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await tenantSubscriptionApi.getPlans(true);
      setPlans(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan?: TenantPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description,
        targetUser: plan.targetUser,
        price: plan.price,
        currency: plan.currency,
        duration: plan.duration,
        maxShipments: plan.maxShipments,
        maxTrucks: plan.maxTrucks,
        maxDrivers: plan.maxDrivers,
        maxTransactions: plan.maxTransactions,
        advancedAnalytics: plan.advancedAnalytics,
        prioritySupport: plan.prioritySupport,
        apiAccess: plan.apiAccess,
        displayOrder: plan.displayOrder,
        isPopular: plan.isPopular,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        targetUser: 'BOTH',
        price: 0,
        currency: 'RWF',
        duration: 'MONTHLY',
        advancedAnalytics: false,
        prioritySupport: false,
        apiAccess: false,
        displayOrder: 0,
        isPopular: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPlan(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      if (editingPlan) {
        await tenantSubscriptionApi.updatePlan(editingPlan.id, formData);
        setSuccess('Plan updated successfully');
      } else {
        await tenantSubscriptionApi.createPlan(formData);
        setSuccess('Plan created successfully');
      }
      handleCloseDialog();
      loadPlans();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleToggleStatus = async (planId: string) => {
    try {
      await tenantSubscriptionApi.togglePlanStatus(planId);
      setSuccess('Plan status updated');
      loadPlans();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    try {
      await tenantSubscriptionApi.deletePlan(planId);
      setSuccess('Plan deleted successfully');
      loadPlans();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const getDurationLabel = (duration: string) => {
    const labels = { MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', YEARLY: 'Yearly' };
    return labels[duration as keyof typeof labels] || duration;
  };

  const getTargetUserLabel = (target: string) => {
    const labels = { CARGO_OWNER: 'Cargo Owners', TRUCK_OWNER: 'Truck Owners', BOTH: 'Both' };
    return labels[target as keyof typeof labels] || target;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Subscription Plans</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Plan
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={6} lg={4} key={plan.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">{plan.name}</Typography>
                  <Chip
                    label={plan.status}
                    color={plan.status === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.description || 'No description'}
                </Typography>

                <Typography variant="h4" sx={{ mb: 1 }}>
                  {plan.price.toLocaleString()} {plan.currency}
                  <Typography component="span" variant="body2" color="text.secondary">
                    /{getDurationLabel(plan.duration)}
                  </Typography>
                </Typography>

                <Chip label={getTargetUserLabel(plan.targetUser)} size="small" sx={{ mb: 2 }} />

                <Box sx={{ mt: 2 }}>
                  {plan.maxShipments && (
                    <Typography variant="body2">• Max Shipments: {plan.maxShipments}</Typography>
                  )}
                  {plan.maxTrucks && (
                    <Typography variant="body2">• Max Trucks: {plan.maxTrucks}</Typography>
                  )}
                  {plan.maxDrivers && (
                    <Typography variant="body2">• Max Drivers: {plan.maxDrivers}</Typography>
                  )}
                  {plan.advancedAnalytics && (
                    <Typography variant="body2">• Advanced Analytics</Typography>
                  )}
                  {plan.prioritySupport && (
                    <Typography variant="body2">• Priority Support</Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleStatus(plan.id)}
                    title={plan.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  >
                    {plan.status === 'ACTIVE' ? <ToggleOn /> : <ToggleOff />}
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpenDialog(plan)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(plan.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Plan Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Target Users"
                value={formData.targetUser}
                onChange={(e) => setFormData({ ...formData, targetUser: e.target.value as any })}
              >
                <MenuItem value="CARGO_OWNER">Cargo Owners</MenuItem>
                <MenuItem value="TRUCK_OWNER">Truck Owners</MenuItem>
                <MenuItem value="BOTH">Both</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value as any })}
              >
                <MenuItem value="MONTHLY">Monthly</MenuItem>
                <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                <MenuItem value="YEARLY">Yearly</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Shipments"
                value={formData.maxShipments || ''}
                onChange={(e) => setFormData({ ...formData, maxShipments: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Trucks"
                value={formData.maxTrucks || ''}
                onChange={(e) => setFormData({ ...formData, maxTrucks: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.advancedAnalytics}
                    onChange={(e) => setFormData({ ...formData, advancedAnalytics: e.target.checked })}
                  />
                }
                label="Advanced Analytics"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.prioritySupport}
                    onChange={(e) => setFormData({ ...formData, prioritySupport: e.target.checked })}
                  />
                }
                label="Priority Support"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  />
                }
                label="Mark as Popular"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPlan ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionPlans;
