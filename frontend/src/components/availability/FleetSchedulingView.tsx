import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, User, RefreshCw, Download } from 'lucide-react';
import { SchedulingCalendar, type ScheduleEntry } from './SchedulingCalendar';
import { UtilizationSummary } from './UtilizationSummary';
import { availabilityApi } from '../../services/availabilityApi';
import { fleetApi } from '../../services/fleetApi';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';

interface Props {
  className?: string;
}

export const FleetSchedulingView: React.FC<Props> = ({ className }) => {
  const [viewMode, setViewMode] = useState<'trucks' | 'drivers' | 'all'>('all');

  // Fetch all trucks and drivers so we can build schedule entries
  const { data: trucks = [], isLoading: trucksLoading } = useQuery({
    queryKey: ['fleet-trucks-for-schedule'],
    queryFn: () => fleetApi.getTrucks({}),
    staleTime: 60_000,
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['fleet-drivers-for-schedule'],
    queryFn: () => fleetApi.getDrivers({}),
    staleTime: 60_000,
  });

  // Fetch schedules for each truck (we do one call per truck; could be batched with a new endpoint)
  const { data: allEntries = [], isLoading: entriesLoading, refetch } = useQuery({
    queryKey: ['fleet-all-schedules', trucks.map((t: any) => t.id)],
    queryFn: async (): Promise<ScheduleEntry[]> => {
      const entries: ScheduleEntry[] = [];

      // Truck schedules
      for (const truck of trucks as any[]) {
        try {
          const reservations = await availabilityApi.getTruckSchedule(truck.id);
          for (const r of reservations) {
            entries.push({
              id:            r.id,
              resourceType:  'TRUCK',
              resourceId:    truck.id,
              resourceLabel: truck.plateNumber || truck.id,
              cargoId:       r.cargoId,
              tripId:        r.tripId,
              pickupDateTime:   r.pickupDateTime,
              deliveryDateTime: r.deliveryDateTime,
              status: 'PLANNED' as any, // we'll refine with trip status if available
            });
          }
        } catch {
          // skip individual truck failures silently
        }
      }

      // Driver schedules
      for (const driver of drivers as any[]) {
        try {
          const reservations = await availabilityApi.getDriverSchedule(driver.id);
          for (const r of reservations) {
            // Avoid duplicates — truck entries already cover these reservations visually
            entries.push({
              id:            `driver-${r.id}`,
              resourceType:  'DRIVER',
              resourceId:    driver.id,
              resourceLabel: `${driver.firstName} ${driver.lastName}`,
              cargoId:       r.cargoId,
              tripId:        r.tripId,
              pickupDateTime:   r.pickupDateTime,
              deliveryDateTime: r.deliveryDateTime,
              status: 'PLANNED' as any,
            });
          }
        } catch {
          // skip individual driver failures silently
        }
      }

      return entries;
    },
    enabled: trucks.length > 0 || drivers.length > 0,
    staleTime: 30_000,
  });

  const handleBackfill = async () => {
    try {
      const result = await availabilityApi.backfill();
      toast.success(`Backfill complete: ${result.count} reservation(s) seeded`);
      refetch();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const filteredEntries = allEntries.filter(e => {
    if (viewMode === 'trucks')  return e.resourceType === 'TRUCK';
    if (viewMode === 'drivers') return e.resourceType === 'DRIVER';
    return true;
  });

  const isLoading = trucksLoading || driversLoading || entriesLoading;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">Fleet Scheduling</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Real-time reservation calendar — truck & driver availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleBackfill}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#345E85] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#2a4d6d] transition-all"
          >
            <Download size={12} />
            Backfill
          </button>
        </div>
      </div>

      {/* Utilization summary */}
      <UtilizationSummary />

      {/* View mode toggle */}
      <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/60">
        {(['all', 'trucks', 'drivers'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-200',
              viewMode === mode
                ? 'bg-white text-[#345E85] shadow-md border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50',
            )}
          >
            {mode === 'trucks'  && <Truck size={11} />}
            {mode === 'drivers' && <User size={11} />}
            {mode === 'all'     && <span>🗓</span>}
            {mode === 'all' ? 'All Resources' : mode === 'trucks' ? 'Trucks' : 'Drivers'}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <SchedulingCalendar
        entries={filteredEntries}
        loading={isLoading}
      />
    </div>
  );
};
