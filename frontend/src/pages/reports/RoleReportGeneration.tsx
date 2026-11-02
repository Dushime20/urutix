import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  exportRows,
  reportLabel,
  formatFinancialValue,
  type ExportFormat,
} from "./reportExports";
import {
  AlertTriangle,
  Headphones,
  Scale,
  Truck,
  Users,
  Navigation,
  Package,
  Warehouse,
  FileText,
  CreditCard,
  Wallet,
  FileSpreadsheet,
  Download,
  Search,
  RefreshCw,
  Filter,
  Calendar,
  ChevronDown,
  Landmark,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";
import { TranslatedText } from "../../components/translated-text";
import { useAuth } from "../../contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { reportsApi } from "../../services/reportsApi";
import { PRIORITY_LABELS } from "../../types/dispute";
import {
  StandardDataTable,
  type Column,
} from "../../components/EnliteUI/Tables";
import AdminPageLayout from "../../components/Admin/AdminPageLayout";

type ReportId =
  | "revenue"
  | "safety"
  | "incidents"
  | "tenants"
  | "auctions"
  | "bids"
  | "matches"
  | "commissions"
  | "disbursements"
  | "issues"
  | "support"
  | "disputes"
  | "fleet"
  | "drivers"
  | "trips"
  | "cargo"
  | "parking"
  | "users"
  | "invoices"
  | "payments"
  | "credits"
  | "loans"
  | "repayments"
  | "inspections";

type Row = Record<string, string | number>;

interface ReportDef {
  id: ReportId;
  label: string;
  description: string;
  group: string;
  icon: typeof Truck;
}

const REPORTS: ReportDef[] = [
  {
    id: "revenue",
    label: "Settled Revenue",
    description: "Recorded settled revenue and platform fees",
    group: "Commercial",
    icon: FileSpreadsheet,
  },
  {
    id: "safety",
    label: "Safety Inspections",
    description: "Recorded driver and truck safety checks",
    group: "Operations",
    icon: FileSpreadsheet,
  },
  {
    id: "incidents",
    label: "Safety Incidents",
    description: "Recorded incidents and investigation status",
    group: "Operations",
    icon: FileSpreadsheet,
  },
  {
    id: "tenants",
    label: "Tenants",
    description: "Platform tenant activity",
    group: "Operations",
    icon: FileSpreadsheet,
  },
  {
    id: "auctions",
    label: "Auctions",
    description: "Recorded auctions and winning bids",
    group: "Operations",
    icon: FileSpreadsheet,
  },
  {
    id: "bids",
    label: "Bids",
    description: "Submitted bids and acceptance outcomes",
    group: "Operations",
    icon: FileSpreadsheet,
  },
  {
    id: "matches",
    label: "Smart Matching",
    description: "Recorded cargo and truck matching outcomes",
    group: "Operations",
    icon: FileSpreadsheet,
  },
  {
    id: "commissions",
    label: "Broker Commissions",
    description: "Configured commissions and payment status",
    group: "Commercial",
    icon: FileSpreadsheet,
  },
  {
    id: "disbursements",
    label: "Disbursements",
    description: "Actual loan disbursement records",
    group: "Commercial",
    icon: FileSpreadsheet,
  },
  {
    id: "issues",
    label: "Issues",
    description: "Delays, damage, billing, and operational problems",
    group: "Support Center",
    icon: AlertTriangle,
  },
  {
    id: "support",
    label: "Support",
    description: "Technical help, account, and feature requests",
    group: "Support Center",
    icon: Headphones,
  },
  {
    id: "disputes",
    label: "Disputes",
    description: "Complaints, contract conflicts, fraud, and claims",
    group: "Support Center",
    icon: Scale,
  },
  {
    id: "fleet",
    label: "Fleet",
    description: "Trucks, status, utilization, and compliance dates",
    group: "Operations",
    icon: Truck,
  },
  {
    id: "drivers",
    label: "Drivers",
    description: "Driver roster, licenses, and availability",
    group: "Operations",
    icon: Users,
  },
  {
    id: "trips",
    label: "Trips",
    description: "Trip activity, status, and routing",
    group: "Operations",
    icon: Navigation,
  },
  {
    id: "cargo",
    label: "Cargo",
    description: "Loads, pickup/delivery, and cargo value",
    group: "Operations",
    icon: Package,
  },
  {
    id: "parking",
    label: "Parking Reservations",
    description: "Facility reservations and review status",
    group: "Operations",
    icon: Warehouse,
  },
  {
    id: "inspections",
    label: "Inspections",
    description: "Customs inspections linked to your cargo or trips",
    group: "Operations",
    icon: ClipboardCheck,
  },
  {
    id: "users",
    label: "Users",
    description: "Tenant staff and partner accounts",
    group: "Commercial",
    icon: Users,
  },
  {
    id: "invoices",
    label: "Invoices",
    description: "Issued invoices and outstanding balances",
    group: "Commercial",
    icon: FileText,
  },
  {
    id: "payments",
    label: "Payments",
    description: "Payment activity on your account",
    group: "Commercial",
    icon: CreditCard,
  },
  {
    id: "credits",
    label: "Credits",
    description: "Credit purchases, usage, and adjustments",
    group: "Commercial",
    icon: Wallet,
  },
  {
    id: "loans",
    label: "Loans",
    description: "Loan requests you borrowed or funded",
    group: "Commercial",
    icon: Landmark,
  },
  {
    id: "repayments",
    label: "Repayments",
    description: "Loan repayment activity on your book",
    group: "Commercial",
    icon: Landmark,
  },
];

const GROUPS = ["Support Center", "Operations", "Commercial"];

function downloadBlob(blob: Blob, filename: string) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: filename,
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4_000);
}

const RoleReportGeneration: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const catalogQuery = useQuery({
    queryKey: ["report-catalog", user?.id, user?.role, user?.tenantId],
    queryFn: reportsApi.catalog,
    enabled: Boolean(user?.id),
  });
  const catalog = useMemo(
    () =>
      REPORTS.filter((r) => catalogQuery.data?.some((c) => c.id === r.id)).map(
        (r) => ({
          ...r,
          statuses: (
            catalogQuery.data?.find((c) => c.id === r.id)?.statuses || []
          ).map((value) => ({ value, label: value.replace(/_/g, " ") })),
        }),
      ),
    [catalogQuery.data],
  );
  const [reportId, setReportId] = useState<ReportId>(
    catalog[0]?.id || "issues",
  );
  const [reportGroup, setReportGroup] = useState("");
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [tenantId, setTenantId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [cargoOwnerId, setCargoOwnerId] = useState("");
  const [preset, setPreset] = useState("all");
  const dateError =
    preset === "date" && !dateFrom
      ? "Choose a report date."
      : dateFrom && dateTo && dateFrom > dateTo
        ? "Start date must be on or before the end date."
        : "";
  const filters = {
    category: reportId,
    status: status || undefined,
    priority: ["issues", "support", "disputes"].includes(reportId)
      ? priority || undefined
      : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search || undefined,
    tenantId: tenantId || undefined,
    truckId: truckId || undefined,
    driverId: driverId || undefined,
    cargoOwnerId: cargoOwnerId || undefined,
  };
  useEffect(() => {
    setPageNumber(1);
  }, [
    reportId,
    status,
    priority,
    search,
    dateFrom,
    dateTo,
    tenantId,
    truckId,
    driverId,
    cargoOwnerId,
  ]);
  const applyPreset = (value: string) => {
    setPreset(value);
    if (value === "date") {
      const selected = dateFrom || dateTo;
      setDateFrom(selected);
      setDateTo(selected);
      return;
    }
    if (value === "custom") return;
    if (value === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const now = new Date();
    let start = new Date();
    let end = new Date();
    if (value === "yesterday") {
      start.setUTCDate(now.getUTCDate() - 1);
      end = new Date(start);
    }
    if (value === "7" || value === "30")
      start.setUTCDate(now.getUTCDate() - Number(value) + 1);
    if (value === "month")
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    if (value === "previous") {
      start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
      );
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
    }
    if (value === "year")
      start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    setDateFrom(start.toISOString().slice(0, 10));
    setDateTo(end.toISOString().slice(0, 10));
  };

  useEffect(() => {
    if (!catalog.some((r) => r.id === reportId) && catalog[0]) {
      setReportId(catalog[0].id);
    }
  }, [catalog, reportId]);

  const def = catalog.find((r) => r.id === reportId) || catalog[0];
  const availableGroups = GROUPS.filter((group) =>
    catalog.some((r) => r.group === group),
  );
  const activeGroup = availableGroups.includes(reportGroup)
    ? reportGroup
    : def?.group;
  const groupReports = catalog.filter((r) => r.group === activeGroup);
  const isTicketReport =
    reportId === "issues" || reportId === "support" || reportId === "disputes";
  const isAdminShell = location.pathname.startsWith("/admin/reports");

  const query = useQuery({
    queryKey: [
      "role-report",
      user?.id,
      user?.role,
      user?.tenantId,
      filters,
      pageNumber,
    ],
    enabled: Boolean(
      user?.id && catalog.some((r) => r.id === reportId) && !dateError,
    ),
    queryFn: () =>
      reportsApi.getMyReport({ ...filters, page: pageNumber, pageSize: 50 }),
    staleTime: 0,
  });
  const filteredRows = query.data?.rows ?? [];
  const headers = query.data?.headers ?? [];

  const previewColumns = useMemo<Column<Row>[]>(
    () =>
      headers.map((h) => ({
        key: h,
        label: reportLabel(h),
        sortable: false,
        render: (v) => (
          <span className="text-xs text-gray-700 dark:text-slate-300 whitespace-nowrap">
            {String(v ?? "—")}
          </span>
        ),
      })),
    [headers],
  );

  const handleGenerate = async (requestedFormat: ExportFormat = format) => {
    if (!def || dateError) return;
    const printWindow =
      requestedFormat === "print" ? window.open("", "_blank") : null;
    try {
      if (requestedFormat === "print" && !printWindow)
        throw new Error("Allow pop-ups to open the print view");
      if (printWindow)
        printWindow.document.title = "Preparing URUTIX report...";
      setGenerating(true);
      if (requestedFormat === "csv")
        downloadBlob(
          await reportsApi.exportCsv(filters),
          `${reportId}-${new Date().toISOString().slice(0, 10)}.csv`,
        );
      else {
        const report = await reportsApi.exportData(filters);
        if (requestedFormat === "print")
          exportRows(requestedFormat, report, printWindow);
        else exportRows(requestedFormat, report);
      }
      toast.success(
        requestedFormat === "print"
          ? "Print view opened"
          : `${def.label} report downloaded`,
      );
    } catch (err: any) {
      printWindow?.close();
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to generate report",
      );
    } finally {
      setGenerating(false);
    }
  };

  const page = (
    <div className="space-y-5">
      {catalogQuery.isError && (
        <p role="alert" className="text-red-600">
          Unable to load available reports.{" "}
          <button onClick={() => catalogQuery.refetch()}>Retry</button>
        </p>
      )}
      {catalogQuery.isLoading && (
        <div
          className="h-24 animate-pulse bg-slate-100 rounded-xl"
          aria-label="Loading report categories"
        />
      )}
      {!catalogQuery.isLoading && !catalogQuery.isError && !catalog.length && (
        <p>No reports are available for your account.</p>
      )}
      {!isAdminShell && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#2c5173] flex items-center justify-center shadow-sm">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#358b9b] dark:text-cyan-400">
                  Reporting workspace
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  <TranslatedText text="Generate Reports" />
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <TranslatedText text="Filter your own records and export as CSV, Excel, or PDF" />
            </p>
          </div>
          <button
            onClick={() => query.refetch()}
            className="self-start sm:self-center px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#358b9b] focus-visible:ring-offset-2 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh data
          </button>
        </div>
      )}

      {isAdminShell && (
        <div className="flex justify-end">
          <button
            onClick={() => query.refetch()}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh data
          </button>
        </div>
      )}

      {catalog.length > 0 && (
        <section
          aria-labelledby="report-picker-heading"
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2c5173]/10 text-xs font-bold text-[#2c5173] dark:bg-slate-700 dark:text-slate-200">
                01
              </span>
              <div>
                <h2
                  id="report-picker-heading"
                  className="text-sm font-bold text-slate-900 dark:text-white"
                >
                  Choose your report
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Select a report, then choose dates and export below.
                </p>
              </div>
            </div>
            {def && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#358b9b]/10 px-3 py-1.5 text-xs font-semibold text-[#2c5173] dark:bg-cyan-400/10 dark:text-cyan-300">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {def.label} selected
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row">
            <nav
              aria-label="Report categories"
              className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50/70 p-3 md:w-52 md:shrink-0 md:flex-col md:border-b-0 md:border-r md:p-4 dark:border-slate-700 dark:bg-slate-900/30"
            >
              {availableGroups.map((group) => {
                const selected = activeGroup === group;
                return (
                  <button
                    key={group}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setReportGroup(group)}
                    className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#358b9b] ${selected ? "bg-[#2c5173] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"}`}
                  >
                    {group}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${selected ? "bg-white/15 text-white" : "bg-slate-200/60 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}
                    >
                      {catalog.filter((r) => r.group === group).length}
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="min-w-0 flex-1 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {activeGroup}
                </h3>
                <span className="text-xs text-slate-400">
                  Choose one report
                </span>
              </div>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
                {groupReports.map((r) => {
                  const active = r.id === reportId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setReportId(r.id);
                        setStatus("");
                        setPriority("");
                        setTruckId("");
                        setDriverId("");
                        setCargoOwnerId("");
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#358b9b] ${active ? "bg-[#358b9b]/[0.08] dark:bg-cyan-500/10" : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/50"}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-[#358b9b] dark:border-cyan-400" : "border-slate-300 dark:border-slate-500"}`}
                      >
                        {active && (
                          <span className="h-2 w-2 rounded-full bg-[#358b9b] dark:bg-cyan-400" />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-5">
                        <span
                          className={`text-sm font-semibold sm:w-40 sm:shrink-0 ${active ? "text-[#2c5173] dark:text-cyan-300" : "text-slate-800 dark:text-slate-100"}`}
                        >
                          {r.label}
                        </span>
                        <span className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {r.description}
                        </span>
                      </span>
                      {active && (
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-[#358b9b] dark:text-cyan-400"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {def && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#2c5173]" />
            <p className="text-sm font-black text-gray-900 dark:text-white">
              Filters · {def.label}
            </p>
          </div>
          <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <legend className="px-1 text-sm font-bold text-[#2c5173] dark:text-slate-200">
              <Calendar className="mr-1.5 inline h-4 w-4" />
              Report dates
            </legend>
            <p
              id="report-date-help"
              className="mb-3 text-xs text-slate-500 dark:text-slate-400"
            >
              Choose a specific day or a date range. Both dates include the full
              day (UTC). The same dates apply to the preview and every export.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Reporting period
                <select
                  aria-label="Reporting period (UTC)"
                  value={preset}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="rounded-xl border p-2 text-xs dark:bg-slate-700"
                >
                  {[
                    ["all", "All time"],
                    ["today", "Today"],
                    ["yesterday", "Yesterday"],
                    ["7", "Last 7 days"],
                    ["30", "Last 30 days"],
                    ["month", "This month"],
                    ["previous", "Previous month"],
                    ["year", "This year"],
                    ["date", "Specific date"],
                    ["custom", "Custom range"],
                  ].map(([v, label]) => (
                    <option key={v} value={v}>
                      {label} (UTC)
                    </option>
                  ))}
                </select>
              </label>
              {preset === "date" ? (
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Report date
                  <input
                    type="date"
                    aria-label="Report date"
                    value={dateFrom}
                    aria-describedby={
                      dateError ? "report-date-error" : "report-date-help"
                    }
                    aria-invalid={Boolean(dateError)}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setDateTo(e.target.value);
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-600 dark:bg-slate-700"
                  />
                </label>
              ) : (
                <>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                    Start date
                    <input
                      type="date"
                      aria-label="Start date"
                      value={dateFrom}
                      max={dateTo || undefined}
                      aria-invalid={Boolean(dateError)}
                      aria-describedby={
                        dateError ? "report-date-error" : "report-date-help"
                      }
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setPreset("custom");
                      }}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-600 dark:bg-slate-700"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                    End date
                    <input
                      type="date"
                      aria-label="End date"
                      value={dateTo}
                      min={dateFrom || undefined}
                      aria-invalid={Boolean(dateError)}
                      aria-describedby={
                        dateError ? "report-date-error" : "report-date-help"
                      }
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setPreset("custom");
                      }}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-600 dark:bg-slate-700"
                    />
                  </label>
                </>
              )}
              <button
                type="button"
                onClick={() => applyPreset("all")}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-[#2c5173] dark:text-slate-200"
              >
                Clear dates
              </button>
            </div>
            {dateError && (
              <p
                id="report-date-error"
                role="alert"
                className="mt-3 text-xs text-red-600 dark:text-red-400"
              >
                {dateError}
              </p>
            )}
          </fieldset>
          <div className="flex flex-wrap gap-2">
            {user?.role === "SUPER_ADMIN" && (
              <input
                aria-label="Tenant ID or * for all tenants"
                placeholder="Tenant UUID or * for platform"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="rounded-xl border p-2 text-xs dark:bg-slate-700"
              />
            )}
            {["trips", "fleet", "matches", "safety", "incidents"].includes(
              reportId,
            ) && (
              <input
                aria-label="Truck ID"
                placeholder="Truck UUID (optional)"
                value={truckId}
                onChange={(e) => setTruckId(e.target.value)}
                className="rounded-xl border p-2 text-xs dark:bg-slate-700"
              />
            )}
            {["trips", "drivers", "safety", "incidents"].includes(reportId) && (
              <input
                aria-label="Driver ID"
                placeholder="Driver UUID (optional)"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="rounded-xl border p-2 text-xs dark:bg-slate-700"
              />
            )}
            {["trips", "cargo", "auctions", "bids", "matches"].includes(
              reportId,
            ) && (
              <input
                aria-label="Cargo owner ID"
                placeholder="Cargo owner UUID (optional)"
                value={cargoOwnerId}
                onChange={(e) => setCargoOwnerId(e.target.value)}
                className="rounded-xl border p-2 text-xs dark:bg-slate-700"
              />
            )}
            <button
              disabled={
                generating ||
                query.isFetching ||
                query.isError ||
                !query.data ||
                Boolean(dateError)
              }
              onClick={() => handleGenerate("print")}
              className="rounded-xl border px-3 py-2 text-xs"
            >
              Print report
            </button>
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search within this report..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-[#2c5173] dark:text-slate-200"
              />
            </div>
            {def.statuses.length > 0 && (
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#2c5173] dark:text-slate-200"
                >
                  <option value="">All statuses</option>
                  {def.statuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
              </div>
            )}
            {isTicketReport && (
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#2c5173] dark:text-slate-200"
                >
                  <option value="">All priorities</option>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Export format
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-lg">
              {[
                {
                  id: "csv" as const,
                  label: "CSV",
                  hint: "Spreadsheets & imports",
                  icon: FileText,
                },
                {
                  id: "xlsx" as const,
                  label: "Excel",
                  hint: "Formatted workbook",
                  icon: FileSpreadsheet,
                },
                {
                  id: "pdf" as const,
                  label: "PDF",
                  hint: "Printable document",
                  icon: Download,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                    format === f.id
                      ? "border-[#2c5173] bg-[#2c5173]/5 text-[#2c5173]"
                      : "border-gray-200 dark:border-slate-700 text-gray-500 hover:border-[#2c5173]/40"
                  }`}
                >
                  <f.icon className="w-5 h-5" />
                  <span className="text-xs font-black">{f.label}</span>
                  <span className="text-[10px] opacity-70">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <span className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-[#2c5173] dark:text-slate-300 rounded-xl text-xs font-bold">
              {query.isLoading ? "Loading…" : `${filteredRows.length} rows`}
            </span>
            <button
              onClick={() => handleGenerate()}
              disabled={
                generating ||
                query.isFetching ||
                query.isError ||
                !query.data ||
                Boolean(dateError)
              }
              className="px-4 py-2.5 bg-[#2c5173] text-white rounded-xl text-xs font-bold hover:bg-[#1e3a54] disabled:opacity-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {generating
                ? "Generating…"
                : `Generate ${def.label} ${format.toUpperCase()}`}
            </button>
          </div>
        </div>
      )}

      {reportId === "commissions" && (
        <p className="text-xs text-slate-500">
          Commission currency is not recorded. Amounts are shown individually
          and are not combined.
        </p>
      )}
      {query.data && !query.isError && (
        <section aria-label="Report summary" className="space-y-3">
          <p className="text-xs text-slate-500">
            {query.data.metadata.period} (
            {query.data.metadata.dateBasis || "Record creation date"}) |{" "}
            {query.data.total.toLocaleString()} matching records | Export limit:
            5,000 records
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(query.data.summary.metrics).map(
              ([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border p-4 dark:border-slate-700"
                >
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-xl font-bold">
                    {value.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })}
                  </p>
                </div>
              ),
            )}
            {query.data.summary.statuses.map((s) => (
              <div
                key={s.status}
                className="rounded-xl border p-4 dark:border-slate-700"
              >
                <p className="text-xs text-slate-500">{s.status}</p>
                <p className="text-xl font-bold">{s.count.toLocaleString()}</p>
              </div>
            ))}
          </div>
          {query.data.metadata.balanceBasis && (
            <p className="text-xs text-slate-500">
              {query.data.metadata.balanceBasis}
            </p>
          )}
          {query.data.summary.amounts.map((a, i) => (
            <p key={i} className="text-sm">
              {String(a.currency || "Unspecified currency")} |{" "}
              {String(a.status || "")}:{" "}
              {Object.entries(a)
                .filter(([k]) => k !== "currency" && k !== "status")
                .map(
                  ([k, v]) => `${reportLabel(k)}: ${formatFinancialValue(v)}`,
                )
                .join(" | ")}
            </p>
          ))}
          {query.data.summary.trends.length > 1 && (
            <div className="h-48" aria-label="Monthly record counts">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={query.data.summary.trends}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2c5173" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {query.data.summary.breakdowns.length > 0 && (
            <details className="rounded-xl border p-3 dark:border-slate-700">
              <summary className="cursor-pointer text-sm font-bold">
                Activity and performance by participant (top 20 per group)
              </summary>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr>
                      <th scope="col">Group</th>
                      <th scope="col">Participant</th>
                      <th scope="col">Records</th>
                      <th scope="col">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.summary.breakdowns.map((b, i) => (
                      <tr key={i}>
                        <td className="py-2">{b.dimension}</td>
                        <td>{b.key}</td>
                        <td>{b.count.toLocaleString()}</td>
                        <td>
                          {b.completed == null
                            ? "-"
                            : b.completed.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
          <div className="flex gap-4 items-center text-sm">
            <button
              disabled={pageNumber === 1 || query.isFetching}
              onClick={() => setPageNumber((n) => n - 1)}
            >
              Previous
            </button>
            <span>
              Page {pageNumber} of{" "}
              {Math.max(1, Math.ceil(query.data.total / 50))}
            </span>
            <button
              disabled={pageNumber * 50 >= query.data.total || query.isFetching}
              onClick={() => setPageNumber((n) => n + 1)}
            >
              Next
            </button>
          </div>
        </section>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden p-2">
        {query.isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#2c5173] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400">
              Loading {def?.label.toLowerCase()} data...
            </p>
          </div>
        ) : query.isError ? (
          <div className="p-12 text-center text-xs text-red-500">
            {(query.error as any)?.response?.data?.message ||
              "Could not load this report. Try another category or refresh."}
          </div>
        ) : (
          <StandardDataTable<Row>
            embedded
            columns={previewColumns}
            data={filteredRows}
            getRowId={(_, i) => String(i)}
            searchable={false}
            stickyHeader
            pagination={false}
            emptyMessage={`No ${def?.label.toLowerCase() || "records"} match the selected filters`}
            ariaLabel={`${def?.label || "Report"} preview`}
          />
        )}
      </div>
    </div>
  );

  if (isAdminShell) {
    return (
      <AdminPageLayout
        title="Generate Reports"
        description="Filter records in your tenant and export as CSV, Excel, or PDF. Each user only sees their own data."
      >
        {page}
      </AdminPageLayout>
    );
  }

  return page;
};

export default RoleReportGeneration;
