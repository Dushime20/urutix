import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type InsuranceVerification, type VerifyInsuranceData, type ComplianceCheck } from '../../services/brokerApi';
import { Shield, Plus, Search, CheckCircle2, XCircle, AlertTriangle, Loader2, FileCheck, Activity, ShieldCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { StandardDataTable, StatusBadge, type Column } from '../../components/EnliteUI/Tables';

const InsuranceVerification: React.FC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<InsuranceVerification[]>([]);
  const [loading, setLoading] = useState(false);
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
      const verificationsData = response.data || response || [];
      setVerifications(Array.isArray(verificationsData) ? verificationsData : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch verifications');
      setVerifications([]);
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
    setLoading(true);
    try {
      const response = await brokerAPI.checkCompliance(selectedTransporter, ['INSURANCE', 'LICENSE', 'DOT_NUMBER']);
      setComplianceCheck(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to check compliance');
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<InsuranceVerification>[] = useMemo(() => [
    {
      key: 'verificationType',
      label: 'Record Type',
      sortable: true,
      render: (_v, row) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 dark:bg-slate-800/50 dark:border-slate-800">
            <Shield size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 tracking-tight uppercase italic dark:text-white">{row.verificationType.replace(/_/g, ' ')}</p>
            <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">Authorized Node</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_v, row) => <StatusBadge status={row.status} label={row.status} />,
    },
    {
      key: 'policyNumber',
      label: 'Value',
      render: (_v, row) => (
        <span className="font-mono text-[11px] font-bold text-slate-700 tracking-wider dark:text-slate-200">
          {row.policyNumber || row.licenseNumber || 'N/A'}
        </span>
      ),
    },
    {
      key: 'expiryDate',
      label: 'Expiry',
      sortable: true,
      align: 'right',
      render: (_v, row) => (
        <p className="text-xs font-bold text-slate-900 uppercase dark:text-white">
          {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : 'Infinite'}
        </p>
      ),
    },
  ], []);

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Compliance Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#345E85]/10 dark:bg-white/10 border border-[#345E85]/20 dark:border-white/20 flex items-center justify-center">
            <ShieldCheck size={24} className="text-[#345E85] dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">Compliance</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Insurance & Safety Verification</p>
          </div>
        </div>

        <button 
          onClick={() => setShowVerifyModal(true)} 
          className="relative z-10 px-8 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold uppercase transition-all shadow-xl shadow-primary-900/20 active:scale-95 flex items-center gap-2"
        >
          <Plus size={14} /> Add Record
        </button>
      </div>

      {/* Terminal Input */}
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm flex flex-col lg:flex-row gap-8 items-end dark:bg-slate-900 dark:border-slate-800">
        <div className="flex-1 space-y-4">
          <label className="text-sm font-bold text-slate-400 uppercase ml-4">Transporter ID</label>
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input
              type="text"
              placeholder="Search Transporter ID (e.g. TRANS_001)..."
              value={selectedTransporter}
              onChange={(e) => setSelectedTransporter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-50 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-xl transition-all outline-none placeholder:text-slate-300 dark:bg-slate-800/50 dark:text-white dark:border-slate-800/50"
            />
          </div>
        </div>
        <button
          onClick={handleCheckCompliance}
          disabled={!selectedTransporter || loading}
          className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-sm font-bold uppercase hover:bg-primary-600 disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl h-[60px] dark:bg-slate-950"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <FileCheck size={16} />} Run Safety Scan
        </button>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          {complianceCheck ? (
            <div className={`rounded-[3rem] p-10 border shadow-sm ${complianceCheck.isCompliant ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} animate-slide-up`}>
              <div className="flex items-center gap-4 mb-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${complianceCheck.isCompliant ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                  {complianceCheck.isCompliant ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                  <p className={`text-sm font-bold uppercase ${complianceCheck.isCompliant ? 'text-emerald-700' : 'text-rose-700'}`}>Status</p>
                  <h3 className={`text-2xl font-bold uppercase ${complianceCheck.isCompliant ? 'text-emerald-900' : 'text-rose-900'}`}>{complianceCheck.isCompliant ? 'Safe to Load' : 'At Risk'}</h3>
                </div>
              </div>

              <div className="space-y-6">
                {complianceCheck.missingTypes.length > 0 && (
                  <div className="p-6 bg-white/50 rounded-2xl border border-rose-200">
                    <p className="text-xs font-bold text-rose-400 uppercase mb-1">Missing Records</p>
                    <p className="text-xs font-bold text-rose-900 uppercase tracking-tight">{complianceCheck.missingTypes.join(', ')}</p>
                  </div>
                )}
                {complianceCheck.expiredTypes.length > 0 && (
                  <div className="p-6 bg-white/50 rounded-2xl border border-rose-200">
                    <p className="text-xs font-bold text-rose-400 uppercase mb-1">Expired Documents</p>
                    <p className="text-xs font-bold text-rose-900 uppercase tracking-tight">{complianceCheck.expiredTypes.join(', ')}</p>
                  </div>
                )}
                {complianceCheck.warnings.map((warning, idx) => (
                  <div key={idx} className="flex gap-3 text-xs font-semibold text-amber-700 bg-amber-100/30 p-4 rounded-xl border border-amber-200">
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] border border-slate-100 p-12 text-center space-y-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200 dark:bg-slate-800/50">
                <Activity size={32} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase">Select a Transporter to Start</p>
            </div>
          )}

          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group dark:bg-slate-950">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield size={120} />
            </div>
            <h4 className="text-xl font-bold uppercase mb-1">Compliance Logs</h4>
            <p className="text-xs font-bold text-primary-400 uppercase mb-8">Audit History</p>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 text-xs font-bold text-slate-400 border-l border-white/10 pl-6 py-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Node_{100+i}</span>
                  <span className="text-slate-200">System Verification Check</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8 animate-slide-up">
          <StandardDataTable
            title="Verified Records"
            subtitle={`Nodes: ${verifications.length}`}
            columns={columns}
            data={verifications}
            loading={loading && !complianceCheck}
            getRowId={(row) => row.id}
            searchPlaceholder="Search records..."
            searchKeys={['verificationType', 'status', 'policyNumber', 'licenseNumber']}
            emptyMessage="No verified records found for this Transporter."
            ariaLabel="Insurance verifications"
            onRefresh={fetchVerifications}
          />
        </div>
      </div>

      {showVerifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={() => setShowVerifyModal(false)}></div>
          <div className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh] dark:bg-slate-900">
            <div className="p-12 border-b border-white/5 flex items-center justify-between bg-slate-900 text-white shadow-2xl dark:bg-slate-950">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold uppercase italic">Verify <span className="text-white">Compliance</span></h2>
                <p className="text-slate-400 text-sm font-bold uppercase">Update Transporter security & legal status</p>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all">
                <X size={24} />
              </button>
            </div>
            <VerifyInsuranceModal
              onClose={() => setShowVerifyModal(false)}
              onSubmit={handleVerify}
              initialTransporterId={selectedTransporter}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const VerifyInsuranceModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: VerifyInsuranceData) => void;
  initialTransporterId?: string;
}> = ({ onClose, onSubmit, initialTransporterId }) => {
  const [formData, setFormData] = useState<VerifyInsuranceData>({
    transporterId: initialTransporterId || '',
    verificationType: 'INSURANCE',
    policyNumber: '',
    effectiveDate: '',
    expiryDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-12 md:p-16 overflow-y-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-400 uppercase ml-4">Transporter ID</label>
          <input
            type="text"
            required
            value={formData.transporterId}
            onChange={(e) => setFormData({ ...formData, transporterId: e.target.value })}
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold text-slate-900 focus:bg-white outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800"
            placeholder="TRANS_001"
          />
        </div>
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-400 uppercase ml-4">Record Category</label>
          <select
            required
            value={formData.verificationType}
            onChange={(e) => setFormData({ ...formData, verificationType: e.target.value as any })}
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold text-slate-900 focus:bg-white outline-none cursor-pointer dark:bg-slate-800/50 dark:text-white dark:border-slate-800"
          >
            <option value="INSURANCE">Standard Insurance</option>
            <option value="LICENSE">Regulatory License</option>
            <option value="DOT_NUMBER">DOT Identification</option>
            <option value="MC_NUMBER">MC Identification</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-bold text-slate-400 uppercase ml-4">Reference Number (Policy/License)</label>
        <input
          type="text"
          required
          value={formData.policyNumber}
          onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold text-slate-900 focus:bg-white outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800"
          placeholder="POL-888222"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-400 uppercase ml-4">Valid From</label>
          <input type="date" value={formData.effectiveDate} onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold text-slate-900 outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" />
        </div>
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-400 uppercase ml-4">Expiry Date</label>
          <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold text-slate-900 outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" />
        </div>
      </div>

      <div className="flex justify-end gap-6 pt-12 border-t border-slate-50 dark:border-slate-800/50">
        <button type="button" onClick={onClose} className="px-12 py-6 text-sm font-bold uppercase text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
        <button type="submit" disabled={submitting} className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] text-sm font-bold uppercase shadow-2xl hover:bg-primary-600 transition-all flex items-center gap-4 dark:bg-slate-950">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />} Save Verification
        </button>
      </div>
    </form>
  );
};

export default InsuranceVerification;
