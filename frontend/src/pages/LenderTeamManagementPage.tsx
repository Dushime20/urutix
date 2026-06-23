import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { 
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaUserShield,
  FaUserTie,
  FaUserCheck,
  FaSearch,
  FaFilter,
  FaDownload,
  FaUpload,
  FaCog,
  FaKey,
  FaShieldAlt,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaUserPlus,
  FaBan,
  FaUnlock
} from 'react-icons/fa';

interface LenderUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: LenderRole;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  permissions: LenderPermission[];
  createdAt: Date;
  lastLogin: Date;
  createdBy: string;
  department: string;
  avatar?: string;
}

interface LenderRole {
  id: string;
  name: string;
  description: string;
  level: number; // 1-5, higher = more access
  defaultPermissions: LenderPermission[];
  isCustom: boolean;
}

interface LenderPermission {
  id: string;
  name: string;
  description: string;
  category: 'loans' | 'borrowers' | 'analytics' | 'settings' | 'compliance' | 'financial';
  level: 'read' | 'write' | 'admin';
}

const LenderTeamManagementPage: React.FC = () => {
  const [users, setUsers] = useState<LenderUser[]>([]);
  const [roles, setRoles] = useState<LenderRole[]>([]);
  const [permissions, setPermissions] = useState<LenderPermission[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null); // Removed duplicate declaration
  // const [saving, setSaving] = useState(false);

  // Load team data on component mount
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const lenderId = localStorage.getItem('lenderId') || 'default-lender-id';
        
        try {
          // Load all team-related data
          const [teamMembers, teamStatsData, availableRoles, allPermissions] = await Promise.all([
            lendingApi.getLenderTeam(lenderId),
            lendingApi.getLenderTeamStats(lenderId),
            lendingApi.getLenderRoles(lenderId),
            lendingApi.getAllPermissions()
          ]);
          
          setUsers(teamMembers);
          setTeamStats(teamStatsData);
          setRoles(availableRoles);
          setPermissions(allPermissions);
          
        } catch (apiError) {
          console.warn('Team management APIs not available, using mock data:', apiError);
          setError('Team management APIs not available. Using demo data.');
          
          // Fallback to mock data
          loadMockData();
        }
      } catch (error) {
        console.error('Failed to load team data:', error);
        setError('Failed to load team data. Using demo data.');
        loadMockData();
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, []);

  const loadMockData = () => {
    setUsers([
      {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@lender.com',
        phone: '+1-555-0101',
        role: {
          id: 'owner',
          name: 'Owner/CEO',
          description: 'Full access to all system features',
          level: 5,
          defaultPermissions: [],
          isCustom: false
        },
        status: 'active',
      permissions: [],
      createdAt: new Date(2024, 0, 15),
      lastLogin: new Date(2025, 7, 12, 8, 30),
      createdBy: 'system',
      department: 'Executive'
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@lender.com',
      phone: '+1-555-0102',
      role: {
        id: 'manager',
        name: 'Lending Manager',
        description: 'Manage loans and oversee lending operations',
        level: 4,
        defaultPermissions: [],
        isCustom: false
      },
      status: 'active',
      permissions: [],
      createdAt: new Date(2024, 1, 20),
      lastLogin: new Date(2025, 7, 12, 9, 15),
      createdBy: 'john.smith@lender.com',
      department: 'Lending'
    },
    {
      id: '3',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@lender.com',
      phone: '+1-555-0103',
      role: {
        id: 'analyst',
        name: 'Risk Analyst',
        description: 'Analyze borrower risk and generate reports',
        level: 3,
        defaultPermissions: [],
        isCustom: false
      },
      status: 'active',
      permissions: [],
      createdAt: new Date(2024, 2, 10),
      lastLogin: new Date(2025, 7, 11, 16, 45),
      createdBy: 'sarah.johnson@lender.com',
      department: 'Risk Management'
    },
    {
      id: '4',
      firstName: 'Lisa',
      lastName: 'Rodriguez',
      email: 'lisa.rodriguez@lender.com',
      phone: '+1-555-0104',
      role: {
        id: 'officer',
        name: 'Loan Officer',
        description: 'Process loan applications and manage borrower relationships',
        level: 2,
        defaultPermissions: [],
        isCustom: false
      },
      status: 'pending',
      permissions: [],
      createdAt: new Date(2025, 7, 8),
      lastLogin: new Date(2025, 7, 8, 10, 0),
      createdBy: 'sarah.johnson@lender.com',
      department: 'Operations'
    }
    ]);
    
    setRoles([
      {
        id: 'owner',
        name: 'Owner/CEO',
        description: 'Full system access with all administrative privileges',
        level: 5,
        defaultPermissions: [],
        isCustom: false
      },
      {
        id: 'manager',
        name: 'Lending Manager',
        description: 'Manage lending operations and oversee loan processes',
        level: 4,
        defaultPermissions: [],
        isCustom: false
      },
      {
        id: 'analyst',
        name: 'Risk Analyst',
        description: 'Analyze borrower risk and generate detailed reports',
        level: 3,
        defaultPermissions: [],
        isCustom: false
      },
      {
        id: 'officer',
        name: 'Loan Officer',
        description: 'Process applications and manage borrower relationships',
        level: 2,
        defaultPermissions: [],
        isCustom: false
      }
    ]);
    
    setTeamStats({
      totalMembers: 4,
      activeMembers: 3,
      pendingMembers: 1,
      roles: [
        { id: 'owner', name: 'Owner/CEO', count: 1 },
        { id: 'manager', name: 'Lending Manager', count: 1 },
        { id: 'analyst', name: 'Risk Analyst', count: 1 },
        { id: 'officer', name: 'Loan Officer', count: 1 }
      ],
      departments: [
        { name: 'Executive', count: 1 },
        { name: 'Lending', count: 1 },
        { name: 'Risk Management', count: 1 },
        { name: 'Operations', count: 1 }
      ],
      recentActivity: []
    });
  };

  // ...existing code...

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<LenderUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    level: 2,
    selectedPermissions: [] as string[]
  });

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleId: '',
    department: '',
    customPermissions: [] as string[]
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
                         user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role.id === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'owner': return <FaUserShield className="h-4 w-4 text-purple-600" />;
      case 'manager': return <FaUserTie className="h-4 w-4 text-blue-600" />;
      case 'analyst': return <FaUserCheck className="h-4 w-4 text-green-600" />;
      case 'officer': return <FaUsers className="h-4 w-4 text-orange-600" />;
      case 'assistant': return <FaUsers className="h-4 w-4 text-gray-600" />;
      case 'crm_specialist': return <FaEnvelope className="h-4 w-4 text-pink-600" />;
      default: return <FaCog className="h-4 w-4 text-gray-600" />; // Custom roles get gear icon
    }
  };

  const getRolePermissions = (roleId: string): LenderPermission[] => {
    // Check if it's a custom role first
    const customRole = roles.find(r => r.id === roleId && r.isCustom);
    if (customRole) {
      return customRole.defaultPermissions;
    }

    // Default system roles
    const rolePermissionMap: { [key: string]: string[] } = {
      owner: permissions.map(p => p.id), // All permissions
      manager: [
        'view_loans', 'create_loans', 'approve_loans', 'modify_loans', 'disburse_funds', 'delete_loans',
        'view_borrowers', 'edit_borrowers', 'credit_assessment', 'borrower_communication', 'borrower_documents',
        'view_analytics', 'generate_reports', 'portfolio_analytics',
        'view_transactions', 'process_payments',
        'view_compliance', 'manage_compliance',
        'view_settings', 'manage_users'
      ],
      analyst: [
        'view_loans', 'view_borrowers', 'credit_assessment',
        'view_analytics', 'generate_reports', 'portfolio_analytics',
        'view_transactions', 'view_compliance'
      ],
      officer: [
        'view_loans', 'create_loans', 'modify_loans',
        'view_borrowers', 'edit_borrowers', 'borrower_communication', 'borrower_documents',
        'view_analytics', 'generate_reports',
        'view_transactions'
      ],
      assistant: [
        'view_loans', 'view_borrowers', 'view_analytics', 'view_transactions'
      ],
      crm_specialist: [
        'view_loans', 'view_borrowers', 'borrower_communication'
      ]
    };

    const permissionIds = rolePermissionMap[roleId] || [];
    return permissions.filter(p => permissionIds.includes(p.id));
  };

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.roleId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const lenderId = localStorage.getItem('lenderId') || 'default-lender-id';
      
      const userData = {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        roleId: newUser.roleId,
        department: newUser.department
      };
      
      try {
        const response = await lendingApi.addTeamMember(lenderId, userData);
        
        // Add the newly created user to the list
        setUsers(prev => [...prev, response]);
      } catch (apiError) {
        console.error('API call failed, using mock data:', apiError);
        
        // Fallback for demo - create user with mock data
        const selectedRole = roles.find(r => r.id === newUser.roleId);
        if (!selectedRole) return;
    
        const user: LenderUser = {
          id: Date.now().toString(),
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
          role: selectedRole,
          status: 'pending',
          permissions: getRolePermissions(newUser.roleId),
          createdAt: new Date(),
          lastLogin: new Date(),
          createdBy: 'current-user@lender.com',
          department: newUser.department
        };
    
        setUsers(prev => [...prev, user]);
      }
      
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        roleId: '',
        department: '',
        customPermissions: []
      });
      setShowAddUser(false);
    } catch (error) {
      console.error('Failed to add user:', error);
      setError('Failed to add team member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        setSaving(true);
        const lenderId = localStorage.getItem('lenderId') || 'default-lender-id';
        
        try {
          await lendingApi.removeTeamMember(lenderId, userId);
          setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (apiError) {
          console.error('API call failed, removing from local state:', apiError);
          // Still remove from UI for demo purposes
          setUsers(prev => prev.filter(u => u.id !== userId));
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
        setError('Failed to remove team member. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      setSaving(true);
      const lenderId = localStorage.getItem('lenderId') || 'default-lender-id';
      
      try {
        await lendingApi.updateTeamMember(lenderId, userId, {
          status: newStatus
        });
        
        setUsers(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, status: newStatus } : user
          )
        );
      } catch (apiError) {
        console.error('API call failed, updating local state:', apiError);
        // Still update UI for demo purposes
        setUsers(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, status: newStatus } : user
          )
        );
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
      setError('Failed to update user status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) return;
    
    const lenderId = localStorage.getItem('lenderId') || 'default-lender-id';
    setSaving(true);

    try {
      switch (action) {
        case 'activate':
          // In a real implementation, we'd use a batch API endpoint
          // For now, we'll just loop through each user
          for (const userId of selectedUsers) {
            try {
              await lendingApi.updateTeamMember(lenderId, userId, { status: 'active' });
            } catch (apiError) {
              console.error(`Failed to activate user ${userId}:`, apiError);
              // Continue with other users
            }
          }
          
          setUsers(prev => 
            prev.map(user => 
              selectedUsers.includes(user.id) ? { ...user, status: 'active' as const } : user
            )
          );
          break;
          
        case 'deactivate':
          for (const userId of selectedUsers) {
            try {
              await lendingApi.updateTeamMember(lenderId, userId, { status: 'inactive' });
            } catch (apiError) {
              console.error(`Failed to deactivate user ${userId}:`, apiError);
              // Continue with other users
            }
          }
          
          setUsers(prev => 
            prev.map(user => 
              selectedUsers.includes(user.id) ? { ...user, status: 'inactive' as const } : user
          )
        );
        break;
        
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} selected users?`)) {
          for (const userId of selectedUsers) {
            try {
              await lendingApi.removeTeamMember(lenderId, userId);
            } catch (apiError) {
              console.error(`Failed to delete user ${userId}:`, apiError);
              // Continue with other users
            }
          }
          setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
        }
        break;
    }
    setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      setError(`Failed to ${action} users. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const lenderId = localStorage.getItem('lenderId') || 'default-lender-id';
      
      const roleData = {
        name: newRole.name,
        description: newRole.description,
        level: newRole.level,
        defaultPermissions: newRole.selectedPermissions,
        isCustom: true
      };
      
      try {
        const createdRole = await lendingApi.createLenderRole(lenderId, roleData);
        setRoles(prev => [...prev, createdRole]);
      } catch (apiError) {
        console.error('API call failed, using local data:', apiError);
        // Still update UI for demo purposes
        const role: LenderRole = {
          id: `custom_${Date.now()}`,
          name: newRole.name,
          description: newRole.description,
          level: newRole.level,
          defaultPermissions: permissions.filter(p => newRole.selectedPermissions.includes(p.id)),
          isCustom: true
        };
        
        setRoles(prev => [...prev, role]);
      }
      
      setNewRole({
        name: '',
        description: '',
        level: 2,
        selectedPermissions: []
      });
      setShowCreateRole(false);
    } catch (error) {
      console.error('Failed to create role:', error);
      setError('Failed to create role. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role?.isCustom) {
      alert('Cannot delete system roles');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        setSaving(true);
        const lenderId = localStorage.getItem('lenderId') || 'default-lender-id';
        
        // Note: Backend API for deleting roles not yet implemented in our codebase
        // This would be implemented as:
        // await api.delete(`/api/admin/lenders/${lenderId}/roles/${roleId}`);
        
        setRoles(prev => prev.filter(r => r.id !== roleId));
        
        // Update users with this role to a default role
        const defaultRole = roles.find(r => r.id === 'user') || roles[0];
        
        setUsers(prev => 
          prev.map(user => 
            user.role.id === roleId ? { ...user, role: defaultRole } : user
          )
        );
      } catch (error) {
        console.error('Failed to delete role:', error);
        setError('Failed to delete role. Please try again.');
      } finally {
        setSaving(false);
      }
      setUsers(prev => 
        prev.map(user => 
          user.role.id === roleId 
            ? { ...user, role: roles.find(r => r.id === 'assistant') || roles[0] }
            : user
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUsers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage your lending team members and their access permissions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{users.length}</span> total members
              </div>
              <button
                onClick={() => setShowCreateRole(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaCog className="h-4 w-4" />
                Create Role
              </button>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaUserPlus className="h-4 w-4" />
                Add Team Member
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaUserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active Members</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaCog className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending Approval</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaUserShield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{roles.length}</div>
                <div className="text-sm text-gray-600">Available Roles</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaShieldAlt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{permissions.length}</div>
                <div className="text-sm text-gray-600">Permissions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>

              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <FaDownload className="h-4 w-4" />
                Export
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <FaCheck className="h-3 w-3" />
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                >
                  <FaBan className="h-3 w-3" />
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  <FaTrash className="h-3 w-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Roles Management Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Role Management</h2>
            <span className="text-sm text-gray-600">{roles.length} roles available</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(role.id)}
                    <h3 className="font-medium text-gray-900">{role.name}</h3>
                  </div>
                  {role.isCustom && (
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete custom role"
                    >
                      <FaTrash className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Level {role.level} • {getRolePermissions(role.id).length} permissions
                  </div>
                  {role.isCustom && (
                    <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Custom
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Member</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Role & Permissions</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Department</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Last Login</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(user.role.id)}
                        <div>
                          <div className="font-medium text-gray-900">{user.role.name}</div>
                          <button
                            onClick={() => setShowPermissions(showPermissions === user.id ? null : user.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {getRolePermissions(user.role.id).length} permissions
                          </button>
                        </div>
                      </div>
                      {showPermissions === user.id && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 gap-1 text-xs">
                            {getRolePermissions(user.role.id).map(permission => (
                              <div key={permission.id} className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  permission.level === 'admin' ? 'bg-red-500' :
                                  permission.level === 'write' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}></span>
                                <span>{permission.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900">{user.department}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(user.status)}`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">
                        {user.lastLogin.toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit user"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(user.id, 'inactive')}
                            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Deactivate user"
                          >
                            <FaEyeSlash className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user.id, 'active')}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Activate user"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete user"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <FaUsers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search or filters.' : 'Get started by adding your first team member.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddUser(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Team Member
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Team Member</h3>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    required
                    value={newUser.roleId}
                    onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  {newUser.roleId && (
                    <p className="text-sm text-gray-600 mt-1">
                      {roles.find(r => r.id === newUser.roleId)?.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select department</option>
                    <option value="Executive">Executive</option>
                    <option value="Lending">Lending</option>
                    <option value="Risk Management">Risk Management</option>
                    <option value="Operations">Operations</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Finance">Finance</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Team Member</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setSaving(true);
                  const lenderId = localStorage.getItem('lenderId') || 'default-lender-id';
                  
                  const userData = {
                    firstName: editingUser.firstName,
                    lastName: editingUser.lastName,
                    email: editingUser.email,
                    phone: editingUser.phone,
                    roleId: editingUser.role.id,
                    department: editingUser.department,
                    status: editingUser.status
                  };
                  
                  try {
                    await lendingApi.updateTeamMember(lenderId, editingUser.id, userData);
                    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
                  } catch (apiError) {
                    console.error('API call failed, updating local state:', apiError);
                    // Still update UI for demo purposes
                    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
                  }
                  
                  setEditingUser(null);
                } catch (error) {
                  console.error('Failed to update user:', error);
                  setError('Failed to update team member. Please try again.');
                } finally {
                  setSaving(false);
                }
              }}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={editingUser.firstName}
                      onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editingUser.lastName}
                      onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.role.id}
                    onChange={(e) => {
                      const selectedRole = roles.find(r => r.id === e.target.value);
                      if (selectedRole) {
                        setEditingUser({ ...editingUser, role: selectedRole });
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'active' | 'inactive' | 'pending' | 'suspended' })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select department</option>
                    <option value="Executive">Executive</option>
                    <option value="Lending">Lending</option>
                    <option value="Risk Management">Risk Management</option>
                    <option value="Operations">Operations</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Finance">Finance</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Role Modal */}
        {showCreateRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Custom Role</h3>
              <form onSubmit={handleCreateRole}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., CRM Specialist"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Brief description of this role's responsibilities"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                  <select
                    value={newRole.level}
                    onChange={(e) => setNewRole({ ...newRole, level: parseInt(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>Level 1 - Assistant Level</option>
                    <option value={2}>Level 2 - Officer Level</option>
                    <option value={3}>Level 3 - Analyst Level</option>
                    <option value={4}>Level 4 - Manager Level</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Permissions</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {Object.entries(
                      permissions.reduce((acc, permission) => {
                        if (!acc[permission.category]) acc[permission.category] = [];
                        acc[permission.category].push(permission);
                        return acc;
                      }, {} as Record<string, typeof permissions>)
                    ).map(([category, categoryPermissions]) => (
                      <div key={category} className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2 capitalize">{category}</h4>
                        {categoryPermissions.map(permission => (
                          <label key={permission.id} className="flex items-start gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={newRole.selectedPermissions.includes(permission.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewRole({
                                    ...newRole,
                                    selectedPermissions: [...newRole.selectedPermissions, permission.id]
                                  });
                                } else {
                                  setNewRole({
                                    ...newRole,
                                    selectedPermissions: newRole.selectedPermissions.filter(id => id !== permission.id)
                                  });
                                }
                              }}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                              <div className="text-xs text-gray-500">{permission.description}</div>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                                permission.level === 'read' ? 'bg-green-100 text-green-800' :
                                permission.level === 'write' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {permission.level}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateRole(false);
                      setNewRole({ name: '', description: '', level: 2, selectedPermissions: [] });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={newRole.selectedPermissions.length === 0}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Create Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LenderTeamManagementPage;
