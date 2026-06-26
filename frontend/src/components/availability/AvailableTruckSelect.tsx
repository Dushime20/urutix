import React from 'react';
import { Truck, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useAvailableTrucks } from '../../hooks/useAvailability';
import { cn } from '../../utils/cn';

interface Props {
  pickupDateTime?: string;
  deliveryDateTime?: string;
  capacityWeight?: number;
  truckType?: string;
  value?: string;
  onChange: (truckId: string) => void;
  className?: string;
  label?: string;
  required?: boolean;
}

/**
 * A truck picker that only shows trucks available for the requested window.
 * Falls back to a plain select when no date range is provided.
 */
export const AvailableTruckSelect: React.FC<Props> = ({
  pickupDateTime,
  deliveryDateTime,
  capacityWeight,
  truckType,
  value,
  onChange,
  className,
  label = 'Assign Truck',
  required,
}) => {
  const datesProvided = !!pickupDateTime && !!deliveryDateTime;

  const { data: trucks = [], isLoading, isError } = useAvailableTrucks({
    pickupDateTime,
    deliveryDateTime,
    capacityWeight,
    truckType,
  });

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Date requirement hint */}
      {!datesProvided && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
          <AlertTriangle size={12} className="text-amber-500 shrink-0" />
          <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
            Set pickup & delivery dates first to see available trucks
          </span>
        </div>
      )}

      {/* Loading */}
      {datesProvided && isLoading && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          <Loader2 size={13} className="animate-spin text-slate-400" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Checking availability…</span>
        </div>
      )}

      {/* Error */}
      {datesProvided && isError && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle size={12} className="text-red-500 shrink-0" />
          <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">
            Failed to load availability. Please retry.
          </span>
        </div>
      )}

      {/* Truck select */}
      {datesProvided && !isLoading && !isError && (
        <>
          {trucks.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <div>
                <p className="text-[9px] font-black text-red-700 uppercase tracking-widest">No trucks available</p>
                <p className="text-[8px] text-red-600 mt-0.5">
                  All trucks are assigned during this period. Choose different dates or free a truck.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={11} className="text-emerald-500" />
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                  {trucks.length} truck{trucks.length !== 1 ? 's' : ''} available for this window
                </span>
              </div>
              <select
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#345E85] focus:border-transparent transition-all"
              >
                <option value="">Select a truck…</option>
                {trucks.map(truck => (
                  <option key={truck.id} value={truck.id}>
                    {truck.plateNumber} — {truck.make} {truck.model} ({truck.capacityWeight?.toLocaleString()} kg)
                  </option>
                ))}
              </select>
            </>
          )}
        </>
      )}
    </div>
  );
};
