import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Warning as WarningIcon } from '@mui/icons-material';
import axios from 'axios';

/**
 * SuspendUserModal
 * 
 * Modal for suspending a user's account.
 * Includes form validation, violation category selector, and duration picker.
 */

interface SuspendUserModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

const SuspendUserModal: React.FC<SuspendUserModalProps> = ({
  open,
  onClose,
  userId,
  userName,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [violationCategory, setViolationCategory] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const violationCategories = [
    { value: 'spam', label: 'Spam' },
    { value: 'fraud', label: 'Fraud' },
    { value: 'abuse', label: 'Abuse' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'illegal', label: 'Illegal Activity' },
    { value: 'terms_violation', label: 'Terms Violation' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!reason || reason.length < 20) {
      setError('Reason must be at least 20 characters');
      return;
    }

    if (!violationCategory) {
      setError('Please select a violation category');
      return;
    }

    if (expiresAt && expiresAt <= new Date()) {
      setError('Expiration date must be in the future');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const payload = {
        reason,
        violationCategory,
        severity,
        expiresAt: expiresAt?.toISOString(),
        adminNotes,
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/governance/enforcement/suspend/${userId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Success
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error suspending user:', err);
      setError(err.response?.data?.message || 'Failed to suspend user');
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setViolationCategory('');
    setSeverity('medium');
    setExpiresAt(null);
    setAdminNotes('');
    setError(null);
    setShowConfirmation(false);
    onClose();
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Suspend User Account</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!showConfirmation ? (
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Alert severity="warning" sx={{ mb: 3 }}>
              You are about to suspend <strong>{userName}</strong>. This will block all platform access.
            </Alert>

            <TextField
              fullWidth
              label="Reason for Suspension"
              multiline
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a detailed reason for the suspension (minimum 20 characters)"
              helperText={`${reason.length}/2000 characters (minimum 20)`}
              error={reason.length > 0 && reason.length < 20}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Violation Category</InputLabel>
              <Select
                value={violationCategory}
                onChange={(e) => setViolationCategory(e.target.value)}
                label="Violation Category"
              >
                {violationCategories.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                label="Severity"
              >
                <MenuItem value="low">
                  <Chip label="Low" size="small" color="success" sx={{ mr: 1 }} />
                  Minor violation, first offense
                </MenuItem>
                <MenuItem value="medium">
                  <Chip label="Medium" size="small" color="info" sx={{ mr: 1 }} />
                  Repeated minor violations
                </MenuItem>
                <MenuItem value="high">
                  <Chip label="High" size="small" color="warning" sx={{ mr: 1 }} />
                  Serious violation
                </MenuItem>
                <MenuItem value="critical">
                  <Chip label="Critical" size="small" color="error" sx={{ mr: 1 }} />
                  Fraud or illegal activity
                </MenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Suspension Expires At (Optional)"
                value={expiresAt}
                onChange={(newValue) => setExpiresAt(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Leave empty for indefinite suspension',
                    sx: { mb: 2 },
                  },
                }}
              />
            </LocalizationProvider>

            <TextField
              fullWidth
              label="Admin Notes (Optional)"
              multiline
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Additional notes for internal reference"
              helperText="These notes are visible to other admins"
            />
          </Box>
        ) : (
          <Box sx={{ pt: 2 }}>
            <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Confirm Suspension
              </Typography>
              <Typography variant="body2">
                Are you sure you want to suspend <strong>{userName}</strong>?
              </Typography>
            </Alert>

            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Suspension Details:
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Reason:</strong> {reason}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Category:</strong> {violationCategories.find(c => c.value === violationCategory)?.label}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Severity:</strong>{' '}
                <Chip label={severity.toUpperCase()} size="small" color={getSeverityColor(severity) as any} />
              </Typography>
              {expiresAt && (
                <Typography variant="body2">
                  <strong>Expires:</strong> {expiresAt.toLocaleString()}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {!showConfirmation ? (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="warning"
            disabled={loading || !reason || !violationCategory}
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            Confirm Suspension
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SuspendUserModal;
