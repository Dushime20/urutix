import React, { useState } from 'react';
import {
    Gavel, Clock, CheckCircle, XCircle,
    Search, Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { tenantApi, type Bid } from '../../services/tenantApi';

interface TenantBiddingProps {
    tenantId: string;
}

const TenantBidding: React.FC<TenantBiddingProps> = ({ tenantId }) => {
    const [filter] = useState('all');

    const { data: bids = [], isLoading } = useQuery({
        queryKey: ['tenant-bids', tenantId, filter],
        queryFn: () => tenantApi.getTenantBids(tenantId, filter),
        enabled: !!tenantId
    });

    const stats = {
        active: bids.filter((b: Bid) => b.status === 'active' || b.status === 'pending').length,
        pending: bids.filter((b: Bid) => b.status === 'pending').length,
        accepted: bids.filter((b: Bid) => b.status === 'accepted').length,
        rejected: bids.filter((b: Bid) => b.status === 'rejected' || b.status === 'withdrawn').length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bidding Intelligence</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Monitor and manage your active auctions and bids</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search auctions..."
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 w-64"
                        />
                    </div>
                    <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-slate-500">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Active Bids', value: stats.active.toString(), icon: Gavel, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Pending Approval', value: stats.pending.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Won Auctions', value: stats.accepted.toString(), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Lost / Expired', value: stats.rejected.toString(), icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : bids.length > 0 ? (
                    <div className="p-6">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="pb-4 pl-4">Load / Lane</th>
                                    <th className="pb-4">Coordinates</th>
                                    <th className="pb-4">Bid Amount</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {bids.map((bid: Bid) => (
                                    <tr key={bid.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="py-4 pl-4">
                                            <div className="font-bold text-slate-700">#{bid.loadId.substring(0, 8)}</div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
                                                <span>{bid.loadOrigin}</span>
                                                <span className="text-slate-300">→</span>
                                                <span>{bid.loadDestination}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="font-black text-slate-800">${bid.amount.toLocaleString()}</div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${bid.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
                                                bid.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-slate-50 text-slate-500'
                                                }`}>
                                                {bid.status}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <div className="text-xs font-medium text-slate-400">
                                                {new Date(bid.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                            <Gavel className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">No Active Bids Found</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            You haven't placed any bids yet, or there are no active auctions matching your criteria.
                        </p>
                        <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                            Browse Available Loads
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TenantBidding;
