# Reporting implementation

## Discovery and plan (before implementation)

The application uses NestJS/TypeORM/PostgreSQL and React/React Query. `TenantReportsService` and `ReportsController` already provide 15 categories with tenant and owner/assignment predicates. `RoleReportGeneration` is shared by existing role routes, including the tenant-admin re-export. It already uses StandardDataTable, jsPDF/autotable and XLSX. Existing analytics, broker performance, lender analytics, custom report builder, trip overdue scheduler and payment workflows remain in place.

Reports are authenticated with JwtAuthGuard and TenantGuard. The route permission rules already cover `/reports` through the capability/feature-control infrastructure. ADMIN is tenant-bound; only SUPER_ADMIN can request platform scope. Driver identity is a Driver.userId, broker assignment is Load.brokerId, lender identity is a Lender entity resolved by contact email (not User.id). Loan requested/approved amounts are not disbursements or recognized revenue. Existing lender analytics includes estimates and mixes currencies, so it cannot safely supply authoritative reporting balances unchanged.

Gaps: filtering after a 5,000-row cap, no database pagination/counts, no filtered summaries, client-only export snapshots, no export metadata/print view, duplicated role catalogs, missing auction/bid/match/commission/tenant categories, incorrect lender identity comparison. Existing trips expose recorded OVERDUE status; preserve that workflow rather than invent another overdue definition.

Sequence:
1. Extend the existing service with validated request-local filters, database pagination/counts/status/month summaries and currency-separated financial totals. Keep existing response fields compatible.
2. Add backend catalog and authorized full export-data endpoint; reject oversized exports explicitly. Extend existing repositories with verified auction, bid, match, commission and tenant records.
3. Extend the shared page with server filters/pagination/KPIs/trends, backend catalog, fresh export requests, metadata and print layout using current libraries.
4. Add negative scope/ownership/filter/export tests, compile both applications and document verification and limitations.

Security: authorization predicates apply before filtering, aggregation, count and export. Reject mismatched service tenant arguments even when callers bypass the controller. Platform scope is explicit and SUPER_ADMIN-only. Unknown roles fail closed. No cross-currency summation; missing currency is labeled unspecified. No inferred driver earnings, bid revenue, cargo-budget revenue or estimated risk metrics.

Performance: SQL WHERE filters precede limits; summaries are grouped in PostgreSQL; no N+1 per-row lookups. Preview defaults to 50 and caps at 200 records; synchronous exports cap at 5,000 with an explicit error. Existing tenant/status and owner indexes are reused; no speculative migrations or new infrastructure. Live financial reporting is uncached. Production query plans and database integration tests remain necessary before claiming deployment readiness.

## Implemented behavior

The existing shared page and role navigation/routes are retained. Its catalog and valid statuses now come from the backend and respect explicit capability denies and feature controls. Existing dashboards, analytics endpoints, lending workflows and overdue transitions are unchanged. All reporting categories use real entities; no production fixtures were added.

The original fifteen categories remain: issues, support, disputes, fleet, drivers, trips, cargo, parking, users, invoices, payments, credits, loans, repayments and inspections. Nine additional categories use existing tables: tenants, auctions, bids, matches, commissions, disbursements, safety inspections, safety incidents and settled revenue.

| Role | Available reporting scope |
| --- | --- |
| SUPER_ADMIN | All categories, including tenant inventory and settled platform revenue. Explicit `tenantId=*` enables platform scope; a tenant UUID selects one tenant. |
| ADMIN / TENANT_ADMIN | Tenant operations, users, fleet, cargo, trips, safety, auctions/matching and financial records. ADMIN remains tenant-bound under the existing security model. |
| Truck owner | Owned fleet, employed drivers, related cargo/trips, own bids/matches, safety, personal payments/invoices/credits, borrowing, disbursements and repayments. |
| Cargo owner | Owned cargo and related trips, auctions, received bids, matching, inspections, personal payments/invoices/credits and financing ledgers. |
| Driver | Assigned trips/missions, related inspections, driver safety inspections/incidents, personal payments and submitted/identified reservations. |
| Lender | Tenant-bound lender portfolio resolved from authenticated email, disbursements, repayments and personal payments. |
| Broker | Assigned cargo and trips, managed auctions/bids/matching, configured commissions, authorized invoices/payments and inspections. |

Support tickets remain scoped to the existing complainant/respondent/driver authorization rules. Existing receiver, customs, parking and fleet-family report entitlements are preserved.

All filtered records contribute to SQL counts, status summaries, monthly activity and relevant financial aggregates. Additional metrics include cargo weight, transported cargo weight on completed trips, completion rate, on-time delivery rate, accepted bids/matches, auctions with recorded winning bids and the proportion of trucks in transit. On-time rate uses only completed trips with both actual and planned completion timestamps. OVERDUE remains the recorded trip status, maintained by the existing workflow.

Participant breakdowns show the top twenty groups per dimension: user role, driver/truck trip activity and completions, cargo owner activity, borrower/financing type, and platform activity per tenant where supported. Complete filtered detail remains available through pagination and export, subject to the export cap.

## API contract

Paths below are relative to the application's existing API prefix.

| Endpoint | Behavior |
| --- | --- |
| `GET /reports/catalog` | Role and capability-filtered report IDs, titles and authoritative enum statuses. New. |
| `GET /reports` | Existing response envelope and title/category/headers/rows/total fields, extended with page, pageSize, summary and generation/filter metadata. Now database-paginated. |
| `GET /reports/export-data` | Fresh, fully authorized filtered data for PDF, Excel and printing. New. |
| `GET /reports/export` | Existing CSV download, now using the same complete filtered generation and explicit size limit. |

Filters: category, status, ticket priority, search, dateFrom, dateTo, page, pageSize, tenantId and applicable truckId/driverId/cargoOwnerId. Unsupported filters, malformed UUIDs, invalid enum statuses/dates, inverted ranges and invalid pagination return 400. Cross-tenant and unauthorized category access return 403. Dates are inclusive UTC calendar dates; metadata states whether filtering uses creation, hire, issue, repayment, inspection, incident or settlement date.

Preview defaults to 50 records and accepts at most 200 per page. A synchronous export includes all matching records up to 5,000. Larger requests fail with an instruction to narrow filters rather than silently truncating. Exports query the backend again; they do not serialize only the browser's current page.

## Financial meaning and access

JWT, tenant and reporting capability guards protect previews, catalogs and both export paths. Financial categories additionally evaluate `analytics:financial`; user, tenant, auction, bid and matching categories evaluate relevant existing capabilities. The existing capability service preserves explicit user denies and platform/tenant feature switches, followed by existing role fallback behavior. The service separately enforces the role/category whitelist and SQL ownership/assignment restrictions, including when tenant arguments are manipulated. The catalog suppresses disabled categories without suppressing unexpected permission infrastructure errors.

Payment totals are separated by currency, status, payment type and incoming/outgoing direction for personal reports. Tenant reports describe transaction volume. Invoice amounts and requested/approved loan amounts remain distinct. Settled revenue comes only from existing settled RevenueRecord rows, without invoking settlement logic or treating bids/cargo offers as revenue. Cargo detail distinguishes offered transport price from cargo value.

Loan principal totals use successful/disbursed disbursement ledger entries less recorded principal repayments in the same currency. Child ledgers are aggregated independently to avoid multiplication from joining disbursements and repayments. Their subqueries reuse the authorized, filtered loan query. Unknown currencies, mismatched ledger currencies, missing disbursement amounts, and active loans without disbursement records cause principal totals to be unavailable rather than reporting fabricated zero balances. Incomplete ledger counts are exposed. Recorded loan due dates and the existing not-repaid overdue definition drive overdue loan/principal summaries. These are current principal balances for the filtered loan cohort, not historical as-of balances or full interest/fee obligations.

Amounts are never converted or summed across currencies. Unknown currency groups do not receive monetary totals. BrokerCommission has no currency column, so individual commission amounts/statuses are reported with an explicit notice and no combined monetary total. Driver payments expose only actual authorized payment records; there is no assumed salary/allowance or trip-based earnings calculation.

Report responses use `Cache-Control: no-store`. Export generation records an AuditLog entry with actor, tenant, category, filters and count, without copying report rows into the audit record. A missing authenticated email can no longer match reservations with blank email fields.

## Export and UI behavior

The shared page reuses React Query, EnliteUI tables, Recharts and existing visual styles. It adds server search, date presets/custom ranges, applicable entity-ID filters, summaries, monthly activity, participant breakdowns, pagination and recoverable loading/error/empty states. Sorting within a single loaded page is disabled to avoid implying global sorting. Entity filters currently accept UUIDs rather than introducing new lookup endpoints.

CSV uses escaped fields, UTF-8 BOM and spreadsheet-formula protection while preserving numeric negatives. Excel uses actual XLSX workbooks with typed numeric/date cells, readable widths, auto-filters, report metadata, financial totals and participant performance worksheets. Missing totals remain blank. PDF includes URUTIX branding, period/date basis, actor, tenant name, filter/summary information, detail tables, wide-table orientation and page numbers. Printing opens the generated PDF in a window reserved at the user's click, avoiding asynchronous popup blocking and excluding application navigation.

## Files and database changes

Modified:
- `backend/src/modules/tenant-dashboard/tenant-reports.service.ts`: validated queries, ownership corrections, extended categories, SQL pagination/aggregates, currency-safe ledger reporting, metadata and export audit.
- `backend/src/modules/tenant-dashboard/reports.controller.ts`: catalog/export-data endpoints and shared generation contracts.
- `backend/src/modules/tenant-dashboard/tenant-dashboard.module.ts`: register the reporting access guard.
- `backend/src/config/database.config.ts`: register the existing RevenueRecord entity in the explicit entity list.
- `frontend/src/services/reportsApi.ts`: catalog, paginated preview and fresh export methods/types.
- `frontend/src/pages/reports/RoleReportGeneration.tsx`: extend the existing shared reporting experience.

Created:
- `backend/src/modules/tenant-dashboard/reports-access.guard.ts` and its test.
- `backend/src/modules/tenant-dashboard/tenant-reports.service.spec.ts`.
- `backend/src/modules/tenant-dashboard/reports.controller.spec.ts`.
- `frontend/src/pages/reports/reportExports.ts` and its test.
- `frontend/src/pages/reports/RoleReportGeneration.test.tsx`.
- This implementation/discovery document.

No schema changes, migrations, new packages, background workers or caching infrastructure were introduced. The existing base schema already defines revenue_records; entity registration fixes its availability to the existing TypeORM configuration.

## Verification and limits

Backend tests build real PostgreSQL TypeORM entity metadata and generated SQL while mocking database execution. They cover all authorized categories for supported roles, cross-tenant and ownership restrictions, manipulated IDs, capability/feature denial, filters, pagination, empty data, currency separation, principal ledger query structure, calculations, audit/export contracts and CSV safety. Existing trip-overdue suites are included as regression checks. Frontend tests exercise the shared page's server catalog, pagination, server search, fresh export requests and error handling, and generate/round-trip real XLSX bytes and real PDF output, including print behavior and missing totals.

Full frontend type-checking currently fails in pre-existing unrelated JSX files, including CargoEmptyState, LenderDashboard_Backup, TenantAdminDrivers, cargo detail and PartnerPlans. Full backend type-checking that includes every test encounters pre-existing broken test imports and fixture type errors in admin/lending/security suites. No tests were disabled and no compiler settings were weakened. The normal backend application build configuration and targeted reporting-file frontend diagnostics are checked separately.

Production readiness still requires executing the SQL against a representative PostgreSQL database, examining query plans and testing the full application in a browser after the unrelated frontend syntax failures are repaired. No live database balances or complete authenticated browser journeys were verified here. PDF structure/content is tested; rendered visual QA across large production datasets remains outstanding. Historical as-of accounting balances, advanced risk forecasting, currency conversion, scheduled report delivery/history and asynchronous exports above the cap are not introduced. Existing analytics/dashboard pages are preserved, but their complete runtime compatibility cannot be claimed from the focused regression suites alone.

### Final verification results

- Backend: **76 tests passed across 5 suites** (`tenant-reports.service`, `reports-access.guard`, `reports.controller`, existing `trip-overdue.util` and `trips-overdue`). Negative-test validation errors in Nest logs are expected; all assertions passed.
- Frontend: **8 tests passed across 2 suites** (`RoleReportGeneration`, `reportExports`), including real PDF/XLSX generation, printing and unavailable financial values.
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.build.json` from backend: **passed** using the unchanged normal application build configuration.
- TypeScript syntactic/semantic diagnostics for all five reporting frontend source/test files using the existing frontend configuration: **0 diagnostics**.
- Full repository frontend/backend type checks: **blocked by the pre-existing errors described above**, not reported as passing.
- `git diff --check`: **passed** (Git emits local LF/CRLF normalization notices).

Backend test command (run from backend): `node node_modules/jest/bin/jest.js --runInBand --cacheDirectory .cache/jest-reporting src/modules/tenant-dashboard/tenant-reports.service.spec.ts src/modules/tenant-dashboard/reports-access.guard.spec.ts src/modules/tenant-dashboard/reports.controller.spec.ts src/modules/trips/trip-overdue.util.spec.ts src/modules/trips/trips-overdue.spec.ts`. The generated test cache was removed after verification; use an ignored/writable cache location when rerunning on Windows.

Frontend test command (run from frontend): `node node_modules/vitest/vitest.mjs run src/pages/reports/reportExports.test.ts src/pages/reports/RoleReportGeneration.test.tsx --pool=forks --poolOptions.forks.singleFork`.
