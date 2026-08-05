import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchKPI } from '../../services/adminApi';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);


const KPIWidget: React.FC = () => {
  const { data, isLoading, error } = useQuery({ queryKey: ['kpi'], queryFn: fetchKPI });

  const doughnutData = {
    labels: ['Active Trips', 'Revenue', 'Engagement', 'Alerts'],
    datasets: [
      {
        data: [data?.activeTrips || 0, data?.revenue || 0, data?.engagement || 0, data?.alerts || 0],
        backgroundColor: [
          'rgba(59,130,246,0.7)',
          'rgba(34,197,94,0.7)',
          'rgba(139,92,246,0.7)',
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
      title: { display: true, text: 'Platform KPIs' },
    },
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded shadow p-4 flex flex-col items-center justify-center min-h-[120px]">
      {isLoading ? (
        <div className="mt-4 text-gray-400">Loading...</div>
      ) : error ? (
        <div className="mt-4 text-red-600">Error loading KPIs</div>
      ) : (
        <Doughnut data={doughnutData} options={options} height={120} />
      )}
    </div>
  );
};

export default KPIWidget;
