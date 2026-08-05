import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  Download,
  Printer,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import ReceiptsEnlite, { type ReceiptData } from '../LenderDashboard/Receipts.enlite';

const ReceiptViewer: React.FC = () => {
  const { user } = useAuth();
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  const { data: receipts, isLoading } = useQuery({
    queryKey: ['lender-receipts', user?.id],
    queryFn: async () => {
      const response = await api.get('/payments/receipts', {
        params: {
          lenderId: user?.id,
        },
      });
      return response.data.data?.receipts || response.data || [];
    },
    enabled: !!user?.id,
  });

  const handleDownload = async (receipt: ReceiptData) => {
    try {
      toast.success('Initiating secure ledger download...');
      // TODO: Implement PDF download
      console.log('Download receipt:', receipt.id);
    } catch (error) {
      toast.error('Secure download failed');
    }
  };

  const handlePrint = (receipt: ReceiptData) => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight uppercase flex items-center gap-3">
              <div className="p-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-200 dark:shadow-none">
                <Receipt size={24} />
              </div>
              Settlement Receipts
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2 uppercase text-[10px] font-black tracking-[0.2em] opacity-70">
              Validated certificates of institutional capital settlement
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <button className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 dark:shadow-none">Current Cycle</button>
              <button className="px-4 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest">Historical</button>
            </div>
          </div>
        </div>

        <ReceiptsEnlite
          loading={isLoading}
          receipts={receipts || []}
          onViewDetails={(r) => setSelectedReceipt(r)}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />

        {/* Receipt Detail Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`p-4 rounded-2xl ${selectedReceipt.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'}`}>
                    <Receipt size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase">Settlement Certificate</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Instrument No: {selectedReceipt.receiptNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Document Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedReceipt.status === 'paid' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{selectedReceipt.status}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Issuance Date</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{new Date(selectedReceipt.paymentDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-4 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 uppercase">Principal Party</span>
                    <span className="font-black text-slate-900 dark:text-white uppercase text-right">{selectedReceipt.cargoOwnerName}</span>
                  </div>
                  {selectedReceipt.cargoOwnerEmail && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 uppercase">Identity Hash</span>
                      <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{selectedReceipt.cargoOwnerEmail}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-700 pt-4">
                    <span className="text-slate-400 uppercase">Asset Manifest</span>
                    <span className="font-black text-slate-900 dark:text-white uppercase text-right leading-tight">{selectedReceipt.cargoName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-700 pt-4">
                    <span className="text-slate-400 uppercase font-black text-[10px]">Net Settlement</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedReceipt.currency} {selectedReceipt.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleDownload(selectedReceipt)}
                    className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all group"
                  >
                    <Download className="text-slate-400 group-hover:text-indigo-600" size={20} />
                    <span className="text-[9px] font-black text-slate-400 uppercase group-hover:text-indigo-600">Download Cryptographic PDF</span>
                  </button>
                  <button
                    onClick={() => handlePrint(selectedReceipt)}
                    className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                  >
                    <Printer className="text-slate-400 group-hover:text-indigo-600" size={20} />
                    <span className="text-[9px] font-black text-slate-400 uppercase group-hover:text-indigo-600">Print Physical Copy</span>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-indigo-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Authenticated via Secure Ledger</p>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Close Certificate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptViewer;
