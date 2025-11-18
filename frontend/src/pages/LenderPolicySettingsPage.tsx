import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaPercent, FaCalendarAlt, FaMoneyBillWave, FaShieldAlt } from 'react-icons/fa';

const LenderPolicySettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    interest_rate: '',
    repayment_term_days: '',
    max_advance_per_trip: '',
    max_exposure: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Check authentication and get lender ID from user context
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-500">
            Please log in to access the lender policy settings.
          </p>
        </div>
      </div>
    );
  }

  if (user.role !== 'LENDER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500">
            This page is only accessible to lenders.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      // Use authenticated user's lender ID
      const lenderId = user.id;
      const res = await fetch(`/api/admin/lenders/${lenderId}/policy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest_rate: parseFloat(form.interest_rate),
          repayment_term_days: parseInt(form.repayment_term_days),
          max_advance_per_trip: parseFloat(form.max_advance_per_trip),
          max_exposure: parseFloat(form.max_exposure),
        }),
      });
      if (!res.ok) throw new Error('Failed to save policy');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error saving policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Set Repayment Policy</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaPercent className="inline mr-2 text-blue-600" /> Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.001"
              max="1"
              name="interest_rate"
              value={form.interest_rate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 0.15 for 15%"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaCalendarAlt className="inline mr-2 text-green-600" /> Repayment Term (days)
            </label>
            <input
              type="number"
              min="1"
              name="repayment_term_days"
              value={form.repayment_term_days}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="e.g. 90"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaMoneyBillWave className="inline mr-2 text-indigo-600" /> Max Advance Per Trip
            </label>
            <input
              type="number"
              min="1"
              name="max_advance_per_trip"
              value={form.max_advance_per_trip}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 50000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaShieldAlt className="inline mr-2 text-purple-600" /> Max Exposure
            </label>
            <input
              type="number"
              min="1"
              name="max_exposure"
              value={form.max_exposure}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. 200000"
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">Policy saved successfully!</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {loading ? 'Saving...' : 'Save Policy'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LenderPolicySettingsPage;
