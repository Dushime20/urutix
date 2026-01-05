import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  SwitchCamera,
  Image as ImageIcon,
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Download
} from 'lucide-react';

interface CameraDocumentScannerProps {
  onDocumentCaptured: (documents: CapturedDocument[]) => void;
  onClose: () => void;
  documentType?: 'invoice' | 'pod' | 'bill-of-lading' | 'insurance' | 'general';
}

interface CapturedDocument {
  id: string;
  type: string;
  imageData: string;
  timestamp: Date;
  extractedData?: any;
  processed: boolean;
}

export const CameraDocumentScanner: React.FC<CameraDocumentScannerProps> = ({
  onDocumentCaptured,
  onClose,
  documentType = 'general'
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedDocs, setCapturedDocs] = useState<CapturedDocument[]>([]);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const documentTypes = {
    invoice: { label: 'Invoice', icon: '📄', color: 'blue' },
    pod: { label: 'Proof of Delivery', icon: '✅', color: 'emerald' },
    'bill-of-lading': { label: 'Bill of Lading', icon: '📋', color: 'violet' },
    insurance: { label: 'Insurance Document', icon: '🛡️', color: 'amber' },
    general: { label: 'General Document', icon: '📑', color: 'gray' }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          zoom: { ideal: zoom }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCurrentStream(stream);
      setIsCameraActive(true);
      setError('');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }
    setIsCameraActive(false);
  };

  const captureDocument = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply image enhancements
    applyImageEnhancements(ctx, canvas);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    const newDoc: CapturedDocument = {
      id: `doc-${Date.now()}`,
      type: documentType,
      imageData,
      timestamp: new Date(),
      processed: false
    };

    setCapturedDocs([...capturedDocs, newDoc]);

    // Process document with OCR (simulated)
    processDocument(newDoc);

    // Visual feedback
    flashScreen();
  };

  const applyImageEnhancements = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Increase contrast
    const contrast = 1.2;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor * (data[i] - 128) + 128;     // R
      data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
      data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const processDocument = async (doc: CapturedDocument) => {
    setIsProcessing(true);

    // Simulate OCR processing
    setTimeout(() => {
      const extractedData = {
        documentNumber: `${documentType.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toLocaleDateString(),
        amount: documentType === 'invoice' ? `$${(Math.random() * 5000 + 1000).toFixed(2)}` : null,
        confidence: Math.random() * 0.3 + 0.7 // 70-100%
      };

      setCapturedDocs(docs =>
        docs.map(d =>
          d.id === doc.id
            ? { ...d, extractedData, processed: true }
            : d
        )
      );

      setIsProcessing(false);
    }, 2000);
  };

  const flashScreen = () => {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      z-index: 9999;
      pointer-events: none;
      animation: flash 0.3s ease-out;
    `;
    document.body.appendChild(flash);
    setTimeout(() => document.body.removeChild(flash), 300);
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    setTimeout(startCamera, 100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        const newDoc: CapturedDocument = {
          id: `doc-${Date.now()}`,
          type: documentType,
          imageData,
          timestamp: new Date(),
          processed: false
        };
        setCapturedDocs(docs => [...docs, newDoc]);
        processDocument(newDoc);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeDocument = (id: string) => {
    setCapturedDocs(docs => docs.filter(d => d.id !== id));
  };

  const handleComplete = () => {
    onDocumentCaptured(capturedDocs);
    stopCamera();
  };

  const docType = documentTypes[documentType];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Document Scanner</h2>
              <p className="text-sm text-gray-300">{docType.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 rounded-lg text-sm">
              {capturedDocs.length} captured
            </span>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Camera View or Start Screen */}
      <div className="flex-1 relative bg-black">
        {isCameraActive ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
            />
            
            {/* Camera overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Frame guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-4 border-white/50 rounded-2xl w-[80%] h-[60%] shadow-2xl">
                  <div className="absolute -top-3 -left-3 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                  <div className="absolute -top-3 -right-3 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                  <div className="absolute -bottom-3 -left-3 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                  <div className="absolute -bottom-3 -right-3 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl">
                <p className="text-white text-sm font-medium text-center">
                  📄 Align document within frame
                </p>
              </div>

              {/* Processing indicator */}
              {isProcessing && (
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-violet-600 px-6 py-3 rounded-xl flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white font-medium">Processing...</span>
                </div>
              )}
            </div>

            {/* Camera controls */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-4 pointer-events-auto">
              <button
                onClick={switchCamera}
                className="p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
              >
                <SwitchCamera className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={captureDocument}
                disabled={isProcessing}
                className="p-8 bg-white rounded-full hover:bg-gray-100 transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-8 h-8 text-gray-900" />
              </button>

              <label className="p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors cursor-pointer">
                <ImageIcon className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="bg-gray-800 rounded-full p-8 mb-6">
              <Camera className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Start Scanning</h3>
            <p className="text-gray-400 text-center mb-8 max-w-md">
              Capture clear photos of your {docType.label.toLowerCase()}s for automatic processing
            </p>

            {error && (
              <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500 rounded-xl flex items-center gap-2 text-white max-w-md">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={startCamera}
                className="px-8 py-4 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-bold transition-all flex items-center gap-2 shadow-lg"
              >
                <Camera className="w-5 h-5" />
                Open Camera
              </button>

              <label className="px-8 py-4 border-2 border-white/20 text-white rounded-xl hover:bg-white/10 font-bold transition-all flex items-center gap-2 cursor-pointer">
                <Upload className="w-5 h-5" />
                Upload Files
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Captured Documents Strip */}
      {capturedDocs.length > 0 && (
        <div className="bg-gray-900 p-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {capturedDocs.map((doc) => (
              <div
                key={doc.id}
                className="relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-700 hover:border-violet-500 transition-colors group"
              >
                <img
                  src={doc.imageData}
                  alt="Captured document"
                  className="w-full h-full object-cover"
                />
                
                {doc.processed && (
                  <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}

                <button
                  onClick={() => removeDocument(doc.id)}
                  className="absolute top-2 left-2 bg-rose-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {doc.extractedData && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-2">
                    <p className="text-white text-xs font-bold truncate">
                      {doc.extractedData.documentNumber}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleComplete}
            disabled={capturedDocs.length === 0 || isProcessing}
            className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Complete ({capturedDocs.length} documents)
          </button>
        </div>
      )}

      {/* Flash animation styles */}
      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CameraDocumentScanner;

