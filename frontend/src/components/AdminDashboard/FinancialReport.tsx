import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFinancials } from '../../services/adminApi';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FinancialReport: React.FC = () => {
  const { data, isLoading, error } = useQuery({ queryKey: ['financials'], queryFn: fetchFinancials });

  const barData = {
    labels: ['Revenue', 'Payouts', 'Refunds'],
    datasets: [
      {
        label: 'Amount',
        data: [data?.revenue || 0, data?.payouts || 0, data?.refunds || 0],
        backgroundColor: [
          'rgba(34,197,94,0.7)',
          'rgba(59,130,246,0.7)',
          'rgba(239,68,68,0.7)',
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Financial Metrics' },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#e5e7eb' } },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4 min-h-[120px]">
      <div className="text-xl font-bold mb-2">Financial Reporting</div>
      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-gray-400">Loading...</div>
      ) : error ? (
        <div className="h-32 flex items-center justify-center text-red-600">Error loading financials</div>
      ) : (
        <Bar data={barData} options={options} height={120} />
      )}
    </div>
  );
};

export default FinancialReport;
