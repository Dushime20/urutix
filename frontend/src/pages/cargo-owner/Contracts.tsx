import { useState } from 'react';
import { FileText, Search, Filter, Download, Eye, Calendar, Clock, ArrowRight } from 'lucide-react';
import { TranslatedText } from '../../components/translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface Contract {
  id: string;
  contractNumber: string;
  cargoDescription: string;
  truckOwner: string;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  startDate: string;
  endDate: string;
  amount: number;
}

const Contracts = () => {
  const { tSync } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data - replace with actual API call
  const contracts: Contract[] = [
    {
      id: '1',
      contractNumber: 'CNT-2024-001',
      cargoDescription: 'Electronics - 5 tons',
      truckOwner: 'ABC Transport Ltd',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      amount: 150000,
    },
    {
      id: '2',
      contractNumber: 'CNT-2024-002',
      cargoDescription: 'Construction Materials - 10 tons',
      truckOwner: 'XYZ Logistics',
      status: 'completed',
      startDate: '2024-01-10',
      endDate: '2024-01-15',
      amount: 250000,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'completed':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'pending':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.cargoDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.truckOwner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-8 md:p-12 bg-slate-50/30 min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-100/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#345E85] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/10">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight leading-tight">
              Shared <span className="text-[#345E85]">Logistics</span> Vault
            </h1>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest sm:tracking-[0.2em] max-w-xl">
            Secure contractual archives & real-time agreement oversight
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 mb-8 sm:mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative col-span-1 lg:col-span-2">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={tSync('Search agreements, carriers or cargoes...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 sm:py-4 bg-slate-50 border-none rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#345E85]/10 transition-all text-xs sm:text-sm font-bold placeholder:text-slate-300 shadow-inner"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 sm:py-4 bg-slate-50 border-none rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#345E85]/10 transition-all text-xs sm:text-sm font-bold appearance-none shadow-inner"
              >
                <option value="all">{tSync('All Status')}</option>
                <option value="active">{tSync('Active')}</option>
                <option value="completed">{tSync('Completed')}</option>
                <option value="pending">{tSync('Pending')}</option>
                <option value="cancelled">{tSync('Cancelled')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredContracts.length === 0 ? (
            <div className="col-span-full bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-12 sm:p-20 text-center animate-in fade-in zoom-in-95 duration-700">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner text-slate-300">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 tracking-tight">
                <TranslatedText text="Archive is Empty" />
              </h3>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                {searchTerm || statusFilter !== 'all'
                  ? tSync('System could not locate agreements matching these parameters.')
                  : tSync('Your shared logistics agreements will materialize here after successful bookings.')}
              </p>
            </div>
          ) : (
            filteredContracts.map((contract) => (
              <div key={contract.id} className="group bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 p-6 sm:p-8 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${getStatusColor(contract.status)} shadow-sm`}>
                    <TranslatedText text={contract.status} />
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {contract.contractNumber}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-black text-[#0f172a] leading-tight mb-3 group-hover:text-[#345E85] transition-colors line-clamp-2">
                    {contract.cargoDescription}
                  </h3>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] sm:text-[12px] font-black text-[#345E85] shadow-sm">
                      {contract.truckOwner.charAt(0)}
                    </div>
                    <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">{contract.truckOwner}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-8 p-5 sm:p-6 bg-slate-50 rounded-3xl flex-grow shadow-inner border border-slate-100/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Temporal flow</span>
                    </div>
                    <div className="text-[10px] sm:text-xs font-black text-[#0f172a]">
                      {new Date(contract.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      <ArrowRight className="inline-block w-2.5 h-2.5 mx-1.5 text-slate-300" />
                      {new Date(contract.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-1.5 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Economic Value</span>
                    </div>
                    <div className="text-sm sm:text-lg font-black text-[#345E85] tracking-tight">
                      RF {contract.amount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 sm:gap-3">
                  <button className="flex-1 px-4 sm:px-6 py-3.5 sm:py-4 bg-[#345E85] text-white rounded-2xl sm:rounded-3xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <TranslatedText text="Insights" />
                  </button>
                  <button className="p-3.5 sm:p-4 bg-white border border-slate-100 text-slate-400 rounded-2xl sm:rounded-3xl hover:bg-slate-50 hover:text-[#345E85] transition-all shadow-sm active:scale-95" title="Download Archive">
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Contracts;
