import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import type { CostTrendDataPoint } from '../../services/analyticsApi';

interface CostTrendsChartProps {
  data: CostTrendDataPoint[];
  height?: number;
  /** Currency symbol to prefix monetary values. Defaults to '$'. */
  currencySymbol?: string;
}

export const CostTrendsChart: React.FC<CostTrendsChartProps> = ({
  data,
  height = 300,
  currencySymbol = '$',
}) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <Typography variant="body2" color="textSecondary">
          No data available for the selected period
        </Typography>
      </Box>
    );
  }

  const chartData = data.map(point => ({
    ...point,
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    totalCost: Number(point.totalCost) || 0,
    averageCost: Number(point.averageCost) || 0,
    shipmentCount: Number(point.shipmentCount) || 0,
  }));

  const formatCurrency = (value: number) =>
    `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const formatNumber = (value: number) => value.toLocaleString('en-US');

  return (
    <Box>
      {/* Total Cost Trend */}
      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom>
          Total Cost Over Time
        </Typography>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Total Cost']}
              labelStyle={{ color: theme.palette.text.primary }}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
            <Line
              type="monotone"
              dataKey="totalCost"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Shipment Volume and Average Cost */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Shipment Volume and Average Cost
        </Typography>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={formatNumber} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                name === 'shipmentCount' ? formatNumber(value) : formatCurrency(value),
                name === 'shipmentCount' ? 'Shipments' : `Avg Cost (${currencySymbol})`,
              ]}
              labelStyle={{ color: theme.palette.text.primary }}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="shipmentCount"
              fill={theme.palette.secondary.main}
              name="Shipments"
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="averageCost"
              stroke={theme.palette.warning.main}
              strokeWidth={2}
              name={`Avg Cost (${currencySymbol})`}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};
