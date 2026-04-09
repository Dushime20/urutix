import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Receipt, 
  Trash2, Edit3, Eye, CheckCircle, XCircle, 
  Clock, Fuel, Wrench, MapPin, Truck, 
  User as UserIcon, ArrowRight,
  TrendingUp, ShieldCheck, Landmark
} from 'lucide-react';
import { motion } from 'framer-motion';
import { financialAPI, fleetAPI, tripsAPI } from '@/services/api';
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
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState('');
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


  const { data: tripsData } = useQuery({
    queryKey: ['trips-active'],
    queryFn: async () => {
      const response = await tripsAPI.getAll({ limit: 50, status: 'IN_PROGRESS' });
      const data = response.data;
      if (Array.isArray(data?.trips)) return data.trips;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data)) return data;
      return [];
    }
  });

  // Derive drivers assigned to the selected truck from assignedDrivers array
  const assignedDrivers: { driverId: string; driverName: string }[] = selectedTruckId
    ? (trucksData?.find((t: any) => t.id === selectedTruckId)?.assignedDrivers || [])
    : [];

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

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => financialAPI.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated');
      setEditExpense(null);
    },
    onError: () => toast.error('Failed to update expense'),
  });

  const handleOpenEdit = (expense: Expense) => {
    setEditExpense(expense);
    setEditForm({
      description: expense.description,
      amount: expense.amount,
      type: expense.type,
      date: expense.date?.split('T')[0],
      truckId: expense.truckId || '',
      vendor: expense.vendor || '',
      notes: expense.notes || '',
      taxDeductible: expense.taxDeductible,
      status: expense.status,
    });
  };

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
    { value: 'fuel', label: 'Fuel', icon: Fuel, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { value: 'toll', label: 'Tolls', icon: ArrowRight, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { value: 'driver', label: 'Labor', icon: UserIcon, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { value: 'insurance', label: 'Insurance', icon: ShieldCheck, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { value: 'tax', label: 'Gov & Tax', icon: Landmark, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { value: 'other', label: 'Other', icon: Receipt, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800' }
  ];

  const SummaryCard = ({ title, value, icon: Icon, subtitle }: { title: string; value: string; icon: any; subtitle?: string }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex flex-col items-center group cursor-pointer"
    >
      <div className="relative size-36 lg:size-40 bg-white dark:bg-slate-900 border-[6px] border-slate-50 dark:border-slate-800 rounded-full flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none">
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

        <div className="p-2 rounded-xl mb-1 bg-slate-50 dark:bg-slate-950 text-[#345E85] dark:text-blue-400 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all duration-500 shadow-sm border border-transparent dark:border-slate-800">
          <Icon size={14} />
        </div>
        <p className="text-xl lg:text-2xl font-black text-[#0f172a] dark:text-slate-100 tracking-tighter group-hover:scale-110 transition-transform duration-500 text-center leading-none">
          {value}
        </p>
      </div>
      <div className="mt-4 text-center">
        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-[#345E85] dark:text-slate-400 group-hover:text-[#345E85] dark:group-hover:text-blue-400 transition-colors">
          {title}
        </p>
        {subtitle && (
          <p className="text-[6px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Quick Dashboard - SUBTLE CIRCULAR DESIGN */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-8 bg-slate-50/30 dark:bg-slate-900/10 rounded-[3rem] border border-slate-100/50 dark:border-slate-800 place-items-center">
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
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-500 group-focus-within:text-[#345E85] dark:group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text"
            placeholder="Search expenses, vendors or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-6 py-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 transition-all cursor-pointer"
          >
            <option value="">All Categories</option>
            {expenseTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none px-8 py-4 bg-[#345E85] dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10 dark:shadow-blue-500/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Expense Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Entity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Amount</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Timing</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
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
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-[2rem] flex items-center justify-center">
                        <Receipt className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">No expenses found matching criteria</p>
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.map((expense: Expense) => {
                const typeInfo = expenseTypes.find(t => t.value === expense.type) || expenseTypes[6];
                const Icon = typeInfo.icon;
                
                return (
                  <tr key={expense.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", typeInfo.bg)}>
                          <Icon className={cn("w-5 h-5", typeInfo.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#0f172a] dark:text-slate-100 uppercase tracking-tight">{expense.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{expense.category}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {expense.vendor || 'Unknown Vendor'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        {expense.truckId ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                             <Truck className="w-3 h-3 text-slate-300 dark:text-slate-500" />
                             <span>TRK-{expense.truckId.substring(0,6)}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest italic">General Business</span>
                        )}
                        {expense.location && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            <MapPin className="w-3 h-3" />
                            <span>{expense.location}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-[#0f172a] dark:text-slate-100 tracking-tight">
                          ${Number(expense.amount).toLocaleString()}
                        </span>
                        {expense.taxDeductible && (
                          <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                            <CheckCircle className="w-2.5 h-2.5" /> Tax Deductible
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                          Added {new Date(expense.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest",
                        expense.status === 'paid' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800" :
                        expense.status === 'pending' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800" :
                        "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
                      )}>
                        {expense.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                        {expense.status === 'pending' && <Clock className="w-3 h-3" />}
                        {expense.status}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => setViewExpense(expense)}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-[#345E85] dark:hover:text-blue-400 hover:border-[#345E85] dark:hover:border-blue-500 transition-all shadow-sm">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(expense)}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-600 dark:hover:border-indigo-500 transition-all shadow-sm">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteExpense(expense)}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-600 dark:hover:border-rose-500 transition-all shadow-sm">
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

      {/* Delete Confirmation Modal */}
      {deleteExpense && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" style={{ zIndex: 99999 }}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-5">
              <Trash2 className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Delete Expense?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">{deleteExpense.description}</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">
              ${Number(deleteExpense.amount).toLocaleString()} Â· {new Date(deleteExpense.date).toLocaleDateString()}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">This action cannot be undone.</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteExpense(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { deleteExpenseMutation.mutate(deleteExpense.id); setDeleteExpense(null); }}
                disabled={deleteExpenseMutation.isPending}
                className="flex-1 py-3 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 disabled:opacity-50 transition-colors">
                {deleteExpenseMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Expense Modal */}
      {/* View Expense Modal */}
      {viewExpense && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" style={{ zIndex: 99999 }}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-7 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center",
                  expenseTypes.find(t => t.value === viewExpense.type)?.bg || 'bg-slate-50 dark:bg-slate-800')}>
                  {(() => { const Icon = expenseTypes.find(t => t.value === viewExpense.type)?.icon || Receipt; return <Icon className={cn("w-6 h-6", expenseTypes.find(t => t.value === viewExpense.type)?.color || 'text-slate-500')} />; })()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{viewExpense.description}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewExpense.category}</p>
                </div>
              </div>
              <button onClick={() => setViewExpense(null)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <XCircle className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="mx-7 mb-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">${Number(viewExpense.amount).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  viewExpense.status === 'paid' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" :
                  viewExpense.status === 'pending' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" :
                  "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                  {viewExpense.status}
                </span>
                {viewExpense.taxDeductible && (
                  <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                    <CheckCircle className="w-3 h-3" /> Tax Deductible
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-7 pb-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Date', value: new Date(viewExpense.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) },
                  { label: 'Vendor', value: viewExpense.vendor },
                  { label: 'Truck', value: viewExpense.truckId ? `TRK-${viewExpense.truckId.slice(0,6)}` : null },
                  { label: 'Driver', value: (() => {
                    if (!viewExpense.driverId) return null;
                    const allDrivers = (trucksData || []).flatMap((t: any) => t.assignedDrivers || []);
                    const found = allDrivers.find((d: any) => d.driverId === viewExpense.driverId);
                    return found?.driverName || `DRV-${viewExpense.driverId.slice(0,6)}`;
                  })() },
                  { label: 'Trip', value: viewExpense.tripId ? `TRP-${viewExpense.tripId.slice(0,6)}` : null },
                  { label: 'Location', value: viewExpense.location },
                  { label: 'Added', value: new Date(viewExpense.createdAt).toLocaleDateString() },
                  { label: 'Updated', value: new Date(viewExpense.updatedAt).toLocaleDateString() },
                ].filter(item => !!item.value).map(({ label, value }) => (
                  <div key={label} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{value}</p>
                  </div>
                ))}
              </div>
              {viewExpense.notes && (
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{viewExpense.notes}</p>
                </div>
              )}
            </div>
            <div className="p-7 flex gap-3 flex-shrink-0">
              <button onClick={() => setViewExpense(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Close
              </button>
              <button onClick={() => { setViewExpense(null); handleOpenEdit(viewExpense); }}
                className="flex-1 py-3 rounded-2xl bg-[#345E85] dark:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors">
                Edit
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Expense Modal */}
      {editExpense && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" style={{ zIndex: 99999 }}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-7 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Edit Expense</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update record</p>
                </div>
              </div>
              <button onClick={() => setEditExpense(null)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <XCircle className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-7">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                  <input value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount ($)</label>
                  <input type="number" step="0.01" value={editForm.amount || ''} onChange={e => setEditForm(p => ({ ...p, amount: Number(e.target.value) }))}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                  <select value={editForm.type || ''} onChange={e => setEditForm(p => ({ ...p, type: e.target.value as any }))}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
                    {expenseTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                  <input type="date" value={editForm.date || ''} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                  <select value={editForm.status || ''} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as any }))}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendor</label>
                  <input value={editForm.vendor || ''} onChange={e => setEditForm(p => ({ ...p, vendor: e.target.value }))}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</label>
                  <textarea rows={2} value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none" />
                </div>
                <div className="col-span-2 flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <input type="checkbox" id="editTaxDeductible" checked={!!editForm.taxDeductible}
                    onChange={e => setEditForm(p => ({ ...p, taxDeductible: e.target.checked }))}
                    className="w-5 h-5 rounded-lg text-indigo-600" />
                  <label htmlFor="editTaxDeductible" className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Tax Deductible</label>
                </div>
              </div>
            </div>
            <div className="p-7 flex gap-3 flex-shrink-0">
              <button onClick={() => setEditExpense(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => updateExpenseMutation.mutate({ id: editExpense.id, data: editForm })}
                disabled={updateExpenseMutation.isPending}
                className="flex-[2] py-3 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {updateExpenseMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteExpense && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" style={{ zIndex: 99999 }}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-5">
              <Trash2 className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Delete Expense?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">{deleteExpense.description}</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
              ${Number(deleteExpense.amount).toLocaleString()} · {new Date(deleteExpense.date).toLocaleDateString()}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">This action cannot be undone.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteExpense(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { deleteExpenseMutation.mutate(deleteExpense.id); setDeleteExpense(null); }}
                disabled={deleteExpenseMutation.isPending}
                className="flex-1 py-3 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 disabled:opacity-50 transition-colors">
                {deleteExpenseMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Record Expense Modal — portal renders at document.body */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" style={{ zIndex: 99999 }}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 rounded-t-[3rem] flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#345E85] dark:bg-blue-600 text-white flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">Record Expense</h3>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Entry Lifecycle Management</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setSelectedTruckId(''); }}
                className="w-10 h-10 rounded-2xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-center text-slate-400 dark:text-slate-500"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
            <form className="p-8" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              createExpenseMutation.mutate({
                ...data,
                amount: Number(data.amount),
                taxDeductible: data.taxDeductible === 'on',
                status: 'pending',
                category: (data as any).type,
                driverId: data.driverId || undefined,
                tripId: data.tripId || undefined,
                truckId: data.truckId || undefined,
              });
            }}>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Description</label>
                  <input name="description" required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white dark:focus:bg-slate-900 transition-all" placeholder="e.g. Weekly Fuel Refill" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Amount ($)</label>
                  <input name="amount" type="number" step="0.01" required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white dark:focus:bg-slate-900 transition-all" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Expense Category</label>
                  <select name="type" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white dark:focus:bg-slate-900 transition-all">
                    {expenseTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Date</label>
                  <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white dark:focus:bg-slate-900 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Related Truck</label>
                  <select name="truckId" value={selectedTruckId}
                    onChange={e => setSelectedTruckId(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white dark:focus:bg-slate-900 transition-all">
                    <option value="">General Expense</option>
                    {trucksData?.map((t: any) => <option key={t.id} value={t.id}>{t.plateNumber}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                    Driver {selectedTruckId && assignedDrivers.length === 0 && <span className="text-slate-300 normal-case font-medium">(no driver assigned)</span>}
                  </label>
                  <select name="driverId"
                    disabled={!selectedTruckId || assignedDrivers.length === 0}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="">
                      {!selectedTruckId ? 'Select a truck first' : assignedDrivers.length === 0 ? 'No driver assigned' : 'Select driver'}
                    </option>
                    {assignedDrivers.map((d: any) => (
                      <option key={d.driverId} value={d.driverId}>{d.driverName}</option>
                    ))}
                  </select>
                  {assignedDrivers.length === 1 && (
                    <input type="hidden" name="driverId" value={assignedDrivers[0].driverId} />
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Related Trip</label>
                  <select name="tripId" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#345E85]/10 focus:bg-white dark:focus:bg-slate-900 transition-all">
                    <option value="">No Trip</option>
                    {tripsData?.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.tripNumber || t.id.slice(0, 8)} — {t.status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-8 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <input type="checkbox" name="taxDeductible" id="taxDeductible" className="w-5 h-5 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-[#345E85] dark:text-blue-500 focus:ring-[#345E85] dark:focus:ring-blue-500" />
                <label htmlFor="taxDeductible" className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Mark as Tax Deductible (Optimizes business tax profile)</label>
              </div>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => { setShowAddModal(false); setSelectedTruckId(''); }}
                  className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">
                  Cancel
                </button>
                <button type="submit" disabled={createExpenseMutation.isPending}
                  className="flex-[2] px-8 py-4 bg-[#345E85] dark:bg-blue-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/10 dark:shadow-blue-500/20 active:scale-95 disabled:opacity-50">
                  {createExpenseMutation.isPending ? "Processing..." : "Finalize Record"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ExpenseManagement;
