import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, PenTool, User, FileCheck, RotateCcw,
  ShieldCheck, File, Plus, Trash2, MapPin, CheckCircle2,
  AlertCircle, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tripsAPI } from '../../services/api';

interface ProofOfDeliveryProps {
  tripId: string;
  tripNumber?: string;
  cargoTitle?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const ProofOfDelivery: React.FC<ProofOfDeliveryProps> = ({
  tripId,
  tripNumber,
  cargoTitle,
  onComplete,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=recipient, 2=photos, 3=signature

  // ── Canvas setup ──────────────────────────────────────────────────────────
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (step === 3) setTimeout(initCanvas, 100);
  }, [step, initCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e, canvas);
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
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // ── Photo handling ────────────────────────────────────────────────────────
  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!recipientName.trim()) { toast.error('Recipient name is required'); setStep(1); return; }
    if (!hasSignature) { toast.error('Signature is required'); return; }

    setSubmitting(true);
    try {
      // Convert canvas to blob
      const canvas = canvasRef.current!;
      const signatureBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas empty')), 'image/png');
      });

      const formData = new FormData();
      formData.append('recipientName', recipientName.trim());
      if (recipientPhone) formData.append('recipientPhone', recipientPhone);
      if (deliveryNotes) formData.append('deliveryNotes', deliveryNotes);
      if (odometerReading) formData.append('odometerReading', odometerReading);
      formData.append('signature', signatureBlob, 'signature.png');
      photos.forEach(photo => formData.append('photos', photo));

      // Try to get GPS
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        formData.append('latitude', String(pos.coords.latitude));
        formData.append('longitude', String(pos.coords.longitude));
      } catch {
        // GPS optional — continue without it
      }

      await tripsAPI.submitEpod(tripId, formData);

      setSubmitted(true);
      toast.success('ePOD submitted! Trip completed and invoice generated.', { duration: 5000 });
      setTimeout(onComplete, 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to submit ePOD';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 px-8 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Delivery Confirmed!</h2>
        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
          ePOD submitted successfully. The trip is now marked as completed and an invoice has been sent to the cargo owner.
        </p>
      </motion.div>
    );
  }

  const steps = [
    { num: 1, label: 'Recipient' },
    { num: 2, label: 'Photos' },
    { num: 3, label: 'Signature' },
  ];

  const canProceed = step === 1
    ? recipientName.trim().length > 0
    : step === 2
    ? true // photos optional
    : hasSignature;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <FileCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Electronic Proof of Delivery</p>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {tripNumber || 'Trip'} {cargoTitle ? `— ${cargoTitle}` : ''}
            </h2>
          </div>
        </div>
        <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all border border-slate-100">
          <X size={18} />
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <button
              onClick={() => { if (s.num < step || (s.num === step + 1 && canProceed)) setStep(s.num as 1|2|3); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                step === s.num
                  ? 'bg-blue-600 text-white'
                  : step > s.num
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                step > s.num ? 'bg-emerald-500 text-white' : step === s.num ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-400'
              }`}>
                {step > s.num ? '✓' : s.num}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded ${step > s.num ? 'bg-emerald-300' : 'bg-slate-100'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={13} className="text-blue-600" /> Recipient Information
              </h3>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="Name of person who received the cargo"
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Phone (optional)</label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  placeholder="+250 7XX XXX XXX"
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Odometer Reading (optional)</label>
                <input
                  type="text"
                  value={odometerReading}
                  onChange={e => setOdometerReading(e.target.value)}
                  placeholder="e.g. 125,430 km"
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Delivery Notes (optional)</label>
                <textarea
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  placeholder="Any notes about cargo condition, partial delivery, etc."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <MapPin size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Your GPS location will be automatically captured when you submit the ePOD to geo-stamp the delivery.
              </p>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={13} className="text-blue-600" /> Delivery Photos
                </h3>
                <span className="text-[10px] font-bold text-slate-400">{photos.length}/5</span>
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-3">
                {photoPreviews.map((preview, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group">
                    <img src={preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {photos.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                    <Plus size={20} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add Photo</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
                  </label>
                )}
              </div>

              {photos.length === 0 && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Photos are optional but strongly recommended for high-value cargo. They serve as visual evidence of delivery condition.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <PenTool size={13} className="text-blue-600" /> Recipient Signature *
                </h3>
                <button
                  onClick={clearSignature}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  <RotateCcw size={11} /> Clear
                </button>
              </div>

              <div className="relative h-52 bg-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 transition-colors">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={e => { e.preventDefault(); startDrawing(e); }}
                  onTouchMove={e => { e.preventDefault(); draw(e); }}
                  onTouchEnd={e => { e.preventDefault(); stopDrawing(); }}
                  className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Sign here</p>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed text-center">
                By signing, the recipient confirms the cargo was received in the stated condition and releases carrier liability.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Submission Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Recipient</span>
                <span className="font-semibold text-slate-800">{recipientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Photos</span>
                <span className="font-semibold text-slate-800">{photos.length} attached</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Signature</span>
                <span className={`font-semibold ${hasSignature ? 'text-emerald-600' : 'text-red-500'}`}>
                  {hasSignature ? '✓ Captured' : '✗ Required'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button
            onClick={() => setStep(s => (s - 1) as 1|2|3)}
            className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Back
          </button>
        )}

        {step < 3 ? (
          <button
            onClick={() => setStep(s => (s + 1) as 1|2|3)}
            disabled={!canProceed}
            className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all ${
              canProceed
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !hasSignature}
            className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              hasSignature && !submitting
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting...</>
            ) : (
              <><ShieldCheck size={16} /> Submit ePOD & Complete Trip</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
