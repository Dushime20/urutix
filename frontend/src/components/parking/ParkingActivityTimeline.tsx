import { PARKING_ACTIVITY_LABELS, PARKING_STATUS_LABELS, type ParkingReservationActivity } from '../../types/parking';
import { TranslatedText } from '../translated-text';

export function ParkingActivityTimeline({
  activities,
  emptyText = 'No events have been recorded yet.',
}: {
  activities?: ParkingReservationActivity[];
  emptyText?: string;
}) {
  const items = [...(activities || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  if (!items.length) {
    return <p className="text-sm font-medium text-slate-500">{emptyText}</p>;
  }

  return (
    <ol className="space-y-3" aria-label="Reservation activity">
      {items.map((activity, index) => {
        const statusChange =
          activity.previousStatus && activity.newStatus && activity.previousStatus !== activity.newStatus
            ? `${PARKING_STATUS_LABELS[activity.previousStatus] || activity.previousStatus} → ${PARKING_STATUS_LABELS[activity.newStatus] || activity.newStatus}`
            : activity.newStatus
              ? PARKING_STATUS_LABELS[activity.newStatus] || activity.newStatus
              : null;
        return (
          <li key={activity.id} className="relative border-l-2 border-primary-200 pl-4 pb-1">
            {index === items.length - 1 && (
              <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary-600" />
            )}
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {PARKING_ACTIVITY_LABELS[activity.action] || activity.action.replace(/_/g, ' ')}
            </p>
            {statusChange && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{statusChange}</p>
            )}
            <p className="text-xs text-slate-500">
              {activity.actorLabel || activity.actorRole || 'System'} · {new Date(activity.createdAt).toLocaleString()}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function ParkingTimelineCard({
  activities,
  title = 'Event timeline',
}: {
  activities?: ParkingReservationActivity[];
  title?: string;
}) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
      <h2 className="ui-section-title mb-4">
        <TranslatedText text={title} />
      </h2>
      <ParkingActivityTimeline activities={activities} />
    </section>
  );
}
