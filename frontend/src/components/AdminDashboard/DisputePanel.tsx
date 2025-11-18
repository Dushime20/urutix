import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDisputes } from '../../services/adminApi';
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

const DisputePanel: React.FC = () => {
  const { data, isLoading, error } = useQuery({ queryKey: ['disputes'], queryFn: fetchDisputes });

  // Example dispute status breakdown
  const statusCounts = {
    open: data?.disputes?.filter((d: any) => d.status === 'open').length || 0,
    resolved: data?.disputes?.filter((d: any) => d.status === 'resolved').length || 0,
    escalated: data?.disputes?.filter((d: any) => d.status === 'escalated').length || 0,
  };

  const barData = {
    labels: ['Open', 'Resolved', 'Escalated'],
    datasets: [
      {
        label: 'Disputes',
        data: [statusCounts.open, statusCounts.resolved, statusCounts.escalated],
        backgroundColor: [
          'rgba(59,130,246,0.7)',
          'rgba(34,197,94,0.7)',
          'rgba(239,68,68,0.7)',
        ],
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Dispute Status' },
    },
    scales: {
      x: { grid: { color: '#e5e7eb' } },
      y: { grid: { display: false } },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4 min-h-[120px]">
      <div className="text-xl font-bold mb-2">Dispute Resolution</div>
      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-gray-400">Loading...</div>
      ) : error ? (
        <div className="h-32 flex items-center justify-center text-red-600">Error loading disputes</div>
      ) : (
        <Bar data={barData} options={options} height={120} />
      )}
    </div>
  );
};

export default DisputePanel;
