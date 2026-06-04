/**
 * Bulk Load CSV Upload — CARGO_OWNER role
 * Route: /dashboard/cargos/bulk-upload
 * Layout: DashboardLayout (CargoOwnerLayout)
 */
import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, Download, FileText, CheckCircle2, AlertTriangle, X, Package } from 'lucide-react';
import { bulkCsvApi } from '../../../services/featuresApi';
import { TranslatedText } from '../../../components/translated-text';
import toast from 'react-hot-toast';

interface BulkResult {
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
  loadIds: string[];
}

const BulkUploadPage: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [dragging, setDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (f: File) => bulkCsvApi.upload(f),
    onSuccess: (data: BulkResult) => {
      setResult(data);
      if (data.created > 0) toast.success(`${data.created} loads created successfully`);
      if (data.failed > 0) toast.error(`${data.failed} rows failed — check errors below`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Upload failed'),
  });

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) { toast.error('Only CSV files are accepted'); return; }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <TranslatedText text="Bulk Load Upload" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          <TranslatedText text="Upload a CSV file to create multiple loads at once. Download the template to get started." />
        </p>
      </div>

      {/* Download Template */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={18} className="text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wide">
              <TranslatedText text="CSV Template" />
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              <TranslatedText text="Required columns: origin, destination, weight, pickupDate, deliveryDate, offeredPrice" />
            </p>
          </div>
        </div>
        <a
          href={bulkCsvApi.downloadTemplate()}
          download="loads-template.csv"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all"
        >
          <Download size={14} /> <TranslatedText text="Download Template" />
        </a>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : file
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/10'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 size={36} className="text-emerald-500" />
            <p className="font-black text-slate-900 dark:text-white text-sm">{file.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-bold"
            >
              <X size={12} /> <TranslatedText text="Remove file" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={36} className="text-slate-300 dark:text-slate-600" />
            <p className="font-black text-slate-600 dark:text-slate-400 text-sm">
              <TranslatedText text="Drag & drop your CSV file here, or click to browse" />
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              <TranslatedText text="Only .csv files accepted" />
            </p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && !result && (
        <button
          onClick={() => uploadMutation.mutate(file)}
          disabled={uploadMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-sm transition-all disabled:opacity-50"
        >
          {uploadMutation.isPending ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> <TranslatedText text="Uploading..." /></>
          ) : (
            <><Upload size={16} /> <TranslatedText text="Upload & Create Loads" /></>
          )}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 flex items-center gap-4">
              <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{result.created}</p>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  <TranslatedText text="Loads Created" />
                </p>
              </div>
            </div>
            <div className={`border rounded-2xl p-5 flex items-center gap-4 ${result.failed > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
              <AlertTriangle size={28} className={result.failed > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'} />
              <div>
                <p className={`text-2xl font-black ${result.failed > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>{result.failed}</p>
                <p className={`text-xs font-black uppercase tracking-widest ${result.failed > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                  <TranslatedText text="Failed Rows" />
                </p>
              </div>
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900 overflow-hidden">
              <div className="px-5 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900">
                <p className="text-xs font-black text-red-700 dark:text-red-300 uppercase tracking-widest">
                  <TranslatedText text="Row Errors" />
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-0.5 flex-shrink-0">
                      Row {err.row}
                    </span>
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{err.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset */}
          <button
            onClick={() => { setFile(null); setResult(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-all"
          >
            <Upload size={14} /> <TranslatedText text="Upload Another File" />
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkUploadPage;
