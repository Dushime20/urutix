import React from 'react';
import { useAdminLayout } from '../../contexts/AdminLayoutContext';

interface AdminPageWrapperProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const AdminPageWrapper: React.FC<AdminPageWrapperProps> = ({ 
  title, 
  subtitle, 
  actions, 
  children,
  className = ''
}) => {
  const { isCompactMode } = useAdminLayout();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 dark:text-slate-300 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {actions}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className={`${isCompactMode ? 'space-y-4' : 'space-y-6'}`}>
        {children}
      </div>
    </div>
  );
};

export default AdminPageWrapper;
