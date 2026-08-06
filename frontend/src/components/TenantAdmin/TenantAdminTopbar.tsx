import React from 'react';
import { FaBell, FaSearch, FaUser, FaBuilding, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminLayout } from '../../contexts/AdminLayoutContext';

const TenantAdminTopbar: React.FC = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useAdminLayout();

  const tenantName =
    user?.tenantName && user.tenantName !== user?.tenantId ? user.tenantName : 'Default Tenant';

  return (
    <header className="sticky top-0 z-[200] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 h-14">
      <div className="max-w-[1536px] mx-auto h-full flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/30">
              <FaBuilding className="text-primary-600 dark:text-primary-400 text-sm flex-shrink-0" />
            </div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              Tenant Administration
            </h1>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search operations, drivers, vehicles..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 dark:bg-primary-950/30 rounded-lg border border-primary-100 dark:border-primary-900/40">
            <FaBuilding className="text-primary-600 text-xs flex-shrink-0" />
            <span className="text-xs font-medium text-primary-800 dark:text-primary-300 truncate max-w-28">
              {tenantName}
            </span>
          </div>

          <button className="relative p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <FaBell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-100 dark:border-slate-800">
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUser className="text-white text-xs" />
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-slate-400">Tenant Admin</p>
            </div>
            <FaChevronDown className="text-slate-400 text-xs flex-shrink-0 hidden sm:block" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TenantAdminTopbar;
