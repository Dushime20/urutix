import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Columns,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  RefreshCw,
} from 'lucide-react';
import DataCard from '../Cards/DataCard';
import EnhancedTable, { type Column } from './EnhancedTable';
import { TableActionMenu, type TableAction } from './TableActionMenu';
import { StatusBadge } from './StatusBadge';

export type { Column, TableAction };
export { StatusBadge };

export interface FilterOption {
  value: string;
  label: string;
}

export interface TableFilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  /** 'all' value that means no filter (default 'all') */
  allValue?: string;
}

export interface StandardDataTableProps<T = any> {
  /** Optional DataCard title — omit for embedded table-only mode */
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default';
  headerActions?: React.ReactNode;

  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;

  /** Client-side search */
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  /** Controlled search (optional) */
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  /** Client-side filters */
  filters?: TableFilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;

  /** Sorting — client-side if onSort not provided */
  sortable?: boolean;
  defaultSortKey?: string;
  defaultSortDirection?: 'asc' | 'desc';
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;

  /** Pagination */
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  /** Server-side total; when set, pagination is controlled externally */
  totalItems?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  /** Column visibility selector */
  columnVisibility?: boolean;

  /** Row selection */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  getRowId?: (row: T, index: number) => string;

  /** Per-row action menu appended as last column */
  rowActions?: TableAction<T>[];
  actionsLabel?: string;

  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;

  stickyHeader?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  dense?: boolean;

  /** Show export button in toolbar */
  onExport?: () => void;
  exportLabel?: string;

  /** Refresh button */
  onRefresh?: () => void;

  className?: string;
  toolbarExtra?: React.ReactNode;
  /** Skip DataCard wrapper */
  embedded?: boolean;
  ariaLabel?: string;
}

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  if (path in obj) return obj[path];
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function compareValues(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const da = Date.parse(String(a));
  const db = Date.parse(String(b));
  if (!Number.isNaN(da) && !Number.isNaN(db) && String(a).length > 8 && String(b).length > 8) {
    return da - db;
  }
  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true });
}

export function StandardDataTable<T = any>({
  title,
  subtitle,
  icon,
  headerColor = 'primary',
  headerActions,
  columns,
  data,
  loading = false,
  error = null,
  onRetry,
  emptyMessage = 'No records match your current filters',
  searchable = true,
  searchPlaceholder = 'Search…',
  searchKeys,
  searchValue: controlledSearch,
  onSearchChange,
  filters = [],
  filterValues: controlledFilters,
  onFilterChange,
  sortable = true,
  defaultSortKey,
  defaultSortDirection = 'asc',
  sortKey: controlledSortKey,
  sortDirection: controlledSortDir,
  onSort,
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  totalItems,
  page: controlledPage,
  onPageChange,
  onPageSizeChange,
  columnVisibility = true,
  selectable = false,
  selectedIds: controlledSelected,
  onSelectionChange,
  getRowId = (_row, index) => String(index),
  rowActions,
  actionsLabel = 'Actions',
  onRowClick,
  rowClassName,
  stickyHeader = true,
  striped = true,
  hoverable = true,
  dense = false,
  onExport,
  exportLabel = 'Export',
  onRefresh,
  className = '',
  toolbarExtra,
  embedded = false,
  ariaLabel,
}: StandardDataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('');
  const [internalFilters, setInternalFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((f) => [f.key, f.allValue ?? 'all'])),
  );
  const [internalSortKey, setInternalSortKey] = useState(defaultSortKey || '');
  const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc'>(defaultSortDirection);
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
    () => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)),
  );

  const search = controlledSearch ?? internalSearch;
  const filterState = controlledFilters ?? internalFilters;
  const sortKey = controlledSortKey ?? internalSortKey;
  const sortDirection = controlledSortDir ?? internalSortDir;
  const page = controlledPage ?? internalPage;
  const pageSize = onPageSizeChange ? (initialPageSize || internalPageSize) : internalPageSize;
  const selectedIds = controlledSelected ?? internalSelected;
  const isServerPaged = typeof totalItems === 'number' && !!onPageChange;

  useEffect(() => {
    if (controlledPage == null) setInternalPage(1);
  }, [search, filterState, pageSize, controlledPage]);

  const setSearch = (v: string) => {
    onSearchChange?.(v);
    if (controlledSearch === undefined) setInternalSearch(v);
  };

  const setFilter = (key: string, value: string) => {
    onFilterChange?.(key, value);
    if (controlledFilters === undefined) {
      setInternalFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSort = (key: string) => {
    const nextDir: 'asc' | 'desc' =
      sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort?.(key, nextDir);
    if (controlledSortKey === undefined) {
      setInternalSortKey(key);
      setInternalSortDir(nextDir);
    }
  };

  const handleSelectionChange = (ids: string[]) => {
    onSelectionChange?.(ids);
    if (controlledSelected === undefined) setInternalSelected(ids);
  };

  const setPage = (p: number) => {
    onPageChange?.(p);
    if (controlledPage === undefined) setInternalPage(p);
  };

  const setPageSize = (size: number) => {
    onPageSizeChange?.(size);
    if (!onPageSizeChange) setInternalPageSize(size);
    setPage(1);
  };

  const resolvedSearchKeys = useMemo(() => {
    if (searchKeys?.length) return searchKeys;
    return columns.filter((c) => c.key !== 'actions').map((c) => c.key);
  }, [searchKeys, columns]);

  const processedData = useMemo(() => {
    if (isServerPaged) return data;

    let rows = [...data];

    // Search
    if (searchable && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) =>
        resolvedSearchKeys.some((key) => {
          const val = getNestedValue(row, key);
          if (val == null) return false;
          return String(val).toLowerCase().includes(q);
        }),
      );
    }

    // Filters
    for (const f of filters) {
      const allVal = f.allValue ?? 'all';
      const current = filterState[f.key] ?? allVal;
      if (current !== allVal) {
        rows = rows.filter((row) => String(getNestedValue(row, f.key)) === String(current));
      }
    }

    // Sort
    if (sortable && sortKey) {
      rows.sort((a, b) => {
        const cmp = compareValues(getNestedValue(a, sortKey), getNestedValue(b, sortKey));
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return rows;
  }, [
    data,
    isServerPaged,
    searchable,
    search,
    resolvedSearchKeys,
    filters,
    filterState,
    sortable,
    sortKey,
    sortDirection,
  ]);

  const total = isServerPaged ? (totalItems as number) : processedData.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageData = useMemo(() => {
    if (isServerPaged) return processedData;
    if (!pagination) return processedData;
    const start = (safePage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, isServerPaged, pagination, safePage, pageSize]);

  const visibleColumns = useMemo(() => {
    const cols = columns.filter((c) => !hiddenColumns.has(c.key) || c.alwaysVisible);
    if (rowActions?.length) {
      cols.push({
        key: '__actions',
        label: actionsLabel,
        alwaysVisible: true,
        hideable: false,
        align: 'right' as const,
        render: (_: any, row: T) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <TableActionMenu row={row} actions={rowActions} />
          </div>
        ),
      });
    }
    return cols;
  }, [columns, hiddenColumns, rowActions, actionsLabel]);

  const activeFilterCount = filters.filter((f) => {
    const allVal = f.allValue ?? 'all';
    return (filterState[f.key] ?? allVal) !== allVal;
  }).length;

  const toolbar = (
    <div className="space-y-3 mb-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#345E85]/30 focus:border-[#345E85] transition-shadow"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {toolbarExtra}
          {filters.length > 0 && (
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-[#345E85]/10 border-[#345E85]/30 text-[#345E85] dark:text-blue-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#345E85] text-white text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
          {columnVisibility && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumns((v) => !v)}
                aria-expanded={showColumns}
                aria-haspopup="true"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Columns className="w-3.5 h-3.5" />
                Columns
              </button>
              {showColumns && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColumns(false)} aria-hidden />
                  <div
                    role="menu"
                    className="absolute right-0 mt-1.5 z-50 w-56 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl"
                  >
                    <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Toggle columns
                    </p>
                    {columns
                      .filter((c) => c.hideable !== false && !c.alwaysVisible && c.key !== '__actions')
                      .map((col) => {
                        const checked = !hiddenColumns.has(col.key);
                        return (
                          <label
                            key={col.key}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setHiddenColumns((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(col.key)) next.delete(col.key);
                                  else next.add(col.key);
                                  return next;
                                });
                              }}
                              className="rounded border-gray-300 text-[#345E85] focus:ring-[#345E85]/40"
                            />
                            {col.label}
                          </label>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Refresh"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#345E85] hover:bg-[#2c5173] text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {exportLabel}
            </button>
          )}
        </div>
      </div>

      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
          {filters.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 min-w-[140px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{f.label}</span>
              <select
                value={filterState[f.key] ?? f.allValue ?? 'all'}
                onChange={(e) => setFilter(f.key, e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
              >
                <option value={f.allValue ?? 'all'}>All</option>
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          ))}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                filters.forEach((f) => setFilter(f.key, f.allValue ?? 'all'));
              }}
              className="self-end text-xs font-bold text-[#345E85] dark:text-blue-400 hover:underline px-2 py-2"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {selectable && selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#345E85]/10 border border-[#345E85]/20 text-sm">
          <span className="text-xs font-bold text-[#345E85] dark:text-blue-300">
            {selectedIds.length} selected
          </span>
          <button
            type="button"
            onClick={() => handleSelectionChange([])}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );

  const paginationBar = pagination && total > 0 && (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium">Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          aria-label="Rows per page"
          className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="hidden sm:inline">
          {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, total)} of {total}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="First page"
          disabled={safePage <= 1}
          onClick={() => setPage(1)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Previous page"
          disabled={safePage <= 1}
          onClick={() => setPage(safePage - 1)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">
          {safePage} / {totalPages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={safePage >= totalPages}
          onClick={() => setPage(safePage + 1)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Last page"
          disabled={safePage >= totalPages}
          onClick={() => setPage(totalPages)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const tableBody = (
    <div className={className}>
      {(searchable || filters.length > 0 || columnVisibility || onExport || onRefresh || toolbarExtra) && toolbar}
      <EnhancedTable
        columns={visibleColumns}
        data={pageData}
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage={emptyMessage}
        onSort={sortable ? handleSort : undefined}
        sortKey={sortKey || undefined}
        sortDirection={sortDirection}
        onRowClick={onRowClick}
        rowClassName={rowClassName}
        stickyHeader={stickyHeader}
        striped={striped}
        hoverable={hoverable}
        selectable={selectable}
        selectedIds={selectedIds}
        getRowId={getRowId}
        onSelectionChange={handleSelectionChange}
        dense={dense}
        ariaLabel={ariaLabel || (typeof title === 'string' ? title : 'Data table')}
        embedded
      />
      {paginationBar}
    </div>
  );

  if (embedded || !title) {
    return tableBody;
  }

  return (
    <DataCard
      title={title}
      subtitle={subtitle}
      icon={icon}
      headerColor={headerColor}
      actions={headerActions}
    >
      {tableBody}
    </DataCard>
  );
}

export default StandardDataTable;
