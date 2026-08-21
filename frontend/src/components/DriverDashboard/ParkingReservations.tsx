import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ParkingSquare, Plus, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { parkingApi } from '../../services/parkingApi';
import {
  PARKING_PAYMENT_LABELS,
  PARKING_STATUS_LABELS,
  formatParkingMoney,
  isParkingPaymentOpen,
  type ParkingReservation,
} from '../../types/parking';
import { ParkingReservationForm } from '../parking/ParkingReservationForm';
import { ParkingActivityTimeline } from '../parking/ParkingActivityTimeline';
import { ParkingIshemaPayModal } from '../parking/ParkingIshemaPayModal';
import { TranslatedText } from '../translated-text';
import { getApiErrorMessage } from '../../config/errorMessages';
import { Modal } from '../EnliteUI';

interface ParkingReservationsProps {
  driver?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    contactInfo?: { email?: string; phone?: string };
  } | null;
}

const statusTone = (status: string) => {
  if (status === 'APPROVED' || status === 'COMPLETED') return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40';
  if (status === 'REJECTED' || status === 'CANCELLED' || status === 'EXPIRED') return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40';
  if (status === 'ADDITIONAL_INFORMATION_REQUIRED') return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40';
  return 'bg-blue-50 text-[#2b5271] border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40';
};

export const ParkingReservations: React.FC<ParkingReservationsProps> = ({ driver }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['my-parking-reservations'],
    queryFn: () => parkingApi.list({ page: 1, limit: 50, sortBy: 'createdAt', sortDir: 'DESC' }),
  });

  const respond = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => parkingApi.respond(id, text),
    onSuccess: () => {
      toast.success('Response submitted');
      setResponseText('');
      setRespondingId(null);
      queryClient.invalidateQueries({ queryKey: ['my-parking-reservations'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const defaults = useMemo(() => ({
    driverFirstName: driver?.firstName || '',
    driverLastName: driver?.lastName || '',
    driverEmail: driver?.email || driver?.contactInfo?.email || '',
    companyPhone: driver?.phone || driver?.contactInfo?.phone || '',
  }), [driver]);

  const items = query.data?.items || [];
  const payingItem = items.find((row) => row.id === payingId);

  return (
    <div className="animate-in fade-in duration-500 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#2b5271] dark:text-blue-300">
              <ParkingSquare size={18} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              <TranslatedText text="Parking Reservation" />
            </h1>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            <TranslatedText text="Request truck parking and track reservation status" />
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2b5271] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#234560] transition-colors"
        >
          <Plus size={14} />
          <TranslatedText text="New reservation" />
        </button>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Parking Reservation Request"
        size="xl"
        headerColor="default"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
            <TranslatedText text="Submit your truck parking reservation request and our parking team will review availability and confirm the next steps." />
          </p>
          <ParkingReservationForm
            defaultValues={defaults}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['my-parking-reservations'] });
            }}
          />
        </div>
      </Modal>

      <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-700">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
          <TranslatedText text="My reservations" />
        </h2>

        {query.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2b5271] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : query.isError ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold text-rose-600 mb-4">{getApiErrorMessage(query.error)}</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="text-[10px] font-black uppercase tracking-widest text-[#2b5271]"
            >
              <TranslatedText text="Retry" />
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <ParkingSquare className="mx-auto mb-4 text-slate-300 dark:text-slate-600" size={36} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <TranslatedText text="You have not submitted any parking reservations yet" />
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((row: ParkingReservation) => (
              <div
                key={row.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                      {row.reservationReference}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {String(row.requestedStartDate).slice(0, 10)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} /> {row.facilityName ? `${row.facilityName} · ` : ''}{row.truckSpacesRequested} space{row.truckSpacesRequested === 1 ? '' : 's'} · {row.contractMonths} month{row.contractMonths === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusTone(row.status)}`}>
                      {PARKING_STATUS_LABELS[row.status] || row.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/driver/parking-reservations/${row.id}`)}
                      className="text-[10px] font-black uppercase tracking-widest text-[#2b5271] dark:text-blue-300 hover:underline"
                    >
                      <TranslatedText text="View details" />
                    </button>
                  </div>
                </div>

                {row.status === 'ADDITIONAL_INFORMATION_REQUIRED' && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {row.informationRequested && (
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-3">
                        <span className="font-black uppercase tracking-widest text-[9px] text-amber-600 block mb-1">
                          <TranslatedText text="Information requested" />
                        </span>
                        {row.informationRequested}
                      </p>
                    )}
                    {respondingId === row.id ? (
                      <div className="space-y-3">
                        <textarea
                          rows={3}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                          placeholder="Type your response"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={responseText.trim().length < 2 || respond.isPending}
                            onClick={() => respond.mutate({ id: row.id, text: responseText.trim() })}
                            className="px-4 py-2 rounded-lg bg-[#2b5271] text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                          >
                            <TranslatedText text="Send response" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRespondingId(null); setResponseText(''); }}
                            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest"
                          >
                            <TranslatedText text="Cancel" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRespondingId(row.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-amber-600"
                      >
                        <TranslatedText text="Respond to request" />
                      </button>
                    )}
                  </div>
                )}

                {row.status === 'APPROVED' && isParkingPaymentOpen(row.payment?.status) && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-2">
                      {PARKING_PAYMENT_LABELS[row.payment!.status]} · {formatParkingMoney(row.payment?.totalAmount, row.payment?.currency)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPayingId(row.id)}
                      className="px-4 py-2 rounded-lg bg-[#2b5271] text-white text-[10px] font-black uppercase tracking-widest"
                    >
                      <TranslatedText text="Pay now" />
                    </button>
                  </div>
                )}

                {row.activities && row.activities.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Events and status</p>
                    <ParkingActivityTimeline activities={row.activities} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {payingItem && (
        <ParkingIshemaPayModal
          open={!!payingId}
          onClose={() => setPayingId(null)}
          reservation={payingItem}
          reservationId={payingItem.id}
          onPaid={() => {
            setPayingId(null);
            queryClient.invalidateQueries({ queryKey: ['my-parking-reservations'] });
            toast.success('Payment confirmed. Your reservation is approved.');
          }}
        />
      )}
    </div>
  );
};

export default ParkingReservations;
