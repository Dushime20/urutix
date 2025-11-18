import React from 'react';

const triggerWorkflow = (type: string, payload?: any) => {
  window.dispatchEvent(new CustomEvent(`workflow:${type}`, { detail: payload }));
  // Optionally, call backend API for workflow automation
  // Example: fetch(`/api/workflow/${type}`, { method: 'POST', body: JSON.stringify(payload) });
};

const QuickActions: React.FC = () => (
  <div className="bg-white rounded shadow p-4 min-h-[120px]">
    <div className="text-xl font-bold mb-2">Quick Actions</div>
    <div className="flex gap-2">
      <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => triggerWorkflow('create-user')}>Create User</button>
      <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => triggerWorkflow('resolve-dispute')}>Resolve Dispute</button>
      <button className="bg-yellow-600 text-white px-3 py-1 rounded" onClick={() => triggerWorkflow('trigger-payout')}>Trigger Payout</button>
      <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => triggerWorkflow('send-alert')}>Send Alert</button>
      <button className="bg-purple-600 text-white px-3 py-1 rounded" onClick={() => triggerWorkflow('pricing-estimate')}>Estimate Pricing</button>
    </div>
  </div>
);

export default QuickActions;
