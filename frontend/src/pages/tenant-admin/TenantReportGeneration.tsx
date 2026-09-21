import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  AlertTriangle, Headphones, Scale, Truck, Users, Navigation, Package,
  Warehouse, FileText, CreditCard, Wallet, FileSpreadsheet, Download,
  Search, RefreshCw, Filter, Calendar, ChevronDown,
} from 'lucide-react';
import { TranslatedText } from '../../components/translated-text';
import { useAuth } from '../../contexts/AuthContext';
import { tenantApi } from '../../services/tenantApi';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../types/dispute';
import { PARKING_STATUS_LABELS } from '../../types/parking';
import { StandardDataTable, type Column } from '../../components/EnliteUI/Tables';

type ExportFormat = 'csv' | 'xlsx' | 'pdf';
type ReportId =
  | 'issues' | 'support' | 'disputes'
  | 'fleet' | 'drivers' | 'trips' | 'cargo' | 'parking'
  | 'users' | 'invoices' | 'payments' | 'credits';

type Row = Record<string, string | number>;

interface ReportDef {
  id: ReportId;
  label: string;
  description: string;
  group: string;
  icon: typeof Truck;
  statuses: { value: string; label: string }[];
}

const TICKET_STATUSES = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
const PARKING_STATUSES = Object.entries(PARKING_STATUS_LABELS).map(([value, label]) => ({ value, label }));

const REPORTS: ReportDef[] = [
  { id: 'issues', label: 'Issues', description: 'Delays, damage, billing, and operational problems', group: 'Support Center', icon: AlertTriangle, statuses: TICKET_STATUSES },
  { id: 'support', label: 'Support', description: 'Technical help, account, and feature requests', group: 'Support Center', icon: Headphones, statuses: TICKET_STATUSES },
  { id: 'disputes', label: 'Disputes', description: 'Complaints, contract conflicts, fraud, and claims', group: 'Support Center', icon: Scale, statuses: TICKET_STATUSES },
  { id: 'fleet', label: 'Fleet', description: 'Trucks, status, utilization, and compliance dates', group: 'Operations', icon: Truck, statuses: [
    { value: 'AVAILABLE', label: 'Available' }, { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'MAINTENANCE', label: 'Maintenance' }, { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
  ]},
  { id: 'drivers', label: 'Drivers', description: 'Driver roster, licenses, and availability', group: 'Operations', icon: Users, statuses: [
    { value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' }, { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'TERMINATED', label: 'Terminated' }, { value: 'IN_TRANSIT', label: 'In Transit' },
  ]},
  { id: 'trips', label: 'Trips', description: 'Trip activity, status, and routing', group: 'Operations', icon: Navigation, statuses: [
    { value: 'PLANNED', label: 'Planned' }, { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' }, { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'DELAYED', label: 'Delayed' }, { value: 'OVERDUE', label: 'Overdue' },
  ]},
  { id: 'cargo', label: 'Cargo', description: 'Loads, pickup/delivery, and cargo value', group: 'Operations', icon: Package, statuses: [
    { value: 'DRAFT', label: 'Draft' }, { value: 'CREATED', label: 'Created' },
    { value: 'PUBLISHED', label: 'Published' }, { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_TRANSIT', label: 'In Transit' }, { value: 'DELIVERED', label: 'Delivered' },
    { value: 'COMPLETED', label: 'Completed' }, { value: 'CANCELLED', label: 'Cancelled' },
  ]},
  { id: 'parking', label: 'Parking Reservations', description: 'Facility reservations and review status', group: 'Operations', icon: Warehouse, statuses: PARKING_STATUSES },
  { id: 'users', label: 'Users', description: 'Tenant staff and partner accounts', group: 'Commercial', icon: Users, statuses: [
    { value: 'ACTIVE', label: 'Active' }, { value: 'PENDING_VERIFICATION', label: 'Pending' },
    { value: 'SUSPENDED', label: 'Suspended' }, { value: 'DEACTIVATED', label: 'Deactivated' },
  ]},
  { id: 'invoices', label: 'Invoices', description: 'Issued invoices and outstanding balances', group: 'Commercial', icon: FileText, statuses: [
    { value: 'DRAFT', label: 'Draft' }, { value: 'SENT', label: 'Sent' },
    { value: 'PAID', label: 'Paid' }, { value: 'OVERDUE', label: 'Overdue' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]},
  { id: 'payments', label: 'Payments', description: 'Payment activity across the tenant', group: 'Commercial', icon: CreditCard, statuses: [
    { value: 'PENDING', label: 'Pending' }, { value: 'COMPLETED', label: 'Completed' },
    { value: 'FAILED', label: 'Failed' }, { value: 'REFUNDED', label: 'Refunded' },
  ]},
  { id: 'credits', label: 'Credits', description: 'Credit purchases, usage, and adjustments', group: 'Commercial', icon: Wallet, statuses: [
    { value: 'PURCHASE', label: 'Purchase' }, { value: 'CONSUMPTION', label: 'Usage' },
    { value: 'BONUS', label: 'Bonus' }, { value: 'ADJUSTMENT', label: 'Adjustment' },
    { value: 'REFUND', label: 'Refund' }, { value: 'SUBSCRIPTION_GRANT', label: 'Subscription grant' },
  ]},
];

const GROUPS = ['Support Center', 'Operations', 'Commercial'];

function downloadBlob(blob: Blob, filename: string) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: filename,
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4_000);
}

function toCsv(headers: string[], rows: Row[]): string {
  const escape = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers, ...rows.map((r) => headers.map((h) => escape(r[h] ?? '')))].map((line) => line.join(',')).join('\n');
}

function exportRows(format: ExportFormat, title: string, headers: string[], rows: Row[]) {
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `${title.toLowerCase().replace(/\s+/g, '-')}-${stamp}`;
  if (format === 'csv') {
    downloadBlob(new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' }), `${base}.csv`);
    return;
  }
  if (format === 'xlsx') {
    const sheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, title.slice(0, 31));
    XLSX.writeFile(wb, `${base}.xlsx`);
    return;
  }
  const landscape = headers.length > 6;
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date().toLocaleString()}  ·  ${rows.length} rows`, 40, 52);
  autoTable(doc, {
    startY: 64,
    head: [headers],
    body: rows.map((r) => headers.map((h) => String(r[h] ?? ''))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [44, 81, 115], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  doc.save(`${base}.pdf`);
}

const TenantReportGeneration: React.FC = () => {
  const { user } = useAuth();
  const [reportId, setReportId] = useState<ReportId>('issues');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(false);

  const def = REPORTS.find((r) => r.id === reportId)!;
  const isTicketReport = reportId === 'issues' || reportId === 'support' || reportId === 'disputes';

  const query = useQuery({
    queryKey: ['tenant-report', reportId, user?.tenantId, status, priority, dateFrom, dateTo],
    enabled: Boolean(user?.tenantId),
    queryFn: async (): Promise<Row[]> => {
      if (!user?.tenantId) return [];
      const data = await tenantApi.getTenantReport(user.tenantId, {
        category: reportId,
        status: status || undefined,
        priority: isTicketReport ? (priority || undefined) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      return data?.rows || [];
    },
    staleTime: 30_000,
  });

  const filteredRows = useMemo(() => {
    const rows = query.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(q)));
  }, [query.data, search]);

  const headers = useMemo(() => (filteredRows[0] ? Object.keys(filteredRows[0]) : Object.keys(query.data?.[0] || { Result: '' })), [filteredRows, query.data]);

  const previewColumns = useMemo<Column<Row>[]>(
    () => headers.map((h) => ({
      key: h,
      label: h,
      sortable: true,
      render: (v) => <span className="text-xs text-gray-700 dark:text-slate-300 whitespace-nowrap">{String(v ?? '—')}</span>,
    })),
    [headers],
  );

  const handleGenerate = useCallback(async () => {
    if (!filteredRows.length) {
      toast.error('No rows match the current filters');
      return;
    }
    try {
      setGenerating(true);
      exportRows(format, def.label, headers, filteredRows);
      toast.success(`${def.label} report downloaded as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  }, [filteredRows, format, def.label, headers]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-8 h-8 bg-[#2c5173]/10 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-[#2c5173]" />
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">
              <TranslatedText text="Generate Reports" />
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 ml-10">
            <TranslatedText text="Filter any category and export as CSV, Excel, or PDF" />
          </p>
        </div>
        <button
          onClick={() => query.refetch()}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh data
        </button>
      </div>

      {GROUPS.map((group) => (
        <div key={group}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{group}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {REPORTS.filter((r) => r.group === group).map((r) => {
              const Icon = r.icon;
              const active = r.id === reportId;
              return (
                <button
                  key={r.id}
                  onClick={() => { setReportId(r.id); setStatus(''); setPriority(''); }}
                  className={`text-left p-3 rounded-2xl border transition-all ${
                    active
                      ? 'border-[#2c5173] bg-[#2c5173]/5 shadow-sm'
                      : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#2c5173]/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? 'bg-[#2c5173] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900 dark:text-white">{r.label}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-snug mt-0.5">{r.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#2c5173]" />
          <p className="text-sm font-black text-gray-900 dark:text-white">Filters · {def.label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#2c5173] dark:text-slate-200"
            >
              <option value="">All statuses</option>
              {def.statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
          </div>
          {isTicketReport && (
            <div className="relative">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#2c5173] dark:text-slate-200"
              >
                <option value="">All priorities</option>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
            </div>
          )}
          <label className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 font-medium">From</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent outline-none dark:text-slate-200" />
          </label>
          <label className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 font-medium">To</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent outline-none dark:text-slate-200" />
          </label>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Export format</p>
          <div className="grid grid-cols-3 gap-2 max-w-lg">
            {([
              { id: 'csv' as const, label: 'CSV', hint: 'Spreadsheets & imports', icon: FileText },
              { id: 'xlsx' as const, label: 'Excel', hint: 'Formatted workbook', icon: FileSpreadsheet },
              { id: 'pdf' as const, label: 'PDF', hint: 'Printable document', icon: Download },
            ]).map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                  format === f.id
                    ? 'border-[#2c5173] bg-[#2c5173]/5 text-[#2c5173]'
                    : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-[#2c5173]/40'
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
            {query.isLoading ? 'Loading…' : `${filteredRows.length} rows`}
          </span>
          <button
            onClick={handleGenerate}
            disabled={generating || query.isLoading || !filteredRows.length}
            className="px-4 py-2.5 bg-[#2c5173] text-white rounded-xl text-xs font-bold hover:bg-[#1e3a54] disabled:opacity-50 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            {generating ? 'Generating…' : `Generate ${def.label} ${format.toUpperCase()}`}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden p-2">
        {query.isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#2c5173] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400">Loading {def.label.toLowerCase()} data...</p>
          </div>
        ) : query.isError ? (
          <div className="p-12 text-center text-xs text-red-500">Could not load this report. Try another category or refresh.</div>
        ) : (
          <StandardDataTable<Row>
            embedded
            columns={previewColumns}
            data={filteredRows}
            getRowId={(_, i) => String(i)}
            searchable={false}
            stickyHeader
            pagination
            emptyMessage={`No ${def.label.toLowerCase()} match the selected filters`}
            ariaLabel={`${def.label} report preview`}
          />
        )}
      </div>
    </div>
  );
};

export default TenantReportGeneration;
