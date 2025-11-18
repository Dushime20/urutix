import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';

const OnboardingAnalyticsWidget: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      const res = await axios.get('/api/analytics/onboarding-summary');
      setData(res.data);
      setLoading(false);
    }
    fetchAnalytics();
  }, []);

  if (loading) return <div>Loading onboarding analytics...</div>;
  if (!data) return <div>No analytics data available.</div>;

  const chartData = {
    labels: data.steps,
    datasets: [
      {
        label: 'Completions',
        data: data.completions,
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
      },
      {
        label: 'Drop-offs',
        data: data.dropoffs,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
      },
    ],
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="font-bold mb-2">Onboarding Analytics</div>
      <Bar data={chartData} />
    </div>
  );
};

export default OnboardingAnalyticsWidget;
