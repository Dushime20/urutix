import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

interface ProfitabilityChartProps {
  data?: {
    profitableShipments: number;
    unprofitableShipments: number;
    averageProfitMargin: number;
    trend: string;
  };
  height?: number;
}

export const ProfitabilityChart: React.FC<ProfitabilityChartProps> = ({ 
  data, 
  height = 300 
}) => {
  const theme = useTheme();

  if (!data) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height={height}
      >
        <Typography variant="body2" color="textSecondary">
          No profitability data available
        </Typography>
      </Box>
    );
  }

  const chartData = [
    {
      name: 'Profitable',
      value: data.profitableShipments,
      color: theme.palette.success.main,
    },
    {
      name: 'Unprofitable',
      value: data.unprofitableShipments,
      color: theme.palette.error.main,
    },
  ];

  const total = data.profitableShipments + data.unprofitableShipments;
  const profitablePercentage = total > 0 ? (data.profitableShipments / total) * 100 : 0;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return theme.palette.success.main;
      case 'declining':
        return theme.palette.error.main;
      default:
        return theme.palette.warning.main;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '↗️';
      case 'declining':
        return '↘️';
      default:
        return '➡️';
    }
  };

  return (
    <Box>
      {/* Summary Stats */}
      <Box mb={2}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Profitability Overview
        </Typography>
        <Typography variant="h6" color="primary">
          {profitablePercentage.toFixed(1)}% Profitable
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Avg Margin: {data.averageProfitMargin.toFixed(1)}%
        </Typography>
        <Box display="flex" alignItems="center" mt={1}>
          <Typography 
            variant="body2" 
            sx={{ color: getTrendColor(data.trend) }}
          >
            {getTrendIcon(data.trend)} {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
          </Typography>
        </Box>
      </Box>

      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={height - 100}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [value, 'Shipments']}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Additional Metrics */}
      <Box mt={2}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="textSecondary">
            Profitable Shipments:
          </Typography>
          <Typography variant="body2" color="success.main">
            {data.profitableShipments}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="textSecondary">
            Unprofitable Shipments:
          </Typography>
          <Typography variant="body2" color="error.main">
            {data.unprofitableShipments}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};