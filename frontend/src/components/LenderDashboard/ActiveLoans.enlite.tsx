import React, { useState } from 'react';
import {
    ShieldAlert,
    ExternalLink,
    Mail,
    Download,
    LayoutGrid,
    List,
} from 'lucide-react';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface Borrower {
    id: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    credit_score: number | null;
    verification_status: string | null;
}

interface ActiveLoan {
    id: string;
    loan_request_id: string;
    borrower: Borrower;
    principal_amount: number;
    approved_amount: number | null;
    interest_rate: number | null;
    loan_term_months: number | null;
    total_amount: number;
    amount_repaid: number;
    outstanding_balance: number;
    total_principal_paid: number;
    total_interest_paid: number;
    created_at: string | null;
    due_date: string | null;
    status: string;
    purpose: string | null;
    repayment_count: number;
    lender_name: string | null;
    _rawData?: any;
}

interface ActiveLoansEnliteProps {
    loading: boolean;
    loans: ActiveLoan[];
    onSort: (key: string) => void;
    sortKey: string;
    sortDirection: 'asc' | 'desc';
    onViewDetails: (loan: ActiveLoan) => void;
}

const ActiveLoansEnlite: React.FC<ActiveLoansEnliteProps> = ({
    loading,
    loans,
    onSort,
    sortKey,
    sortDirection,
    onViewDetails
}) => {
    const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');
    const { format } = useCurrencyFormat();
    const { tSync: t } = useTranslation();

    // Loans are stored in RWF — convert to user preferred currency
    const fmt  = (n: number) => format(n, 'RWF');

    const handleExport = () => {
        if (loans.length === 0) return;

        const headers = [
            'Loan ID', 'Borrower', 'Company', 'Email', 'Phone',
            'Principal', 'Approved Amount', 'Outstanding', 'Amount Repaid',
            'Interest Paid', 'Interest Rate', 'Status', 'Due Date',
            'Purpose', 'Repayment Count', 'Created At',
        ];

        const rows = loans.map(l => [
            l.id,
            l.borrower.name ?? '',
            l.borrower.company ?? '',
            l.borrower.email ?? '',
            l.borrower.phone ?? '',
            l.principal_amount,
            l.approved_amount ?? '',
            l.outstanding_balance,
            l.amount_repaid,
            l.total_interest_paid,
            l.interest_rate ?? '',
            l.status,
            l.due_date ?? '',
            l.purpose ?? '',
            l.repayment_count,
            l.created_at ?? '',
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `active-loans-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleContactBorrower = (loan: ActiveLoan) => {
        if (loan.borrower.email) {
            window.location.href = `mailto:${loan.borrower.email}?subject=Regarding Loan ${loan.id}`;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'emerald';
            case 'disbursed': return 'blue';
            case 'overdue': return 'rose';
            case 'repaid': return 'slate';
            default: return 'slate';
        }
    };

    const getPerformanceColor = (repaymentCount: number) => {
        // Derive performance from repayment count
        if (repaymentCount >= 5) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (repaymentCount >= 3) return 'text-[#345E85] bg-blue-50 border-blue-100';
        if (repaymentCount >= 1) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-slate-600 bg-slate-50 border-slate-100';
    };

    const getPerformanceLabel = (repaymentCount: number) => {
        if (repaymentCount >= 5) return 'excellent';
        if (repaymentCount >= 3) return 'good';
        if (repaymentCount >= 1) return 'fair';
        return 'new';
    };

    const columns = [
        {
            key: 'borrower',
            label: 'BORROWER IDENTITY',
            render: (_: any, loan: ActiveLoan) => {
                const performanceLabel = getPerformanceLabel(loan.repayment_count);
                return (
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs ${
                            performanceLabel === 'excellent' ? 'bg-emerald-500' :
                            performanceLabel === 'good' ? 'bg-[#345E85]' :
                            performanceLabel === 'fair' ? 'bg-amber-500' : 'bg-slate-500'
                        }`}>
                            {(loan.borrower.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-slate-900 uppercase tracking-tight text-[11px]">
                                {loan.borrower.name || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {loan.borrower.company || 'Private Borrower'}
                            </span>
                        </div>
                    </div>
                );
            },
            sortable: true
        },
        {
            key: 'loan_details',
            label: 'FINANCIAL PROFILE',
            render: (_: any, loan: ActiveLoan) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-[11px]">
                            {cpt(loan.principal_amount)}
                        </span>
                        {loan.interest_rate && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-black">
                                {loan.interest_rate}%
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {loan.loan_term_months ? `${loan.loan_term_months} Months Term` : 'Term N/A'}
                    </span>
                </div>
            )
        },
        {
            key: 'outstanding_balance',
            label: 'EXPOSURE INDEX',
            render: (_: any, loan: ActiveLoan) => {
                const progress = loan.total_amount > 0 ? (loan.amount_repaid / loan.total_amount) * 100 : 0;
                return (
                    <div className="space-y-2 min-w-[120px]">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-black text-slate-900 text-[11px]">
                                {cpt(loan.outstanding_balance)}
                            </span>
                            <span className="text-[10px] font-black text-[#345E85]">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-[#345E85] h-full rounded-full transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                );
            },
            sortable: true
        },
        {
            key: 'due_date',
            label: 'NEXT SETTLEMENT',
            render: (_: any, loan: ActiveLoan) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">
                        {loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {loan.repayment_count} payments made
                    </span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'performance',
            label: 'STATUS & RATING',
            render: (_: any, loan: ActiveLoan) => {
                const performanceLabel = getPerformanceLabel(loan.repayment_count);
                return (
                    <div className="flex flex-col gap-1.5">
                        <span className={`w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getPerformanceColor(loan.repayment_count)}`}>
                            {performanceLabel}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <ShieldAlert size={10} className={
                                loan.status === 'overdue' ? 'text-rose-500' :
                                loan.status === 'approved' ? 'text-emerald-500' : 'text-blue-500'
                            } />
                            {loan.status}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, loan: ActiveLoan) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onViewDetails(loan)}
                        className="p-2 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-lg transition-all"
                        title="View Details"
                    >
                        <ExternalLink size={14} />
                    </button>
                    <button
                        onClick={() => handleContactBorrower(loan)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Contact Borrower"
                        disabled={!loan.borrower.email}
                    >
                        <Mail size={14} />
                    </button>
                </div>
            )
        }
    ];

    const groupedLoans = loans.reduce((acc, loan) => {
        if (!acc[loan.status]) acc[loan.status] = [];
        acc[loan.status].push(loan);
        return acc;
    }, {} as Record<string, ActiveLoan[]>);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Main Content Area */}
            <DataCard
                title={t("Portfolio Management Console")}
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-[#345E85]' : 'text-slate-400'}`}
                            >
                                <List size={14} />
                            </button>
                            <button
                                onClick={() => setViewMode('grouped')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grouped' ? 'bg-white shadow-sm text-[#345E85]' : 'text-slate-400'}`}
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            <Download size={14} /> <TranslatedText text="Export Portfolio" />
                        </button>
                    </div>
                }
            >
                <div className="space-y-6">
                    {viewMode === 'table' ? (
                        <EnhancedTable
                            columns={columns}
                            data={loans}
                            loading={loading}
                            onSort={onSort}
                            sortKey={sortKey}
                            sortDirection={sortDirection}
                        />
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(groupedLoans).map(([status, statusLoans]) => (
                                <div key={status} className="space-y-4">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white bg-${getStatusColor(status)}-500 shadow-lg shadow-${getStatusColor(status)}-100`}>
                                            <ShieldAlert size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tighter">{status} <TranslatedText text="OPERATIONS" /></h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{statusLoans.length} <TranslatedText text="Active Assets Assigned" /></p>
                                        </div>
                                        <div className="flex-1 border-t border-slate-100 border-dashed mx-4"></div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900 uppercase">{cpt(statusLoans.reduce((sum, l) => sum + l.outstanding_balance, 0))}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest"><TranslatedText text="Total Exposure" /></p>
                                        </div>
                                    </div>
                                    <EnhancedTable
                                        columns={columns}
                                        data={statusLoans}
                                        loading={loading}
                                        onSort={onSort}
                                        sortKey={sortKey}
                                        sortDirection={sortDirection}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DataCard>
        </div>
    );
};

export default ActiveLoansEnlite;
