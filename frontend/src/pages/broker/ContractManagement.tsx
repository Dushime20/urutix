import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type LoadContract, type CreateContractData } from '../../services/brokerApi';
import { Plus, Search, CheckCircle2, X, Eye, Download, Shield, TrendingUp, Lock, FileCheck, DollarSign, Activity, AlertCircle, Clock, Loader2, FileText, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import jsPDF from 'jspdf';

const ContractManagement: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<LoadContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<LoadContract | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      fetchContracts();
    }
  }, [user, filters.status]);

  const fetchContracts = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await brokerAPI.getContracts({
        status: filters.status || undefined,
      });
      const contractsData = response.data || response || [];
      setContracts(Array.isArray(contractsData) ? contractsData : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch contracts');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptContract = async (contractId: string) => {
    try {
      await brokerAPI.acceptContract(contractId);
      toast.success('Contract accepted successfully');
      fetchContracts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept contract');
    }
  };

  const handleCreateContract = async (data: CreateContractData) => {
    try {
      await brokerAPI.createContract(data);
      toast.success('Contract created successfully');
      setShowCreateModal(false);
      fetchContracts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create contract');
    }
  };

  const handleSignContract = async (contractId: string) => {
    try {
      await brokerAPI.signContract(contractId, {
        signatureMethod: 'DIGITAL',
      });
      toast.success('Contract signed successfully');
      fetchContracts();
      setSelectedContract(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sign contract');
    }
  };

  const generatePDF = (contract: LoadContract) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 30;

    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BROKER SERVICE CONTRACT', pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Contract ID: ${contract.id}`, margin, y);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, y);
    y += 20;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('1. PARTIES', margin, y);
    y += 10;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Broker: ${user?.firstName} ${user?.lastName || ''} (${user?.email})`, margin + 5, y);
    y += 8;
    pdf.text(`Load Reference: ${contract.loadId}`, margin + 5, y);
    y += 20;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('2. FINANCIAL TERMS', margin, y);
    y += 10;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Agreed Rate: ${contract.currencyCode} ${contract.agreedRate.toLocaleString()}`, margin + 5, y);
    y += 8;
    pdf.text(`Commission: ${contract.commissionRate}% (${contract.commissionAmount.toLocaleString()} ${contract.currencyCode})`, margin + 5, y);
    y += 8;
    pdf.text(`Payment Terms: ${contract.paymentTerms || 'Standard Net 30'}`, margin + 5, y);
    y += 20;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('3. TIMELINES', margin, y);
    y += 10;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Pickup Date: ${contract.pickupDate ? new Date(contract.pickupDate).toLocaleDateString() : 'TBD'}`, margin + 5, y);
    y += 8;
    pdf.text(`Delivery Date: ${contract.deliveryDate ? new Date(contract.deliveryDate).toLocaleDateString() : 'TBD'}`, margin + 5, y);
    
    pdf.save(`Contract_${contract.id.slice(0, 8)}.pdf`);
    toast.success('Contract PDF downloaded');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'SIGNED':
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PENDING_SIGNATURE':
      case 'PENDING_BROKER_ACCEPTANCE':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (loading && contracts.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Contracts Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <FileText size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1">Contracts</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Legal & Financial Records</p>
          </div>
        </div>

        <div className="relative z-10 hidden md:flex items-center gap-12 mr-4">
          <div className="text-center">
            <p className="text-xl font-bold leading-none text-white">{contracts.filter(c => c.status === 'ACTIVE' || c.status === 'SIGNED').length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Active</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold leading-none text-primary-400">{contracts.filter(c => c.status.includes('PENDING')).length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Pending</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white font-bold uppercase px-8 py-2.5 rounded-xl shadow-xl shadow-primary-900/20 active:scale-95 transition-all flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> New Contract
          </button>
        </div>
      </div>

      {/* Registry Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Earnings', value: `${contracts.reduce((acc, c) => acc + c.commissionAmount, 0).toLocaleString()} KES`, sub: 'Total Commission', icon: TrendingUp, color: 'primary' },
          { label: 'Active Loads', value: contracts.filter(c => c.status === 'ACTIVE' || c.status === 'SIGNED').length, sub: 'Authorized Contracts', icon: Shield, color: 'emerald' },
          { label: 'Pending Action', value: contracts.filter(c => c.status.includes('PENDING')).length, sub: 'Awaiting Signature', icon: Clock, color: 'amber' },
          { label: 'Success Rate', value: '98.2%', sub: 'Fulfilled Contracts', icon: CheckCircle2, color: 'indigo' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-primary-50 transition-colors"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all mb-6">
                <stat.icon size={20} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Contract Table Terminal */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search Contracts..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-4 text-xs font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-primary-100 transition-all"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="bg-slate-50 border border-slate-100 rounded-2xl px-8 py-4 text-sm font-bold uppercase text-slate-600 outline-none focus:bg-white transition-all cursor-pointer flex-1 md:flex-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SIGNED">Signed</option>
              <option value="PENDING_SIGNATURE">Pending</option>
              <option value="CANCELLED">Voided</option>
            </select>
          </div>
        </div>

        {contracts.length === 0 ? (
          <div className="p-32 text-center space-y-8">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <Shield size={48} />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 uppercase">No Contracts Found</h3>
              <p className="text-xs font-semibold text-slate-400 uppercase leading-relaxed max-w-xs mx-auto">You have not created any contracts yet.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-8 text-left text-sm font-bold text-slate-400 uppercase border-b border-slate-100">Contract</th>
                  <th className="px-10 py-8 text-left text-sm font-bold text-slate-400 uppercase border-b border-slate-100">Earnings</th>
                  <th className="px-10 py-8 text-left text-sm font-bold text-slate-400 uppercase border-b border-slate-100">Dates</th>
                  <th className="px-10 py-8 text-left text-sm font-bold text-slate-400 uppercase border-b border-slate-100">Status</th>
                  <th className="px-10 py-8 text-right text-sm font-bold text-slate-400 uppercase border-b border-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                          <Activity size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 uppercase italic">#{contract.id.slice(0, 8)}</p>
                          <p className="text-sm font-bold text-slate-400 uppercase mt-1">Load {contract.loadId.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-sm font-bold text-slate-900">{contract.agreedRate.toLocaleString()} <span className="text-sm text-slate-300 uppercase">{contract.currencyCode}</span></p>
                      <p className="text-xs font-bold text-primary-600 uppercase mt-1">Commission: {contract.commissionAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-xs font-bold text-slate-900 uppercase">{contract.pickupDate ? new Date(contract.pickupDate).toLocaleDateString() : 'TBD'}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase mt-1">Pickup Date</p>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border flex items-center gap-2 w-fit ${getStatusStyle(contract.status)}`}>
                        {contract.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => generatePDF(contract)}
                          className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        {contract.status === 'PENDING_SIGNATURE' && (
                          <button
                            onClick={() => handleAcceptContract(contract.id)}
                            className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg"
                            title="Accept Contract"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateContractModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateContract} />
      )}

      {selectedContract && (
        <ViewContractModal 
          contract={selectedContract} 
          onClose={() => setSelectedContract(null)} 
          onSign={handleSignContract}
          onDownload={generatePDF}
        />
      )}
    </div>
  );
};

const CreateContractModal: React.FC<{ onClose: () => void, onSubmit: (data: CreateContractData) => void }> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateContractData>({
    loadId: '',
    transporterId: '',
    agreedRate: 0,
    commissionRate: 5.0,
    currencyCode: 'KES',
    paymentTerms: 'Net 30 days',
    pickupDate: '',
    deliveryDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        <div className="p-12 border-b border-white/5 flex items-center justify-between bg-slate-900 text-white shadow-2xl">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold uppercase italic">Create <span className="text-white">Contract</span></h2>
            <p className="text-slate-400 text-sm font-bold uppercase">Setup a new legal & financial agreement</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-12 md:p-16 overflow-y-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Load ID</label>
              <input
                type="text"
                required
                value={formData.loadId}
                onChange={(e) => setFormData({...formData, loadId: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold tracking-tight text-slate-900 focus:bg-white focus:border-primary-600 outline-none transition-all"
                placeholder="LOAD_Reference"
              />
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Carrier ID</label>
              <input
                type="text"
                required
                value={formData.transporterId}
                onChange={(e) => setFormData({...formData, transporterId: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold tracking-tight text-slate-900 focus:bg-white focus:border-primary-600 outline-none transition-all"
                placeholder="CARRIER_Ident"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Total Rate</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={formData.agreedRate || ''}
                  onChange={(e) => setFormData({...formData, agreedRate: parseFloat(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold tracking-tight text-slate-900 focus:bg-white focus:border-primary-600 outline-none transition-all"
                />
                <DollarSign size={16} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Commission (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.commissionRate || ''}
                onChange={(e) => setFormData({...formData, commissionRate: parseFloat(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold tracking-tight text-slate-900 focus:bg-white focus:border-primary-600 outline-none transition-all"
              />
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Currency</label>
              <select
                value={formData.currencyCode}
                onChange={(e) => setFormData({...formData, currencyCode: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-10 py-6 text-sm font-bold tracking-tight text-slate-900 focus:bg-white focus:border-primary-600 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="KES">KES - Shilling</option>
                <option value="USD">USD - Dollar</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-6 pt-12 border-t border-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-12 py-6 text-sm font-bold uppercase text-slate-400 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] text-sm font-bold uppercase shadow-2xl hover:bg-primary-600 transition-all flex items-center gap-4"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              Authorize Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewContractModal: React.FC<{ contract: LoadContract, onClose: () => void, onSign: (id: string) => void, onDownload: (c: LoadContract) => void }> = ({ contract, onClose, onSign, onDownload }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        <div className="p-12 border-b border-white/5 flex items-center justify-between bg-slate-900 text-white shadow-2xl">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold uppercase italic">Contract <span className="text-white">Details</span></h2>
            <p className="text-slate-400 text-sm font-bold uppercase">Legal agreement reference #{contract.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-12 md:p-16 overflow-y-auto space-y-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Total Rate', value: `${contract.agreedRate.toLocaleString()} ${contract.currencyCode}`, icon: DollarSign },
              { label: 'Commission', value: `${contract.commissionAmount.toLocaleString()}`, icon: TrendingUp },
              { label: 'Security', value: 'Verified', icon: Shield },
              { label: 'Status', value: contract.status.replace('_', ' '), icon: Activity },
            ].map((meta, i) => (
              <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all">
                <meta.icon size={20} className="text-slate-300 mb-6 group-hover:text-primary-600 transition-colors" />
                <p className="text-sm font-bold text-slate-400 uppercase mb-1">{meta.label}</p>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{meta.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.4em] ml-4">Agreement Context</h4>
              <div className="bg-slate-900 rounded-[2.5rem] p-10 space-y-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-xl -mr-16 -mt-16"></div>
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-sm font-bold uppercase text-slate-500">Load Reference</span>
                    <span className="text-sm font-bold text-white">{contract.loadId}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-sm font-bold uppercase text-slate-500">Creation Timestamp</span>
                    <span className="text-sm font-bold">{new Date(contract.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold uppercase text-slate-500">Protocol</span>
                    <span className="text-sm font-bold text-emerald-400">Digital Smart Contract</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.4em] ml-4">Financial Terms</h4>
              <div className="bg-slate-50 rounded-[2.5rem] p-10 space-y-8 border border-slate-100">
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-4">
                    <span className="text-sm font-bold uppercase text-slate-400">Payment Window</span>
                    <span className="text-sm font-bold text-slate-900">{contract.paymentTerms || 'Standard Net 30'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-4">
                    <span className="text-sm font-bold uppercase text-slate-400">Commission Verification</span>
                    <span className="text-sm font-bold text-primary-600">Authorized</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold uppercase text-slate-400">Legal Standard</span>
                    <span className="text-sm font-bold text-slate-900">Commercial Maritime Act</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-slate-100">
            <div className="flex gap-4 w-full md:w-auto">
              <button
                onClick={() => onDownload(contract)}
                className="flex-1 md:flex-none px-12 py-6 bg-slate-900 text-white rounded-[2rem] text-sm font-bold uppercase shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-4"
              >
                <Download size={18} /> Export PDF
              </button>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <button onClick={onClose} className="flex-1 md:flex-none px-12 py-6 text-sm font-bold uppercase text-slate-400 hover:text-slate-900 transition-colors">Close</button>
              {contract.status === 'PENDING_SIGNATURE' && (
                <button
                  onClick={() => onSign(contract.id)}
                  className="flex-1 md:flex-none px-16 py-6 bg-primary-600 text-white rounded-[2rem] text-sm font-bold uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  <FileCheck size={18} /> Sign Agreement
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractManagement;
