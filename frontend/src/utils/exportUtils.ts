/**
 * Export Utilities for Driver Dashboard
 * Supports CSV, Excel, and PDF exports with proper formatting
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
export interface ExportData {
  driver?: any;
  stats?: any;
  trips?: any[];
  earnings?: any;
  performance?: any;
  timeRange?: string;
  exportDate?: string;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  includeCharts?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Export driver data to CSV format
 */
export const exportToCSV = (data: ExportData, filename: string = 'driver-dashboard'): void => {
  try {
    const csvRows: string[] = [];
    
    // Header
    csvRows.push('Driver Dashboard Export');
    csvRows.push(`Export Date: ${new Date().toLocaleString()}`);
    csvRows.push(`Time Range: ${data.timeRange || 'All Time'}`);
    csvRows.push('');

    // Driver Information
    if (data.driver) {
      csvRows.push('DRIVER INFORMATION');
      csvRows.push(`Name,${data.driver.firstName} ${data.driver.lastName}`);
      csvRows.push(`Email,${data.driver.email || 'N/A'}`);
      csvRows.push(`Phone,${data.driver.phone || 'N/A'}`);
      csvRows.push(`License Number,${data.driver.licenseNumber || 'N/A'}`);
      csvRows.push('');
    }

    // Statistics
    if (data.stats) {
      csvRows.push('PERFORMANCE STATISTICS');
      csvRows.push('Metric,Value');
      csvRows.push(`Total Trips,${data.stats.totalTrips || 0}`);
      csvRows.push(`Total Distance,${data.stats.totalDistance || 0} km`);
      csvRows.push(`Total Earnings,${data.stats.totalEarnings || 0} RWF`);
      csvRows.push(`Safety Score,${data.stats.safetyScore || 0}%`);
      csvRows.push(`On-Time Delivery Rate,${data.stats.onTimeDeliveryRate || 0}%`);
      csvRows.push(`Rating,${data.stats.rating || 0}/5`);
      csvRows.push(`Hours Worked (Week),${data.stats.hoursWorkedThisWeek || 0}h`);
      csvRows.push(`Hours Worked (Month),${data.stats.hoursWorkedThisMonth || 0}h`);
      csvRows.push('');
    }

    // Trips
    if (data.trips && data.trips.length > 0) {
      csvRows.push('TRIP HISTORY');
      csvRows.push('Trip Number,Status,Origin,Destination,Distance (km),Earnings (RWF),Date');
      
      data.trips.forEach(trip => {
        csvRows.push([
          trip.tripNumber || 'N/A',
          trip.status || 'N/A',
          `"${trip.origin?.city || 'N/A'}, ${trip.origin?.state || 'N/A'}"`,
          `"${trip.destination?.city || 'N/A'}, ${trip.destination?.state || 'N/A'}"`,
          trip.distance || 0,
          trip.earnings || 0,
          trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleDateString() : 'N/A'
        ].join(','));
      });
      csvRows.push('');
    }

    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error('Failed to export CSV');
  }
};

/**
 * Export driver data to Excel format
 */
export const exportToExcel = async (data: ExportData, filename: string = 'driver-dashboard'): Promise<void> => {
  try {
    // Dynamically import xlsx to avoid bundling if not needed
    const XLSX = await import('xlsx');
    
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData: any[][] = [
      ['Driver Dashboard Export'],
      ['Export Date:', new Date().toLocaleString()],
      ['Time Range:', data.timeRange || 'All Time'],
      [],
      ['DRIVER INFORMATION'],
    ];

    if (data.driver) {
      summaryData.push(['Name:', `${data.driver.firstName} ${data.driver.lastName}`]);
      summaryData.push(['Email:', data.driver.email || 'N/A']);
      summaryData.push(['Phone:', data.driver.phone || 'N/A']);
      summaryData.push(['License Number:', data.driver.licenseNumber || 'N/A']);
      summaryData.push([]);
    }

    summaryData.push(['PERFORMANCE STATISTICS']);
    if (data.stats) {
      summaryData.push(['Total Trips:', data.stats.totalTrips || 0]);
      summaryData.push(['Total Distance (km):', data.stats.totalDistance || 0]);
      summaryData.push(['Total Earnings (RWF):', data.stats.totalEarnings || 0]);
      summaryData.push(['Safety Score (%):', data.stats.safetyScore || 0]);
      summaryData.push(['On-Time Delivery Rate (%):', data.stats.onTimeDeliveryRate || 0]);
      summaryData.push(['Rating:', `${data.stats.rating || 0}/5`]);
      summaryData.push(['Hours Worked (Week):', data.stats.hoursWorkedThisWeek || 0]);
      summaryData.push(['Hours Worked (Month):', data.stats.hoursWorkedThisMonth || 0]);
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    summarySheet['!cols'] = [
      { wch: 30 },
      { wch: 30 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Trips Sheet
    if (data.trips && data.trips.length > 0) {
      const tripsData: any[][] = [
        ['Trip Number', 'Status', 'Origin City', 'Origin State', 'Destination City', 'Destination State', 'Distance (km)', 'Earnings (RWF)', 'Date']
      ];

      data.trips.forEach(trip => {
        tripsData.push([
          trip.tripNumber || 'N/A',
          trip.status || 'N/A',
          trip.origin?.city || 'N/A',
          trip.origin?.state || 'N/A',
          trip.destination?.city || 'N/A',
          trip.destination?.state || 'N/A',
          trip.distance || 0,
          trip.earnings || 0,
          trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleDateString() : 'N/A'
        ]);
      });

      const tripsSheet = XLSX.utils.aoa_to_sheet(tripsData);
      
      // Set column widths
      tripsSheet['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, tripsSheet, 'Trips');
    }

    // Performance Sheet
    if (data.performance) {
      const performanceData: any[][] = [
        ['Performance Metrics'],
        [],
        ['Metric', 'Score (%)'],
        ['On-Time Delivery', data.performance.onTimeDelivery || 0],
        ['Safety Score', data.performance.safetyScore || 0],
        ['Customer Rating', data.performance.customerRating || 0],
        ['Fuel Efficiency', data.performance.fuelEfficiency || 0],
        ['Load Utilization', data.performance.loadUtilization || 0],
        ['Response Time', data.performance.responseTime || 0]
      ];

      const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);
      performanceSheet['!cols'] = [{ wch: 20 }, { wch: 15 }];
      
      XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Performance');
    }

    // Write file
    XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Excel export failed:', error);
    throw new Error('Failed to export Excel');
  }
};

/**
 * Export driver data to PDF format
 */
export const exportToPDF = (data: ExportData, filename: string = 'driver-dashboard'): void => {
  try {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Driver Dashboard Report', 105, yPosition, { align: 'center' });
    yPosition += 10;

    // Export Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Time Range: ${data.timeRange || 'All Time'}`, 20, yPosition);
    yPosition += 10;

    // Driver Information
    if (data.driver) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Driver Information', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const driverInfo = [
        ['Name:', `${data.driver.firstName} ${data.driver.lastName}`],
        ['Email:', data.driver.email || 'N/A'],
        ['Phone:', data.driver.phone || 'N/A'],
        ['License Number:', data.driver.licenseNumber || 'N/A']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: driverInfo,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 'auto' }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Performance Statistics
    if (data.stats) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Statistics', 20, yPosition);
      yPosition += 8;

      const statsData = [
        ['Total Trips', (data.stats.totalTrips || 0).toString()],
        ['Total Distance', `${data.stats.totalDistance || 0} km`],
        ['Total Earnings', `${(data.stats.totalEarnings || 0).toLocaleString()} RWF`],
        ['Safety Score', `${data.stats.safetyScore || 0}%`],
        ['On-Time Delivery Rate', `${data.stats.onTimeDeliveryRate || 0}%`],
        ['Rating', `${data.stats.rating || 0}/5`],
        ['Hours Worked (Week)', `${data.stats.hoursWorkedThisWeek || 0}h`],
        ['Hours Worked (Month)', `${data.stats.hoursWorkedThisMonth || 0}h`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: statsData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 'auto' }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Trips Table
    if (data.trips && data.trips.length > 0) {
      // Add new page if needed
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Trip History', 20, yPosition);
      yPosition += 8;

      const tripsData = data.trips.map(trip => [
        trip.tripNumber || 'N/A',
        trip.status || 'N/A',
        `${trip.origin?.city || 'N/A'}, ${trip.origin?.state || 'N/A'}`,
        `${trip.destination?.city || 'N/A'}, ${trip.destination?.state || 'N/A'}`,
        `${trip.distance || 0} km`,
        `${(trip.earnings || 0).toLocaleString()} RWF`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Trip #', 'Status', 'Origin', 'Destination', 'Distance', 'Earnings']],
        body: tripsData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
          5: { cellWidth: 30 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Performance Metrics
    if (data.performance) {
      // Add new page if needed
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Metrics', 20, yPosition);
      yPosition += 8;

      const performanceData = [
        ['On-Time Delivery', `${data.performance.onTimeDelivery || 0}%`],
        ['Safety Score', `${data.performance.safetyScore || 0}%`],
        ['Customer Rating', `${data.performance.customerRating || 0}%`],
        ['Fuel Efficiency', `${data.performance.fuelEfficiency || 0}%`],
        ['Load Utilization', `${data.performance.loadUtilization || 0}%`],
        ['Response Time', `${data.performance.responseTime || 0}%`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Score']],
        body: performanceData,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 'auto' }
        }
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Main export function that routes to appropriate format
 */
export const exportDriverData = async (
  data: ExportData,
  options: ExportOptions
): Promise<void> => {
  const filename = options.filename || 'driver-dashboard';

  try {
    switch (options.format) {
      case 'csv':
        exportToCSV(data, filename);
        break;
      case 'excel':
        await exportToExcel(data, filename);
        break;
      case 'pdf':
        exportToPDF(data, filename);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};
