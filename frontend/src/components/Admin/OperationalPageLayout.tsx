import React, { type ReactNode } from 'react';

interface OperationalPageLayoutProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * Lightweight page layout for /admin-operational/* pages.
 * No sidebar or extra header — the route wrapper (AdminOperationalLayout)
 * already provides the top nav. This just adds a page title bar + content area.
 */
const OperationalPageLayout: React.FC<OperationalPageLayoutProps> = ({
  title,
  description,
  children,
  actions,
}) => {
  return (
    <div>
      {/* Page title bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="ui-page-title text-slate-800 dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="ui-body-small mt-0.5">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">{actions}</div>
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
};

export default OperationalPageLayout;
