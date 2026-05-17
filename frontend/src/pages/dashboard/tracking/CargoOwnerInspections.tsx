import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Package,
  User,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  FileText,
  Camera,
  PenLine,
} from "lucide-react";
import api from "@/services/api";
import { cn } from "@/utils/cn";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";

interface Inspection {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DISPUTED";
  loadId: string;
  loadTitle: string;
  loadReference?: string;
  receiverId: string;
  receiverName?: string;
  receiverEmail?: string;
  receiverPhone?: string;
  checklist: Array<{
    id: string;
    label: string;
    originalValue?: any;
    verified: boolean;
    notes?: string;
    discrepancy?: boolean;
    category?: string;
  }>;
  overallNotes?: string;
  allItemsVerified: boolean;
  verifiedCount: number;
  totalItems: number;
  discrepancyCount: number;
  discrepancies?: Array<{
    itemId: string;
    itemLabel: string;
    originalValue: any;
    receivedValue?: any;
    notes: string;
  }>;
  documents?: Array<{
    id: string;
    url: string;
    type: 'photo' | 'document' | 'signature';
    label?: string;
    uploadedAt: string;
  }>;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface InspectionsResponse {
  success: boolean;
  data: {
    inspections: Inspection[];
    total: number;
    summary: {
      pending: number;
      inProgress: number;
      completed: number;
      disputed: number;
      withDiscrepancies: number;
    };
  };
}

const statusConfig = {
  PENDING: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, label: "Pending" },
  IN_PROGRESS: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: ClipboardCheck, label: "In Progress" },
  COMPLETED: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle, label: "Completed" },
  DISPUTED: { color: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle, label: "Disputed" },
};

const CargoOwnerInspections = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Inspection["status"]>("all");
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [expandedInspections, setExpandedInspections] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery<InspectionsResponse>({
    queryKey: ["cargo-owner-inspections"],
    queryFn: () => api.get("/receivers/inspections/my-loads").then((res) => res.data),
  });

  const inspections = data?.data?.inspections || [];
  const summary = data?.data?.summary;

  const toggleExpand = (id: string) => {
    setExpandedInspections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredInspections = inspections.filter((inspection) => {
    // Status filter
    if (statusFilter !== "all" && inspection.status !== statusFilter) return false;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        inspection.loadTitle?.toLowerCase().includes(searchLower) ||
        inspection.loadReference?.toLowerCase().includes(searchLower) ||
        inspection.receiverName?.toLowerCase().includes(searchLower) ||
        inspection.receiverEmail?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#345E85] rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Inspections...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle size={48} className="text-rose-500" />
        <p className="text-lg font-bold text-slate-700">Failed to load inspections</p>
        <p className="text-sm text-slate-500">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-slate-900">{summary.completed}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-amber-600">{summary.pending}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-blue-600">{summary.inProgress}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Progress</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-rose-600">{summary.disputed}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disputed</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-orange-600">{summary.withDiscrepancies}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">With Issues</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by cargo, reference, or receiver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#345E85] outline-none transition-all placeholder-slate-400"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {(["all", "PENDING", "IN_PROGRESS", "COMPLETED", "DISPUTED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap",
                  statusFilter === status
                    ? "bg-[#345E85] text-white shadow-md"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                {status === "all" ? "All" : status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inspections List */}
      {filteredInspections.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ClipboardCheck size={40} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">No inspections found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            {search || statusFilter !== "all"
              ? "Try adjusting your filters to find what you're looking for."
              : "When cargo receivers inspect your delivered loads, their reports will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInspections.map((inspection) => {
            const status = statusConfig[inspection.status];
            const StatusIcon = status.icon;
            const isExpanded = expandedInspections.has(inspection.id);

            return (
              <div
                key={inspection.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Header - Always visible */}
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleExpand(inspection.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#345E85]">
                        <Package size={24} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{inspection.loadTitle}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Ref: {inspection.loadReference || inspection.loadId.slice(0, 8)}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border", status.color)}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            <Calendar size={10} className="inline mr-1" />
                            {new Date(inspection.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-700">{inspection.receiverName || "Unknown Receiver"}</p>
                        <p className="text-[10px] text-slate-400">{inspection.verifiedCount}/{inspection.totalItems} verified</p>
                      </div>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          inspection.discrepancyCount > 0 ? "bg-rose-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${(inspection.verifiedCount / Math.max(inspection.totalItems, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100">
                    {/* Receiver Info */}
                    <div className="py-4 border-b border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Receiver Information</h4>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <User size={14} className="text-slate-400" />
                          <span className="font-medium">{inspection.receiverName || "N/A"}</span>
                        </div>
                        {inspection.receiverEmail && (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Mail size={14} className="text-slate-400" />
                            <span>{inspection.receiverEmail}</span>
                          </div>
                        )}
                        {inspection.receiverPhone && (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Phone size={14} className="text-slate-400" />
                            <span>{inspection.receiverPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Summary */}
                    <div className="py-4 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Checklist</h4>
                        {inspection.allItemsVerified && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider">
                            All Verified
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {inspection.checklist.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "flex items-start gap-2 p-2.5 rounded-lg border",
                              item.verified
                                ? "bg-emerald-50/50 border-emerald-100"
                                : item.discrepancy
                                ? "bg-rose-50/50 border-rose-100"
                                : "bg-slate-50 border-slate-100"
                            )}
                          >
                            {item.verified ? (
                              <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                            ) : item.discrepancy ? (
                              <XCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                            ) : (
                              <Clock size={14} className="text-amber-400 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700">{item.label}</p>
                              {item.originalValue && (
                                <p className="text-[10px] text-slate-500">Expected: {String(item.originalValue)}</p>
                              )}
                              {item.notes && (
                                <p className="text-[10px] text-slate-500 mt-1 italic">"{item.notes}"</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Discrepancies */}
                    {inspection.discrepancies && inspection.discrepancies.length > 0 && (
                      <div className="py-4 border-b border-slate-100">
                        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Discrepancies ({inspection.discrepancies.length})
                        </h4>
                        <div className="space-y-2">
                          {inspection.discrepancies.map((d, i) => (
                            <div key={i} className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                              <p className="text-xs font-bold text-rose-700">{d.itemLabel}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px]">
                                <span className="text-rose-600">Expected: {String(d.originalValue)}</span>
                                {d.receivedValue && (
                                  <>
                                    <span className="text-slate-400">→</span>
                                    <span className="text-rose-800 font-bold">Received: {String(d.receivedValue)}</span>
                                  </>
                                )}
                              </div>
                              {d.notes && <p className="text-[10px] text-rose-600 mt-2 italic">"{d.notes}"</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Overall Notes */}
                    {inspection.overallNotes && (
                      <div className="py-4 border-b border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Receiver Notes</h4>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <p className="text-sm text-amber-800 leading-relaxed">{inspection.overallNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Documents & Photos */}
                    {inspection.documents && inspection.documents.length > 0 && (
                      <div className="py-4 border-b border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                          <FileText size={12} />
                          Documents & Photos ({inspection.documents.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {inspection.documents.map((doc, i) => (
                            <a
                              key={doc.id || i}
                              href={doc.url.startsWith('http') ? doc.url : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:3001'}/${doc.url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="group"
                            >
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-[#345E85] transition-all hover:shadow-md">
                                {doc.type === 'photo' ? (
                                  <div className="h-24 overflow-hidden">
                                    <img
                                      src={doc.url.startsWith('http') ? doc.url : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:3001'}/${doc.url}`}
                                      alt={doc.label || `Photo ${i + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  </div>
                                ) : doc.type === 'signature' ? (
                                  <div className="h-24 bg-slate-50 flex items-center justify-center">
                                    <PenLine size={24} className="text-slate-400" />
                                  </div>
                                ) : (
                                  <div className="h-24 bg-slate-50 flex items-center justify-center">
                                    <FileText size={24} className="text-slate-400" />
                                  </div>
                                )}
                                <div className="p-2">
                                  <p className="text-[10px] font-bold text-slate-700 truncate">{doc.label || doc.type}</p>
                                  <p className="text-[9px] text-slate-400 capitalize">{doc.type}</p>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="pt-4 flex flex-wrap gap-4 text-[10px] text-slate-400">
                      <span>Created: {new Date(inspection.createdAt).toLocaleString()}</span>
                      {inspection.completedAt && (
                        <span className="text-emerald-600 font-medium">
                          Completed: {new Date(inspection.completedAt).toLocaleString()}
                        </span>
                      )}
                      <span>Updated: {new Date(inspection.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedInspection} onOpenChange={() => setSelectedInspection(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inspection Details</DialogTitle>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-4">
              {/* Modal content can be expanded here */}
              <p className="text-sm text-slate-600">Detailed view coming soon...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CargoOwnerInspections;
