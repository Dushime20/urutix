import React from 'react';
import {
    Download,
    Printer,
    CheckCircle2,
    Clock,
    XCircle,
    FileText,
    Eye,
    Box
} from 'lucide-react';
import { StandardDataTable } from '../EnliteUI/Tables';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { useTranslation } from '../../hooks/useTranslation';

export interface ReceiptData {
    id: string;
    receiptNumber: string;
    lenderId: string;
    paymentId: string;
    tripId: string;
    cargoOwnerId: string;
    cargoOwnerName: string;
    cargoOwnerEmail?: string;
    cargoOwnerPhone?: string;
    cargoName: string;
    amount: number;
    currency: string;
    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    paymentMethod?: string;
    transactionId?: string;
    referenceNumber?: string;
    paymentDate: string;
    notes?: string;
    metadata?: {
        tripNumber?: string;
        cargoId?: string;
        paymentType?: string;
    };
}

interface ReceiptsEnliteProps {
    loading: boolean;
    receipts: ReceiptData[];
    onViewDetails: (receipt: ReceiptData) => void;
    onDownload: (receipt: ReceiptData) => void;
    onPrint: (receipt: ReceiptData) => void;
}

const ReceiptsEnlite: React.FC<ReceiptsEnliteProps> = ({
    loading,
    receipts,
    onViewDetails,
    onDownload,
    onPrint
}) => {
    const { format } = useCurrencyFormat();
    const formatMoney = (amount: number, fromCurrency = 'RWF') =>
        format(amount, fromCurrency);
    const { tSync: t } = useTranslation();

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'issued': return 'bg-blue-50 text-[#345E85] border-blue-200';
            case 'draft': return 'bg-slate-50 text-slate-700 border-slate-200';
            case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle2 size={12} className="mr-1" />;
            case 'issued': return <Clock size={12} className="mr-1" />;
            case 'draft': return <FileText size={12} className="mr-1" />;
            case 'cancelled': return <XCircle size={12} className="mr-1" />;
            default: return null;
        }
    };

    const columns = [
        {
            key: 'receiptNumber',
            label: 'RECEIPT ID',
            render: (_: unknown, r: ReceiptData) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-tight">
                        {r.receiptNumber}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Ref: {r.referenceNumber || 'N/A'}
                    </span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'cargo',
            label: 'CARGO & TRIP',
            render: (_: unknown, r: ReceiptData) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-400 group-hover:text-[#345E85] group-hover:bg-blue-50 transition-all">
                        <Box size={14} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-[11px]">
                            {r.cargoName}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                            Trip: {r.metadata?.tripNumber || 'N/A'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'party',
            label: 'PAYMENT FROM',
            render: (_: unknown, r: ReceiptData) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                        {r.cargoOwnerName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-[11px]">{r.cargoOwnerName}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{r.cargoOwnerPhone || 'No contact'}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'SETTLEMENT',
            render: (_: unknown, r: ReceiptData) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 dark:text-white text-[11px]">
                        {formatMoney(r.amount, r.currency || 'RWF')}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        via {r.paymentMethod || 'Wire'}
                    </span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'date',
            label: 'ISSUANCE',
            render: (_: unknown, r: ReceiptData) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-tight">
                        {new Date(r.paymentDate).toLocaleDateString()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {r.status === 'paid' ? 'Completed' : 'Pending'}
                    </span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'status',
            label: 'STATUS',
            render: (_: unknown, r: ReceiptData) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(r.status)}`}>
                    {getStatusIcon(r.status)}
                    {r.status}
                </span>
            ),
            sortable: true
        },
        {
            key: 'actions',
            label: '',
            render: (_: unknown, r: ReceiptData) => (
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={() => onViewDetails(r)}
                        className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-lg transition-all"
                    >
                        <Eye size={14} />
                    </button>
                    <button
                        onClick={() => onDownload(r)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    >
                        <Download size={14} />
                    </button>
                    <button
                        onClick={() => onPrint(r)}
                        className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-lg transition-all"
                    >
                        <Printer size={14} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <StandardDataTable
                title={t("Payment Archive")}
                subtitle={t("Official financial records for institutional auditing")}
                icon={<FileText className="w-5 h-5" />}
                headerColor="primary"
                headerActions={
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button className="px-3 py-1.5 bg-white dark:bg-slate-900 text-[#345E85] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Current</button>
                        <button className="px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest">Archival</button>
                    </div>
                }
                columns={columns}
                data={receipts}
                loading={loading}
                getRowId={(row) => row.id}
                searchable
                searchPlaceholder={t('Search receipts…')}
                searchKeys={['receiptNumber', 'cargoName', 'cargoOwnerName', 'status', 'referenceNumber']}
                filters={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { value: 'paid', label: 'Paid' },
                            { value: 'issued', label: 'Issued' },
                            { value: 'draft', label: 'Draft' },
                            { value: 'cancelled', label: 'Cancelled' },
                        ],
                    },
                ]}
                pagination
                pageSize={10}
                columnVisibility
                stickyHeader
                striped
                hoverable
                emptyMessage={t("No institutional receipts generated for this period")}
                rowClassName={() => 'group'}
                ariaLabel={t("Payment Archive")}
            />
        </div>
    );
};

export default ReceiptsEnlite;
