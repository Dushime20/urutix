import React, { useRef, useState } from 'react';
import { FaFilePdf, FaFileImage, FaFileAlt, FaTrash, FaEye, FaDownload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import DocumentPreviewModal from '../../documents/DocumentPreviewModal';
import { documentApi } from '../../../services/documents/documentApi';
import type { ComplianceDocRecord, CompliancePermitStatus } from '../../../utils/vehicleComplianceDocuments';
import {
  validateComplianceFile,
  formatFileSize,
} from '../../../utils/vehicleComplianceDocuments';

const inputClass =
  'w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none appearance-none';
const labelClass =
  'block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1';

const STATUSES: { value: CompliancePermitStatus; label: string }[] = [
  { value: 'VALID', label: 'Valid' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'EXPIRING', label: 'Expiring soon' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

interface ComplianceDocumentFieldProps {
  title: string;
  numberLabel: string;
  value: ComplianceDocRecord;
  onChange: (next: ComplianceDocRecord) => void;
  required?: boolean;
  requiredFile?: boolean;
  extraField?: React.ReactNode;
  onRemove?: () => void;
}

const fileIcon = (mimeType?: string, fileName?: string) => {
  const name = (fileName || '').toLowerCase();
  if (mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif)$/.test(name)) {
    return <FaFileImage className="text-blue-600 dark:text-blue-400" />;
  }
  if (mimeType === 'application/pdf' || name.endsWith('.pdf')) {
    return <FaFilePdf className="text-red-500" />;
  }
  return <FaFileAlt className="text-gray-400" />;
};

export const ComplianceDocumentField: React.FC<ComplianceDocumentFieldProps> = ({
  title,
  numberLabel,
  value,
  onChange,
  required,
  requiredFile,
  extraField,
  onRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDoc, setPreviewDoc] = useState<{ id: string; title: string; fileName?: string } | null>(null);
  const hasFile = Boolean(value.file || value.documentId || value.fileName);
  const expired =
    Boolean(value.expiryDate) && new Date(value.expiryDate as string) < new Date(new Date().toDateString());

  const applyFile = (file: File | undefined) => {
    if (!file) {
      if (value.previewUrl) URL.revokeObjectURL(value.previewUrl);
      onChange({
        ...value,
        file: undefined,
        previewUrl: undefined,
        fileName: value.documentId ? value.fileName : undefined,
        fileSize: value.documentId ? value.fileSize : undefined,
        mimeType: value.documentId ? value.mimeType : undefined,
      });
      return;
    }
    const error = validateComplianceFile(file);
    if (error) {
      toast.error(error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (value.previewUrl) URL.revokeObjectURL(value.previewUrl);
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    onChange({
      ...value,
      file,
      previewUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-900/40 rounded-lg border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between gap-3">
        <h5 className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h5>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>
            {numberLabel} {required && '*'}
          </label>
          <input
            type="text"
            value={value.number || ''}
            onChange={(e) => onChange({ ...value, number: e.target.value })}
            className={inputClass}
            required={required}
            maxLength={80}
            placeholder={numberLabel}
          />
        </div>
        <div>
          <label className={labelClass}>Issuing authority</label>
          <input
            type="text"
            value={value.issuingAuthority || ''}
            onChange={(e) => onChange({ ...value, issuingAuthority: e.target.value })}
            className={inputClass}
            maxLength={120}
            placeholder="e.g. NTSA, FMCSA, Customs"
          />
        </div>
        <div>
          <label className={labelClass}>Issue date</label>
          <input
            type="date"
            value={value.issueDate || ''}
            onChange={(e) => onChange({ ...value, issueDate: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            Expiry date {required && '*'}
          </label>
          <input
            type="date"
            value={value.expiryDate || ''}
            onChange={(e) => onChange({ ...value, expiryDate: e.target.value })}
            className={inputClass}
            required={required}
          />
          {expired && (
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500 px-1">
              This document has expired
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={value.status || 'VALID'}
            onChange={(e) => onChange({ ...value, status: e.target.value as CompliancePermitStatus })}
            className={inputClass}
          >
            {STATUSES.map((option) => (
              <option key={option.value} value={option.value} className="dark:bg-gray-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {extraField}
      </div>

      <div>
        <label className={labelClass}>
          Supporting document {requiredFile && '*'}
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png"
          onChange={(e) => applyFile(e.target.files?.[0])}
          className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg"
        />
        <p className="mt-1.5 text-[9px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
          PDF, JPG, PNG, DOC or DOCX · Max 10MB · Expiry is tracked independently of the file
        </p>
      </div>

      {hasFile && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
          {value.previewUrl ? (
            <img src={value.previewUrl} alt="" className="w-12 h-12 object-cover rounded-md border border-gray-100 dark:border-gray-700" />
          ) : (
            <div className="w-12 h-12 rounded-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-lg">
              {fileIcon(value.mimeType, value.fileName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
              {value.fileName || 'Uploaded document'}
            </p>
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {value.file ? 'Ready to upload' : value.documentId ? 'Stored in document vault' : 'Selected'}
              {value.fileSize ? ` · ${formatFileSize(value.fileSize)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {value.documentId && (
              <button
                type="button"
                onClick={() => setPreviewDoc({ id: value.documentId as string, title: title, fileName: value.fileName })}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                title="Preview"
              >
                <FaEye />
              </button>
            )}
            {value.documentId && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const blob = await documentApi.downloadDocument(value.documentId as string);
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = value.fileName || `${title}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(url);
                  } catch {
                    toast.error('Failed to download document');
                  }
                }}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                title="Download"
              >
                <FaDownload />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                applyFile(undefined);
              }}
              className="p-2 text-gray-400 hover:text-red-500"
              title="Remove file"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      )}

      {previewDoc && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          documentId={previewDoc.id}
          title={previewDoc.title}
          fileName={previewDoc.fileName}
        />
      )}
    </div>
  );
};

export default ComplianceDocumentField;
