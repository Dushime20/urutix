export type ReportWidgetType = 'metric' | 'chart' | 'table' | 'note';
export type ReportChartType = 'bar' | 'line' | 'pie' | 'area';
export type ReportDataSource = 'shipments' | 'costs' | 'performance' | 'carriers' | 'routes';

export interface ReportWidget {
  id: string;
  type: ReportWidgetType;
  title: string;
  dataSource: ReportDataSource;
  chartType?: ReportChartType;
  note?: string;
}

export interface SavedCustomReport {
  id: string;
  name: string;
  widgets: ReportWidget[];
  timeRange: string;
  updatedAt: string;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string;
  };
}

const storageKey = (userId?: string) => `urutix.report-builder.${userId || 'anon'}`;

export function loadSavedReports(userId?: string): SavedCustomReport[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedReports(userId: string | undefined, reports: SavedCustomReport[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(reports));
}
