import React, { useState, useEffect } from 'react';
import { brokerAPI, type TransporterCredit, type UpdatePaymentTermsData } from '../../services/brokerApi';
import { CreditCard, Search, CheckCircle2, XCircle, AlertTriangle, Loader2, DollarSign, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const CreditManagement: React.FC = () => {
  const [credits, setCredits] = useState<TransporterCredit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState('');
  const [selectedCredit, setSelectedCredit] = useState<TransporterCredit | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    fetchCreditRecords();
  }, []);

  const fetchCreditRecords = async () => {
    setLoading(true);
    try {
      const response = await brokerAPI.getCreditRecords();
      setCredits(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch credit records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreditCheck = async () => {
    if (!selectedTransporter) {
      toast.error('Please enter a Transporter ID');
      return;
    }

    setLoading(true);
    try {
      await brokerAPI.performCreditCheck(selectedTransporter);
      toast.success('Credit check completed');
      fetchCreditRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to perform credit check');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'HIGH':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credit Management</h1>
          <p className="text-gray-600 mt-1">Manage transporter credit limits and payment terms</p>
        </div>
      </div>

      {/* Credit Check Form */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Perform Credit Check</label>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Enter Transporter ID"
            value={selectedTransporter}
            onChange={(e) => setSelectedTransporter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleCreditCheck}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span>Check Credit</span>
          </button>
        </div>
      </div>

      {/* Credit Records */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : credits.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No credit records found</h3>
          <p className="text-gray-600">Perform a credit check to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {credits.map((credit) => (
            <div key={credit.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(credit.status)}`}>
                      {credit.status}
                    </span>
                    <span className="text-sm text-gray-500">Transporter: {credit.transporterId.slice(0, 8)}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Credit Limit</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {credit.creditLimit.toLocaleString()} KES
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Current Balance</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {credit.currentBalance.toLocaleString()} KES
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Available Credit</div>
                      <div className="text-lg font-semibold text-green-600">
                        {credit.availableCredit.toLocaleString()} KES
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Payment Terms</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {credit.paymentTerms.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {credit.creditCheck && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Credit Score</span>
                        <span className={`text-lg font-bold ${getRiskColor(credit.creditCheck.riskLevel)}`}>
                          {credit.creditCheck.creditScore}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Risk Level: <span className={getRiskColor(credit.creditCheck.riskLevel)}>
                          {credit.creditCheck.riskLevel}
                        </span>
                      </div>
                    </div>
                  )}

                  {credit.paymentHistory && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Payment History</div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">On-Time:</span>{' '}
                          <span className="font-semibold text-green-600">
                            {credit.paymentHistory.onTimePayments}/{credit.paymentHistory.totalTransactions}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Late:</span>{' '}
                          <span className="font-semibold text-red-600">
                            {credit.paymentHistory.latePayments}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Trend:</span>{' '}
                          <span className="font-semibold">
                            {credit.paymentHistory.paymentTrend}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {credit.riskAssessment && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-sm font-medium text-red-900 mb-1">Risk Assessment</div>
                      <div className="text-sm text-red-700">
                        {credit.riskAssessment.overallRisk} Risk - {credit.riskAssessment.riskFactors.join(', ')}
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => {
                      setSelectedCredit(credit);
                      setShowUpdateModal(true);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Update Terms
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Payment Terms Modal */}
      {showUpdateModal && selectedCredit && (
        <UpdatePaymentTermsModal
          credit={selectedCredit}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedCredit(null);
          }}
          onUpdate={fetchCreditRecords}
        />
      )}
    </div>
  );
};

const UpdatePaymentTermsModal: React.FC<{
  credit: TransporterCredit;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ credit, onUpdate, onClose }) => {
  const [formData, setFormData] = useState<UpdatePaymentTermsData>({
    paymentTerms: credit.paymentTerms,
    customPaymentDays: credit.customPaymentDays,
    creditLimit: credit.creditLimit,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await brokerAPI.updatePaymentTerms(credit.id, formData);
      toast.success('Payment terms updated successfully');
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update payment terms');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Payment Terms</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="NET_15">Net 15</option>
              <option value="NET_30">Net 30</option>
              <option value="NET_45">Net 45</option>
              <option value="NET_60">Net 60</option>
              <option value="DUE_ON_RECEIPT">Due on Receipt</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          {formData.paymentTerms === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Days</label>
              <input
                type="number"
                value={formData.customPaymentDays || ''}
                onChange={(e) => setFormData({ ...formData, customPaymentDays: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (KES)</label>
            <input
              type="number"
              value={formData.creditLimit || ''}
              onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Terms'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditManagement;

