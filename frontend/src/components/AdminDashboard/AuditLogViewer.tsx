import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '../../services/adminApi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AuditLogViewer: React.FC = () => {
  const { data, isLoading, error } = useQuery({ queryKey: ['audit'], queryFn: fetchAuditLogs });

  // Example audit log event frequency
  const logCounts = (data?.logs || []).reduce((acc: Record<string, number>, log: any) => {
    const date = log.date ? new Date(log.date).toLocaleDateString() : 'Unknown';
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const lineData = {
    labels: Object.keys(logCounts),
    datasets: [
      {
        label: 'Audit Events',
        data: Object.values(logCounts),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Audit Log Events' },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#e5e7eb' } },
    },
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded shadow p-4 min-h-[120px]">
      <div className="text-xl font-bold mb-2">Audit Log Viewer</div>
      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-gray-400">Loading...</div>
      ) : error ? (
        <div className="h-32 flex items-center justify-center text-red-600">Error loading audit logs</div>
      ) : (
        <Line data={lineData} options={options} height={120} />
      )}
    </div>
  );
};

export default AuditLogViewer;
