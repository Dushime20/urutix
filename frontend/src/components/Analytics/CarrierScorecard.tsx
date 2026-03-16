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
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface CarrierScorecardProps {
  carrierId: string;
  totalShipments: number;
  onTimeRate: number;
  averageRating: number;
  reliabilityScore: number;
  recommendation: 'preferred' | 'acceptable' | 'avoid' | 'insufficient_data';
  averageCost?: number;
  relationshipDuration?: number;
}

const getRecommendationColor = (recommendation: string) => {
  switch (recommendation) {
    case 'preferred':
      return 'success';
    case 'acceptable':
      return 'warning';
    case 'avoid':
      return 'error';
    default:
      return 'default';
  }
};

const getRecommendationLabel = (recommendation: string) => {
  switch (recommendation) {
    case 'preferred':
      return 'Preferred Partner';
    case 'acceptable':
      return 'Acceptable';
    case 'avoid':
      return 'Avoid';
    case 'insufficient_data':
      return 'Insufficient Data';
    default:
      return 'Unknown';
  }
};

export const CarrierScorecard: React.FC<CarrierScorecardProps> = ({
  carrierId,
  totalShipments,
  onTimeRate,
  averageRating,
  reliabilityScore,
  recommendation,
  averageCost,
  relationshipDuration,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <BusinessIcon color="primary" />
            <Typography variant="h6" component="div">
              {carrierId}
            </Typography>
          </Box>
          <Chip
            label={getRecommendationLabel(recommendation)}
            color={getRecommendationColor(recommendation) as any}
            size="small"
          />
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
                  color={onTimeRate >= 90 ? 'success' : onTimeRate >= 75 ? 'warning' : 'error'}
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
                <StarIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Average Rating
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <LinearProgress
                  variant="determinate"
                  value={(averageRating / 5) * 100}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  color={averageRating >= 4 ? 'success' : averageRating >= 3 ? 'warning' : 'error'}
                />
                <Typography variant="body2" fontWeight="bold">
                  {averageRating.toFixed(1)}/5
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box mb={2}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Reliability Score
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <LinearProgress
                  variant="determinate"
                  value={reliabilityScore}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  color={reliabilityScore >= 85 ? 'success' : reliabilityScore >= 70 ? 'warning' : 'error'}
                />
                <Typography variant="body2" fontWeight="bold">
                  {reliabilityScore}/100
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="space-between" mt={2} pt={2} borderTop="1px solid #e0e0e0">
          <Box textAlign="center">
            <Typography variant="h6" color="primary">
              {totalShipments}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Shipments
            </Typography>
          </Box>
          {averageCost && (
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                ₦{averageCost.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Cost
              </Typography>
            </Box>
          )}
          {relationshipDuration && (
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {Math.round(relationshipDuration / 30)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Months
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};