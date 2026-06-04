import React from 'react';
import { FaUser, FaBuilding, FaEnvelope, FaPhone } from 'react-icons/fa';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { useAuth } from '../../contexts/AuthContext';

const OperationalAdminProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <AdminPageLayout
      title="My Profile"
      description="Manage your operational admin account details"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-xl">
          <div className="h-32 bg-primary-600"></div>
          <div className="px-8 pb-8 relative">
            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-3xl font-bold text-primary-500 absolute -top-12">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="pt-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-primary-600 dark:text-primary-400 font-semibold mt-1">
                Operational Admin
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                  <FaEnvelope size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                  <FaPhone size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Phone Number</p>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl md:col-span-2">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                  <FaBuilding size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tenant Organization</p>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold">{user?.tenantName || 'N/A'} (ID: {user?.tenantId})</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-end">
              <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default OperationalAdminProfile;
