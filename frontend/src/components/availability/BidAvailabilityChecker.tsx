import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Truck,
  User,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { cn } from '../../utils/cn';
import { getApiErrorMessage } from '../../config/errorMessages';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConflictDetail {
  type: 'TRUCK' | 'DRIVER';
  resourceId: string;
  conflictingTripId: string;
  conflictingCargoId: string;
  existingPickup: string;
  existingDelivery: string;
  message: string;
}

interface CheckResult {
  available: boolean;
  conflicts: ConflictDetail[];
  message: string;
}

interface Props {
  truckId?: string;
  driverId?: string;
  pickupDateTime?: string;
  deliveryDateTime?: string;
  /** Called whenever the check result changes */
  onResult?: (result: CheckResult | null) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Proactively checks availability for the truck/driver selected in a bid form.
 * Mount this inside the bid submission form and pass the selected truck/driver IDs
 * along with the load's pickup/delivery dates.
 *
 * It automatically re-checks whenever those four props change.
 */
export const BidAvailabilityChecker: React.FC<Props> = ({
  truckId,
  driverId,
  pickupDateTime,
  deliveryDateTime,
  onResult,
  className,
}) => {
  const [result, setResult]   = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canCheck = (truckId || driverId) && pickupDateTime && deliveryDateTime;

  const runCheck = useCallback(async () => {
    if (!canCheck) {
      setResult(null);
      onResult?.(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/bidding/check-availability', {
        truckId,
        driverId,
        pickupDateTime,
        deliveryDateTime,
      });

      const data: CheckResult = response.data?.data;
      setResult(data);
      onResult?.(data);
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      setResult(null);
      onResult?.(null);
    } finally {
      setLoading(false);
    }
  }, [truckId, driverId, pickupDateTime, deliveryDateTime, canCheck]);

  // Debounce checks so we don't hammer the API on every keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCheck, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runCheck]);

  if (!canCheck) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <Loader2 size={12} className="animate-spin text-slate-400 shrink-0" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Checking availability…
          </span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
          <AlertTriangle size={12} className="text-amber-500 shrink-0" />
          <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
            Could not verify availability — {error}
          </span>
          <button
            type="button"
            onClick={runCheck}
            className="ml-auto p-1 hover:bg-amber-100 rounded-lg transition-all"
          >
            <RefreshCw size={11} className="text-amber-600" />
          </button>
        </div>
      )}

      {/* Available */}
      {!loading && !error && result?.available && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
          <CheckCircle size={12} className="text-emerald-500 shrink-0" />
          <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
            Truck &amp; driver available for this window
          </span>
        </div>
      )}

      {/* Conflicts */}
      {!loading && !error && result && !result.available && (
        <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-red-100 border-b border-red-200">
            <XCircle size={14} className="text-red-600 shrink-0" />
            <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">
              Scheduling Conflict Detected
            </span>
          </div>

          {/* Conflict list */}
          <div className="p-4 space-y-3">
            {result.conflicts.map((c, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                  c.type === 'TRUCK' ? 'bg-red-100' : 'bg-orange-100',
                )}>
                  {c.type === 'TRUCK'
                    ? <Truck size={13} className="text-red-600" />
                    : <User  size={13} className="text-orange-600" />}
                </div>
                <div>
                  <p className="text-[9px] font-black text-red-700 uppercase tracking-widest">
                    {c.type === 'TRUCK' ? 'Truck Conflict' : 'Driver Conflict'}
                  </p>
                  <p className="text-xs font-medium text-red-600 mt-0.5">{c.message}</p>
                  <p className="text-[8px] text-red-500 mt-0.5 font-black uppercase tracking-widest">
                    Cargo: {c.conflictingCargoId.slice(0, 8)}…
                  </p>
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-red-200">
              <p className="text-[9px] font-black text-red-700 uppercase tracking-widest">
                ⚠️ Your bid will be submitted but this assignment will be rejected at acceptance.
              </p>
              <p className="text-[9px] text-red-600 mt-1">
                Please select a different truck or driver, or choose different transportation dates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
