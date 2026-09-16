import { CircleDollarSign, ClipboardList } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';
import {
  parkingFeesAreSystemLevel,
  parkingWorkspaceHref,
  parkingWorkspaceTab,
  type ParkingWorkspaceTab,
} from '../../utils/parkingPaths';
import CurrencySelector from '../common/CurrencySelector';
import { TranslatedText } from '../translated-text';
import ParkingFeeSettings from '../../pages/parking/ParkingFeeSettings';
import ParkingReservationsDashboard from '../../pages/parking/ParkingReservationsDashboard';
import ParkingSystemFeesSettings from './ParkingSystemFeesSettings';

interface ParkingManagementWorkspaceProps {
  basePath: string;
  title?: string;
  description?: string;
}

const ParkingManagementWorkspace = ({
  basePath,
  title,
  description,
}: ParkingManagementWorkspaceProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { can } = usePermission();
  const canManageFees = can('parking:manage_fees');
  const systemFees = parkingFeesAreSystemLevel(user?.role);
  const activeTab: ParkingWorkspaceTab =
    canManageFees && parkingWorkspaceTab(location.search) === 'fees' ? 'fees' : 'queue';

  const goToTab = (tab: ParkingWorkspaceTab) => {
    navigate(parkingWorkspaceHref(basePath, tab));
  };

  const tabs = [
    {
      id: 'queue' as const,
      label: 'Reservation queue',
      icon: ClipboardList,
    },
    ...(canManageFees
      ? [
          {
            id: 'fees' as const,
            label: systemFees ? 'System fees' : 'Pricing & fees',
            icon: CircleDollarSign,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {(title || description) && (
        <div>
          {title && (
            <h1 className="ui-page-title">
              <TranslatedText text={title} />
            </h1>
          )}
          {description && (
            <p className="ui-body-small mt-1">
              <TranslatedText text={description} />
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
        <div role="tablist" aria-label="Parking management" className="flex items-stretch gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => goToTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${
                  active
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <TranslatedText text={tab.label} />
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                )}
              </button>
            );
          })}
        </div>
        <div className="pb-2 sm:pb-0">
          <CurrencySelector variant="full" />
        </div>
      </div>

      {activeTab === 'fees' ? (
        systemFees ? <ParkingSystemFeesSettings /> : <ParkingFeeSettings embedded />
      ) : (
        <ParkingReservationsDashboard basePath={basePath} embedded />
      )}
    </div>
  );
};

export default ParkingManagementWorkspace;
