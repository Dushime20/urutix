import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loanRequestService } from '../services/loanRequestService';
import type { LoanRequest } from '../types/loanRequest';
import { DollarSign, FileText, Clock, TrendingUp, Calendar } from 'lucide-react';

const CargoFinancingPage = () => {
    const { user } = useAuth();
    const [loans, setLoans] = useState<LoanRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLoans = async () => {
            if (!user?.tenantId) {
                setLoading(false);
                return;
            }
            try {
                // Assuming we use tenant ID to fetch loans for this cargo owner
                const data = await loanRequestService.getTenantLoans(user.tenantId);
                setLoans(data);
            } catch (err: any) {
                console.error('Failed to fetch loans:', err);
                setError('Failed to load financing history');
            } finally {
                setLoading(false);
            }
        };

        fetchLoans();
    }, [user?.tenantId]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'repaid': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const stats = {
        totalBorrowed: loans.reduce((acc, loan) => loan.status === 'approved' || loan.status === 'repaid' ? acc + (loan.approved_amount || 0) : acc, 0),
        activeLoans: loans.filter(l => l.status === 'approved' || l.status === 'disbursed').length,
        pendingRequests: loans.filter(l => l.status === 'pending').length,
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    <p className="font-medium">Error loading financing data</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cargo Financing</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage your cargo loans and financing requests</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Borrowed</p>
                            <p className="text-2xl font-bold text-gray-900">${stats.totalBorrowed.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Loans</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.activeLoans}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-50 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Requests</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loans List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Loan Requests History</h3>
                </div>

                {loans.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No financing history</h3>
                        <p className="text-gray-500">You haven't submitted any financing requests yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {loans.map((loan) => (
                            <div key={loan.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                                                {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                            </span>
                                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(loan.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-gray-900 mb-1">{loan.purpose || 'Cargo Financing'}</h4>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span>Requested: ${loan.requested_amount.toLocaleString()}</span>
                                            {loan.approved_amount && (
                                                <span className="text-green-600 font-medium">Approved: ${loan.approved_amount.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Interest Rate</p>
                                            <p className="font-medium text-gray-900">{loan.interest_rate || '2'}% / month</p>
                                        </div>
                                        <div className="text-right pl-4 border-l border-gray-200">
                                            <p className="text-sm text-gray-500">Term</p>
                                            <p className="font-medium text-gray-900">{loan.loan_term_months ? Math.round(loan.loan_term_months * 30) : 30} days</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CargoFinancingPage;
