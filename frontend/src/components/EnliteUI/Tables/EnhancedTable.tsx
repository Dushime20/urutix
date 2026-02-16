import React from 'react';
import { motion } from 'framer-motion';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
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
}: EnhancedTableProps<T>) {
  const getSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) return <FaSort className="text-slate-300" />;
    return sortDirection === 'asc'
      ? <FaSortUp className="text-indigo-600" />
      : <FaSortDown className="text-indigo-600" />;
  };

  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className={`bg-[#fafafa] border-b border-gray-100 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width }}
                  className={`
                    px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest
                    ${getAlignClass(column.align)}
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
                  `}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className="flex items-center gap-2 justify-start">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="text-xs">
                        {getSortIcon(column.key)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-lg font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  onClick={() => onRowClick?.(row, index)}
                  className={`
                    ${striped && index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                    ${hoverable ? 'hover:bg-indigo-50 transition-colors' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${rowClassName ? rowClassName(row, index) : ''}
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-sm text-gray-900 ${getAlignClass(column.align)}`}
                    >
                      {column.render
                        ? column.render((row as any)[column.key], row, index)
                        : (row as any)[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EnhancedTable;
