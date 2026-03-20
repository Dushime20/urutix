import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import toast from 'react-hot-toast';
import {
  Plus, Search, Building2, Mail, Phone,
  CheckCircle, AlertTriangle, X,
  ArrowRight, Download, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranslatedText } from '../components/translated-text';

interface Lender {
  id: string;
  name: string;
  contact_email: string;
  status?: 'active' | 'paused' | 'suspended';
  created_at?: string;
}

const TenantLenderManagementPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLenders();
  }, []);

  const fetchLenders = async () => {
    try {
      setFetching(true);
      const data = await lendingApi.getTenantLenders();
      setLenders(data);
    } catch (err: any) {
      console.error('Error fetching lenders:', err);
      toast.error('Failed to load lenders');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await lendingApi.createTenantLender({
        name: form.name,
        contact_email: form.email,
        callback_url: undefined
      });
      
      setForm({ name: '', email: '', phone: '' });
      setShowModal(false);
      setLoading(false);
      toast.success('Lender registered successfully');
      fetchLenders();
    } catch (err: any) {
      console.error('Error creating lender:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error registering lender';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const filteredLenders = lenders.filter(lender =>
    lender.name.toLowerCase().includes(search.toLowerCase()) ||
    lender.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: lenders.length,
    active: lenders.filter(l => (l.status || 'active') === 'active').length,
    pending: lenders.filter(l => l.status === 'paused' || l.status === 'suspended').length
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
        {[
          { label: <TranslatedText text="Total Lenders" />, value: stats.total, icon: Building2, color: 'primary' },
          { label: <TranslatedText text="Active Lenders" />, value: stats.active, icon: CheckCircle, color: 'emerald' },
          { label: <TranslatedText text="Attention Needed" />, value: stats.pending, icon: AlertTriangle, color: 'rose' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center space-x-6 transition-transform duration-300 hover:translate-x-1 cursor-default group"
          >
            <div className={`relative flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-white border border-slate-100 shadow-xl shadow-slate-100/20 overflow-hidden transition-all duration-500 group-hover:scale-110`}>
              <stat.icon size={28} className="text-primary-600" />
            </div>

            <div className="flex flex-col">
              <span className={`text-3xl font-black text-slate-800 tracking-tight leading-none mb-1.5`}>
                {stat.value}
              </span>
              <span className="text-[11px] font-black text-slate-400 whitespace-nowrap uppercase tracking-[0.2em]">
                {stat.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lender Registry Header */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 md:px-10 py-6 md:py-10 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic"><TranslatedText text="Lender Registry" /></h3>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight"><TranslatedText text="Active Lenders" /></h4>
          </div>
          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-center sm:justify-end">
            <button className="p-4 bg-slate-50 border border-slate-100 rounded-[20px] text-slate-400 hover:text-primary-600 transition-all">
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 sm:flex-none justify-center bg-primary-600 text-white px-8 md:px-10 py-4 rounded-[20px] hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 flex items-center text-[11px] font-black uppercase tracking-widest"
            >
              <Plus className="w-4 h-4 mr-3" />
              <TranslatedText text="Add Lender" />
            </button>
          </div>
        </div>

        <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-50 flex flex-col lg:flex-row gap-4 md:gap-6 bg-slate-50/20">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[20px] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-600 transition-all outline-none text-xs md:text-sm font-medium shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-[20px] text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary-600 transition-all">
            <Filter className="w-4 h-4" />
            <TranslatedText text="Filter By Status" />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
              <tr>
                <th className="px-10 py-6 italic">Lender Name</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6">Created On</th>
                <th className="px-10 py-6">Admin Contact</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fetching ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-10 py-8">
                      <div className="h-12 bg-slate-50 rounded-2xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredLenders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                      <Building2 className="text-slate-200 w-10 h-10" />
                    </div>
                    <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest">No Lenders Found</h5>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Start by adding a new lender to your tenant registry.</p>
                  </td>
                </tr>
              ) : filteredLenders.map((lender) => (
                <motion.tr
                  key={lender.id}
                  layout
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-primary-50 rounded-[18px] flex items-center justify-center border border-primary-100 group-hover:bg-primary-600 group-hover:border-primary-600 transition-all duration-300">
                        <Building2 className="w-5 h-5 text-primary-600 group-hover:text-white" />
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors">
                          {lender.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          Node ID: {lender.id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${(lender.status || 'active') === 'active'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${(lender.status || 'active') === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                      {lender.status || 'active'}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-xs font-black text-slate-700">
                      {lender.created_at ? new Date(lender.created_at).toLocaleDateString() : '-'}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-300" />
                        <span>{lender.contact_email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button className="text-slate-400 group-hover:text-primary-600 transition-colors p-3 hover:bg-primary-50 rounded-xl">
                      <ArrowRight className="w-5 h-5 translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lender Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-primary-600 p-12 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="p-4 bg-white/10 rounded-[24px] border border-white/20 backdrop-blur-md">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <h3 className="text-3xl font-black tracking-tight">Add Lender</h3>
                  <p className="text-white/60 text-xs font-medium mt-2">Register a new lending partner to the platform.</p>
                </div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-slate-50/50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-6 py-5 bg-white border border-slate-100 rounded-[24px] font-black text-sm focus:border-primary-600 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all shadow-sm"
                    placeholder="Enter lender name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        required
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[24px] font-black text-sm focus:border-primary-600 outline-none transition-all shadow-sm"
                        placeholder="lender@bank.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        required
                        type="text"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[24px] font-black text-sm focus:border-primary-600 outline-none transition-all shadow-sm"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 bg-primary-600 hover:bg-primary-700 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? 'Processing...' : 'Register Lender'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TenantLenderManagementPage;
