import React, { useState, useEffect } from 'react';
import { FaHistory, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import type { TenantActivity } from '../../services/tenantApi';
import ModernLoader from '../../components/common/ModernLoader';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const OperationalAdminActivityLogs: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<TenantActivity[]>([]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchActivities(user.tenantId);
    } else {
      setLoading(false);
    }
  }, [user?.tenantId]);

  const fetchActivities = async (_tenantId: string) => {
    try {
      setLoading(true);
      // Use the dedicated /admin/activity-logs endpoint (accessible to ADMIN + TENANT_ADMIN)
      // Backend scopes results to the authenticated user's tenant automatically
      const res = await operationalAdminApi.getActivityLogs({ limit: 100 });
      const raw: any[] = Array.isArray(res)
        ? res
        : res?.logs ?? res?.data ?? res?.activities ?? res?.items ?? [];
      setActivities(raw);
    } catch (error) {
      toast.error('Failed to load activity logs');
      console.error(error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <FaCheckCircle className="text-green-500" />;
      case 'warning': return <FaExclamationTriangle className="text-yellow-500" />;
      case 'error': return <FaTimesCircle className="text-red-500" />;
      default: return <FaInfoCircle className="text-blue-500" />;
    }
  };

  return (
    <OperationalPageLayout
      title="Activity Logs"
      description="Track operational events, actions, and system updates"
    >
      {loading ? (
        <ModernLoader isLoading={true} type="page" />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaHistory className="text-primary-500" /> Recent Operations Log
            </h3>
            <span className="text-sm font-semibold text-gray-500 bg-gray-50 dark:bg-slate-800 px-3 py-1 rounded-full">
              Showing last {activities.length} entries
            </span>
          </div>

          <div className="p-6">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <FaHistory size={48} className="mx-auto text-gray-300 dark:text-slate-700 mb-4" />
                <p className="text-gray-500 font-medium">No recent activity recorded.</p>
              </div>
            ) : (
              <div className="relative border-l border-gray-200 dark:border-slate-800 ml-4 space-y-8">
                {activities.map((activity) => (
                  <div key={activity.id} className="relative pl-8">
                    <span className="absolute -left-3 top-1 bg-white dark:bg-slate-900 p-1">
                      {getStatusIcon(activity.status)}
                    </span>
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          {activity.type} • {activity.action}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          {activity.timestamp}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200 mt-2">
                        {activity.description}
                      </p>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-3 text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500">
                          {JSON.stringify(activity.metadata)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </OperationalPageLayout>
  );
};

export default OperationalAdminActivityLogs;
