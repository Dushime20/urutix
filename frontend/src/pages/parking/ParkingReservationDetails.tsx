import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/EnliteUI';
import { StatusBadge } from '../../components/EnliteUI/Tables';
import { parkingApi } from '../../services/parkingApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import {
  PARKING_ACTIVITY_LABELS,
  PARKING_STATUS_LABELS,
  type ParkingReservationStatus,
} from '../../types/parking';
import { TranslatedText } from '../../components/translated-text';
import { usePermission } from '../../contexts/PermissionContext';
import ModernLoader from '../../components/common/ModernLoader';

type ModalKind = 'approve' | 'reject' | 'info' | 'assign' | 'note' | 'cancel' | null;

const ParkingReservationDetails = ({ listPath = '/dashboard/parking/reservations' }: { listPath?: string }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = usePermission();
  const [modal, setModal] = useState<ModalKind>(null);
  const [reason, setReason] = useState('');
  const [extra, setExtra] = useState('');
  const [assignee, setAssignee] = useState('');

  const query = useQuery({
    queryKey: ['parking-reservation', id],
    queryFn: () => parkingApi.get(id!),
    enabled: !!id,
  });

  const officersQuery = useQuery({
    queryKey: ['parking-officers'],
    queryFn: parkingApi.officers,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['parking-reservation', id] });
    qc.invalidateQueries({ queryKey: ['parking-reservations'] });
    qc.invalidateQueries({ queryKey: ['parking-reservation-stats'] });
  };

  const run = useMutation({
    mutationFn: async (action: Exclude<ModalKind, null> | 'review' | 'review-response') => {
      if (!id) return;
      if (action === 'review') return parkingApi.startReview(id);
      if (action === 'review-response') return parkingApi.reviewResponse(id);
      if (action === 'approve') return parkingApi.approve(id);
      if (action === 'reject') return parkingApi.reject(id, reason, extra || undefined);
      if (action === 'info') return parkingApi.requestInformation(id, reason);
      if (action === 'assign') return parkingApi.assign(id, assignee);
      if (action === 'note') return parkingApi.addNote(id, reason);
      if (action === 'cancel') return parkingApi.cancel(id, reason);
    },
    onSuccess: () => {
      toast.success('Reservation updated');
      setModal(null);
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
    const items: Array<{ label: string; permission: string; onClick: () => void; tone?: string }> = [];
    if (status === 'PENDING_REVIEW') {
      if (can('parking:review')) items.push({ label: 'Start Review', permission: 'parking:review', onClick: () => run.mutate('review') });
      if (can('parking:assign')) items.push({ label: 'Assign', permission: 'parking:assign', onClick: () => setModal('assign') });
      if (can('parking:reject')) items.push({ label: 'Reject', permission: 'parking:reject', onClick: () => setModal('reject'), tone: 'error' });
      if (can('parking:request_information')) items.push({ label: 'Request Information', permission: 'parking:request_information', onClick: () => setModal('info') });
    }
    if (status === 'UNDER_REVIEW') {
      if (can('parking:approve')) items.push({ label: 'Approve', permission: 'parking:approve', onClick: () => setModal('approve') });
      if (can('parking:reject')) items.push({ label: 'Reject', permission: 'parking:reject', onClick: () => setModal('reject'), tone: 'error' });
      if (can('parking:request_information')) items.push({ label: 'Request Information', permission: 'parking:request_information', onClick: () => setModal('info') });
      if (can('parking:add_note')) items.push({ label: 'Add Internal Note', permission: 'parking:add_note', onClick: () => setModal('note') });
      if (can('parking:assign')) items.push({ label: 'Reassign', permission: 'parking:assign', onClick: () => setModal('assign') });
    }
    if (status === 'ADDITIONAL_INFORMATION_REQUIRED') {
      if (can('parking:review')) items.push({ label: 'Review Response', permission: 'parking:review', onClick: () => run.mutate('review-response') });
      if (can('parking:approve')) items.push({ label: 'Approve', permission: 'parking:approve', onClick: () => setModal('approve') });
      if (can('parking:reject')) items.push({ label: 'Reject', permission: 'parking:reject', onClick: () => setModal('reject'), tone: 'error' });
    }
    if (status === 'APPROVED') {
      if (can('parking:cancel')) items.push({ label: 'Cancel Reservation', permission: 'parking:cancel', onClick: () => setModal('cancel'), tone: 'error' });
      if (can('parking:add_note')) items.push({ label: 'Add Note', permission: 'parking:add_note', onClick: () => setModal('note') });
    }
    return items;
  }, [status, can, run]);

  if (query.isLoading) return <ModernLoader isLoading text="Loading_Reservation" />;
  if (query.isError || !reservation) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(listPath)} className="text-[10px] font-black uppercase tracking-widest text-primary-600">Back</button>
        <p className="text-sm font-semibold text-red-600">Reservation not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(listPath)} className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-primary-600">
        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to reservations
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="ui-page-title">{reservation.reservationReference}</h1>
          <div className="mt-2"><StatusBadge status={reservation.status} label={PARKING_STATUS_LABELS[reservation.status]} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={run.isPending}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${action.tone === 'error' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {reservation.possibleDuplicate && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm font-semibold">
          A similar reservation request already exists.
          {reservation.duplicateOfReferences?.length ? ` Related: ${reservation.duplicateOfReferences.join(', ')}` : ''}
        </div>
      )}

      {reservation.capacity && !reservation.capacity.sufficient && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold">
          Insufficient parking capacity is available for the requested period. Remaining: {reservation.capacity.remaining} of {reservation.capacity.totalCapacity}.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Reservation Information">
          <Info label="Reference" value={reservation.reservationReference} />
          <Info label="Status" value={PARKING_STATUS_LABELS[reservation.status]} />
          <Info label="Created" value={new Date(reservation.createdAt).toLocaleString()} />
          <Info label="Requested Start Date" value={String(reservation.requestedStartDate).slice(0, 10)} />
          <Info label="Contract Duration" value={`${reservation.contractMonths} month(s)`} />
          <Info label="Truck Spaces Requested" value={String(reservation.truckSpacesRequested)} />
        </Card>
        <Card title="Company Information">
          <Info label="Company Name" value={reservation.companyName} />
          <Info label="MC Number" value={reservation.mcNumber} />
          <Info label="USDOT Number" value={reservation.usdotNumber} />
          <Info label="Phone" value={reservation.companyPhone} />
          <Info label="Email" value={reservation.email} />
        </Card>
        <Card title="Driver Information">
          <Info label="Driver Name" value={`${reservation.driverFirstName} ${reservation.driverLastName}`} />
        </Card>
        <Card title="Authorization">
          <Info label="Agreement" value={reservation.agreementAccepted ? 'Accepted' : 'Not accepted'} />
          <div>
            <p className="ui-label mb-1"><TranslatedText text="Signature" /></p>
            {reservation.signature?.startsWith('data:image/') ? (
              <img
                src={reservation.signature}
                alt="Applicant signature"
                className="max-h-36 w-full max-w-md object-contain bg-white border border-slate-100 rounded-xl"
              />
            ) : (
              <p className="ui-body break-words">{reservation.signature || '—'}</p>
            )}
          </div>
        </Card>
        <Card title="Review Information">
          <Info label="Assigned Officer" value={reservation.assignedToName || 'Unassigned'} />
          <Info label="Reviewed At" value={reservation.reviewedAt ? new Date(reservation.reviewedAt).toLocaleString() : '—'} />
          <Info label="Internal Notes" value={reservation.internalNotes || '—'} />
          <Info label="Customer Notes" value={reservation.customerNotes || '—'} />
          {reservation.informationRequested && <Info label="Information requested" value={reservation.informationRequested} />}
          {reservation.informationResponse && <Info label="Customer response" value={reservation.informationResponse} />}
          {reservation.rejectionReason && <Info label="Rejection reason" value={reservation.rejectionReason} />}
        </Card>
        <Card title="Activity Timeline">
          <ol className="space-y-3">
            {(reservation.activities || []).map((activity) => (
              <li key={activity.id} className="border-l-2 border-primary-200 pl-3">
                <p className="text-sm font-bold text-slate-800">{PARKING_ACTIVITY_LABELS[activity.action] || activity.action}</p>
                <p className="text-xs text-slate-500">{activity.actorLabel || activity.actorRole || 'System'} · {new Date(activity.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {status === 'ADDITIONAL_INFORMATION_REQUIRED' && can('parking:view_own') && !can('parking:review') && (
        <Card title="Respond to information request">
          {reservation.informationRequested && (
            <p className="text-sm font-medium text-slate-600 mb-3">{reservation.informationRequested}</p>
          )}
          <textarea
            className="w-full ui-input border rounded-xl p-3 mb-3"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Type your response"
          />
          <button
            type="button"
            disabled={reason.trim().length < 2 || run.isPending}
            onClick={async () => {
              if (!id) return;
              try {
                await parkingApi.respond(id, reason.trim());
                toast.success('Response submitted');
                setReason('');
                refresh();
              } catch (error) {
                toast.error(getApiErrorMessage(error));
              }
            }}
            className="px-4 py-2 rounded-lg font-bold bg-primary-600 hover:bg-primary-700 text-white text-sm disabled:opacity-50"
          >
            Send response
          </button>
        </Card>
      )}

      <Modal isOpen={modal === 'approve'} onClose={() => setModal(null)} title="Approve Reservation?" size="md" footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg font-bold border" onClick={() => setModal(null)}>Cancel</button>
          <button className="px-4 py-2 rounded-lg font-bold bg-primary-600 text-white" onClick={() => run.mutate('approve')}>Confirm approval</button>
        </div>
      }>
        <p className="text-sm font-medium text-slate-600 mb-4">You are about to approve reservation {reservation.reservationReference} for:</p>
        <Info label="Company" value={reservation.companyName} />
        <Info label="Truck Spaces" value={String(reservation.truckSpacesRequested)} />
        <Info label="Contract Duration" value={`${reservation.contractMonths} months`} />
        <Info label="Start Date" value={String(reservation.requestedStartDate).slice(0, 10)} />
      </Modal>

      <Modal isOpen={modal === 'reject'} onClose={() => setModal(null)} title="Reject Reservation" size="md" footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg font-bold border" onClick={() => setModal(null)}>Cancel</button>
          <button className="px-4 py-2 rounded-lg font-bold bg-rose-600 text-white" disabled={reason.trim().length < 5} onClick={() => run.mutate('reject')}>Reject</button>
        </div>
      }>
        <label className="ui-label block mb-2">Reason *</label>
        <textarea className="w-full ui-input border rounded-xl p-3 mb-3" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        <label className="ui-label block mb-2">Additional explanation</label>
        <textarea className="w-full ui-input border rounded-xl p-3" rows={3} value={extra} onChange={(e) => setExtra(e.target.value)} />
      </Modal>

      <Modal isOpen={modal === 'info'} onClose={() => setModal(null)} title="Request Information" size="md" footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg font-bold border" onClick={() => setModal(null)}>Cancel</button>
          <button className="px-4 py-2 rounded-lg font-bold bg-primary-600 text-white" disabled={reason.trim().length < 5} onClick={() => run.mutate('info')}>Send request</button>
        </div>
      }>
        <label className="ui-label block mb-2">Information Required *</label>
        <textarea className="w-full ui-input border rounded-xl p-3" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>

      <Modal isOpen={modal === 'assign'} onClose={() => setModal(null)} title="Assign Reservation" size="md" footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg font-bold border" onClick={() => setModal(null)}>Cancel</button>
          <button className="px-4 py-2 rounded-lg font-bold bg-primary-600 text-white" disabled={!assignee} onClick={() => run.mutate('assign')}>Assign</button>
        </div>
      }>
        <select className="w-full ui-input border rounded-xl p-3" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">Select officer</option>
          {(officersQuery.data || []).map((officer) => (
            <option key={officer.id} value={officer.id}>
              {[officer.firstName, officer.lastName].filter(Boolean).join(' ') || officer.email}
            </option>
          ))}
        </select>
      </Modal>

      <Modal isOpen={modal === 'note' || modal === 'cancel'} onClose={() => setModal(null)} title={modal === 'cancel' ? 'Cancel Reservation' : 'Add Internal Note'} size="md" footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg font-bold border" onClick={() => setModal(null)}>Close</button>
          <button className="px-4 py-2 rounded-lg font-bold bg-primary-600 text-white" disabled={reason.trim().length < 2} onClick={() => run.mutate(modal === 'cancel' ? 'cancel' : 'note')}>Save</button>
        </div>
      }>
        <textarea className="w-full ui-input border rounded-xl p-3" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>
    </div>
  );
};

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
      <h2 className="ui-section-title mb-4"><TranslatedText text={title} /></h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="ui-label mb-1">{label}</p>
      <p className="ui-body break-words">{value}</p>
    </div>
  );
}

export default ParkingReservationDetails;
