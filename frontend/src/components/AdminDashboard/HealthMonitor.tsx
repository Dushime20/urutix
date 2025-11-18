import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../../services/adminApi';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const HealthMonitor: React.FC = () => {
  const { data, isLoading, error } = useQuery({ queryKey: ['health'], queryFn: fetchHealth });

  const pieData = {
    labels: ['Healthy', 'Latency', 'Error Rate'],
    datasets: [
      {
        data: [data?.status === 'healthy' ? 1 : 0, data?.latency || 0, data?.errorRate || 0],
        backgroundColor: [
          'rgba(34,197,94,0.7)',
          'rgba(59,130,246,0.7)',
          'rgba(239,68,68,0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const },
      title: { display: true, text: 'System Health' },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4 min-h-[120px]">
      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-gray-400">Loading...</div>
      ) : error ? (
        <div className="h-32 flex items-center justify-center text-red-600">Error loading health data</div>
      ) : (
        <Pie data={pieData} options={options} height={120} />
      )}
    </div>
  );
};

export default HealthMonitor;
