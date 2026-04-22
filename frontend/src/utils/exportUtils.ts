/**
 * Professional Export Utilities
 * Provides modern export functionality for CSV, Excel, and JSON formats
 */

/**
 * Convert data to CSV format
 */
export const convertToCSV = (data: any[], headers?: string[]): string => {
  if (!data || data.length === 0) return '';

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV content
  const headerRow = csvHeaders.map(escapeCSV).join(',');
  const dataRows = data.map(row => 
    csvHeaders.map(header => escapeCSV(row[header])).join(',')
  ).join('\n');

  return `${headerRow}\n${dataRows}`;
};

/**
 * Download data as CSV file
 */
export const downloadCSV = (data: any[], filename: string, headers?: string[]): void => {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

/**
 * Download data as JSON file
 */
export const downloadJSON = (data: any[], filename: string): void => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filename}.json`);
};

/**
 * Download data as Excel-compatible CSV (with BOM for proper UTF-8 encoding in Excel)
 */
export const downloadExcelCSV = (data: any[], filename: string, headers?: string[]): void => {
  const csv = convertToCSV(data, headers);
  // Add BOM for Excel UTF-8 recognition
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

/**
 * Helper function to trigger file download
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Format date for export
 */
export const formatDateForExport = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return '';
  }
};

/**
 * Format currency for export
 */
export const formatCurrencyForExport = (amount: number | null | undefined, currency: string = 'USD'): string => {
  if (amount === null || amount === undefined) return '';
  return `${currency} ${amount.toFixed(2)}`;
};

/**
 * Prepare loan requests data for export
 */
export const prepareLoanRequestsForExport = (requests: any[]): any[] => {
  return requests.map(req => ({
    'Loan ID': req.id?.substring(0, 8) || '',
    'Borrower Name': req.borrower_name || '',
    'Borrower Company': req.borrower_company || '',
    'Borrower Email': req.borrower_email || '',
    'Borrower Phone': req.borrower_phone || '',
    'Requested Amount': req.requested_amount || 0,
    'Approved Amount': req.approved_amount || '',
    'Status': req.status || '',
    'Priority': req.priority || '',
    'Interest Rate (%)': req.interest_rate || '',
    'Loan Term (Months)': req.loan_term_months || '',
    'Cargo Type': req.cargo_type || '',
    'Cargo Weight (kg)': req.cargo_weight || '',
    'Pickup Location': req.pickup_location || '',
    'Delivery Location': req.delivery_location || '',
    'Risk Score (%)': req.risk_score || '',
    'Credit Score': req.credit_score || '',
    'Lender': req.lender?.name || 'Auto-assigned',
    'Purpose': req.purpose || req.metadata?.purpose || '',
    'Created Date': formatDateForExport(req.created_at),
    'Due Date': formatDateForExport(req.due_date),
    'Processing Fee': req.processing_fee || 0,
    'Total Amount': req.total_amount || 0,
  }));
};

/**
 * Export with format selection modal
 */
export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  filename: string;
  data: any[];
  prepareData?: (data: any[]) => any[];
}

export const exportData = (options: ExportOptions): void => {
  const { format, filename, data, prepareData } = options;
  const processedData = prepareData ? prepareData(data) : data;
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filenameWithDate = `${filename}_${timestamp}`;

  switch (format) {
    case 'csv':
      downloadCSV(processedData, filenameWithDate);
      break;
    case 'excel':
      downloadExcelCSV(processedData, filenameWithDate);
      break;
    case 'json':
      downloadJSON(processedData, filenameWithDate);
      break;
    default:
      console.error('Unsupported export format:', format);
  }
};
