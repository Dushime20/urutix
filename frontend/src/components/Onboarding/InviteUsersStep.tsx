import React, { useState } from 'react';
import { inviteUsers } from '../../services/onboardingApi';
import { checkVerificationStatus } from '../../services/verificationApi';

const InviteUsersStep: React.FC<any> = ({ formData, setFormData, next, prev }) => {
  const [emails, setEmails] = useState(formData.invites || []);
  const [input, setInput] = useState('');
  const [verification, setVerification] = useState<string>('');

  const addEmail = () => {
    if (input && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input)) {
      setEmails((e: string[]) => [...e, input]);
      setInput('');
    }
  };

  const handleNext = async () => {
    setFormData((f: any) => ({ ...f, invites: emails }));
    try {
      await inviteUsers({ emails });
      const result = await checkVerificationStatus('invites', { emails });
      setVerification(result.status);
      if (result.status === 'verified') {
        next();
      }
    } catch (err) {
      alert('Failed to invite users.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-semibold">Invite Users (email)</label>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} className="border rounded px-2 py-1 flex-1" placeholder="user@example.com" />
          <button type="button" className="bg-blue-600 text-white px-3 py-1 rounded" onClick={addEmail}>Add</button>
        </div>
        <ul className="mt-2 space-y-1">
          {emails.map((email: string, i: number) => (
            <li key={i} className="text-sm text-gray-700">{email}</li>
          ))}
        </ul>
        {verification && (
          <div className={`text-sm ${verification === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>Verification status: {verification}</div>
        )}
      </div>
      <div className="flex justify-between gap-2">
        <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={prev}>Back</button>
        <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleNext}>Next</button>
      </div>
    </div>
  );
};

export default InviteUsersStep;
