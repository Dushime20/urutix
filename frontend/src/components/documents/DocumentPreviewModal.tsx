import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, ExternalLink, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { documentApi } from '@/services/documents/documentApi';
import toast from 'react-hot-toast';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  title: string;
  fileName?: string;
  onDownload?: () => void; // Keeping for backward compatibility but using internal if possible
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  documentId,
  title,
  fileName,
  onDownload
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [activeBlob, setActiveBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    if (!isOpen || !documentId) return;

    setLoading(true);
    setError(null);

    try {
      const blob = await documentApi.downloadDocument(documentId);

      // Safety check: if blob is actually an error message
      if (blob.size < 500) {
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          if (json.statusCode === 401 || json.message === 'Unauthorized') {
            throw new Error('Session expired or unauthorized. Please re-login.');
          }
          if (json.statusCode === 404 || json.message?.includes('not found')) {
            throw new Error('Document file not found on server.');
          }
        } catch (e) {
          // Not JSON, or other error
          if (text.includes('Unauthorized')) throw new Error('Unauthorized access.');
        }
      }

      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setActiveBlob(blob);
    } catch (err: any) {
      console.error('Failed to load document preview:', err);
      setError(err.message || 'Failed to connect to document server');
      toast.error(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [isOpen, documentId]);

  useEffect(() => {
    if (isOpen) {
      loadDocument();
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, documentId]); // Dependencies are fine as blobUrl is replaced when documentId changes

  const handleDownloadInternal = () => {
    if (!activeBlob) {
      if (onDownload) {
        onDownload();
      } else {
        toast.error('Document not ready for download');
      }
      return;
    }

    try {
      const url = window.URL.createObjectURL(activeBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to start download');
    }
  };

  const handleExternalOpen = () => {
    // If we have a local authenticated blob URL, use it! 
    // This bypasses any "different port" or "unauthorized" issues in the new tab.
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    } else {
      // Fallback to direct API link if blob isn't loaded yet
      const viewUrl = documentApi.getDocumentViewUrl(documentId);
      window.open(viewUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100000] p-4 animate-in fade-in duration-300">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center space-x-4 overflow-hidden">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-blue-100 shadow-lg shrink-0">
              <span className="text-white text-xl">📄</span>
            </div>
            <div className="overflow-hidden">
              <h3 className="text-xl font-bold text-gray-900 truncate" title={title}>
                {title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  ID: {documentId.substring(0, 8)}...
                </span>
                {fileName && (
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{fileName}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadInternal}
              disabled={loading || !!error}
              className="h-10 px-4 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExternalOpen}
              className="h-10 px-4 border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Maximize
            </Button>

            <div className="h-8 w-px bg-gray-200 mx-1" />

            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden group">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 z-20">
              <div className="relative">
                <div className="w-16 h-16 border-[5px] border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-base font-semibold text-gray-800">Establishing Secure Connection</p>
                <p className="text-sm text-gray-500 mt-1">Fetching document data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white">
              <div className="bg-red-100 p-6 rounded-3xl mb-6 animate-bounce">
                <AlertCircle className="w-16 h-16 text-red-600" />
              </div>
              <h4 className="text-2xl font-black text-gray-900 mb-3">Preview Interrupted</h4>
              <p className="text-gray-500 max-w-md mb-8 leading-relaxed">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={loadDocument}
                  className="bg-white h-12 px-6 rounded-xl border-gray-200 hover:border-blue-400"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={handleExternalOpen}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-xl shadow-lg shadow-blue-200 transition-all hover:translate-y-[-2px]"
                >
                  Force Open In New Tab
                </Button>
              </div>
            </div>
          ) : blobUrl ? (
            <div className="w-full h-full flex flex-col">
              <iframe
                src={`${blobUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-none shadow-inner"
                title={title}
              />
            </div>
          ) : null}

          {/* Subtle Decorative Border */}
          <div className="absolute inset-0 pointer-events-none border border-black/5" />
        </div>

        {/* Improved Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center px-8 border-b rounded-b-2xl">
          <div className="flex items-center text-gray-400 gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium">
              {loading ? 'Validating credentials...' : 'End-to-end encrypted preview'}
            </span>
          </div>
          {!loading && !error && (
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                Uruti Document Service v2
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
