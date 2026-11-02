import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import RoleReportGeneration from "./RoleReportGeneration";
import { reportsApi, type RoleReportResult } from "../../services/reportsApi";
import { exportRows } from "./reportExports";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", role: "CARGO_OWNER", tenantId: "tenant-1" },
  }),
}));
vi.mock("../../components/translated-text", () => ({
  TranslatedText: ({ text }: { text: string }) => <>{text}</>,
}));
vi.mock("../../components/Admin/AdminPageLayout", () => ({
  default: ({ children }: any) => <>{children}</>,
}));
vi.mock("../../components/EnliteUI/Tables", () => ({
  StandardDataTable: ({ data, emptyMessage }: any) => (
    <div>
      {data.length
        ? data.map((r: any) => <span key={r.Reference}>{r.Reference}</span>)
        : emptyMessage}
    </div>
  ),
}));
vi.mock("../../services/reportsApi", () => ({
  reportsApi: {
    catalog: vi.fn(),
    getMyReport: vi.fn(),
    exportData: vi.fn(),
    exportCsv: vi.fn(),
  },
}));
vi.mock("./reportExports", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./reportExports")>()),
  exportRows: vi.fn(),
}));

const data: RoleReportResult = {
  title: "Payments",
  category: "payments",
  headers: ["Reference", "Amount", "Currency"],
  rows: [{ Reference: "PREVIEW", Amount: 10, Currency: "USD" }],
  total: 75,
  page: 1,
  pageSize: 50,
  summary: {
    breakdowns: [],
    metrics: {},
    statuses: [{ status: "completed", count: 75 }],
    trends: [],
    amounts: [],
  },
  metadata: {
    generatedAt: "2026-10-30T10:00:00Z",
    generatedBy: "owner",
    tenantId: "tenant-1",
    period: "All time",
    filters: { category: "payments" },
  },
};

function open() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <RoleReportGeneration />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(reportsApi.catalog).mockResolvedValue([
    { id: "payments", title: "Payments", statuses: ["pending", "completed"] },
  ]);
  vi.mocked(reportsApi.getMyReport).mockResolvedValue(data);
  vi.mocked(reportsApi.exportData).mockResolvedValue({
    ...data,
    rows: [{ Reference: "FRESH EXPORT", Amount: 25, Currency: "USD" }],
  });
});

describe("Shared reporting page", () => {
  it("shows one category at a time and keeps the selected report while browsing", async () => {
    vi.mocked(reportsApi.catalog).mockResolvedValue([
      { id: "issues", title: "Issues", statuses: [] },
      { id: "trips", title: "Trips", statuses: [] },
      { id: "payments", title: "Payments", statuses: [] },
    ]);
    open();
    await screen.findByText("PREVIEW");
    expect(
      screen.getByRole("button", { name: /Issues Delays/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("button", { name: /Trips Trip activity/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Operations 1/ }));
    expect(
      screen.getByRole("button", { name: /Trips Trip activity/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Issues Delays/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Issues selected")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Trips Trip activity/ }),
    );
    await waitFor(() =>
      expect(reportsApi.getMyReport).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: "trips" }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: /Commercial 1/ }));
    expect(
      screen.getByRole("button", { name: /Payments Payment activity/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Trips selected")).toBeInTheDocument();
  });

  it("applies a chosen date range to the preview and generated report", async () => {
    open();
    await screen.findByText("PREVIEW");
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-10-01" },
    });
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-10-31" },
    });
    await waitFor(() =>
      expect(reportsApi.getMyReport).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dateFrom: "2026-10-01",
          dateTo: "2026-10-31",
          page: 1,
        }),
      ),
    );
    const generate = screen.getByRole("button", {
      name: "Generate Payments XLSX",
    });
    await waitFor(() => expect(generate).not.toBeDisabled());
    fireEvent.click(generate);
    await waitFor(() =>
      expect(reportsApi.exportData).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: "2026-10-01",
          dateTo: "2026-10-31",
        }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear dates" }));
    await waitFor(() =>
      expect(reportsApi.getMyReport).toHaveBeenLastCalledWith(
        expect.objectContaining({ dateFrom: undefined, dateTo: undefined }),
      ),
    );
  });

  it("uses the same start and end date for a specific day", async () => {
    open();
    await screen.findByText("PREVIEW");
    fireEvent.change(screen.getByLabelText("Reporting period (UTC)"), {
      target: { value: "date" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a report date");
    expect(
      screen.getByRole("button", { name: "Generate Payments XLSX" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Report date"), {
      target: { value: "2026-10-25" },
    });
    await waitFor(() =>
      expect(reportsApi.getMyReport).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dateFrom: "2026-10-25",
          dateTo: "2026-10-25",
        }),
      ),
    );
    const generate = screen.getByRole("button", {
      name: "Generate Payments XLSX",
    });
    await waitFor(() => expect(generate).not.toBeDisabled());
    fireEvent.click(generate);
    await waitFor(() =>
      expect(reportsApi.exportData).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: "2026-10-25",
          dateTo: "2026-10-25",
        }),
      ),
    );
  });

  it("blocks reversed date ranges without sending an invalid report request", async () => {
    open();
    await screen.findByText("PREVIEW");
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-10-31" },
    });
    await waitFor(() =>
      expect(reportsApi.getMyReport).toHaveBeenLastCalledWith(
        expect.objectContaining({ dateFrom: "2026-10-31" }),
      ),
    );
    vi.mocked(reportsApi.getMyReport).mockClear();
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-10-01" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Start date must be on or before the end date",
    );
    expect(
      screen.getByRole("button", { name: "Generate Payments XLSX" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Print report" })).toBeDisabled();
    expect(reportsApi.getMyReport).not.toHaveBeenCalled();
    expect(reportsApi.exportData).not.toHaveBeenCalled();
  });

  it("uses the backend catalog, filtered total and server pagination", async () => {
    open();
    await screen.findByText("PREVIEW", {}, { timeout: 5000 });
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.queryByText("Fleet")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(reportsApi.getMyReport).toHaveBeenLastCalledWith(
        expect.objectContaining({
          category: "payments",
          page: 2,
          pageSize: 50,
        }),
      ),
    );
  });

  it("sends search to the server and exports fresh authorized data with the same filters", async () => {
    open();
    await screen.findByText("PREVIEW", {}, { timeout: 5000 });
    fireEvent.change(
      screen.getByPlaceholderText("Search within this report..."),
      { target: { value: "invoice-123" } },
    );
    await waitFor(() =>
      expect(reportsApi.getMyReport).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "invoice-123" }),
      ),
    );
    const button = screen.getByRole("button", {
      name: "Generate Payments XLSX",
    });
    await waitFor(() => expect(button).not.toBeDisabled());
    fireEvent.click(button);
    await waitFor(() =>
      expect(exportRows).toHaveBeenCalledWith(
        "xlsx",
        expect.objectContaining({
          rows: [{ Reference: "FRESH EXPORT", Amount: 25, Currency: "USD" }],
        }),
      ),
    );
    expect(reportsApi.exportData).toHaveBeenCalledWith(
      expect.objectContaining({ category: "payments", search: "invoice-123" }),
    );
  });

  it("shows a recoverable error without exporting stale data", async () => {
    vi.mocked(reportsApi.getMyReport).mockRejectedValue({
      response: { data: { message: "Reporting access denied" } },
    });
    open();
    await screen.findByText("Reporting access denied");
    expect(
      screen.getByRole("button", { name: "Generate Payments XLSX" }),
    ).toBeDisabled();
    expect(reportsApi.exportData).not.toHaveBeenCalled();
  });
});
