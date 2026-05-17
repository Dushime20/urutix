import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package, Clock, MapPin, User, AlertCircle,
  CheckCircle2, Loader2, ChevronRight
} from 'lucide-react';
import api from '../../services/api';

interface PendingDeliveriesListProps {
  className?: string;
}

const PendingDeliveriesList: React.FC<PendingDeliveriesListProps> = ({ className = '' }) => {
  // Fetch pending ePODs for cargo receiver
  const { data: epodsRes, isLoading, error } = useQuery({
    queryKey: ['cargo-receiver-pending-epods'],
    queryFn: () => api.get('/receivers/my/epods?status=PENDING').then(res => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const pendingEpods = epodsRes?.data?.epods || [];

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Failed to load pending deliveries
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Pending Deliveries
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Awaiting your confirmation
              </p>
            </div>
          </div>
          {pendingEpods.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {pendingEpods.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {pendingEpods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              All Caught Up!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
              No pending deliveries to confirm. You'll be notified when new deliveries arrive.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingEpods.map((epod: any) => (
              <Link
                key={epod.id}
                to={`/dashboard/cargos/${epod.loadId}/inspect`}
                className="block group"
              >
                <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all duration-200">
                  {/* Trip Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                          Trip #{epod.tripId?.slice(0, 8)}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <User className="w-3 h-3" />
                          <span>{epod.recipientName || 'Unknown Recipient'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        Pending
                      </span>
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="space-y-2 mb-3">
                    {epod.deliveryCoordinates && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {epod.deliveryCoordinates.latitude.toFixed(4)}, {epod.deliveryCoordinates.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>
                        Delivered: {new Date(epod.submittedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {epod.deliveryNotes && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-2 mt-2">
                        <span className="font-semibold">Note:</span> {epod.deliveryNotes}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      {epod.photoUrls?.length > 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          📸 {epod.photoUrls.length} photo{epod.photoUrls.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {epod.signatureFileUrl && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ✍️ Signed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 group-hover:gap-3 transition-all">
                      <span className="text-sm font-bold">Confirm Delivery</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Quick Stats */}
      {pendingEpods.length > 0 && (
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              {pendingEpods.length} delivery{pendingEpods.length !== 1 ? 'ies' : 'y'} awaiting confirmation
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              Action required
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingDeliveriesList;
