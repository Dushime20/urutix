import React from 'react';
import { cn } from '../../utils/cn';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

/**
 * Shared page shell whose X-axis matches DashboardHeader.
 * Outer gutter + inner max-w-7xl padding are the header's exact classes.
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  innerClassName,
}) => {
  return (
    <div className={cn('ui-page-gutter', className)}>
      <div className={cn('ui-page-container', innerClassName)}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
