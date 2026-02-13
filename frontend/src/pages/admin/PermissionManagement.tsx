import React, { useState, useEffect } from 'react';
import { UserPermissionEditor } from '../../components/Admin/Permissions/UserPermissionEditor';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { FaSearch } from 'react-icons/fa';

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

    return (
        <AdminPageLayout
            title="Permission Management"
            description="Manage user-specific permissions and access control"
        >
            {!selectedUser ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-900 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 transition-all">Search</button>
                    </form>

                    {/* Users List */}
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading users...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400">
                                    <tr>
                                        <th className="p-3">User</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="p-3 font-medium dark:text-white">{user.firstName} {user.lastName}</td>
                                            <td className="p-3 dark:text-gray-300">{user.email}</td>
                                            <td className="p-3">
                                                <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="text-blue-600 hover:underline text-sm font-medium"
                                                >
                                                    Manage Permissions
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-gray-500">No users found</td>
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
