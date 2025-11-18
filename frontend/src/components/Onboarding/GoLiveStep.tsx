import React, { useState } from 'react';
import { submitCompanyInfo, submitAdminUser, submitPayment, submitBranding, inviteUsers } from '../../services/onboardingApi';

const GoLiveStep: React.FC<any> = ({ formData, prev }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleGoLive = async () => {
    setLoading(true);
    setError('');
    try {
      // Optionally re-submit all data for finalization
      await submitCompanyInfo(formData.company);
      await submitAdminUser(formData.admin);
      await submitPayment(formData.payment);
      await submitBranding(formData.branding);
      await inviteUsers({ emails: formData.invites });
      setSuccess(true);
    } catch (err) {
      setError('Failed to finalize onboarding.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="font-semibold">Go-live Checklist</div>
      <ul className="list-disc pl-6 text-gray-700">
        <li>Company info verified</li>
        <li>Admin user created</li>
        <li>Payment method set up</li>
        <li>Branding configured</li>
        <li>Users invited</li>
        <li>Feature tour completed</li>
        <li>All required documents uploaded</li>
      </ul>
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">Onboarding complete! Your account is live.</div>}
      <div className="flex justify-between gap-2">
        <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={prev} disabled={loading}>Back</button>
        <button type="button" className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleGoLive} disabled={loading}>
          {loading ? 'Finalizing...' : 'Finish & Go Live'}
        </button>
      </div>
    </div>
  );
};

export default GoLiveStep;
