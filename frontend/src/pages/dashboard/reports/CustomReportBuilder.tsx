import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Download,
  Eye,
  FileText,
  LayoutDashboard,
  Plus,
  Save,
  Settings2,
  Table2,
  Trash2,
  TrendingUp,
  Type,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { analyticsApi, type CostFilters } from '../../../services/analyticsApi';
import { useAuth } from '../../../contexts/AuthContext';
import { useCurrencyFormat } from '../../../hooks/useCurrencyFormat';
import { TranslatedText } from '../../../components/translated-text';
import { Modal } from '../../../components/EnliteUI';
import { StandardDataTable, type Column } from '../../../components/EnliteUI/Tables';
import {
  loadSavedReports,
  persistSavedReports,
  type ReportChartType,
  type ReportDataSource,
  type ReportWidget,
  type ReportWidgetType,
  type SavedCustomReport,
} from './reportBuilderStorage';

const COLORS = ['#345E85', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];

const DATA_SOURCES: { id: ReportDataSource; label: string }[] = [
  { id: 'shipments', label: 'Shipments' },
  { id: 'costs', label: 'Costs' },
  { id: 'performance', label: 'On-time performance' },
  { id: 'carriers', label: 'Carriers' },
  { id: 'routes', label: 'Routes' },
];

const WIDGET_TYPES: { type: ReportWidgetType; label: string; icon: typeof BarChart3 }[] = [
  { type: 'metric', label: 'KPI', icon: LayoutDashboard },
  { type: 'chart', label: 'Chart', icon: BarChart3 },
  { type: 'table', label: 'Table', icon: Table2 },
  { type: 'note', label: 'Note', icon: Type },
];

function unwrap(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  if (payload.trends || payload.totalShipments != null || Array.isArray(payload)) return payload;
  if (payload.data && typeof payload.data === 'object') return unwrap(payload.data);
  return payload;
}

function newWidget(type: ReportWidgetType, dataSource: ReportDataSource = 'shipments'): ReportWidget {
  return {
    id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title:
      type === 'metric' ? 'Key metric' : type === 'chart' ? 'Trend' : type === 'table' ? 'Breakdown' : 'Notes',
    dataSource,
    chartType: type === 'chart' ? 'bar' : undefined,
    note: type === 'note' ? 'Add context for this report.' : undefined,
  };
}

const CustomReportBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { format, compact } = useCurrencyFormat();
  const [name, setName] = useState('Operations snapshot');
  const [widgets, setWidgets] = useState<ReportWidget[]>([
    newWidget('metric', 'shipments'),
    newWidget('metric', 'costs'),
    newWidget('chart', 'costs'),
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(widgets[0]?.id || null);
  const [preview, setPreview] = useState(false);
  const [timeRange, setTimeRange] = useState<NonNullable<CostFilters['timeRange']>>('last_30_days');
  const [saved, setSaved] = useState<SavedCustomReport[]>(() => loadSavedReports(user?.id));
  const [showSaved, setShowSaved] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [recipients, setRecipients] = useState(user?.email || '');

  const filters: CostFilters = { timeRange, groupBy: timeRange === 'last_7_days' ? 'day' : 'week' };

  const overviewQuery = useQuery({
    queryKey: ['report-builder', 'overview', user?.id, filters],
    queryFn: () => analyticsApi.getOverview(),
    retry: false,
  });
  const trendsQuery = useQuery({
    queryKey: ['report-builder', 'trends', user?.id, filters],
    queryFn: () => analyticsApi.getCostTrends(filters),
    retry: false,
  });
  const summaryQuery = useQuery({
    queryKey: ['report-builder', 'summary', user?.id, filters],
    queryFn: () => analyticsApi.getFinancialSummary(filters),
    retry: false,
  });
  const performanceQuery = useQuery({
    queryKey: ['report-builder', 'performance', user?.id, filters],
    queryFn: () => analyticsApi.getOperationalPerformance(),
    retry: false,
  });
  const carriersQuery = useQuery({
    queryKey: ['report-builder', 'carriers', user?.id],
    queryFn: () => analyticsApi.getCarrierPerformance(),
    retry: false,
  });
  const routesQuery = useQuery({
    queryKey: ['report-builder', 'routes', user?.id],
    queryFn: () => analyticsApi.getRoutePerformance(),
    retry: false,
  });

  const overview = unwrap(overviewQuery.data);
  const trends = unwrap(trendsQuery.data);
  const summary = unwrap(summaryQuery.data);
  const performance = unwrap(performanceQuery.data);
  const carriers = unwrap(carriersQuery.data);
  const routes = unwrap(routesQuery.data);

  const trendRows = useMemo(() => {
    const rows = Array.isArray(trends?.trends) ? trends.trends : Array.isArray(trends) ? trends : [];
    return rows.map((row: any) => ({
      label: String(row.date || row.month || row.period || '').slice(0, 10) || '—',
      shipments: Number(row.shipmentCount || row.shipments || 0),
      cost: Number(row.totalCost || row.averageCost || row.value || 0),
    }));
  }, [trends]);

  const carrierRows = useMemo(() => {
    const rows = Array.isArray(carriers) ? carriers : carriers?.items || [];
    return rows.slice(0, 8).map((row: any) => ({
      name: row.carrierName || row.name || row.carrierId || 'Carrier',
      shipments: Number(row.totalShipments || 0),
      onTime: Number(row.onTimeRate || 0),
      cost: Number(row.averageCost || 0),
    }));
  }, [carriers]);

  const routeRows = useMemo(() => {
    const rows = Array.isArray(routes) ? routes : routes?.items || [];
    return rows.slice(0, 8).map((row: any) => ({
      name: row.route || row.routeHash || 'Route',
      shipments: Number(row.shipmentCount || 0),
      onTime: Number(row.onTimeRate || 0),
      cost: Number(row.averageCost || 0),
    }));
  }, [routes]);

  const selected = widgets.find((item) => item.id === selectedId) || null;

  const metricFor = (source: ReportDataSource) => {
    if (source === 'shipments') {
      return {
        value: String(overview?.totalShipments ?? trends?.totalShipments ?? performance?.totalShipments ?? 0),
        hint: 'Total shipments in range',
      };
    }
    if (source === 'costs') {
      const amount = Number(trends?.totalCost ?? summary?.totalCost ?? summary?.totalSpend ?? 0);
      return { value: compact(amount), hint: 'Total logistics cost' };
    }
    if (source === 'performance') {
      const rate = Number(performance?.onTimeRate ?? 0);
      return { value: `${rate.toFixed(1)}%`, hint: 'On-time delivery rate' };
    }
    if (source === 'carriers') {
      return {
        value: String(performance?.activeCarriers ?? carrierRows.length),
        hint: 'Active carriers',
      };
    }
    return {
      value: String(performance?.activeRoutes ?? routeRows.length),
      hint: 'Active routes',
    };
  };

  const chartDataFor = (source: ReportDataSource) => {
    if (source === 'carriers') {
      return carrierRows.map((row) => ({ label: row.name, value: row.shipments }));
    }
    if (source === 'routes') {
      return routeRows.map((row) => ({ label: row.name, value: row.shipments }));
    }
    if (source === 'performance') {
      return trendRows.map((row) => ({ label: row.label, value: row.shipments }));
    }
    if (source === 'costs') {
      return trendRows.map((row) => ({ label: row.label, value: row.cost }));
    }
    return trendRows.map((row) => ({ label: row.label, value: row.shipments }));
  };

  const tableFor = (source: ReportDataSource) => {
    if (source === 'carriers') return carrierRows;
    if (source === 'routes') return routeRows;
    return trendRows.map((row) => ({
      name: row.label,
      shipments: row.shipments,
      cost: row.cost,
    }));
  };

  const updateWidget = (id: string, patch: Partial<ReportWidget>) => {
    setWidgets((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addWidget = (type: ReportWidgetType) => {
    const widget = newWidget(type);
    setWidgets((current) => [...current, widget]);
    setSelectedId(widget.id);
    setPreview(false);
  };

  const applyTemplate = (kind: 'operations' | 'costs' | 'carriers') => {
    const next =
      kind === 'operations'
        ? [newWidget('metric', 'shipments'), newWidget('metric', 'performance'), newWidget('chart', 'shipments'), newWidget('table', 'routes')]
        : kind === 'costs'
          ? [newWidget('metric', 'costs'), newWidget('chart', 'costs'), newWidget('table', 'costs')]
          : [newWidget('metric', 'carriers'), newWidget('chart', 'carriers'), newWidget('table', 'carriers')];
    const chart = next.find((item) => item.type === 'chart');
    if (chart) chart.chartType = kind === 'carriers' ? 'pie' : kind === 'costs' ? 'area' : 'line';
    setWidgets(next);
    setSelectedId(next[0].id);
    setName(kind === 'operations' ? 'Operations snapshot' : kind === 'costs' ? 'Cost analysis' : 'Carrier mix');
    toast.success('Template applied');
  };

  const moveWidget = (id: string, direction: -1 | 1) => {
    setWidgets((current) => {
      const index = current.findIndex((item) => item.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  };

  const saveReport = (withSchedule = false) => {
    const report: SavedCustomReport = {
      id: `report-${Date.now()}`,
      name: name.trim() || 'Untitled report',
      widgets,
      timeRange,
      updatedAt: new Date().toISOString(),
      schedule: withSchedule
        ? { frequency, time: scheduleTime, recipients: recipients.trim() }
        : undefined,
    };
    const next = [report, ...saved.filter((item) => item.name !== report.name)].slice(0, 20);
    setSaved(next);
    persistSavedReports(user?.id, next);
    toast.success(withSchedule ? 'Report saved with schedule' : 'Report saved');
    setShowSchedule(false);
  };

  const loadReport = (report: SavedCustomReport) => {
    setName(report.name);
    setWidgets(report.widgets);
    setTimeRange((report.timeRange as CostFilters['timeRange']) || 'last_30_days');
    setSelectedId(report.widgets[0]?.id || null);
    setShowSaved(false);
    toast.success('Report loaded');
  };

  const deleteSaved = (id: string) => {
    const next = saved.filter((item) => item.id !== id);
    setSaved(next);
    persistSavedReports(user?.id, next);
  };

  const exportCsv = () => {
    const tables = widgets.filter((item) => item.type === 'table');
    const source = tables[0]?.dataSource || selected?.dataSource || 'shipments';
    const rows = tableFor(source);
    if (!rows.length) {
      toast.error('No table data to export yet');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => JSON.stringify((row as any)[key] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '-').toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const renderChart = (widget: ReportWidget) => {
    const data = chartDataFor(widget.dataSource);
    const type = widget.chartType || 'bar';
    if (!data.length) {
      return <p className="text-sm text-slate-400 py-16 text-center">No chart data for this range.</p>;
    }
    if (type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#345E85" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (type === 'area') {
      return (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#345E85" fill="#345E85" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#345E85" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderWidget = (widget: ReportWidget) => {
    if (widget.type === 'metric') {
      const metric = metricFor(widget.dataSource);
      return (
        <div className="h-full rounded-2xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{widget.title}</p>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{metric.value}</p>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {metric.hint}
          </p>
        </div>
      );
    }
    if (widget.type === 'chart') {
      return (
        <div className="h-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{widget.title}</p>
          {renderChart(widget)}
        </div>
      );
    }
    if (widget.type === 'table') {
      const rows = tableFor(widget.dataSource);
      const columns: Column[] =
        widget.dataSource === 'costs' || widget.dataSource === 'shipments'
          ? [
              { key: 'name', label: 'Period' },
              { key: 'shipments', label: 'Shipments', align: 'right' },
              { key: 'cost', label: 'Cost', align: 'right', render: (value) => format(Number(value || 0)) },
            ]
          : [
              { key: 'name', label: widget.dataSource === 'routes' ? 'Route' : 'Carrier' },
              { key: 'shipments', label: 'Shipments', align: 'right' },
              { key: 'onTime', label: 'On time', align: 'right', render: (value) => `${Number(value || 0).toFixed(1)}%` },
              { key: 'cost', label: 'Avg cost', align: 'right', render: (value) => format(Number(value || 0)) },
            ];
      return (
        <div className="h-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <StandardDataTable
            title={widget.title}
            embedded
            dense
            searchable={false}
            pagination={false}
            columnVisibility={false}
            data={rows.map((row, index) => ({ id: String(index), ...row }))}
            getRowId={(row) => row.id}
            columns={columns}
            emptyMessage="No rows for this data source"
            ariaLabel={widget.title}
          />
        </div>
      );
    }
    return (
      <div className="h-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900/60">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{widget.title}</p>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{widget.note}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <TranslatedText text="Dashboard" />
          </button>
          <h1 className="ui-page-title"><TranslatedText text="Report builder" /></h1>
          <p className="ui-body-small mt-1">
            <TranslatedText text="Compose a live operations report from shipments, costs, carriers, and routes." />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as CostFilters['timeRange'] as any)}
            className="ui-input h-10 rounded-xl px-3 text-xs font-bold"
          >
            <option value="last_7_days">Last 7 days</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="last_90_days">Last 90 days</option>
            <option value="last_6_months">Last 6 months</option>
          </select>
          <button type="button" onClick={() => setShowSaved(true)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            Saved
          </button>
          <button type="button" onClick={() => setPreview((value) => !value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-2">
            <Eye className="w-4 h-4" />
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button type="button" onClick={exportCsv} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button type="button" onClick={() => setShowSchedule(true)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Schedule
          </button>
          <button type="button" onClick={() => saveReport()} className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold inline-flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full max-w-xl bg-transparent text-xl font-black text-slate-900 dark:text-white border-b border-transparent focus:border-primary-500 outline-none py-1"
      />

      <div className={`grid gap-6 ${preview ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-[280px_1fr]'}`}>
        {!preview && (
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Templates</p>
              <div className="space-y-2">
                {[
                  { id: 'operations', label: 'Operations snapshot' },
                  { id: 'costs', label: 'Cost analysis' },
                  { id: 'carriers', label: 'Carrier mix' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => applyTemplate(item.id as 'operations' | 'costs' | 'carriers')}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Add block</p>
              <div className="grid grid-cols-2 gap-2">
                {WIDGET_TYPES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => addWidget(item.type)}
                      className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-3 text-xs font-bold hover:border-primary-300 hover:text-primary-600"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {selected && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 inline-flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5" />
                  Block settings
                </p>
                <label className="block text-xs font-bold text-slate-500">
                  Title
                  <input
                    value={selected.title}
                    onChange={(e) => updateWidget(selected.id, { title: e.target.value })}
                    className="ui-input mt-1 w-full rounded-xl px-3 py-2"
                  />
                </label>
                {selected.type !== 'note' && (
                  <label className="block text-xs font-bold text-slate-500">
                    Data source
                    <select
                      value={selected.dataSource}
                      onChange={(e) => updateWidget(selected.id, { dataSource: e.target.value as ReportDataSource })}
                      className="ui-input mt-1 w-full rounded-xl px-3 py-2"
                    >
                      {DATA_SOURCES.map((source) => (
                        <option key={source.id} value={source.id}>{source.label}</option>
                      ))}
                    </select>
                  </label>
                )}
                {selected.type === 'chart' && (
                  <div className="grid grid-cols-2 gap-2">
                    {(['bar', 'line', 'area', 'pie'] as ReportChartType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateWidget(selected.id, { chartType: type })}
                        className={`rounded-xl px-3 py-2 text-xs font-bold capitalize ${
                          selected.chartType === type
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
                {selected.type === 'note' && (
                  <textarea
                    value={selected.note || ''}
                    onChange={(e) => updateWidget(selected.id, { note: e.target.value })}
                    rows={4}
                    className="ui-input w-full rounded-xl px-3 py-2 text-sm"
                  />
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => moveWidget(selected.id, -1)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-bold inline-flex items-center justify-center gap-1">
                    <ChevronUp className="w-4 h-4" /> Up
                  </button>
                  <button type="button" onClick={() => moveWidget(selected.id, 1)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-bold inline-flex items-center justify-center gap-1">
                    <ChevronDown className="w-4 h-4" /> Down
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWidgets((current) => current.filter((item) => item.id !== selected.id));
                    setSelectedId(null);
                  }}
                  className="w-full rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 py-2 text-xs font-bold inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove block
                </button>
              </div>
            )}
          </aside>
        )}

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 p-4 min-h-[520px]">
          {widgets.length === 0 ? (
            <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center">
              <FileText className="w-10 h-10 text-primary-500 mb-3" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Start with a template or add a block</h2>
              <p className="mt-2 text-sm text-slate-500 max-w-md">KPIs, charts, and tables pull from your live cargo analytics.</p>
              <button type="button" onClick={() => addWidget('metric')} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold">
                <Plus className="w-4 h-4" />
                Add KPI
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  onClick={() => !preview && setSelectedId(widget.id)}
                  className={`${widget.type === 'table' || widget.type === 'chart' ? 'md:col-span-2' : ''} cursor-pointer rounded-2xl ${
                    selectedId === widget.id && !preview ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  {renderWidget(widget)}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal isOpen={showSaved} onClose={() => setShowSaved(false)} title="Saved reports" size="md">
        {saved.length === 0 ? (
          <p className="text-sm text-slate-500">No saved reports yet.</p>
        ) : (
          <div className="space-y-2">
            {saved.map((report) => (
              <div key={report.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{report.name}</p>
                  <p className="text-[11px] text-slate-400">{new Date(report.updatedAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => loadReport(report)} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold">Open</button>
                  <button type="button" onClick={() => deleteSaved(report.id)} className="px-3 py-1.5 rounded-lg text-rose-600 text-xs font-bold">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        title="Save with reminder"
        size="sm"
        footer={
          <button type="button" onClick={() => saveReport(true)} className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold">
            Save reminder
          </button>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">This stores a reminder on the saved report. Email delivery is not sent from this screen.</p>
          <label className="block text-xs font-bold text-slate-500">
            Frequency
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)} className="ui-input mt-1 w-full rounded-xl px-3 py-2">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-500">
            Time
            <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="ui-input mt-1 w-full rounded-xl px-3 py-2" />
          </label>
          <label className="block text-xs font-bold text-slate-500">
            Recipients
            <input value={recipients} onChange={(e) => setRecipients(e.target.value)} className="ui-input mt-1 w-full rounded-xl px-3 py-2" />
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default CustomReportBuilder;
