import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type InsuranceVerification, type VerifyInsuranceData, type ComplianceCheck } from '../../services/brokerApi';
import { Shield, Plus, Search, CheckCircle2, XCircle, AlertTriangle, Loader2, FileCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const InsuranceVerification: React.FC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<InsuranceVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState<string>('');
  const [complianceCheck, setComplianceCheck] = useState<ComplianceCheck | null>(null);

  useEffect(() => {
    if (user && user.role === 'BROKER' && selectedTransporter) {
      fetchVerifications();
    }
  }, [user, selectedTransporter]);

  const fetchVerifications = async () => {
    if (!selectedTransporter) return;
    setLoading(true);
    try {
      const response = await brokerAPI.getVerifications(selectedTransporter);
      // Handle different response structures
      const verificationsData = response.data || response || [];
      setVerifications(Array.isArray(verificationsData) ? verificationsData : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch verifications');
      setVerifications([]); // Ensure verifications is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (data: VerifyInsuranceData) => {
    try {
      await brokerAPI.verifyInsurance(data);
      toast.success('Insurance verified successfully');
      setShowVerifyModal(false);
      fetchVerifications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to verify insurance');
    }
  };

  const handleCheckCompliance = async () => {
    if (!selectedTransporter) {
      toast.error('Please select a transporter first');
      return;
    }
    try {
      const response = await brokerAPI.checkCompliance(selectedTransporter, ['INSURANCE', 'LICENSE', 'DOT_NUMBER']);
      setComplianceCheck(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to check compliance');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'EXPIRED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'REQUIRES_UPDATE':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurance & Compliance Verification</h1>
          <p className="text-gray-600 mt-1">Verify transporter insurance and compliance documents</p>
        </div>
        <button
          onClick={() => setShowVerifyModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Verify Insurance</span>
        </button>
      </div>

      {/* Transporter Selection */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Transporter</label>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Enter Transporter ID"
            value={selectedTransporter}
            onChange={(e) => setSelectedTransporter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleCheckCompliance}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FileCheck className="w-5 h-5" />
            <span>Check Compliance</span>
          </button>
        </div>
      </div>

      {/* Compliance Check Results */}
      {complianceCheck && (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${complianceCheck.isCompliant ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
          <div className="flex items-center space-x-3 mb-4">
            {complianceCheck.isCompliant ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              Compliance Status: {complianceCheck.isCompliant ? 'Compliant' : 'Non-Compliant'}
            </h3>
          </div>
          {complianceCheck.missingTypes.length > 0 && (
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-700">Missing Types:</p>
              <p className="text-sm text-red-600">{complianceCheck.missingTypes.join(', ')}</p>
            </div>
          )}
          {complianceCheck.expiredTypes.length > 0 && (
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-700">Expired Types:</p>
              <p className="text-sm text-red-600">{complianceCheck.expiredTypes.join(', ')}</p>
            </div>
          )}
          {complianceCheck.warnings.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700">Warnings:</p>
              <ul className="list-disc list-inside text-sm text-yellow-600">
                {complianceCheck.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Verifications List */}
      {selectedTransporter ? (
        loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : verifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No verifications found</h3>
            <p className="text-gray-600">Create a verification for this transporter</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy/License</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {verifications.map((verification) => (
                  <tr key={verification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {verification.verificationType.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(verification.status)}
                        <span className="text-sm text-gray-900">{verification.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {verification.policyNumber || verification.licenseNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {verification.expiryDate ? new Date(verification.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {verification.verifiedAt ? new Date(verification.verifiedAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Transporter</h3>
          <p className="text-gray-600">Enter a transporter ID above to view their verifications</p>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && (
        <VerifyInsuranceModal
          onClose={() => setShowVerifyModal(false)}
          onSubmit={handleVerify}
        />
      )}
    </div>
  );
};

// Verify Insurance Modal
const VerifyInsuranceModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: VerifyInsuranceData) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<VerifyInsuranceData>({
    transporterId: '',
    verificationType: 'INSURANCE',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Verify Insurance/Compliance</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transporter ID</label>
            <input
              type="text"
              required
              value={formData.transporterId}
              onChange={(e) => setFormData({ ...formData, transporterId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Type</label>
            <select
              required
              value={formData.verificationType}
              onChange={(e) => setFormData({ ...formData, verificationType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="INSURANCE">Insurance</option>
              <option value="LICENSE">License</option>
              <option value="DOT_NUMBER">DOT Number</option>
              <option value="MC_NUMBER">MC Number</option>
              <option value="CARGO_INSURANCE">Cargo Insurance</option>
              <option value="BOND">Bond</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Policy/License Number</label>
            <input
              type="text"
              value={formData.policyNumber || ''}
              onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
              <input
                type="date"
                value={formData.effectiveDate || ''}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate || ''}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
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
              {submitting ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InsuranceVerification;

