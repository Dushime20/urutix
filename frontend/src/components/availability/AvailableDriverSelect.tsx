import React from 'react';
import { User, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useAvailableDrivers } from '../../hooks/useAvailability';
import { cn } from '../../utils/cn';

interface Props {
  pickupDateTime?: string;
  deliveryDateTime?: string;
  value?: string;
  onChange: (driverId: string) => void;
  className?: string;
  label?: string;
  required?: boolean;
}

export const AvailableDriverSelect: React.FC<Props> = ({
  pickupDateTime,
  deliveryDateTime,
  value,
  onChange,
  className,
  label = 'Assign Driver',
  required,
}) => {
  const datesProvided = !!pickupDateTime && !!deliveryDateTime;

  const { data: drivers = [], isLoading, isError } = useAvailableDrivers({
    pickupDateTime,
    deliveryDateTime,
  });

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {!datesProvided && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
          <AlertTriangle size={12} className="text-amber-500 shrink-0" />
          <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
            Set pickup & delivery dates first
          </span>
        </div>
      )}

      {datesProvided && isLoading && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          <Loader2 size={13} className="animate-spin text-slate-400" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Checking availability…</span>
        </div>
      )}

      {datesProvided && isError && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle size={12} className="text-red-500 shrink-0" />
          <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">
            Failed to load availability. Please retry.
          </span>
        </div>
      )}

      {datesProvided && !isLoading && !isError && (
        <>
          {drivers.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <div>
                <p className="text-[9px] font-black text-red-700 uppercase tracking-widest">No drivers available</p>
                <p className="text-[8px] text-red-600 mt-0.5">
                  All drivers are assigned during this period. Choose different dates or free a driver.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={11} className="text-emerald-500" />
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                  {drivers.length} driver{drivers.length !== 1 ? 's' : ''} available
                </span>
              </div>
              <select
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#345E85] focus:border-transparent transition-all"
              >
                <option value="">Select a driver…</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.firstName} {driver.lastName} — {driver.licenseNumber}
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
