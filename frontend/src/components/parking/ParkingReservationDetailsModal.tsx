import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CalendarDays,
  FileSignature,
  Mail,
  MapPin,
  Phone,
  Truck,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../EnliteUI';
import { StatusBadge } from '../EnliteUI/Tables';
import { parkingApi } from '../../services/parkingApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import {
  PARKING_PAYMENT_LABELS,
  PARKING_STATUS_LABELS,
  isParkingPaymentOpen,
  type ParkingReservationStatus,
} from '../../types/parking';
import { TranslatedText } from '../translated-text';
import { countryDisplayName } from '../../lib/countries';
import { usePermission } from '../../contexts/PermissionContext';
import { useParkingMoney } from '../../hooks/useParkingMoney';
import CurrencySelector from '../common/CurrencySelector';
import { ParkingActivityTimeline } from './ParkingActivityTimeline';
import { ParkingPaymentCard } from './ParkingPaymentCard';
import { ParkingIshemaPayModal } from './ParkingIshemaPayModal';

type ActionKind = 'approve' | 'reject' | 'info' | 'assign' | 'note' | 'cancel' | 'waive' | null;

export function ParkingReservationDetailsModal({
  open,
  reservationId,
  onClose,
}: {
  open: boolean;
  reservationId?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { can } = usePermission();
  const { money } = useParkingMoney();
  const [action, setAction] = useState<ActionKind>(null);
  const [reason, setReason] = useState('');
  const [extra, setExtra] = useState('');
  const [assignee, setAssignee] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    setAction(null);
    setReason('');
    setExtra('');
    setAssignee('');
    setPayOpen(false);
    setResponseText('');
  }, [open, reservationId]);

  const handleClose = () => {
    if (payOpen) {
      setPayOpen(false);
      return;
    }
    if (action) {
      setAction(null);
      return;
    }
    onClose();
  };

  const query = useQuery({
    queryKey: ['parking-reservation', reservationId],
    queryFn: () => parkingApi.get(reservationId!),
    enabled: open && !!reservationId,
    refetchInterval: (current) =>
      current.state.data?.payment?.status === 'PENDING_VERIFICATION' ? 4000 : false,
  });

  const officersQuery = useQuery({
    queryKey: ['parking-officers'],
    queryFn: parkingApi.officers,
    enabled: open && can('parking:assign'),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['parking-reservation', reservationId] });
    qc.invalidateQueries({ queryKey: ['parking-reservations'] });
    qc.invalidateQueries({ queryKey: ['parking-reservation-stats'] });
    qc.invalidateQueries({ queryKey: ['my-parking-reservations'] });
  };

  const run = useMutation({
    mutationFn: async (kind: Exclude<ActionKind, null> | 'review' | 'review-response') => {
      if (!reservationId) return;
      if (kind === 'review') return parkingApi.startReview(reservationId);
      if (kind === 'review-response') return parkingApi.reviewResponse(reservationId);
      if (kind === 'approve') return parkingApi.approve(reservationId);
      if (kind === 'reject') return parkingApi.reject(reservationId, reason, extra || undefined);
      if (kind === 'info') return parkingApi.requestInformation(reservationId, reason);
      if (kind === 'assign') return parkingApi.assign(reservationId, assignee);
      if (kind === 'note') return parkingApi.addNote(reservationId, reason);
      if (kind === 'cancel') return parkingApi.cancel(reservationId, reason);
      if (kind === 'waive') return parkingApi.waivePayment(reservationId, reason);
    },
    onSuccess: () => {
      toast.success('Reservation updated');
      setAction(null);
      setReason('');
      setExtra('');
      refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const reservation = query.data;
  const status = reservation?.status as ParkingReservationStatus | undefined;

  const actions = useMemo(() => {
    if (!status) return [];
    const items: Array<{ label: string; onClick: () => void; tone?: 'primary' | 'danger' | 'muted' }> = [];
    if (status === 'PENDING_REVIEW') {
      if (can('parking:review')) items.push({ label: 'Start Review', onClick: () => run.mutate('review'), tone: 'primary' });
      if (can('parking:assign')) items.push({ label: 'Assign', onClick: () => setAction('assign') });
      if (can('parking:request_information')) items.push({ label: 'Request Information', onClick: () => setAction('info') });
      if (can('parking:reject')) items.push({ label: 'Reject', onClick: () => setAction('reject'), tone: 'danger' });
    }
    if (status === 'UNDER_REVIEW') {
      if (can('parking:approve')) items.push({ label: 'Approve', onClick: () => setAction('approve'), tone: 'primary' });
      if (can('parking:request_information')) items.push({ label: 'Request Information', onClick: () => setAction('info') });
      if (can('parking:add_note')) items.push({ label: 'Add Note', onClick: () => setAction('note') });
      if (can('parking:assign')) items.push({ label: 'Reassign', onClick: () => setAction('assign') });
      if (can('parking:reject')) items.push({ label: 'Reject', onClick: () => setAction('reject'), tone: 'danger' });
    }
    if (status === 'ADDITIONAL_INFORMATION_REQUIRED') {
      if (can('parking:review')) items.push({ label: 'Review Response', onClick: () => run.mutate('review-response'), tone: 'primary' });
      if (can('parking:approve')) items.push({ label: 'Approve', onClick: () => setAction('approve') });
      if (can('parking:reject')) items.push({ label: 'Reject', onClick: () => setAction('reject'), tone: 'danger' });
    }
    if (status === 'APPROVED') {
      if (can('parking:add_note')) items.push({ label: 'Add Note', onClick: () => setAction('note') });
      if (
        can('parking:confirm_payment') &&
        reservation?.payment &&
        reservation.payment.status !== 'PAID' &&
        reservation.payment.status !== 'WAIVED' &&
        reservation.payment.status !== 'NOT_APPLICABLE'
      ) {
        items.push({ label: 'Waive Fees', onClick: () => setAction('waive') });
      }
      if (can('parking:cancel')) items.push({ label: 'Cancel Reservation', onClick: () => setAction('cancel'), tone: 'danger' });
    }
    return items;
  }, [status, can, run, reservation]);

  const nestedZ = 'z-[10200]';
  const canPayNow =
    status === 'APPROVED' &&
    isParkingPaymentOpen(reservation?.payment?.status) &&
    !can('parking:confirm_payment');

  return (
    <>
      <Modal
        isOpen={open}
        onClose={handleClose}
        title={reservation?.reservationReference || 'Reservation details'}
        size="full"
        headerColor="default"
        footer={
          reservation ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CurrencySelector variant="compact" />
              <div className="flex flex-wrap justify-end gap-2">
                {canPayNow && (
                  <button
                    type="button"
                    onClick={() => setPayOpen(true)}
                    className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    Pay now
                  </button>
                )}
                {actions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={run.isPending}
                    onClick={item.onClick}
                    className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 ${
                      item.tone === 'danger'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : item.tone === 'primary'
                          ? 'bg-primary-600 hover:bg-primary-700 text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        {query.isLoading && (
          <div className="py-16 text-center text-sm font-semibold text-slate-500">
            <TranslatedText text="Loading reservation details…" />
          </div>
        )}
        {query.isError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm font-semibold text-rose-700">
            Reservation not found.
          </div>
        )}
        {reservation && (
          <div className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {reservation.companyName}
                  {reservation.facilityName ? ` · ${reservation.facilityName}` : ''}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Submitted {new Date(reservation.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={reservation.status} label={PARKING_STATUS_LABELS[reservation.status]} />
                {reservation.payment && reservation.payment.status !== 'NOT_APPLICABLE' && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    {PARKING_PAYMENT_LABELS[reservation.payment.status]}
                    {reservation.payment.totalAmount
                      ? ` · ${money(reservation.payment.totalAmount, reservation.payment.currency)}`
                      : ''}
                  </span>
                )}
              </div>
            </div>

            {reservation.possibleDuplicate && (
              <Notice tone="amber">
                A similar reservation request already exists.
                {reservation.duplicateOfReferences?.length ? ` Related: ${reservation.duplicateOfReferences.join(', ')}` : ''}
              </Notice>
            )}
            {reservation.capacity && !reservation.capacity.sufficient && (
              <Notice tone="rose">
                Insufficient parking capacity is available for the requested period. Remaining:{' '}
                {reservation.capacity.remaining} of {reservation.capacity.totalCapacity}.
              </Notice>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Panel title="Stay details" icon={<CalendarDays className="w-4 h-4" />}>
                <Fact label="Requested start" value={String(reservation.requestedStartDate).slice(0, 10)} />
                <Fact label="Duration" value={`${reservation.contractMonths} month(s)`} />
                <Fact label="Truck spaces" value={String(reservation.truckSpacesRequested)} icon={<Truck className="w-3.5 h-3.5" />} />
                <Fact label="Location" value={reservation.locationLabel || reservation.facilityName || '—'} icon={<MapPin className="w-3.5 h-3.5" />} />
                <Fact label="Submitted" value={new Date(reservation.createdAt).toLocaleString()} />
              </Panel>
              <Panel title="Company" icon={<Building2 className="w-4 h-4" />}>
                <Fact label="Company" value={reservation.companyName} />
                <Fact label="Country" value={countryDisplayName(reservation.companyCountry) || reservation.companyCountry || '—'} />
                <Fact label={reservation.operatorPrimaryLabel || 'Operator ID'} value={reservation.mcNumber || '—'} />
                {reservation.usdotNumber ? (
                  <Fact label={reservation.operatorSecondaryLabel || 'Secondary ID'} value={reservation.usdotNumber} />
                ) : null}
                <Fact label="Phone" value={reservation.companyPhone} icon={<Phone className="w-3.5 h-3.5" />} />
                <Fact label="Company email" value={reservation.email} icon={<Mail className="w-3.5 h-3.5" />} />
              </Panel>
              <Panel title="Driver & authorization" icon={<UserRound className="w-4 h-4" />}>
                <Fact label="Driver" value={`${reservation.driverFirstName} ${reservation.driverLastName}`} />
                <Fact label="Driver email" value={reservation.driverEmail || reservation.email} icon={<Mail className="w-3.5 h-3.5" />} />
                <Fact label="Agreement" value={reservation.agreementAccepted ? 'Accepted' : 'Not accepted'} />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    <TranslatedText text="Signature" />
                  </p>
                  {reservation.signature?.startsWith('data:image/') ? (
                    <img
                      src={reservation.signature}
                      alt="Applicant signature"
                      className="max-h-28 w-full object-contain bg-white border border-slate-100 rounded-xl"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 break-words">
                      {reservation.signature || '—'}
                    </p>
                  )}
                </div>
              </Panel>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Panel title="Review" icon={<FileSignature className="w-4 h-4" />}>
                <Fact label="Assigned officer" value={reservation.assignedToName || 'Unassigned'} />
                <Fact label="Reviewed at" value={reservation.reviewedAt ? new Date(reservation.reviewedAt).toLocaleString() : '—'} />
                <Fact label="Internal notes" value={reservation.internalNotes || '—'} />
                <Fact label="Customer notes" value={reservation.customerNotes || '—'} />
                {reservation.informationRequested && (
                  <Fact label="Information requested" value={reservation.informationRequested} />
                )}
                {reservation.informationResponse && (
                  <Fact label="Customer response" value={reservation.informationResponse} />
                )}
                {reservation.rejectionReason && <Fact label="Rejection reason" value={reservation.rejectionReason} />}
              </Panel>
              <Panel title="Activity" icon={<CalendarDays className="w-4 h-4" />}>
                <ParkingActivityTimeline activities={reservation.activities} />
              </Panel>
            </div>

            {(reservation.payment || reservation.feeQuote) && (
              <ParkingPaymentCard
                reservation={reservation}
                quote={reservation.feeQuote}
                convertDisplay
                staff={can('parking:confirm_payment')}
                submitting={run.isPending}
                onSubmit={
                  can('parking:confirm_payment')
                    ? async (payload) => {
                        if (!reservationId) return;
                        try {
                          await parkingApi.confirmPayment(reservationId, payload);
                          toast.success('Payment confirmed');
                          refresh();
                        } catch (error) {
                          toast.error(getApiErrorMessage(error));
                        }
                      }
                    : undefined
                }
              />
            )}

            {status === 'ADDITIONAL_INFORMATION_REQUIRED' && can('parking:view_own') && !can('parking:review') && (
              <Panel title="Respond to information request">
                {reservation.informationRequested && (
                  <p className="text-sm font-medium text-slate-600 mb-3">{reservation.informationRequested}</p>
                )}
                <textarea
                  className="w-full ui-input border rounded-xl p-3 mb-3"
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response"
                />
                <button
                  type="button"
                  disabled={responseText.trim().length < 2 || run.isPending}
                  onClick={async () => {
                    if (!reservationId) return;
                    try {
                      await parkingApi.respond(reservationId, responseText.trim());
                      toast.success('Response submitted');
                      setResponseText('');
                      refresh();
                    } catch (error) {
                      toast.error(getApiErrorMessage(error));
                    }
                  }}
                  className="px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[11px] bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
                >
                  Send response
                </button>
              </Panel>
            )}
          </div>
        )}
      </Modal>

      {reservation && (
        <ParkingIshemaPayModal
          open={payOpen}
          onClose={() => setPayOpen(false)}
          reservation={reservation}
          reservationId={reservation.id}
          onPaid={() => {
            setPayOpen(false);
            refresh();
            toast.success('Payment confirmed. Your reservation is approved.');
          }}
        />
      )}

      <ConfirmDialog
        open={action === 'approve'}
        title="Approve reservation?"
        zIndexClass={nestedZ}
        onClose={() => setAction(null)}
        confirmLabel="Confirm approval"
        onConfirm={() => run.mutate('approve')}
      >
        {reservation && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-600">
              You are about to approve reservation {reservation.reservationReference}.
            </p>
            <Fact label="Company" value={reservation.companyName} />
            <Fact label="Truck spaces" value={String(reservation.truckSpacesRequested)} />
            <Fact label="Duration" value={`${reservation.contractMonths} months`} />
            <Fact label="Start date" value={String(reservation.requestedStartDate).slice(0, 10)} />
            {reservation.feeQuote && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">
                  Fees to request from the driver
                </p>
                <p className="text-sm font-black text-slate-900">
                  {money(reservation.feeQuote.totalAmount, reservation.feeQuote.currency)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Occupancy {money(reservation.feeQuote.occupancyAmount, reservation.feeQuote.currency)} + reservation fee{' '}
                  {money(reservation.feeQuote.reservationFeeAmount, reservation.feeQuote.currency)} + tax{' '}
                  {money(reservation.feeQuote.taxAmount, reservation.feeQuote.currency)}
                </p>
                {reservation.feeQuote.totalAmount <= 0 && (
                  <p className="text-xs font-semibold text-amber-700 mt-2">
                    Fee schedule is currently 0. Configure reservation fees before confirming if the driver should be billed.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={action === 'reject'}
        title="Reject reservation"
        zIndexClass={nestedZ}
        onClose={() => setAction(null)}
        confirmLabel="Reject"
        danger
        disabled={reason.trim().length < 5}
        onConfirm={() => run.mutate('reject')}
      >
        <label className="ui-label block mb-2">Reason *</label>
        <textarea className="w-full ui-input border rounded-xl p-3 mb-3" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        <label className="ui-label block mb-2">Additional explanation</label>
        <textarea className="w-full ui-input border rounded-xl p-3" rows={3} value={extra} onChange={(e) => setExtra(e.target.value)} />
      </ConfirmDialog>

      <ConfirmDialog
        open={action === 'info'}
        title="Request information"
        zIndexClass={nestedZ}
        onClose={() => setAction(null)}
        confirmLabel="Send request"
        disabled={reason.trim().length < 5}
        onConfirm={() => run.mutate('info')}
      >
        <label className="ui-label block mb-2">Information required *</label>
        <textarea className="w-full ui-input border rounded-xl p-3" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>

      <ConfirmDialog
        open={action === 'assign'}
        title="Assign reservation"
        zIndexClass={nestedZ}
        onClose={() => setAction(null)}
        confirmLabel="Assign"
        disabled={!assignee}
        onConfirm={() => run.mutate('assign')}
      >
        <select className="w-full ui-input border rounded-xl p-3" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">Select officer</option>
          {(officersQuery.data || []).map((officer) => (
            <option key={officer.id} value={officer.id}>
              {[officer.firstName, officer.lastName].filter(Boolean).join(' ') || officer.email}
            </option>
          ))}
        </select>
      </ConfirmDialog>

      <ConfirmDialog
        open={action === 'note' || action === 'cancel'}
        title={action === 'cancel' ? 'Cancel reservation' : 'Add internal note'}
        zIndexClass={nestedZ}
        onClose={() => setAction(null)}
        confirmLabel="Save"
        disabled={reason.trim().length < 2}
        onConfirm={() => run.mutate(action === 'cancel' ? 'cancel' : 'note')}
      >
        <textarea className="w-full ui-input border rounded-xl p-3" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>

      <ConfirmDialog
        open={action === 'waive'}
        title="Waive reservation fees"
        zIndexClass={nestedZ}
        onClose={() => setAction(null)}
        confirmLabel="Waive fees"
        disabled={reason.trim().length < 5}
        onConfirm={() => run.mutate('waive')}
      >
        <p className="text-sm font-medium text-slate-600 mb-3">The driver will be notified that no payment is required.</p>
        <textarea
          className="w-full ui-input border rounded-xl p-3"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for waiver"
        />
      </ConfirmDialog>
    </>
  );
}

function ConfirmDialog({
  open,
  title,
  zIndexClass,
  onClose,
  confirmLabel,
  onConfirm,
  disabled,
  danger,
  children,
}: {
  open: boolean;
  title: string;
  zIndexClass: string;
  onClose: () => void;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      size="md"
      zIndexClass={zIndexClass}
      closeOnOverlayClick
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl font-bold text-sm border border-slate-200">
            Cancel
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl font-bold text-sm text-white disabled:opacity-50 ${
              danger ? 'bg-rose-600' : 'bg-primary-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      {children}
    </Modal>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5">
      <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">
        {icon}
        <TranslatedText text={title} />
      </h4>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Fact({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-words inline-flex items-center gap-1.5">
        {icon}
        {value}
      </p>
    </div>
  );
}

function Notice({ tone, children }: { tone: 'amber' | 'rose'; children: ReactNode }) {
  const cls =
    tone === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-rose-50 border-rose-200 text-rose-700';
  return <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${cls}`}>{children}</div>;
}
