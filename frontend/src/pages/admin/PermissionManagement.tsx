import React, { useState, useEffect } from 'react';
import { UserPermissionEditor } from '../../components/Admin/Permissions/UserPermissionEditor';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { TranslatedText } from '../../components/translated-text';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import {
    Search, User, Mail, Shield,
    AlertCircle, CheckCircle, MoreHorizontal,
    Lock, Edit2
} from 'lucide-react';

const PermissionManagement = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Debounced search or initial load
        fetchUsers();
    }, []); // Initial load

    const fetchUsers = async (searchTerm = '') => {
        setLoading(true);
        try {
            // Using existing admin endpoint for users
            const response = await api.get('/admin/users', { params: { search: searchTerm, limit: 20 } });
            // Response format might vary, assuming standard paginated response or array
            setUsers(Array.isArray(response.data) ? response.data : response.data.items || []);
        } catch (error) {
            console.error('Failed to fetch users', error);
            // toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers(search);
    };

    const getStatusColor = (status: string) => {
        return status === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
            : 'bg-gray-50 text-gray-600 border-gray-200';
    };

    const getRoleColor = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'fleet_owner': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'cargo_owner': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'driver': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-gray-50 text-slate-600 border-gray-200';
        }
    };

    return (
        <AdminPageLayout
            title={<TranslatedText text="Permission Management" />}
            description={<TranslatedText text="Manage user-specific permissions and access control" />}
        >
            {!selectedUser ? (
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name, email..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium outline-none"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 font-bold shadow-lg shadow-gray-200 transition-all text-xs uppercase tracking-wider flex items-center gap-2"
                        >
                            <Search className="w-4 h-4" />
                            <TranslatedText text="Search" />
                        </button>
                    </form>

                    {/* Users List */}
                    {loading ? (
                        <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <span className="text-xs font-medium">Loading potential candidates...</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="User Identity" /></th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Role" /></th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Status" /></th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Access Control" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-bold text-xs group-hover:bg-white group-hover:shadow-md transition-all">
                                                        {user.firstName?.charAt(0) || <User className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900 mb-0.5">{user.firstName} {user.lastName}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                                                            <Mail className="w-3 h-3 text-gray-400" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getRoleColor(user.role)}`}>
                                                    <Shield className="w-3 h-3" />
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(user.status)}`}>
                                                    {user.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-lg transition-all text-xs font-bold shadow-sm"
                                                >
                                                    <Lock className="w-3 h-3" />
                                                    <TranslatedText text="Manage Access" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Search className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <p className="text-sm font-medium"><TranslatedText text="No users found" /></p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <UserPermissionEditor
                    userId={selectedUser.id}
                    userName={`${selectedUser.firstName} ${selectedUser.lastName}`}
                    userRole={selectedUser.role}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </AdminPageLayout>
    );
};

export default PermissionManagement;
