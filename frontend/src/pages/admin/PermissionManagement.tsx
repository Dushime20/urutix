import React, { useState, useEffect } from 'react';
import { UserPermissionEditor } from '../../components/Admin/Permissions/UserPermissionEditor';
import AdminLayout from '../../components/Layout/AdminLayout'; // Check path
import { toast } from 'react-hot-toast';
// Need a way to fetch users. Assuming there is a users API or reusing AdminUsers component logic.
// For now, I'll assume we can fetch users via a service or existing API.
// Accessing api directly for user list as a shortcut or reuse existing userService/adminService.
import api from '../../services/api';

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
        // Wrapper div instead of AdminLayout since this will likely be rendered inside AdminLayout via Router
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 dark:text-white">Permission Management</h1>

            {!selectedUser ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Search by name, email..."
                            className="flex-1 border rounded p-2 dark:bg-slate-900 dark:text-white dark:border-gray-700"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Search</button>
                    </form>

                    {/* Users List */}
                    {loading ? (
                        <div>Loading users...</div>
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
        </div>
    );
};

export default PermissionManagement;
