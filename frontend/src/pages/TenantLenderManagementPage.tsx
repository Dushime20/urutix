import React, { useState, useEffect, useMemo } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import toast from 'react-hot-toast';
import {
  Plus, Building2, Mail, Phone,
  CheckCircle, AlertTriangle, X,
  ArrowRight, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranslatedText } from '../components/translated-text';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../components/EnliteUI/Tables';

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

  const stats = {
    total: lenders.length,
    active: lenders.filter(l => (l.status || 'active') === 'active').length,
    pending: lenders.filter(l => l.status === 'paused' || l.status === 'suspended').length
  };

  const tableData = useMemo(() =>
    lenders.map((l) => ({
      ...l,
      statusKey: l.status || 'active',
    })),
  [lenders]);

  const columns: Column<Lender & { statusKey: string }>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Lender Name',
      sortable: true,
      render: (_v, row) => (
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-primary-50 rounded-[18px] flex items-center justify-center border border-primary-100">
            <Building2 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-base font-black text-slate-900 tracking-tight">{row.name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Node ID: {row.id.substring(0, 8)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'statusKey',
      label: 'Status',
      sortable: true,
      render: (_v, row) => (
        <StatusBadge status={row.statusKey} label={row.statusKey} />
      ),
    },
    {
      key: 'created_at',
      label: 'Created On',
      sortable: true,
      render: (_v, row) => (
        <span className="text-xs font-black text-slate-700">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'contact_email',
      label: 'Admin Contact',
      render: (_v, row) => (
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Mail className="w-3.5 h-3.5 text-slate-300" />
          <span>{row.contact_email}</span>
        </div>
      ),
    },
  ], []);

  const rowActions: TableAction<Lender & { statusKey: string }>[] = useMemo(() => [
    {
      key: 'open',
      label: 'Open',
      icon: <ArrowRight className="w-4 h-4" />,
      onClick: () => {},
    },
  ], []);

  return (
    <div className="space-y-8 pb-20">
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
            <div className="relative flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-white border border-slate-100 shadow-xl shadow-slate-100/20 overflow-hidden transition-all duration-500 group-hover:scale-110">
              <stat.icon size={28} className="text-primary-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1.5">
                {stat.value}
              </span>
              <span className="text-[11px] font-black text-slate-400 whitespace-nowrap uppercase tracking-[0.2em]">
                {stat.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <StandardDataTable
        title={<TranslatedText text="Active Lenders" />}
        subtitle={<TranslatedText text="Lender Registry" />}
        icon={<Building2 className="w-5 h-5" />}
        columns={columns}
        data={tableData}
        loading={fetching}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by name, email, or ID..."
        searchKeys={['name', 'contact_email', 'id']}
        filters={[
          {
            key: 'statusKey',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' },
              { value: 'suspended', label: 'Suspended' },
            ],
          },
        ]}
        rowActions={rowActions}
        onRefresh={fetchLenders}
        headerActions={
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 transition-all">
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all flex items-center text-[11px] font-black uppercase tracking-widest"
            >
              <Plus className="w-4 h-4 mr-2" />
              <TranslatedText text="Add Lender" />
            </button>
          </div>
        }
        emptyMessage="No lenders found"
        ariaLabel="Tenant lenders"
      />

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
