import React from 'react';
import { motion } from 'framer-motion';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { Inbox } from 'lucide-react';

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  /** Hide from column visibility toggle by default */
  defaultHidden?: boolean;
  /** Prevent hiding this column */
  alwaysVisible?: boolean;
  /** Used by StandardDataTable column visibility selector */
  hideable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface EnhancedTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  stickyHeader?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  /** Enable checkbox selection column */
  selectable?: boolean;
  selectedIds?: string[];
  getRowId?: (row: T, index: number) => string;
  onSelectionChange?: (ids: string[]) => void;
  /** Error message shown instead of table body */
  error?: string | null;
  onRetry?: () => void;
  /** Compact density */
  dense?: boolean;
  /** Accessible table caption / label */
  ariaLabel?: string;
  className?: string;
  /** When true, omit outer card chrome (used inside StandardDataTable / DataCard) */
  embedded?: boolean;
}

export function EnhancedTable<T = any>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  rowClassName,
  stickyHeader = false,
  striped = false,
  hoverable = true,
  selectable = false,
  selectedIds = [],
  getRowId = (_row, index) => String(index),
  onSelectionChange,
  error = null,
  onRetry,
  dense = false,
  ariaLabel = 'Data table',
  className = '',
  embedded = false,
}: EnhancedTableProps<T>) {
  const cellPad = dense ? 'px-4 py-2.5' : 'px-6 py-4';
  const rowIds = data.map((row, i) => getRowId(row, i));
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id));
  const someSelected = rowIds.some((id) => selectedIds.includes(id)) && !allSelected;

  const getSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) return <FaSort className="text-slate-300 dark:text-slate-600" aria-hidden />;
    return sortDirection === 'asc'
      ? <FaSortUp className="text-[#345E85] dark:text-blue-400" aria-hidden />
      : <FaSortDown className="text-[#345E85] dark:text-blue-400" aria-hidden />;
  };

  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const getJustifyClass = (align?: string) => {
    switch (align) {
      case 'center': return 'justify-center';
      case 'right': return 'justify-end';
      default: return 'justify-start';
    }
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : rowIds);
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  };

  const shellClass = embedded
    ? `overflow-hidden ${className}`
    : `bg-white dark:bg-slate-900 rounded-2xl shadow-lg dark:shadow-none border border-transparent dark:border-slate-800 overflow-hidden ${className}`;

  if (loading) {
    return (
      <div className={shellClass} role="status" aria-busy="true" aria-label="Loading table data">
        <div className="overflow-x-auto">
          <div
            className="grid bg-[#fafafa] dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700"
            style={{ gridTemplateColumns: selectable
              ? `3rem repeat(${columns.length}, minmax(0, 1fr))`
              : `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {selectable && <div className={`${cellPad} w-12`} />}
            {columns.map((column) => (
              <div
                key={column.key}
                className={`${cellPad} ui-table-header ${getAlignClass(column.align)}`}
              >
                {column.label}
              </div>
            ))}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid"
                style={{ gridTemplateColumns: selectable
                  ? `3rem repeat(${columns.length}, minmax(0, 1fr))`
                  : `repeat(${columns.length}, minmax(0, 1fr))` }}
              >
                {selectable && (
                  <div className={cellPad}>
                    <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </div>
                )}
                {columns.map((column) => (
                  <div key={column.key} className={cellPad}>
                    <div
                      className="h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse"
                      style={{ width: `${55 + ((i + column.key.length) % 4) * 10}%` }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <span className="sr-only">Loading data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={shellClass} role="alert">
        <div className="p-12 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">Something went wrong</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[#345E85] hover:bg-[#2c5173] text-white ui-button transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label={ariaLabel}>
          <thead
            className={`bg-[#fafafa] dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700 ${
              stickyHeader ? 'sticky top-0 z-10 shadow-sm' : ''
            }`}
          >
            <tr>
              {selectable && (
                <th className={`${cellPad} w-12`} scope="col">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="rounded border-gray-300 dark:border-slate-600 text-[#345E85] focus:ring-[#345E85]/40"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={{ width: column.width }}
                  aria-sort={
                    column.sortable && sortKey === column.key
                      ? sortDirection === 'asc' ? 'ascending' : 'descending'
                      : column.sortable ? 'none' : undefined
                  }
                  className={`
                    ${cellPad} ui-table-header
                    ${getAlignClass(column.align)}
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors select-none' : ''}
                  `}
                  onClick={() => column.sortable && onSort?.(column.key)}
                  onKeyDown={(e) => {
                    if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSort?.(column.key);
                    }
                  }}
                  tabIndex={column.sortable ? 0 : undefined}
                >
                  <div className={`flex items-center gap-2 ${getJustifyClass(column.align)}`}>
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="text-xs">{getSortIcon(column.key)}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-14 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-slate-400">
                    <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                      <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" aria-hidden />
                    </div>
                    <p className="ui-body text-slate-700 dark:text-slate-200">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const id = getRowId(row, index);
                const isSelected = selectedIds.includes(id);
                return (
                  <motion.tr
                    key={id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(index, 12) * 0.02, duration: 0.18 }}
                    onClick={() => onRowClick?.(row, index)}
                    aria-selected={selectable ? isSelected : undefined}
                    className={`
                      ${striped && index % 2 === 1 ? 'bg-gray-50/80 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900'}
                      ${hoverable ? 'hover:bg-indigo-50/70 dark:hover:bg-slate-800/80 transition-colors' : ''}
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-blue-50/80 dark:bg-blue-900/20 ring-1 ring-inset ring-blue-100 dark:ring-blue-800/40' : ''}
                      ${rowClassName ? rowClassName(row, index) : ''}
                    `}
                  >
                    {selectable && (
                      <td className={cellPad} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(id)}
                          aria-label={`Select row ${index + 1}`}
                          className="rounded border-gray-300 dark:border-slate-600 text-[#345E85] focus:ring-[#345E85]/40"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`${cellPad} ui-table-body text-gray-900 dark:text-slate-100 ${getAlignClass(column.align)}`}
                      >
                        {column.render
                          ? column.render((row as any)[column.key], row, index)
                          : (row as any)[column.key]}
                      </td>
                    ))}
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EnhancedTable;
