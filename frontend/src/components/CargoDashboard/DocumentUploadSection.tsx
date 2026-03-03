import React, { useState, useCallback } from 'react';
import { Upload, X, File, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

export interface PendingDocument {
  id: string;
  file: File;
  title: string;
  description?: string;
  documentType: string;
  category: string;
  priority?: string;
  issueDate?: string;
  expiryDate?: string;
  requiresRenewal?: boolean;
  tags?: string[];
  preview?: string;
}

interface DocumentUploadSectionProps {
  documents: PendingDocument[];
  onDocumentsChange: (documents: PendingDocument[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
}

const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  documents,
  onDocumentsChange,
  maxFiles = 10,
  maxFileSize = 10, // 10MB default
  acceptedFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [editingDoc, setEditingDoc] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      return 'File type not supported';
    }

    return null;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Check max files limit
    if (documents.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newDocuments: PendingDocument[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }

      const preview = await createFilePreview(file);

      newDocuments.push({
        id: `temp-${Date.now()}-${Math.random()}`,
        file,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        documentType: 'OTHER',
        category: 'CARGO',
        priority: 'MEDIUM',
        preview,
      });
    }

    if (newDocuments.length > 0) {
      onDocumentsChange([...documents, ...newDocuments]);
      toast.success(`${newDocuments.length} file(s) added`);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      await handleFiles(e.dataTransfer.files);
    },
    [documents, onDocumentsChange]
  );

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFiles(e.target.files);
    e.target.value = ''; // Reset input
  };

  const removeDocument = (id: string) => {
    onDocumentsChange(documents.filter((doc) => doc.id !== id));
    toast.success('Document removed');
  };

  const updateDocument = (id: string, updates: Partial<PendingDocument>) => {
    onDocumentsChange(
      documents.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    return '📎';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            Documents (Optional)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Upload supporting documents for this cargo ({documents.length}/{maxFiles})
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all',
          isDragging
            ? 'border-[#345E85] bg-blue-50'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
        )}
      >
        <input
          type="file"
          id="document-upload"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        <label
          htmlFor="document-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
            <Upload size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, JPG, PNG, DOC (max {maxFileSize}MB each)
            </p>
          </div>
        </label>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Preview or Icon */}
                <div className="flex-shrink-0">
                  {doc.preview ? (
                    <img
                      src={doc.preview}
                      alt={doc.title}
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-2xl border border-slate-200">
                      {getFileIcon(doc.file.type)}
                    </div>
                  )}
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  {editingDoc === doc.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={doc.title}
                        onChange={(e) =>
                          updateDocument(doc.id, { title: e.target.value })
                        }
                        placeholder="Document title"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:border-[#345E85] focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                      <textarea
                        value={doc.description || ''}
                        onChange={(e) =>
                          updateDocument(doc.id, { description: e.target.value })
                        }
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#345E85] focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={doc.documentType}
                          onChange={(e) =>
                            updateDocument(doc.id, { documentType: e.target.value })
                          }
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#345E85] focus:ring-2 focus:ring-blue-100 outline-none"
                        >
                          <option value="INVOICE">Invoice</option>
                          <option value="PACKING_LIST">Packing List</option>
                          <option value="CERTIFICATE">Certificate</option>
                          <option value="PERMIT">Permit</option>
                          <option value="INSURANCE">Insurance</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <select
                          value={doc.priority || 'MEDIUM'}
                          onChange={(e) =>
                            updateDocument(doc.id, { priority: e.target.value })
                          }
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#345E85] focus:ring-2 focus:ring-blue-100 outline-none"
                        >
                          <option value="LOW">Low Priority</option>
                          <option value="MEDIUM">Medium Priority</option>
                          <option value="HIGH">High Priority</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingDoc(null)}
                          className="px-4 py-2 bg-[#345E85] text-white rounded-lg text-xs font-bold hover:bg-[#2a4d6d] transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {doc.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {doc.file.name} • {formatFileSize(doc.file.size)}
                          </p>
                          {doc.description && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {doc.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingDoc(doc.id)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            title="Edit details"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => removeDocument(doc.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                          {doc.documentType}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">
                          {doc.priority || 'MEDIUM'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Message */}
      {documents.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Documents will be uploaded after cargo creation
            </p>
            <p className="text-xs text-blue-700 mt-1">
              You can add invoices, packing lists, certificates, or any supporting documents.
              They will be automatically associated with the cargo once it's created.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadSection;
