import React, { useState, useRef } from 'react';
import { 
  FaUpload, FaFileAlt, FaImage, FaFilePdf, FaSpinner, 
  FaCheck, FaTimes, FaEye, FaEdit, FaDownload 
} from 'react-icons/fa';
import { ocrApi } from '../../services/ocrApi';
import type { OcrExtractionResult } from '../../services/ocrApi';

interface OcrDocumentUploadProps {
  documentType?: string;
  onExtractionComplete?: (result: OcrExtractionResult) => void;
  onClose?: () => void;
}

export const OcrDocumentUpload: React.FC<OcrDocumentUploadProps> = ({
  documentType = 'general',
  onExtractionComplete,
  onClose
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OcrExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    { value: 'general', label: 'General Document' },
    { value: 'vehicle_registration', label: 'Vehicle Registration' },
    { value: 'insurance_policy', label: 'Insurance Policy' },
    { value: 'driver_license', label: 'Driver License' },
    { value: 'maintenance_record', label: 'Maintenance Record' },
    { value: 'inspection_report', label: 'Inspection Report' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload an image or PDF.');
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size too large. Please upload a file smaller than 10MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const extractionResult = await ocrApi.uploadAndExtract(file);
      setResult(extractionResult);
      
      if (onExtractionComplete) {
        onExtractionComplete(extractionResult);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtractDocumentData = async () => {
    if (!file || !documentType) return;

    setIsProcessing(true);
    setError(null);

    try {
      const extractionResult = await ocrApi.uploadAndExtractDocument(file, documentType);
      setResult(extractionResult);
      
      if (onExtractionComplete) {
        onExtractionComplete(extractionResult);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to extract document data');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">OCR Document Processing</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Document Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {documentTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload Area */}
      <div className="mb-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {!file ? (
            <div>
              <FaUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Upload Document
              </p>
              <p className="text-gray-500 mb-4">
                Drag and drop your document here, or click to browse
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Choose File
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center mb-4">
                {file.type.startsWith('image/') ? (
                  <FaImage className="w-12 h-12 text-green-600" />
                ) : (
                  <FaFilePdf className="w-12 h-12 text-red-600" />
                )}
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {file.name}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Change File
                </button>
                <button
                  onClick={resetForm}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
          <img
            src={preview}
            alt="Document preview"
            className="max-w-full h-48 object-contain border rounded"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {file && !isProcessing && (
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
          >
            <FaFileAlt className="w-4 h-4" />
            Extract Text
          </button>
          {documentType !== 'general' && (
            <button
              onClick={handleExtractDocumentData}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <FaEdit className="w-4 h-4" />
              Extract Data
            </button>
          )}
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="text-center py-8">
          <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Processing document...</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Extraction Results</h3>
            {result.confidence && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                result.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                result.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </span>
            )}
          </div>

          {/* Extracted Data */}
          {result.extractedData && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Data</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {Object.entries(result.extractedData).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1">
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-sm text-gray-900">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Text */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Text</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                {result.text}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => navigator.clipboard.writeText(result.text)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
            >
              <FaEye className="w-3 h-3" />
              Copy Text
            </button>
            <button
              onClick={() => {
                const blob = new Blob([result.text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'extracted_text.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1"
            >
              <FaDownload className="w-3 h-3" />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 