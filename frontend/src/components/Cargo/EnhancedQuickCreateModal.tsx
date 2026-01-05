import React, { useState } from 'react';
import { X, Mic, Camera, MapPin, Sparkles } from 'lucide-react';
import QuickCreateModal from './QuickCreateModal';
import VoiceCargoInput from '../VoiceInput/VoiceCargoInput';
import CameraDocumentScanner from '../Camera/CameraDocumentScanner';
import AdvancedGeoLocation from '../Geolocation/AdvancedGeoLocation';

interface EnhancedQuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EnhancedQuickCreateModal: React.FC<EnhancedQuickCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showAdvancedMap, setShowAdvancedMap] = useState(false);
  const [prefilledData, setPrefilledData] = useState<any>({});
  const [scannedDocuments, setScannedDocuments] = useState<any[]>([]);

  const handleVoiceDataCaptured = (data: any) => {
    setPrefilledData({ ...prefilledData, ...data });
    setShowVoiceInput(false);
  };

  const handleDocumentsCaptured = (documents: any[]) => {
    setScannedDocuments(documents);
    setShowCameraScanner(false);
    
    // Extract relevant data from documents if available
    const invoiceData = documents.find(doc => doc.type === 'invoice');
    if (invoiceData?.extractedData) {
      setPrefilledData({
        ...prefilledData,
        loadValue: parseFloat(invoiceData.extractedData.amount?.replace(/[^0-9.]/g, '')) || 0
      });
    }
  };

  const handleLocationSelected = (location: any, type: 'pickup' | 'delivery') => {
    setPrefilledData({
      ...prefilledData,
      [`${type}Location`]: location.address
    });
    setShowAdvancedMap(false);
  };

  if (!isOpen) return null;

  // Voice Input Modal
  if (showVoiceInput) {
    return (
      <VoiceCargoInput
        onDataCaptured={handleVoiceDataCaptured}
        onClose={() => setShowVoiceInput(false)}
      />
    );
  }

  // Camera Scanner Modal
  if (showCameraScanner) {
    return (
      <CameraDocumentScanner
        documentType="invoice"
        onDocumentCaptured={handleDocumentsCaptured}
        onClose={() => setShowCameraScanner(false)}
      />
    );
  }

  // Advanced Geolocation Modal
  if (showAdvancedMap) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Select Location</h3>
            <button
              onClick={() => setShowAdvancedMap(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1">
            <AdvancedGeoLocation
              mode="select"
              onLocationSelected={(location) => handleLocationSelected(location, 'pickup')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Advanced Features */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Quick Create Cargo</h2>
              <p className="text-violet-100 text-sm">Fill in the details or use advanced features</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Advanced Feature Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowVoiceInput(true)}
              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 group"
            >
              <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Voice Input</span>
            </button>

            <button
              onClick={() => setShowCameraScanner(true)}
              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 group"
            >
              <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Scan Document</span>
            </button>

            <button
              onClick={() => setShowAdvancedMap(true)}
              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 group"
            >
              <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Advanced Map</span>
            </button>
          </div>

          {/* Data Preview */}
          {Object.keys(prefilledData).length > 0 && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Pre-filled Data:</span>
              </div>
              <div className="text-sm text-violet-100">
                {Object.keys(prefilledData).length} fields captured
              </div>
            </div>
          )}

          {scannedDocuments.length > 0 && (
            <div className="mt-2 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span className="text-sm">{scannedDocuments.length} documents scanned</span>
              </div>
            </div>
          )}
        </div>

        {/* Original Quick Create Form */}
        <div className="flex-1 overflow-y-auto">
          <QuickCreateModal
            isOpen={true}
            onClose={onClose}
            onSuccess={onSuccess}
            initialData={prefilledData}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedQuickCreateModal;

