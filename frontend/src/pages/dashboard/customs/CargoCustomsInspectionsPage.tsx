import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  ChevronRight,
  FileText,
  Truck,
  MapPin,
  Calendar,
  User,
  Info,
  Send,
  MessageSquare,
  RefreshCw,
  Package,
} from 'lucide-react';
import { customsApi } from '../../../services/customsApi';
import { StatCard } from '@/components/EnliteUI/Cards/StatCard';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  CLEARED: {
    label: 'Cleared',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  ON_HOLD: {
    label: 'On Hold',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  HIGH_RISK: {
    label: 'High Risk',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  PENDING: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

const RISK_CONFIG: Record<string, { label: string; dot: string }> = {
  LOW: { label: 'Low Risk', dot: 'bg-green-500' },
  MEDIUM: { label: 'Medium Risk', dot: 'bg-yellow-500' },
  HIGH: { label: 'High Risk', dot: 'bg-orange-500' },
  CRITICAL: { label: 'Critical', dot: 'bg-red-600' },
};

const CHANNEL_CONFIG: Record<string, { label: string; color: string }> = {
  GREEN: { label: 'Green Lane', color: 'text-green-700 bg-green-50 border-green-200' },
  YELLOW: { label: 'Yellow Lane', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  RED: { label: 'Red Lane', color: 'text-red-700 bg-red-50 border-red-200' },
};

export default function CargoCustomsInspectionsPage() {
  const navigate = useNavigate();
  const { id: urlInspectionId } = useParams<{ id: string }>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInspection, setSelectedInspection] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['myCustomsInspections'],
    queryFn: async () => {
      const res = await customsApi.getMyInspections();
      return (res.data as any)?.data ?? [];
    },
  });

  const inspections: any[] = data ?? [];

  // Auto-open modal when arriving from a notification deep-link (/customs-inspections/:id)
  useEffect(() => {
    if (urlInspectionId && inspections.length > 0 && !selectedInspection) {
      const match = inspections.find((i) => i.id === urlInspectionId);
      if (match) setSelectedInspection(match);
    }
  }, [urlInspectionId, inspections]);

  const filtered = inspections.filter((i) => {
    const matchesSearch =
      !search ||
      i.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
      i.shipmentReference?.toLowerCase().includes(search.toLowerCase()) ||
      i.containerNumber?.toLowerCase().includes(search.toLowerCase()) ||
      i.trip?.load?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: inspections.length,
    cleared: inspections.filter((i) => i.status === 'CLEARED').length,
    pending: inspections.filter((i) => ['PENDING', 'IN_PROGRESS'].includes(i.status)).length,
    attention: inspections.filter((i) => ['REJECTED', 'ON_HOLD', 'HIGH_RISK'].includes(i.status)).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Customs Inspections</h1>
            <p className="text-sm text-gray-500">Track all customs inspections performed on your cargo</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Inspections"
            value={stats.total}
            icon={<Package />}
            color="secondary"
            variant="classic"
          />
          <StatCard
            title="Cleared"
            value={stats.cleared}
            icon={<CheckCircle />}
            color="success"
            variant="classic"
          />
          <StatCard
            title="In Progress"
            value={stats.pending}
            icon={<Clock />}
            color="info"
            variant="classic"
          />
          <StatCard
            title="Need Attention"
            value={stats.attention}
            icon={<AlertTriangle />}
            color="error"
            variant="classic"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by plate, reference, container or cargo title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 text-sm">Failed to load inspections. Please try again.</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {inspections.length === 0 ? 'No customs inspections on your cargo yet' : 'No inspections match your filters'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {inspections.length === 0
                ? 'When a customs officer inspects one of your shipments, it will appear here.'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inspection) => {
              const status = STATUS_CONFIG[inspection.status] ?? STATUS_CONFIG['PENDING'];
              const risk = RISK_CONFIG[inspection.riskLevel] ?? RISK_CONFIG['LOW'];
              const channel = inspection.inspectionChannel ? CHANNEL_CONFIG[inspection.inspectionChannel] : null;

              return (
                <div
                  key={inspection.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedInspection(inspection)}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Top row */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                          {channel && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${channel.color}`}>
                              {channel.label}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <span className={`w-2 h-2 rounded-full ${risk.dot}`} />
                            {risk.label}
                          </span>
                        </div>

                        {/* Cargo title */}
                        <p className="font-semibold text-gray-900 truncate">
                          {inspection.trip?.load?.title || 'Unnamed Shipment'}
                        </p>

                        {/* Meta grid */}
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                          {inspection.plateNumber && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                              {inspection.plateNumber}
                            </span>
                          )}
                          {(inspection.shipmentReference || inspection.containerNumber) && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                              {inspection.shipmentReference || inspection.containerNumber}
                            </span>
                          )}
                          {inspection.location && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              {inspection.location}
                            </span>
                          )}
                          {inspection.createdAt && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                              {new Date(inspection.createdAt).toLocaleDateString(undefined, {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          )}
                          {inspection.officer && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                              <User className="w-3.5 h-3.5 flex-shrink-0" />
                              Officer: {inspection.officer.profile?.firstName
                                ? `${inspection.officer.profile.firstName} ${inspection.officer.profile.lastName}`
                                : inspection.officer.email}
                            </span>
                          )}
                        </div>

                        {/* Rejection reason */}
                        {inspection.rejectionReason && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{inspection.rejectionReason}</span>
                          </div>
                        )}

                        {/* Hold notes */}
                        {inspection.inspectionNotes && inspection.status !== 'CLEARED' && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
                            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{inspection.inspectionNotes}</span>
                          </div>
                        )}
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          onClose={() => {
            setSelectedInspection(null);
            if (urlInspectionId) navigate('/dashboard/customs-inspections');
          }}
        />
      )}
    </div>
  );
}

function InspectionDetailModal({ inspection, onClose }: { inspection: any; onClose: () => void }) {
  const qc = useQueryClient();
  const status = STATUS_CONFIG[inspection.status] ?? STATUS_CONFIG['PENDING'];
  const risk = RISK_CONFIG[inspection.riskLevel] ?? RISK_CONFIG['LOW'];
  const channel = inspection.inspectionChannel ? CHANNEL_CONFIG[inspection.inspectionChannel] : null;
  const isOnHold = inspection.status === 'ON_HOLD';

  const [responseNotes, setResponseNotes] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);

  // Load previous compliance responses
  const { data: responsesData, refetch: refetchResponses } = useQuery({
    queryKey: ['compliance-responses', inspection.id],
    queryFn: () => customsApi.getComplianceResponses(inspection.id),
    enabled: true,
  });
  const responses: any[] = responsesData?.data?.data ?? [];

  const submitMutation = useMutation({
    mutationFn: (notes: string) =>
      customsApi.submitComplianceResponse(inspection.id, { notes }),
    onSuccess: () => {
      toast.success('Compliance response submitted. The customs officer has been notified.');
      setResponseNotes('');
      setShowResponseForm(false);
      refetchResponses();
      qc.invalidateQueries({ queryKey: ['myCustomsInspections'] });
    },
    onError: () => toast.error('Failed to submit response. Please try again.'),
  });

  const handleSubmitResponse = () => {
    if (!responseNotes.trim()) {
      toast.error('Please describe what was resolved or uploaded');
      return;
    }
    submitMutation.mutate(responseNotes.trim());
  };

  const fields: { label: string; value: any }[] = [
    { label: 'Cargo', value: inspection.trip?.load?.title || '—' },
    { label: 'Plate Number', value: inspection.plateNumber || '—' },
    { label: 'Shipment Reference', value: inspection.shipmentReference || '—' },
    { label: 'Container Number', value: inspection.containerNumber || '—' },
    { label: 'Driver', value: inspection.driverName || '—' },
    { label: 'Declaration Number', value: inspection.declarationNumber || '—' },
    { label: 'Mode of Transport', value: inspection.modeOfTransport || '—' },
    { label: 'Country of Origin', value: inspection.countryOfOrigin || '—' },
    { label: 'Exam Type', value: inspection.examType || '—' },
    { label: 'Hold Type', value: inspection.holdType || '—' },
    { label: 'Declared Value', value: inspection.declaredValue ? `${inspection.currency || ''} ${inspection.declaredValue}`.trim() : '—' },
    { label: 'Duty Amount', value: inspection.dutyAmount ?? '—' },
    { label: 'Tax Amount', value: inspection.taxAmount ?? '—' },
    { label: 'Sanctions Screened', value: inspection.sanctionsScreened != null ? (inspection.sanctionsScreened ? 'Yes' : 'No') : '—' },
    { label: 'Denied Party Flag', value: inspection.deniedPartyFlag ? 'Yes — Flagged' : 'No' },
    { label: 'Inspection Started', value: inspection.createdAt ? new Date(inspection.createdAt).toLocaleString() : '—' },
    { label: 'Completed At', value: inspection.completedAt ? new Date(inspection.completedAt).toLocaleString() : '—' },
  ];

  const responseStatusConfig: Record<string, { label: string; color: string }> = {
    SUBMITTED: { label: 'Awaiting Review', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    REVIEWED:  { label: 'Reviewed',        color: 'bg-blue-100 text-blue-700 border-blue-200' },
    ACCEPTED:  { label: 'Accepted',        color: 'bg-green-100 text-green-700 border-green-200' },
    REJECTED:  { label: 'Rejected',        color: 'bg-red-100 text-red-700 border-red-200' },
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Inspection Details</h2>
              <p className="text-xs text-gray-500">Full customs inspection report</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Status banner */}
          <div className={`flex flex-wrap items-center gap-2 p-3 rounded-xl border ${status.color}`}>
            <span className="flex items-center gap-1.5 font-medium text-sm">{status.icon}{status.label}</span>
            <span className="flex items-center gap-1.5 text-sm">
              <span className={`w-2 h-2 rounded-full ${risk.dot}`} />
              {risk.label}
            </span>
            {channel && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${channel.color}`}>
                {channel.label}
              </span>
            )}
          </div>

          {/* Officer rejection reason */}
          {inspection.rejectionReason && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-xl p-3 border border-red-100">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div><span className="font-medium">Rejection Reason: </span>{inspection.rejectionReason}</div>
            </div>
          )}

          {/* Officer hold notes */}
          {inspection.inspectionNotes && (
            <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 rounded-xl p-3 border border-yellow-100">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div><span className="font-medium">Officer Notes: </span>{inspection.inspectionNotes}</div>
            </div>
          )}

          {/* ── COMPLIANCE RESPONSE SECTION (ON_HOLD only) ── */}
          {isOnHold && (
            <div className="border border-amber-200 rounded-xl overflow-hidden">
              <div className="bg-amber-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Action Required — Compliance Response</span>
                </div>
                <button
                  onClick={() => setShowResponseForm(f => !f)}
                  className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg transition-colors"
                >
                  {showResponseForm ? 'Cancel' : 'Submit Response'}
                </button>
              </div>

              {/* Previous responses */}
              {responses.length > 0 && (
                <div className="px-4 py-3 space-y-2 border-b border-amber-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Previous Responses</p>
                  {responses.map((r: any) => {
                    const rCfg = responseStatusConfig[r.status] ?? responseStatusConfig['SUBMITTED'];
                    return (
                      <div key={r.id} className="bg-white border border-gray-100 rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rCfg.color}`}>{rCfg.label}</span>
                        </div>
                        <p className="text-sm text-gray-700">{r.notes}</p>
                        {r.documentIds?.length > 0 && (
                          <p className="text-xs text-gray-400">{r.documentIds.length} document(s) attached</p>
                        )}
                        {r.reviewNotes && (
                          <div className={`mt-1 text-xs rounded-lg px-2 py-1.5 ${r.status === 'ACCEPTED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <span className="font-semibold">Officer: </span>{r.reviewNotes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Response form */}
              {showResponseForm && (
                <div className="px-4 py-3 space-y-3 bg-white">
                  <p className="text-xs text-gray-500">
                    Describe what documents you have uploaded and what issues have been resolved. 
                    Upload your documents first via the cargo documents section, then submit this response.
                  </p>
                  <textarea
                    rows={4}
                    value={responseNotes}
                    onChange={e => setResponseNotes(e.target.value)}
                    placeholder="e.g. Uploaded valid Bill of Lading (BOL-2024-0012) and Phytosanitary Certificate. The weight discrepancy was due to packing materials — corrected manifest attached."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                  <button
                    onClick={handleSubmitResponse}
                    disabled={submitMutation.isPending || !responseNotes.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {submitMutation.isPending
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</>
                      : <><Send className="w-4 h-4" /> Submit Response to Officer</>
                    }
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Inspection fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {fields.map(({ label, value }) => (
              <div key={label} className="border-b border-gray-50 pb-3">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className={`text-sm font-medium ${value === 'Yes — Flagged' ? 'text-red-600' : 'text-gray-900'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
