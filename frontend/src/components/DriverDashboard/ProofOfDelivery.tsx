import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, PenTool, User, FileCheck, RotateCcw, ShieldCheck,
  Plus, Trash2, MapPin, CheckCircle2, AlertCircle, Loader2,
  Truck, Package, Hash, Building2, Phone, ClipboardList,
  AlertTriangle, Info, Clock, Gauge,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tripsAPI } from '../../services/api';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

// ── Types ─────────────────────────────────────────────────────────────────────
type CargoCondition = 'INTACT' | 'PARTIAL_DAMAGE' | 'FULL_DAMAGE' | 'SHORT_DELIVERY';

interface EpodFormData {
  // Step 1 — Delivery Info
  deliveredAt: string;
  deliveryAddress: string;
  odometerReading: string;
  // Step 2 — Recipient
  recipientName: string;
  recipientPhone: string;
  recipientIdNumber: string;
  recipientCompany: string;
  // Step 3 — Cargo Condition
  cargoCondition: CargoCondition;
  unitsDelivered: string;
  deliveryNotes: string;
  exceptionNotes: string;
  // Step 4 — Photos (handled separately as File[])
  // Step 5 — Signature (handled separately via canvas)
}

interface ProofOfDeliveryProps {
  tripId: string;
  tripNumber?: string;
  cargoTitle?: string;
  origin?: string;
  destination?: string;
  cargoWeight?: number;
  onComplete: () => void;
  onCancel: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CARGO_CONDITIONS: { value: CargoCondition; label: string; desc: string; color: string; icon: React.ElementType }[] = [
  { value: 'INTACT',         label: 'Intact',          desc: 'All units delivered in perfect condition',          color: 'emerald', icon: CheckCircle2   },
  { value: 'PARTIAL_DAMAGE', label: 'Partial Damage',  desc: 'Some units have damage — exceptions logged',        color: 'amber',   icon: AlertTriangle  },
  { value: 'SHORT_DELIVERY', label: 'Short Delivery',  desc: 'Fewer units delivered than manifested',             color: 'orange',  icon: Package        },
  { value: 'FULL_DAMAGE',    label: 'Full Damage',     desc: 'Cargo is unusable — full exception report required', color: 'red',     icon: AlertCircle    },
];

const STEPS = [
  { id: 1, label: 'Delivery',   desc: 'Location & vehicle',    icon: Truck        },
  { id: 2, label: 'Recipient',  desc: 'Who received cargo',    icon: User         },
  { id: 3, label: 'Condition',  desc: 'Cargo state & remarks', icon: ClipboardList},
  { id: 4, label: 'Evidence',   desc: 'Delivery photos',       icon: Camera       },
  { id: 5, label: 'Signature',  desc: 'Recipient sign-off',    icon: PenTool      },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const ProofOfDelivery: React.FC<ProofOfDeliveryProps> = ({
  tripId, tripNumber, cargoTitle, origin, destination, cargoWeight,
  onComplete, onCancel,
}) => {
  const { tSync: t } = useTranslation();
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const [step,       setStep]       = useState<number>(1);
  const [isDrawing,  setIsDrawing]  = useState(false);
  const [hasSig,     setHasSig]     = useState(false);
  const [photos,     setPhotos]     = useState<File[]>([]);
  const [previews,   setPreviews]   = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [gpsStatus,  setGpsStatus]  = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle');
  const [gps,        setGps]        = useState<{ lat: number; lng: number } | null>(null);

  const [form, setForm] = useState<EpodFormData>({
    deliveredAt:    new Date().toISOString().slice(0, 16),
    deliveryAddress:'',
    odometerReading:'',
    recipientName:  '',
    recipientPhone: '',
    recipientIdNumber: '',
    recipientCompany: '',
    cargoCondition: 'INTACT',
    unitsDelivered: '',
    deliveryNotes:  '',
    exceptionNotes: '',
  });

  const set = (k: keyof EpodFormData, v: string) => setForm(p => ({ ...p, [k]: v }));

  // ── GPS ───────────────────────────────────────────────────────────────────
  const captureGps = () => {
    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      pos => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsStatus('ok'); },
      ()  => setGpsStatus('denied'),
      { timeout: 8000, enableHighAccuracy: true },
    );
  };
  useEffect(() => { captureGps(); }, []);

  // ── Canvas ────────────────────────────────────────────────────────────────
  const initCanvas = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const r = window.devicePixelRatio || 1;
    c.width  = c.offsetWidth  * r;
    c.height = c.offsetHeight * r;
    ctx.scale(r, r);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }, []);
  useEffect(() => { if (step === 5) setTimeout(initCanvas, 120); }, [step, initCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect();
    if ('touches' in e) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: (e as React.MouseEvent).clientX - r.left, y: (e as React.MouseEvent).clientY - r.top };
  };
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const { x, y } = getPos(e, c); ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const { x, y } = getPos(e, c); ctx.lineTo(x, y); ctx.stroke(); setHasSig(true);
  };
  const stopDraw = () => setIsDrawing(false);
  const clearSig = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height); setHasSig(false);
  };

  // ── Photos ────────────────────────────────────────────────────────────────
  const addPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 8) { toast.error(t('Maximum 8 photos allowed')); return; }
    setPhotos(p => [...p, ...files]);
    setPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };
  const removePhoto = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setPhotos(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  // ── Validation per step ───────────────────────────────────────────────────
  const stepValid = (s: number): boolean => {
    if (s === 1) return true; // all optional, delivery timestamp auto-filled
    if (s === 2) return form.recipientName.trim().length > 0;
    if (s === 3) {
      if (form.cargoCondition !== 'INTACT' && !form.exceptionNotes.trim()) return false;
      return true;
    }
    if (s === 4) return true; // photos optional but recommended
    if (s === 5) return hasSig;
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.recipientName.trim()) { toast.error(t('Recipient name is required')); setStep(2); return; }
    if (!hasSig) { toast.error(t('Recipient signature is required')); return; }

    setSubmitting(true);
    try {
      const canvas = canvasRef.current!;
      const sigBlob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('Canvas empty')), 'image/png'),
      );

      const fd = new FormData();
      // Required
      fd.append('recipientName',    form.recipientName.trim());
      // Optional — recipient
      if (form.recipientPhone)     fd.append('recipientPhone',     form.recipientPhone);
      if (form.recipientIdNumber)  fd.append('recipientIdNumber',  form.recipientIdNumber);
      if (form.recipientCompany)   fd.append('recipientCompany',   form.recipientCompany);
      // Delivery
      if (form.deliveredAt)        fd.append('deliveredAt',        form.deliveredAt);
      if (form.deliveryAddress)    fd.append('deliveryAddress',    form.deliveryAddress);
      if (form.odometerReading)    fd.append('odometerReading',    form.odometerReading);
      // Cargo condition
      fd.append('cargoCondition',  form.cargoCondition);
      if (form.unitsDelivered)     fd.append('unitsDelivered',     form.unitsDelivered);
      if (form.deliveryNotes)      fd.append('deliveryNotes',      form.deliveryNotes);
      if (form.exceptionNotes)     fd.append('exceptionNotes',     form.exceptionNotes);
      // GPS
      if (gps) { fd.append('latitude', String(gps.lat)); fd.append('longitude', String(gps.lng)); }
      // Files
      fd.append('signature', sigBlob, 'signature.png');
      photos.forEach(p => fd.append('photos', p));

      await tripsAPI.submitEpod(tripId, fd);

      setSubmitted(true);
      toast.success(t('ePOD submitted — trip completed & invoice generated.'), { duration: 6000 });
      setTimeout(onComplete, 2500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || t('Failed to submit ePOD'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-xl shadow-emerald-100">
        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
      </div>
      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 mb-4">
        <TranslatedText text="ePOD Confirmed" />
      </span>
      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3"><TranslatedText text="Delivery Verified" /></h2>
      <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
        <TranslatedText text="Electronic Proof of Delivery submitted successfully. Trip is marked COMPLETED, invoice generated, and cargo owner notified." />
      </p>
    </motion.div>
  );

  // ── Shared input class ────────────────────────────────────────────────────
  const inp = 'w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#345E85]/30 focus:border-[#345E85] transition-all';
  const lbl = 'block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5';

  return (
    <div className="flex flex-col h-full max-h-[90vh] bg-white rounded-[2rem] overflow-hidden">

      {/* ── Top header ────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-transparent px-6 pt-6 pb-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileCheck size={16} className="text-emerald-500 dark:text-emerald-400" />
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <TranslatedText text="Electronic Proof of Delivery" />
              </span>
            </div>
            <h2 className="text-xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
              {tripNumber ? <><TranslatedText text="Trip #" />{tripNumber}</> : <TranslatedText text="Trip Completion" />}
            </h2>
            {cargoTitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">{cargoTitle}</p>
            )}
          </div>
          <button onClick={onCancel}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all border border-slate-200 dark:border-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Trip summary strip */}
        {(origin || destination || cargoWeight) && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex-wrap gap-y-1">
            {origin      && <span>{origin}</span>}
            {origin && destination && <span className="text-slate-400 dark:text-slate-600">→</span>}
            {destination && <span>{destination}</span>}
            {cargoWeight && <><span className="text-slate-400 dark:text-slate-600 mx-1">·</span><span>{cargoWeight.toLocaleString()} kg</span></>}
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-1 mt-5">
          {STEPS.map((s, i) => {
            const done   = step > s.id;
            const active = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
                  ${active ? 'bg-emerald-500 text-white' : done ? 'bg-emerald-50 text-emerald-600 dark:bg-white/15 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-600'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black
                    ${active ? 'bg-white text-emerald-600' : done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-white/10'}`}>
                    {done ? '✓' : s.id}
                  </span>
                  <span className="hidden sm:inline"><TranslatedText text={s.label} /></span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded ${step > s.id ? 'bg-emerald-500/40' : 'bg-slate-200 dark:bg-white/10'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        <AnimatePresence mode="wait">

          {/* STEP 1 — Delivery Info */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-5">
              <div>
                <p className="text-[10px] font-black text-[#345E85] uppercase tracking-widest mb-0.5"><TranslatedText text="Step 1 of 5" /></p>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight"><TranslatedText text="Delivery Details" /></h3>
                <p className="text-xs text-slate-400 mt-0.5"><TranslatedText text="Record when and where the cargo was delivered." /></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}><Clock size={10} className="inline mr-1"/><TranslatedText text="Actual Delivery Date & Time *" /></label>
                  <input type="datetime-local" value={form.deliveredAt}
                    onChange={e => set('deliveredAt', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}><Gauge size={10} className="inline mr-1"/><TranslatedText text="Odometer at Delivery (km)" /></label>
                  <input type="number" placeholder={t('e.g. 125430')} value={form.odometerReading}
                    onChange={e => set('odometerReading', e.target.value)} className={inp} />
                </div>
              </div>

              <div>
                <label className={lbl}><MapPin size={10} className="inline mr-1"/><TranslatedText text="Actual Delivery Address" /></label>
                <input type="text" placeholder={t('Full delivery address if different from scheduled destination')}
                  value={form.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} className={inp} />
              </div>

              {/* GPS status */}
              <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs font-bold ${
                gpsStatus === 'ok'      ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                gpsStatus === 'denied'  ? 'bg-amber-50  border-amber-100  text-amber-700'  :
                gpsStatus === 'loading' ? 'bg-blue-50   border-blue-100   text-blue-700'   :
                'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <MapPin size={14} className="shrink-0" />
                {gpsStatus === 'ok'      && `${t('GPS captured:')} ${gps!.lat.toFixed(5)}, ${gps!.lng.toFixed(5)}`}
                {gpsStatus === 'loading' && t('Capturing GPS coordinates…')}
                {gpsStatus === 'denied'  && t('GPS unavailable — delivery will proceed without geo-stamp')}
                {gpsStatus === 'idle'    && t('GPS location will be captured automatically')}
                {gpsStatus === 'denied' && (
                  <button onClick={captureGps} className="ml-auto px-3 py-1 bg-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-200 transition-all">
                    <TranslatedText text="Retry" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Recipient */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-5">
              <div>
                <p className="text-[10px] font-black text-[#345E85] uppercase tracking-widest mb-0.5"><TranslatedText text="Step 2 of 5" /></p>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight"><TranslatedText text="Recipient Information" /></h3>
                <p className="text-xs text-slate-400 mt-0.5"><TranslatedText text="Identity of the person who physically accepted the cargo." /></p>
              </div>

              <div>
                <label className={lbl}><User size={10} className="inline mr-1"/><TranslatedText text="Full Legal Name *" /></label>
                <input type="text" placeholder={t('Full name as on ID')} value={form.recipientName}
                  onChange={e => set('recipientName', e.target.value)} className={inp} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}><Phone size={10} className="inline mr-1"/><TranslatedText text="Phone Number" /></label>
                  <input type="tel" placeholder="+250 7XX XXX XXX" value={form.recipientPhone}
                    onChange={e => set('recipientPhone', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}><Hash size={10} className="inline mr-1"/><TranslatedText text="ID / Passport Number" /></label>
                  <input type="text" placeholder={t('National ID or passport')} value={form.recipientIdNumber}
                    onChange={e => set('recipientIdNumber', e.target.value)} className={inp} />
                </div>
              </div>

              <div>
                <label className={lbl}><Building2 size={10} className="inline mr-1"/><TranslatedText text="Company / Organisation" /></label>
                <input type="text" placeholder={t('Company name (if receiving on behalf of)')} value={form.recipientCompany}
                  onChange={e => set('recipientCompany', e.target.value)} className={inp} />
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  <TranslatedText text="Recipient details form part of the legally binding ePOD record. Ensure the name matches the individual who signs." />
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Cargo Condition */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-5">
              <div>
                <p className="text-[10px] font-black text-[#345E85] uppercase tracking-widest mb-0.5"><TranslatedText text="Step 3 of 5" /></p>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight"><TranslatedText text="Cargo Condition" /></h3>
                <p className="text-xs text-slate-400 mt-0.5"><TranslatedText text="Declare the state of goods at point of delivery." /></p>
              </div>

              {/* Condition selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CARGO_CONDITIONS.map(c => {
                  const Icon    = c.icon;
                  const active  = form.cargoCondition === c.value;
                  const colors: Record<string, string> = {
                    emerald: active ? 'border-emerald-500 bg-emerald-50 shadow-emerald-100' : 'border-slate-200 hover:border-emerald-300',
                    amber:   active ? 'border-amber-500  bg-amber-50  shadow-amber-100'  : 'border-slate-200 hover:border-amber-300',
                    orange:  active ? 'border-orange-500 bg-orange-50 shadow-orange-100' : 'border-slate-200 hover:border-orange-300',
                    red:     active ? 'border-red-500    bg-red-50    shadow-red-100'    : 'border-slate-200 hover:border-red-300',
                  };
                  const iconColors: Record<string, string> = {
                    emerald: 'text-emerald-600', amber: 'text-amber-600',
                    orange: 'text-orange-600', red: 'text-red-600',
                  };
                  return (
                    <button key={c.value} onClick={() => set('cargoCondition', c.value)}
                      className={`text-left p-4 rounded-xl border-2 transition-all shadow-sm ${colors[c.color]}`}>
                      <div className="flex items-center gap-3 mb-1">
                        <Icon size={16} className={iconColors[c.color]} />
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight"><TranslatedText text={c.label} /></span>
                        {active && <CheckCircle2 size={13} className={`ml-auto ${iconColors[c.color]}`} />}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight"><TranslatedText text={c.desc} /></p>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className={lbl}><Package size={10} className="inline mr-1"/><TranslatedText text="Units / Pieces Delivered" /></label>
                <input type="number" placeholder={t('Actual units delivered (leave blank if full quantity)')}
                  value={form.unitsDelivered} onChange={e => set('unitsDelivered', e.target.value)} className={inp} />
              </div>

              {form.cargoCondition !== 'INTACT' && (
                <div>
                  <label className={lbl}><AlertTriangle size={10} className="inline mr-1 text-amber-500"/>
                    <TranslatedText text="Exception Details *" />
                    <span className="ml-1 text-red-400">(<TranslatedText text="required for non-intact deliveries" />)</span>
                  </label>
                  <textarea rows={3} placeholder={t('Describe the damage, shortage, or exception in detail...')}
                    value={form.exceptionNotes} onChange={e => set('exceptionNotes', e.target.value)}
                    className="w-full bg-slate-50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all resize-none" />
                </div>
              )}

              <div>
                <label className={lbl}><TranslatedText text="General Delivery Remarks" /></label>
                <textarea rows={3} placeholder={t('Any additional notes, access instructions, or remarks for the record...')}
                  value={form.deliveryNotes} onChange={e => set('deliveryNotes', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#345E85]/30 focus:border-[#345E85] transition-all resize-none" />
              </div>
            </motion.div>
          )}

          {/* STEP 4 — Evidence Photos */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-5">
              <div>
                <p className="text-[10px] font-black text-[#345E85] uppercase tracking-widest mb-0.5"><TranslatedText text="Step 4 of 5" /></p>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight"><TranslatedText text="Delivery Evidence" /></h3>
                <p className="text-xs text-slate-400 mt-0.5"><TranslatedText text="Photographic proof of delivery — recommended for all cargo." /></p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                    <img src={src} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    <button onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
                      <Trash2 size={11} />
                    </button>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                      {i + 1}
                    </span>
                  </div>
                ))}
                {photos.length < 8 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-[#345E85] hover:bg-blue-50/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center transition-all">
                      <Plus size={16} className="text-slate-400 group-hover:text-[#345E85]" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 group-hover:text-[#345E85] uppercase tracking-widest"><TranslatedText text="Add Photo" /></span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Camera size={13} className="text-[#345E85]" /><TranslatedText text="Cargo unloaded at destination" />
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Camera size={13} className="text-[#345E85]" /><TranslatedText text="Delivery location / dock" />
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Camera size={13} className="text-[#345E85]" /><TranslatedText text="Condition of packaging" />
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Camera size={13} className="text-[#345E85]" /><TranslatedText text="Any damage (if applicable)" />
                </div>
              </div>

              {photos.length === 0 && (
                <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <TranslatedText text="No photos attached. Photos are strongly recommended for all deliveries — they protect both driver and cargo owner in case of disputes." />
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 5 — Signature & Review */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-5">
              <div>
                <p className="text-[10px] font-black text-[#345E85] uppercase tracking-widest mb-0.5"><TranslatedText text="Step 5 of 5" /></p>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight"><TranslatedText text="Recipient Sign-Off" /></h3>
                <p className="text-xs text-slate-400 mt-0.5"><TranslatedText text="Recipient must sign to legally acknowledge receipt of cargo." /></p>
              </div>

              {/* Signature pad */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={lbl}><PenTool size={10} className="inline mr-1"/><TranslatedText text="Recipient Signature *" /></label>
                  <button onClick={clearSig}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 transition-all">
                    <RotateCcw size={10} /> <TranslatedText text="Clear" />
                  </button>
                </div>
                <div className="relative h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden hover:border-[#345E85]/50 transition-colors group">
                  <canvas ref={canvasRef}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    onTouchStart={e => { e.preventDefault(); startDraw(e); }}
                    onTouchMove={e  => { e.preventDefault(); draw(e); }}
                    onTouchEnd={e   => { e.preventDefault(); stopDraw(); }}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none" />
                  {!hasSig && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
                      <PenTool size={24} className="text-slate-200 group-hover:text-slate-300 transition-colors" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]"><TranslatedText text="Sign here" /></p>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 mt-2 leading-relaxed text-center">
                  <TranslatedText text="By signing, the recipient confirms the cargo was received in the declared condition and the carrier's liability is released." />
                </p>
              </div>

              {/* Final summary */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest"><TranslatedText text="ePOD Submission Summary" /></p>
                </div>
                {[
                  { label: 'Trip',           value: tripNumber ? `#${tripNumber}` : '—'  },
                  { label: 'Delivered At',   value: form.deliveredAt ? new Date(form.deliveredAt).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' }) : '—' },
                  { label: 'Recipient',      value: form.recipientName || '—'             },
                  { label: 'Recipient ID',   value: form.recipientIdNumber || t('Not provided') },
                  { label: 'Company',        value: form.recipientCompany  || t('Not provided') },
                  { label: 'Cargo Condition',value: CARGO_CONDITIONS.find(c => c.value === form.cargoCondition)?.label ? t(CARGO_CONDITIONS.find(c => c.value === form.cargoCondition)!.label) : '—' },
                  { label: 'Photos',         value: t('{count} attached', { count: String(photos.length) })           },
                  { label: 'GPS',            value: gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : t('Not available') },
                  { label: 'Signature',      value: hasSig ? t('✓ Captured') : t('✗ Required'), color: hasSig ? 'text-emerald-600' : 'text-red-500' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text={row.label} /></span>
                    <span className={`text-xs font-bold text-right ${(row as any).color || 'text-slate-700'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Bottom navigation ─────────────────────────────────────────── */}
      <div className="shrink-0 px-6 py-4 bg-white border-t border-slate-100 flex items-center gap-3">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="h-12 px-6 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
            <TranslatedText text="Back" />
          </button>
        )}

        {step < 5 ? (
          <button onClick={() => {
              if (!stepValid(step)) {
                if (step === 2) toast.error(t('Recipient full name is required'));
                if (step === 3 && form.cargoCondition !== 'INTACT') toast.error(t('Exception details are required for non-intact deliveries'));
                return;
              }
              setStep(s => s + 1);
            }}
            className={`flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
              ${stepValid(step)
                ? 'bg-[#345E85] text-white hover:bg-[#0f172a] shadow-lg shadow-blue-900/10'
                : 'bg-slate-100 text-slate-400'}`}>
            <TranslatedText text="Continue" />
            <span className="text-[9px] opacity-60"><TranslatedText text="Step" /> {step + 1} <TranslatedText text="of 5" /></span>
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting || !hasSig}
            className={`flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
              ${hasSig && !submitting
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/10'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> {t('Submitting ePOD…')}</>
              : <><ShieldCheck size={16} /> <TranslatedText text="Submit ePOD & Complete Trip" /></>}
          </button>
        )}
      </div>

    </div>
  );
};
