import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { fetchAllUsers } from '../../../services/adminApi';
import { DataCard } from '../../EnliteUI';
import { TranslatedText } from '../../translated-text';

const UserManagementWidget: React.FC = () => {
    const navigate = useNavigate();

    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users-widget'],
        queryFn: () => fetchAllUsers(),
        refetchInterval: 30000,
    });

    const usersArray = Array.isArray(users) ? users : [];

    const stats = {
        total: usersArray.length || 0,
        active: usersArray.filter((u: any) => u.status === 'active').length || 0,
        newThisWeek: usersArray.filter((u: any) => {
            const createdAt = new Date(u.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return createdAt > weekAgo;
        }).length || 0,
    };

    const recentUsers = usersArray.slice(0, 3) || [];

    return (
        <DataCard
            title={<TranslatedText text="User Management" />}
            subtitle={<TranslatedText text="Platform census overview" />}
            headerColor="secondary"
            icon={<Users size={20} />}
            actions={
                <button
                    onClick={() => navigate('/admin/users')}
                    className="text-[10px] font-black text-white hover:text-primary-200 flex items-center gap-1 uppercase tracking-widest transition-all"
                >
                    <TranslatedText text="View All" /> <ArrowRight size={10} />
                </button>
            }
        >
            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="animate-spin text-primary-600" size={24} />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total', value: stats.total, color: 'text-slate-800', bg: 'bg-slate-50' },
                            { label: 'Active', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Growth', value: `+${stats.newThisWeek}`, color: 'text-primary-600', bg: 'bg-primary-50' }
                        ].map((stat, i) => (
                            <div key={i} className={`text-center p-3 ${stat.bg} rounded-2xl border border-transparent hover:border-slate-200 dark:border-slate-700 transition-all`}>
                                <div className={`text-2xl font-black ${stat.color} leading-none mb-1`}>{stat.value}</div>
                                <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Users List */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                            Recent Platform Deployments
                        </h4>
                        <div className="space-y-3">
                            {recentUsers.map((user: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:border-slate-800 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white text-[10px] font-black group-hover:scale-105 transition-transform">
                                            {user.firstName?.[0]}{user.lastName?.[0]}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                                                {user.firstName} {user.lastName}
                                            </div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user.role}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {user.status === 'active' && (
                                            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                <CheckCircle size={14} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Action */}
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="w-full mt-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-100 group"
                    >
                        <UserPlus size={14} className="group-hover:scale-110 transition-transform" /> 
                        <TranslatedText text="Initialize New User" />
                    </button>
                </div>
            )}
        </DataCard>
    );
};

export default UserManagementWidget;
