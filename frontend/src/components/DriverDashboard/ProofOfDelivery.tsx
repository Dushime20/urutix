import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Camera, 
  PenTool, 
  User, 
  FileCheck,
  RotateCcw,
  ShieldCheck,
  File
} from 'lucide-react';
import { TranslatedText } from '../translated-text';
import toast from 'react-hot-toast';

interface ProofOfDeliveryProps {
  cargoId: string;
  onPODComplete: (data: { recipientName: string; signatureBase64: string; photoFile?: File }) => void;
  onCancel: () => void;
}

export const ProofOfDelivery: React.FC<ProofOfDeliveryProps> = ({ 
  cargoId, 
  onPODComplete, 
  onCancel 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution for crisp lines
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio, ratio);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!recipientName.trim()) {
      toast.error('Please enter recipient name');
      return;
    }
    if (!hasSignature) {
      toast.error('Signature is mandatory for POD');
      return;
    }

    setSubmitting(true);
    try {
      const signatureBase64 = canvasRef.current?.toDataURL('image/png') || '';
      
      // Notify parent to complete delivery status
      onPODComplete({
        recipientName,
        signatureBase64,
        photoFile: selectedFile || undefined
      });
    } catch (error) {
      console.error('POD Error:', error);
      toast.error('Failed to generate Proof of Delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-8 max-w-4xl mx-auto py-8 px-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-900/5">
            <FileCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Tactical Delivery Hub</p>
            <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Proof of Delivery (POD)</h2>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all border border-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recipient Information */}
        <div className="space-y-6">
          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
              <User size={14} className="text-[#345E85]" />
              Recipient Information
            </h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block">Recipient Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Enter collector's name"
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85] transition-all"
                />
              </div>
            </div>

            <div className="mt-8 p-6 bg-[#345E85]/5 border border-[#345E85]/10 rounded-3xl">
               <p className="text-[10px] font-bold text-[#345E85] leading-relaxed italic">
                 "By signing this, the recipient confirms that the cargo was received in perfect condition and matches the manifest record."
               </p>
            </div>
          </div>

          {/* Photo Proof */}
          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
              <Camera size={14} className="text-[#345E85]" />
              Photo Proof of Delivery
            </h3>

            <div 
              onClick={() => document.getElementById('pod-photo-upload')?.click()}
              className={`relative p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group ${
                selectedFile 
                  ? 'border-emerald-200 bg-emerald-50/10' 
                  : 'border-slate-100 bg-slate-50/50 hover:border-[#345E85] hover:bg-white'
              }`}
            >
              <input 
                id="pod-photo-upload"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
                accept="image/*"
              />

              {selectedFile ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <File size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-[#0f172a] truncate max-w-[200px]">{selectedFile.name}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      className="mt-2 px-4 py-1.5 bg-white border border-rose-100 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 text-[#345E85] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Camera size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black text-[#0f172a] uppercase tracking-tight">Snap Cargo Photo</p>
                    <p className="text-[9px] font-bold text-slate-400">Mandatory for high-value loads</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Digital Signature Pad */}
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <PenTool size={14} className="text-[#345E85]" />
              Recipient Digital Signature
            </h3>
            <button 
              onClick={clearSignature}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all"
            >
              <RotateCcw size={12} />
              Clear
            </button>
          </div>

          <div className="flex-1 min-h-[350px] bg-slate-50 border-2 border-slate-100 rounded-[2rem] relative overflow-hidden group hover:border-[#345E85]/30 transition-all shadow-inner">
            <canvas 
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
              onTouchMove={(e) => { e.preventDefault(); draw(e); }}
              onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Sign inside this area</p>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
            Legal Disclaimer: This signature acts as a legally binding acceptance of delivery and release of carrier liability.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-8 flex flex-col items-center gap-6">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full max-w-sm h-16 rounded-[2rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${
            hasSignature && recipientName 
              ? 'bg-[#345E85] text-white shadow-blue-900/20 hover:bg-slate-900 active:scale-95' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          {submitting ? (
             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
               <ShieldCheck size={20} />
               Finalize Delivery & Upload POD
            </>
          )}
        </button>

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <TranslatedText text="Cargo ID:" /> <span className="text-[#345E85] font-black">{cargoId}</span>
        </p>
      </div>
    </motion.div>
  );
};
