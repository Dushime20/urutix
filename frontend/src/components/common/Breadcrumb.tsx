import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-generate breadcrumbs from path if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const pathParts = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', path: pathParts[0] === 'cargo-owner' ? '/cargo-owner' : '/dashboard' }
    ];

    // Map path segments to readable labels
    const labelMap: { [key: string]: string } = {
      'cargo-owner': 'Dashboard',
      'dashboard': 'Dashboard',
      'cargos': 'Cargo Management',
      'list': 'All Cargos',
      'create': 'Create Cargo',
      'active': 'Active Shipments',
      'bidding': 'Bidding',
      'my-bids': 'My Bids',
      'analytics': 'Analytics',
      'reports': 'Reports',
      'history': 'History',
      'tracking': 'Tracking',
      'routes': 'Routes',
      'payments': 'Payments',
      'loan-requests': 'Loan Requests',
      'documents': 'Documents',
      'notifications': 'Notifications',
      'settings': 'Settings',
      'profile': 'Profile',
    };

    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      const label = labelMap[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      
      // Don't add duplicate dashboard
      if (index === 0 && (part === 'cargo-owner' || part === 'dashboard')) {
        return;
      }

      // Only add if it's not the last item (current page)
      if (index < pathParts.length - 1) {
        breadcrumbs.push({ label, path: currentPath });
      } else {
        breadcrumbs.push({ label });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm overflow-x-auto scrollbar-hide ${className || 'text-gray-600'}`}>
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {index === 0 ? (
            <button
              onClick={() => item.path && navigate(item.path)}
              className="flex items-center gap-1 hover:text-blue-600 hover:text-opacity-80 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          ) : (
            <>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50 flex-shrink-0" />
              {item.path ? (
                <button
                  onClick={() => navigate(item.path!)}
                  className="hover:text-blue-600 hover:text-opacity-80 transition-colors whitespace-nowrap touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {item.label}
                </button>
              ) : (
                <span className="font-medium whitespace-nowrap opacity-100">{item.label}</span>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;

