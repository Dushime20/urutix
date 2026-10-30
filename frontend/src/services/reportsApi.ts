import api from "./api";

export interface ReportFilters {
  category: string;
  status?: string;
  priority?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  tenantId?: string;
  truckId?: string;
  driverId?: string;
  cargoOwnerId?: string;
}
export interface RoleReportResult {
  title: string;
  category: string;
  headers: string[];
  rows: Record<string, string | number>[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    breakdowns: {
      dimension: string;
      key: string;
      count: number;
      completed?: number;
    }[];
    metrics: Record<string, number>;
    statuses: { status: string; count: number }[];
    trends: { month: string; count: number }[];
    amounts: Record<string, string | number | null>[];
  };
  metadata: {
    generatedAt: string;
    generatedBy: string;
    tenantId: string;
    tenantName?: string;
    dateBasis?: string;
    balanceBasis?: string;
    period: string;
    filters: ReportFilters;
  };
}
export const reportsApi = {
  catalog: async (): Promise<
    { id: string; title: string; statuses: string[] }[]
  > => (await api.get("/reports/catalog")).data.data,
  getMyReport: async (params: ReportFilters): Promise<RoleReportResult> =>
    (await api.get("/reports", { params })).data.data,
  exportData: async (params: ReportFilters): Promise<RoleReportResult> =>
    (await api.get("/reports/export-data", { params })).data.data,
  exportCsv: async (params: ReportFilters): Promise<Blob> => {
    try {
      return (
        await api.get("/reports/export", { params, responseType: "blob" })
      ).data;
    } catch (error: any) {
      if (error?.response?.data instanceof Blob) {
        const body = await error.response.data.text();
        let message = "Could not export this report";
        try {
          message = JSON.parse(body).message || message;
        } catch {
          /* Response may not be JSON. */
        }
        throw new Error(message);
      }
      throw error;
    }
  },
};
