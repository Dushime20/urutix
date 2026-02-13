import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUserPlus, FaUserCheck, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { fetchAllUsers } from '../../../services/adminApi';

const UserManagementWidget: React.FC = () => {
    const navigate = useNavigate();

    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users-widget'],
        queryFn: () => fetchAllUsers(),
        refetchInterval: 30000, // Refresh every 30s
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FaUsers className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">User Management</h3>
                        <p className="text-xs text-slate-500">Platform users overview</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/users')}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    View All <FaArrowRight size={12} />
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-32">
                    <FaSpinner className="animate-spin text-blue-600" size={24} />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                            <div className="text-2xl font-black text-slate-800">{stats.total}</div>
                            <div className="text-xs text-slate-500 font-medium mt-1">Total Users</div>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
                            <div className="text-xs text-emerald-600 font-medium mt-1">Active</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-black text-blue-600">{stats.newThisWeek}</div>
                            <div className="text-xs text-blue-600 font-medium mt-1">New (7d)</div>
                        </div>
                    </div>

                    {/* Recent Users */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                            Recent Users
                        </h4>
                        <div className="space-y-2">
                            {recentUsers.map((user: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {user.firstName?.[0]}{user.lastName?.[0]}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-800">
                                                {user.firstName} {user.lastName}
                                            </div>
                                            <div className="text-xs text-slate-500">{user.role}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {user.status === 'active' && (
                                            <FaUserCheck className="text-emerald-500" size={14} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Action */}
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <FaUserPlus size={14} /> Create New User
                    </button>
                </>
            )}
        </div>
    );
};

export default UserManagementWidget;
