import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  Route as RouteIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';

interface RoutePerformanceProps {
  route: string;
  averageCost: number;
  averageTransitTime: number;
  shipmentCount: number;
  onTimeRate: number;
  distanceKm?: number;
  profitabilityScore?: number;
}

const getPerformanceColor = (rate: number) => {
  if (rate >= 90) return 'success';
  if (rate >= 75) return 'warning';
  return 'error';
};

const getProfitabilityColor = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
};

export const RoutePerformance: React.FC<RoutePerformanceProps> = ({
  route,
  averageCost,
  averageTransitTime,
  shipmentCount,
  onTimeRate,
  distanceKm,
  profitabilityScore,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <RouteIcon color="primary" />
            <Typography variant="h6" component="div" noWrap>
              {route}
            </Typography>
          </Box>
          {profitabilityScore && (
            <Chip
              label={`${profitabilityScore.toFixed(0)}% Profitable`}
              color={getProfitabilityColor(profitabilityScore) as any}
              size="small"
            />
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box mb={2}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  On-Time Performance
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <LinearProgress
                  variant="determinate"
                  value={onTimeRate}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  color={getPerformanceColor(onTimeRate)}
                />
                <Typography variant="body2" fontWeight="bold">
                  {onTimeRate.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box mb={2}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ShippingIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Route Activity
                </Typography>
              </Box>
              <Typography variant="h6" color="primary">
                {shipmentCount} shipments
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="space-between" mt={2} pt={2} borderTop="1px solid #e0e0e0">
          <Box textAlign="center">
            <Typography variant="h6" color="primary">
              ₦{averageCost.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Cost
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" color="primary">
              {averageTransitTime.toFixed(1)}h
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Transit
            </Typography>
          </Box>
          {distanceKm && (
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {distanceKm.toFixed(0)}km
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Distance
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};