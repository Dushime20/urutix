import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, FileSpreadsheet, FileJson, CheckCircle } from 'lucide-react';
import { exportData } from '../../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  filename: string;
  prepareData?: (data: any[]) => any[];
  title?: string;
}

type ExportFormat = 'csv' | 'excel' | 'json';

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  data,
  filename,
  prepareData,
  title = 'Export Data'
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'json'>('excel');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setExporting(true);
    
    try {
      exportData({
        format: selectedFormat,
        filename,
        data,
        prepareData
      });
      
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formats = [
    {
      id: 'excel' as const,
      name: 'Excel (CSV)',
      description: 'Best for Excel, Google Sheets',
      icon: FileSpreadsheet,
      color: 'emerald',
      recommended: true
    },
    {
      id: 'csv' as const,
      name: 'CSV',
      description: 'Universal format, all apps',
      icon: FileText,
      color: 'blue',
      recommended: false
    },
    {
      id: 'json' as const,
      name: 'JSON',
      description: 'For developers, APIs',
      icon: FileJson,
      color: 'purple',
      recommended: false
    }
  ];

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 px-8 py-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {title}
            </h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
              {data.length} records ready to export
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {exportSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">Export Successful!</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Your file has been downloaded</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Select Export Format
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose the format that works best for your needs
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {formats.map((format) => {
                  const Icon = format.icon;
                  const isSelected = selectedFormat === format.id;
                  
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                        isSelected
                          ? `border-${format.color}-500 bg-${format.color}-50/50 dark:bg-${format.color}-900/20`
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? `bg-${format.color}-600 text-white`
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                            {format.name}
                          </p>
                          {format.recommended && (
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {format.description}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? `border-${format.color}-600 bg-${format.color}-600`
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">
                      Export Information
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      The file will include all visible columns and data. Sensitive information will be handled according to your privacy settings.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Export Data
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExportModal;
