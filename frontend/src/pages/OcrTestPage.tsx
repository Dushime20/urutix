import React, { useState } from 'react';
import { OcrDocumentUpload } from '../components/OCR/OcrDocumentUpload';
import type { OcrExtractionResult } from '../services/ocrApi';

const OcrTestPage: React.FC = () => {
  const [results, setResults] = useState<OcrExtractionResult[]>([]);

  const handleExtractionComplete = (result: OcrExtractionResult) => {
    setResults(prev => [...prev, result]);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">OCR Document Processing Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OCR Upload Component */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Document</h2>
            <OcrDocumentUpload
              onExtractionComplete={handleExtractionComplete}
            />
          </div>

          {/* Results Display */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Processing Results</h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      Document {index + 1} - {result.documentType || 'General'}
                    </h3>
                    {result.confidence && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                        result.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(result.confidence * 100).toFixed(1)}% confidence
                      </span>
                    )}
                  </div>
                  
                  {result.extractedData && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Data:</h4>
                      <div className="bg-gray-50 rounded p-2 text-sm">
                        {Object.entries(result.extractedData).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium">{key}:</span>
                            <span>{value as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Text:</h4>
                    <div className="bg-gray-50 rounded p-2 text-sm max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs">
                        {result.text.substring(0, 200)}...
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
              
              {results.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No documents processed yet.</p>
                  <p className="text-sm">Upload a document to see results here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OcrTestPage; 