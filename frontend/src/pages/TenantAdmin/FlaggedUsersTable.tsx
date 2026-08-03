import React, { useState, useEffect, useMemo } from 'react';
import {
  FaEye,
  FaBan,
  FaFlag,
  FaCheckCircle,
} from 'react-icons/fa';
import axios from 'axios';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';

interface RiskFlag {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskType: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  riskScore: number;
  createdAt: string;
}

const severityVariant = (severity: string) => {
  switch (severity) {
    case 'critical': return 'error' as const;
    case 'high': return 'orange' as const;
    case 'medium': return 'warning' as const;
    case 'low': return 'success' as const;
    default: return 'neutral' as const;
  }
};

const FlaggedUsersTable: React.FC = () => {
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => {
    fetchFlaggedUsers();
  }, [severityFilter, statusFilter]);

  const fetchFlaggedUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      await axios.get(
        `${import.meta.env.VITE_API_URL}/governance/risk-flags?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const mockFlags: RiskFlag[] = [
        {
          id: '1',
          userId: 'user-1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          reason: 'Multiple failed payment attempts detected',
          severity: 'high',
          riskType: 'payment_fraud',
          status: 'pending',
          riskScore: 85,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user-2',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          reason: 'Suspicious activity pattern detected',
          severity: 'medium',
          riskType: 'suspicious_activity',
          status: 'pending',
          riskScore: 65,
          createdAt: new Date().toISOString(),
        },
      ];

      setFlags(mockFlags);
    } catch (err: any) {
      console.error('Error fetching flagged users:', err);
      setError(err.response?.data?.message || 'Failed to load flagged users');
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<RiskFlag>[] = useMemo(() => [
    {
      key: 'userName',
      label: 'User',
      alwaysVisible: true,
      render: (_v, flag) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{flag.userName}</div>
          <div className="text-sm text-gray-500">{flag.userEmail}</div>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (v) => <div className="text-sm text-gray-900 max-w-xs truncate">{v}</div>,
    },
    {
      key: 'riskType',
      label: 'Risk Type',
      render: (v) => (
        <span className="px-2 py-1 text-xs font-medium border rounded-full bg-gray-50 text-gray-700 border-gray-200">
          {v}
        </span>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (_v, flag) => (
        <StatusBadge variant={severityVariant(flag.severity)} label={flag.severity.toUpperCase()} />
      ),
    },
    {
      key: 'riskScore',
      label: 'Risk Score',
      sortable: true,
      render: (_v, flag) => (
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-gray-900">{flag.riskScore}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, flag) => (
        <StatusBadge status={flag.status} label={flag.status} />
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (_v, flag) => (
        <span className="text-xs text-gray-500">
          {new Date(flag.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ], []);

  const rowActions: TableAction<RiskFlag>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <FaEye className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
    {
      key: 'review',
      label: 'Review Flag',
      icon: <FaCheckCircle className="w-3.5 h-3.5" />,
      variant: 'success',
      hidden: (flag) => flag.status !== 'pending',
      onClick: () => {},
    },
    {
      key: 'suspend',
      label: 'Suspend User',
      icon: <FaBan className="w-3.5 h-3.5" />,
      variant: 'danger',
      hidden: (flag) => flag.status !== 'pending',
      onClick: () => {},
    },
  ], []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <StandardDataTable
      title="Flagged Users"
      subtitle="Users with risk flags"
      icon={<FaFlag className="w-5 h-5" />}
      columns={columns}
      data={flags}
      loading={loading}
      getRowId={(row) => row.id}
      searchPlaceholder="Search flagged users..."
      searchKeys={['userName', 'userEmail', 'reason', 'riskType', 'status']}
      toolbarExtra={
        <div className="flex gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      }
      rowActions={rowActions}
      onRefresh={fetchFlaggedUsers}
      emptyMessage="No flagged users found"
      ariaLabel="Flagged users"
    />
  );
};

export default FlaggedUsersTable;
