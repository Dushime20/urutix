import React, { useMemo } from 'react';
import {
  Truck,
  FileText,
  Calendar,
  Wrench,
  Gauge,
  History,
  ShieldAlert,
  Fuel,
  Weight,
  Hash,
  MapPin,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { TranslatedText } from '../translated-text';
import { driverApi } from '../../services/driverApi';
import { MaintenanceTicketModal } from './MaintenanceTicketModal';
import { MissionLogs } from './MissionLogs';
import { StatCard } from '../EnliteUI/Cards/StatCard';
import { StatusBadge } from '../EnliteUI/Tables';
import { TruckFullProfile } from '../FleetDashboard/TruckFullProfile';

interface MyTruckProps {
  driverId: string;
  truckData?: any;
}

function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function expiryMeta(value?: string | Date | null): {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'neutral';
} {
  if (!value) return { label: 'Not on file', variant: 'neutral' };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { label: 'Unknown', variant: 'neutral' };
  const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: 'Expired', variant: 'error' };
  if (days <= 30) return { label: 'Expiring soon', variant: 'warning' };
  return { label: 'Valid', variant: 'success' };
}

export const MyTruck: React.FC<MyTruckProps> = ({ driverId, truckData }) => {
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = React.useState(false);

  const { data: driverProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => driverApi.getDriverProfile(driverId),
    enabled: !!driverId && !truckData,
  });

  const assignedTruckId = truckData?.id || driverProfile?.currentTruckId;

  const { data: fetchedTruck, isLoading: truckLoading } = useQuery({
    queryKey: ['assigned-truck', assignedTruckId],
    queryFn: () => driverApi.getAssignedTruck(assignedTruckId!),
    enabled: !!assignedTruckId && !truckData,
  });

  const truck = truckData || fetchedTruck;

  const { data: maintenanceData } = useQuery({
    queryKey: ['truck-maintenance', truck?.id],
    queryFn: () => driverApi.getMaintenanceHistory(truck!.id),
    enabled: !!truck?.id,
  });

  const isLoading = !truckData && (profileLoading || (!!assignedTruckId && truckLoading));
  const serviceHistory = maintenanceData?.logs || [];

  const complianceDocs = useMemo(() => {
    if (!truck) return [];
    return [
      { id: 'registration', label: 'Registration', expiry: truck.registrationExpiry },
      { id: 'insurance', label: 'Insurance', expiry: truck.insuranceExpiry },
      { id: 'roadworthy', label: 'Roadworthy certificate', expiry: truck.roadworthyCertExpiry },
    ];
  }, [truck]);

  const equipment = useMemo(() => {
    if (!truck) return [];
    return [
      truck.hasGps && 'GPS',
      truck.hasRefrigeration && 'Refrigeration',
      truck.hasLiftGate && 'Lift gate',
      truck.hasHazmatPermit && 'Hazmat',
    ].filter(Boolean) as string[];
  }, [truck]);

  return (
    <div className="animate-in fade-in duration-500 w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/50 p-4 sm:p-6 lg:p-8 rounded-[3rem] space-y-6">
      <div className="px-2 sm:px-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
          <TranslatedText text="My Truck" />
        </h1>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {truck ? (
            <>
              {truck.plateNumber || '—'}
              <span className="mx-2">•</span>
              {[truck.make, truck.model].filter(Boolean).join(' ') || <TranslatedText text="Assigned unit" />}
            </>
          ) : (
            <TranslatedText text="Vehicle assignment and mission history" />
          )}
        </p>
      </div>

      {isLoading && (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
            <Truck size={32} className="text-slate-200 dark:text-slate-700" />
          </div>
          <div className="h-4 w-36 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse mb-2" />
          <div className="h-3 w-52 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
      )}

      {!truck && !isLoading && (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-10 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4">
            <Truck size={32} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            <TranslatedText text="No truck assigned" />
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            <TranslatedText text="You have not been assigned a truck yet. Contact your fleet manager. Past assignments still appear in Mission Logs below." />
          </p>
        </div>
      )}

      {truck && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-[#2b5271] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#2b5271]/20">
                <Truck size={36} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <StatusBadge
                    status={truck.status}
                    label={<TranslatedText text={(truck.status || 'Active').replace(/_/g, ' ')} />}
                  />
                  {truck.truckType && (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-700">
                      {String(truck.truckType).replace('_', ' ')}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {[truck.make, truck.model].filter(Boolean).join(' ') || 'Assigned vehicle'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-[#2b5271] dark:text-blue-300">{truck.plateNumber}</span>
                  {truck.year && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>{truck.year}</span>
                    </>
                  )}
                  {truck.vin && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1">
                        <Hash size={10} />
                        {truck.vin.slice(-8)}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title={<TranslatedText text="Payload" />}
              value={truck.capacityWeight ? `${Number(truck.capacityWeight).toLocaleString()} kg` : '—'}
              icon={<Weight size={20} />}
              variant="classic"
              color="primary"
            />
            <StatCard
              title={<TranslatedText text="Fuel" />}
              value={truck.fuelType || '—'}
              icon={<Fuel size={20} />}
              variant="classic"
              color="success"
            />
            <StatCard
              title={<TranslatedText text="Mileage" />}
              value={truck.mileage != null ? `${Number(truck.mileage).toLocaleString()} km` : '—'}
              icon={<Gauge size={20} />}
              variant="classic"
              color="info"
            />
            <StatCard
              title={<TranslatedText text="Next service" />}
              value={formatDate(truck.nextMaintenanceDate)}
              icon={<Calendar size={20} />}
              variant="classic"
              color="warning"
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">
              <TranslatedText text="Complete vehicle information" />
            </p>
            <TruckFullProfile truck={truck} compact />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
            <div className="xl:col-span-4 space-y-4 sm:space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">
                  <TranslatedText text="Vehicle status" />
                </p>
                <dl className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs font-bold text-slate-500">
                      <TranslatedText text="Last service" />
                    </dt>
                    <dd className="text-sm font-black text-slate-900 dark:text-white">
                      {formatDate(truck.lastMaintenanceDate)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs font-bold text-slate-500">
                      <TranslatedText text="Next service" />
                    </dt>
                    <dd className="text-sm font-black text-slate-900 dark:text-white">
                      {formatDate(truck.nextMaintenanceDate)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs font-bold text-slate-500">
                      <TranslatedText text="Odometer" />
                    </dt>
                    <dd className="text-sm font-black text-slate-900 dark:text-white">
                      {truck.mileage != null ? `${Number(truck.mileage).toLocaleString()} km` : '—'}
                    </dd>
                  </div>
                </dl>
                {equipment.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      <TranslatedText text="Equipment" />
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {equipment.map((item) => (
                        <span
                          key={item}
                          className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
                        >
                          <TranslatedText text={item} />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                      <TranslatedText text="Fault reporting" />
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <TranslatedText text="Fleet priority" />
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-5">
                  <TranslatedText text="Report unusual noise, warning lights, or damage so maintenance can inspect the unit." />
                </p>
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className="w-full py-3 bg-[#2b5271] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Wrench size={16} />
                  <TranslatedText text="Open maintenance ticket" />
                </button>
              </div>
            </div>

            <div className="xl:col-span-8 space-y-4 sm:space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[#2b5271]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <TranslatedText text="Verification" />
                    </p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      <TranslatedText text="Compliance & permits" />
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {complianceDocs.map((doc) => {
                    const meta = expiryMeta(doc.expiry);
                    return (
                      <div
                        key={doc.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-[#2b5271]">
                            <FileText size={16} />
                          </div>
                          <StatusBadge label={<TranslatedText text={meta.label} />} variant={meta.variant} />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight mb-1">
                          <TranslatedText text={doc.label} />
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={11} />
                          <TranslatedText text="Expires" /> {formatDate(doc.expiry)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                    <History size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <TranslatedText text="Worklogs" />
                    </p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      <TranslatedText text="Service history" />
                    </h3>
                  </div>
                </div>

                {serviceHistory.length > 0 ? (
                  <ul className="space-y-3">
                    {serviceHistory.slice(0, 6).map((service: any) => (
                      <li
                        key={service.id}
                        className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700"
                      >
                        <div className="w-2 h-2 rounded-full bg-[#2b5271] mt-2 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="text-[10px] font-black text-[#2b5271] uppercase tracking-widest">
                              {service.serviceDate?.split('T')[0] || formatDate(service.createdAt)}
                            </p>
                            {service.status && (
                              <StatusBadge
                                status={service.status}
                                label={String(service.status).replace(/_/g, ' ')}
                              />
                            )}
                          </div>
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                            {service.taskName || service.type}
                          </p>
                          {(service.providerName || service.shop) && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                              <MapPin size={10} />
                              {service.providerName || service.shop}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400">
                      <TranslatedText text="No service history available." />
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <MissionLogs driverId={driverId} />

      {truck && (
        <MaintenanceTicketModal
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
          truckId={truck?.id}
          truckPlate={truck?.plateNumber}
        />
      )}
    </div>
  );
};
