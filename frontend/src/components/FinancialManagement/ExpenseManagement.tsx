import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Receipt, 
  Trash2, Edit3, Eye, CheckCircle, XCircle, 
  Clock, Fuel, Wrench, MapPin, Truck, 
  User as UserIcon, ArrowRight,
  TrendingUp, ShieldCheck, Landmark
} from 'lucide-react';
import { motion } from 'framer-motion';
import { financialAPI, fleetAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

interface Expense {
  id: string;
  type: 'fuel' | 'maintenance' | 'toll' | 'driver' | 'insurance' | 'tax' | 'other';
  category: string;
  amount: number;
  date: string;
  description: string;
  truckId?: string;
  driverId?: string;
  tripId?: string;
  receipt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  taxDeductible: boolean;
  allocationPercentage: number;
  location?: string;
  vendor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const ExpenseManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    truckId: '',
  });

  // Queries
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const response = await financialAPI.getExpenses(filters);
      return response.data?.data?.expenses || response.data?.expenses || [];
    }
  });

  const { data: trucksData } = useQuery({
    queryKey: ['trucks'],
    queryFn: async () => {
      const response = await fleetAPI.getTrucks();
      const data = response.data;
      if (Array.isArray(data?.trucks)) return data.trucks;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data)) return data;
      return [];
    }
  });

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => financialAPI.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense recorded successfully');
      setShowAddModal(false);
    },
    onError: () => toast.error('Failed to record expense')
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => financialAPI.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted');
    }
  });

  // Computed Values
  const filteredExpenses = useMemo(() => {
    if (!expensesData) return [];
    return expensesData.filter((e: Expense) => 
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expensesData, searchTerm]);

  const stats = useMemo(() => {
    if (!filteredExpenses) return { total: 0, pending: 0, taxSaved: 0 };
    return {
      total: filteredExpenses.reduce((acc: number, e: Expense) => acc + Number(e.amount), 0),
      pending: filteredExpenses.filter((e: Expense) => e.status === 'pending').reduce((acc: number, e: Expense) => acc + Number(e.amount), 0),
      taxSaved: filteredExpenses.filter((e: Expense) => e.taxDeductible).reduce((acc: number, e: Expense) => acc + Number(e.amount), 0) * 0.15 
    };
  }, [filteredExpenses]);

  const expenseTypes = [
    { value: 'fuel', label: 'Fuel', icon: Fuel, color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'toll', label: 'Tolls', icon: ArrowRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { value: 'driver', label: 'Labor', icon: UserIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { value: 'insurance', label: 'Insurance', icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
    { value: 'tax', label: 'Gov & Tax', icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { value: 'other', label: 'Other', icon: Receipt, color: 'text-slate-600', bg: 'bg-slate-50' }
  ];

  const SummaryCard = ({ title, value, icon: Icon, subtitle }: { title: string; value: string; icon: any; subtitle?: string }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex flex-col items-center group cursor-pointer"
    >
      <div className="relative size-36 lg:size-40 bg-white border-[6px] border-slate-50 rounded-full flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
          <circle
            cx="50%"
            cy="50%"
            r="46%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="414"
            strokeDashoffset="300"
            className="text-blue-400 opacity-10 transition-all duration-1000 group-hover:opacity-30"
          />
        </svg>

        <div className="p-2 rounded-xl mb-1 bg-slate-50 text-blue-600 group-hover:bg-white group-hover:text-blue-600 transition-all duration-500 shadow-sm">
          <Icon size={14} />
        </div>
        <p className="text-xl lg:text-2xl font-black text-[#0f172a] tracking-tighter group-hover:scale-110 transition-transform duration-500 text-center leading-none">
          {value}
        </p>
      </div>
      <div className="mt-4 text-center">
        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-blue-600 group-hover:text-[#345E85] transition-colors">
          {title}
        </p>
        {subtitle && (
          <p className="text-[6px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Quick Dashboard - SUBTLE CIRCULAR DESIGN */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-8 bg-slate-50/30 rounded-[3rem] border border-slate-100/50 place-items-center">
        <SummaryCard 
          title="Total Burn" 
          value={`$${stats.total.toLocaleString()}`} 
          icon={TrendingUp} 
          subtitle="Operational Expenses"
        />
        <SummaryCard 
          title="Pending Approval" 
          value={`$${stats.pending.toLocaleString()}`} 
          icon={Clock} 
          subtitle="Awaiting Review"
        />
        <SummaryCard 
          title="Tax Deductible" 
          value={`$${stats.taxSaved.toLocaleString()}`} 
          icon={ShieldCheck} 
          subtitle="Estimated Savings"
        />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#345E85] transition-colors" />
          <input 
            type="text"
            placeholder="Search expenses, vendors or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white transition-all placeholder:text-slate-300"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 transition-all cursor-pointer"
          >
            <option value="">All Categories</option>
            {expenseTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none px-8 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg shadow-blue-900/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expense Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timing</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expensesLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center">
                        <Receipt className="w-10 h-10 text-slate-200" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No expenses found matching criteria</p>
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.map((expense: Expense) => {
                const typeInfo = expenseTypes.find(t => t.value === expense.type) || expenseTypes[6];
                const Icon = typeInfo.icon;
                
                return (
                  <tr key={expense.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", typeInfo.bg)}>
                          <Icon className={cn("w-5 h-5", typeInfo.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{expense.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{expense.category}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                              {expense.vendor || 'Unknown Vendor'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        {expense.truckId ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                             <Truck className="w-3 h-3 text-slate-300" />
                             <span>TRK-{expense.truckId.substring(0,6)}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">General Business</span>
                        )}
                        {expense.location && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <MapPin className="w-3 h-3" />
                            <span>{expense.location}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-[#0f172a] tracking-tight">
                          ${Number(expense.amount).toLocaleString()}
                        </span>
                        {expense.taxDeductible && (
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                            <CheckCircle className="w-2.5 h-2.5" /> Tax Deductible
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600">
                          {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          Added {new Date(expense.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest",
                        expense.status === 'paid' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        expense.status === 'pending' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        "bg-slate-50 text-slate-500 border border-slate-100"
                      )}>
                        {expense.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                        {expense.status === 'pending' && <Clock className="w-3 h-3" />}
                        {expense.status}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-[#345E85] hover:border-[#345E85] transition-all shadow-sm">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm("Confirm deletion?")) deleteExpenseMutation.mutate(expense.id);
                          }}
                          className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-600 transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Add Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#345E85] text-white flex items-center justify-center">
                  <Plus className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#0f172a] tracking-tight">Record Expense</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Entry Lifecycle Management</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-12 h-12 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center justify-center text-slate-400"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form className="p-10" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              createExpenseMutation.mutate({
                ...data,
                amount: Number(data.amount),
                taxDeductible: data.taxDeductible === 'on',
                status: 'pending',
                category: (data as any).type 
              });
            }}>
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Description</label>
                  <input name="description" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white transition-all" placeholder="e.g. Weekly Fuel Refill" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Amount ($)</label>
                  <input name="amount" type="number" step="0.01" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white transition-all" placeholder="0.00" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Expense Category</label>
                  <select name="type" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white transition-all">
                    {expenseTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Date</label>
                  <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white transition-all" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Related Truck</label>
                  <select name="truckId" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white transition-all">
                    <option value="">General Expense</option>
                    {trucksData?.map((t: any) => <option key={t.id} value={t.id}>{t.plateNumber}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <input type="checkbox" name="taxDeductible" id="taxDeductible" className="w-5 h-5 rounded-lg border-slate-200 text-[#345E85] focus:ring-[#345E85]" />
                <label htmlFor="taxDeductible" className="text-sm font-bold text-slate-600 cursor-pointer">Mark as Tax Deductible (Optimizes business tax profile)</label>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-8 py-5 bg-slate-100 text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="flex-[2] px-8 py-5 bg-[#345E85] text-white rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-blue-900/10 active:scale-95 disabled:opacity-50"
                >
                  {createExpenseMutation.isPending ? "Processing..." : "Finalize Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;
