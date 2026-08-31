import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { TranslatedText } from '../translated-text';
import {
  formatOverdueDateTime,
  formatOverdueDuration,
  overdueDurationMs,
} from '../../utils/overdueTrip';

export interface OverdueTripBannerProps {
  tripNumber?: string;
  expectedEnd?: string | Date | null;
  overdueDurationLabel?: string;
  delayReason?: string | null;
  delayDescription?: string | null;
  newEta?: string | Date | null;
  delayReportedAt?: string | Date | null;
}

export const OverdueTripBanner: React.FC<OverdueTripBannerProps> = ({
  tripNumber,
  expectedEnd,
  overdueDurationLabel,
  delayReason,
  delayDescription,
  newEta,
  delayReportedAt,
}) => {
  const overdueLabel =
    overdueDurationLabel || formatOverdueDuration(overdueDurationMs(expectedEnd));

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-3"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-widest text-amber-800 dark:text-amber-300">
            <TranslatedText text="Trip Overdue" />
            {tripNumber ? ` · #${tripNumber}` : ''}
          </p>
          <p className="text-xs font-medium text-amber-800/80 dark:text-amber-200/80 mt-1">
            <TranslatedText text="This trip is overdue. Complete the trip or report a delay." />
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[10px] font-black uppercase tracking-widest text-amber-700/70">
            <TranslatedText text="Expected completion" />
          </dt>
          <dd className="font-bold text-amber-950 dark:text-amber-100">
            {formatOverdueDateTime(expectedEnd)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-black uppercase tracking-widest text-amber-700/70">
            <TranslatedText text="Overdue by" />
          </dt>
          <dd className="font-bold text-amber-950 dark:text-amber-100">{overdueLabel}</dd>
        </div>
        {delayReason && (
          <div>
            <dt className="text-[10px] font-black uppercase tracking-widest text-amber-700/70">
              <TranslatedText text="Delay Reason" />
            </dt>
            <dd className="font-bold text-amber-950 dark:text-amber-100">{delayReason}</dd>
          </div>
        )}
        {newEta && (
          <div>
            <dt className="text-[10px] font-black uppercase tracking-widest text-amber-700/70">
              <TranslatedText text="New ETA" />
            </dt>
            <dd className="font-bold text-amber-950 dark:text-amber-100">
              {formatOverdueDateTime(newEta)}
            </dd>
          </div>
        )}
        {delayReportedAt && (
          <div>
            <dt className="text-[10px] font-black uppercase tracking-widest text-amber-700/70">
              <TranslatedText text="Reported" />
            </dt>
            <dd className="font-bold text-amber-950 dark:text-amber-100">
              {formatOverdueDateTime(delayReportedAt)}
            </dd>
          </div>
        )}
      </dl>
      {delayDescription && (
        <p className="text-xs text-amber-900/80 dark:text-amber-100/80">{delayDescription}</p>
      )}
    </div>
  );
};

export default OverdueTripBanner;
