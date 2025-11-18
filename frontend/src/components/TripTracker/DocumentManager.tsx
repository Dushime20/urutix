import React, { useState } from 'react';
import { FaFileAlt } from 'react-icons/fa';
import Tesseract from 'tesseract.js';
import { extractTextFromPdf } from '../../services/pdfOcrUtil';
import { ocrApi } from '../../services/ocrApi';

function getFileType(url: string) {
  if (url.match(/\.(jpg|jpeg|png|gif)$/i)) return 'image';
  if (url.match(/\.pdf$/i)) return 'pdf';
  return 'other';
}

export const DocumentManager = ({ tripId, documents }: any) => {
  const [ocrResults, setOcrResults] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});

  const handleOcr = async (doc: any, i: number) => {
    setLoading((prev) => ({ ...prev, [i]: true }));
    try {
      let text = '';
      if (getFileType(doc.url) === 'pdf') {
        // Use backend for PDF OCR
        const result = await ocrApi.extractFromUrl(doc.url);
        text = result.text;
      } else {
        // Use backend for images, fallback to frontend if needed
        try {
          const result = await ocrApi.extractFromUrl(doc.url);
          text = result.text;
        } catch {
          const result = await Tesseract.recognize(doc.url, 'eng');
          text = result.data.text;
        }
      }
      setOcrResults((prev) => ({ ...prev, [i]: text }));
    } catch (err) {
      setOcrResults((prev) => ({ ...prev, [i]: 'OCR failed.' }));
    }
    setLoading((prev) => ({ ...prev, [i]: false }));
  };

  return (
    <div className="mb-4 p-2 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-2">Documents</h2>
      <ul className="space-y-4">
        {documents?.map((doc: any, i: number) => {
          const type = getFileType(doc.url);
          return (
            <li key={i} className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <FaFileAlt className="text-gray-600" />
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{doc.name}</a>
                {(type === 'image' || type === 'pdf') && (
                  <button
                    className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
                    onClick={() => handleOcr(doc, i)}
                    disabled={loading[i]}
                  >
                    {loading[i] ? 'Extracting...' : 'OCR'}
                  </button>
                )}
              </div>
              {type === 'image' && (
                <img src={doc.url} alt={doc.name} className="max-h-40 rounded border" />
              )}
              {type === 'pdf' && (
                <iframe src={doc.url} title={doc.name} className="w-full h-40 border rounded" />
              )}
              {ocrResults[i] && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap">
                  <span className="font-semibold">Extracted Text:</span> {ocrResults[i]}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
