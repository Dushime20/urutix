import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
import { customsApi } from '../../services/customsApi';

const BRAND = '#2c5173';

const Field: React.FC<{
  label: string; id: string; required?: boolean;
  children: React.ReactNode;
}> = ({ label, id, required, children }) => (
  <div className="group">
    <label htmlFor={id} className="block text-[10px] font-black text-slate-400 group-focus-within:text-[#2c5173] uppercase tracking-widest mb-2 transition-colors">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-0 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2c5173] transition-all duration-300 placeholder:text-slate-300";

const NewInspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const [form, setForm] = useState({
    tripId: params.get('tripId') || '',
    plateNumber: params.get('plate') || '',
    containerNumber: '',
    shipmentReference: '',
    driverName: '',
    truckType: '',
    originCountry: '',
    destinationCountry: '',
    cargoType: '',
    cargoCategory: '',
    declaredWeight: '',
    actualWeight: '',
    declaredQuantity: '',
    actualQuantity: '',
    hsCode: '',
    sealNumber: '',
    shippingCompany: '',
    hasDangerousGoods: false,
    isRestrictedGoods: false,
    riskLevel: 'LOW',
    inspectionChannel: 'YELLOW',
    examType: 'NONE',
    holdType: 'NONE',
    declarationNumber: '',
    countryOfOrigin: '',
    modeOfTransport: 'ROAD',
    imdgClass: '',
    unNumber: '',
    declaredValue: '',
    currency: 'USD',
    dutyAmount: '',
    taxAmount: '',
    aeoNumber: '',
    deniedPartyFlag: false,
    sanctionsScreened: false,
    estimatedReleaseAt: '',
    checkpointName: '',
    inspectionNotes: '',
  });

  const { data: checkpointsData } = useQuery({
    queryKey: ['customs-checkpoints'],
    queryFn: () => customsApi.getCheckpoints(),
  });
  const checkpoints: any[] = checkpointsData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data: any) => customsApi.createInspection(data),
    onSuccess: (res) => {
      toast.success('Inspection created');
      qc.invalidateQueries({ queryKey: ['customs-inspections'] });
      qc.invalidateQueries({ queryKey: ['customs-stats'] });
      navigate(`/dashboard/customs/inspections/${res.data?.data?.id}`);
    },
    onError: () => toast.error('Failed to create inspection'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plateNumber.trim() && !form.shipmentReference.trim() && !form.containerNumber.trim()) {
      toast.error('Provide at least plate number, shipment reference, or container number');
      return;
    }
    const payload: any = { ...form };
    ['declaredWeight', 'actualWeight', 'declaredQuantity', 'actualQuantity',
     'declaredValue', 'dutyAmount', 'taxAmount'].forEach(k => {
      if (payload[k]) payload[k] = Number(payload[k]);
      else delete payload[k];
    });
    if (!payload.tripId) delete payload.tripId;
    if (!payload.declarationNumber) delete payload.declarationNumber;
    if (!payload.aeoNumber) delete payload.aeoNumber;
    if (!payload.imdgClass) delete payload.imdgClass;
    if (!payload.unNumber) delete payload.unNumber;
    if (!payload.estimatedReleaseAt) delete payload.estimatedReleaseAt;
    mutation.mutate(payload);
  };

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
          <ShieldCheck size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">New Customs Inspection</h1>
          <p className="text-xs text-slate-400">Fill in cargo and vehicle details</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center justify-between mb-8 mt-4 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#2c5173] rounded-full z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>
        
        {[
          { num: 1, label: 'Trade & Route' },
          { num: 2, label: 'Vehicle & Cargo' },
          { num: 3, label: 'Risk & Inspection' }
        ].map(step => (
          <div key={step.num} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${
              currentStep >= step.num 
                ? 'bg-[#2c5173] text-white ring-4 ring-slate-50 dark:ring-slate-950' 
                : 'bg-slate-100 text-slate-400 ring-4 ring-slate-50 dark:ring-slate-950'
            }`}>
              {step.num}
            </div>
            <span className={`absolute top-12 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
              currentStep >= step.num ? 'text-[#2c5173]' : 'text-slate-400'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pt-8">
        {currentStep === 1 && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-500 space-y-6">
            {/* Declaration & Trade Identity */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-0 p-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#2c5173] mb-1">Trade & Declaration</h2>
              <p className="text-[10px] text-slate-400 mb-6 font-bold">Official customs declaration identifiers — required for filing with national customs authorities</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Declaration Number" id="declarationNumber">
                  <input id="declarationNumber" className={inputCls} value={form.declarationNumber} onChange={e => set('declarationNumber', e.target.value)} placeholder="e.g. CD-2024-001234" />
                </Field>
                <Field label="Mode of Transport" id="modeOfTransport">
                  <select id="modeOfTransport" className={inputCls} value={form.modeOfTransport} onChange={e => set('modeOfTransport', e.target.value)}>
                    <option value="ROAD">🚛 Road</option>
                    <option value="SEA">🚢 Sea</option>
                    <option value="AIR">✈️ Air</option>
                    <option value="RAIL">🚂 Rail</option>
                    <option value="MULTIMODAL">🔀 Multimodal</option>
                  </select>
                </Field>
                <Field label="Country of Origin" id="countryOfOrigin">
                  <input id="countryOfOrigin" className={inputCls} value={form.countryOfOrigin} onChange={e => set('countryOfOrigin', e.target.value)} placeholder="e.g. CN, US, DE" />
                </Field>
                <Field label="AEO Number (Trusted Trader)" id="aeoNumber">
                  <input id="aeoNumber" className={inputCls} value={form.aeoNumber} onChange={e => set('aeoNumber', e.target.value)} placeholder="Authorized Economic Operator ID" />
                </Field>
                <Field label="Currency" id="currency">
                  <select id="currency" className={inputCls} value={form.currency} onChange={e => set('currency', e.target.value)}>
                    {['USD','EUR','GBP','JPY','CNY','RWF','KES','UGX','TZS','ZAR','NGN','GHS'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Estimated Release Date" id="estimatedReleaseAt">
                  <input id="estimatedReleaseAt" type="datetime-local" className={inputCls} value={form.estimatedReleaseAt} onChange={e => set('estimatedReleaseAt', e.target.value)} />
                </Field>
              </div>
            </div>

            {/* Route */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-0 p-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#2c5173] mb-6">Route</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Origin Country" id="originCountry">
                  <input id="originCountry" className={inputCls} value={form.originCountry} onChange={e => set('originCountry', e.target.value)} />
                </Field>
                <Field label="Destination Country" id="destinationCountry">
                  <input id="destinationCountry" className={inputCls} value={form.destinationCountry} onChange={e => set('destinationCountry', e.target.value)} />
                </Field>
                <Field label="Checkpoint" id="checkpointName">
                  {checkpoints.length > 0 ? (
                    <select id="checkpointName" className={inputCls} value={form.checkpointName} onChange={e => set('checkpointName', e.target.value)}>
                      <option value="">Select checkpoint</option>
                      {checkpoints.map((cp: any) => <option key={cp.id} value={cp.name}>{cp.name}</option>)}
                    </select>
                  ) : (
                    <input id="checkpointName" className={inputCls} value={form.checkpointName} onChange={e => set('checkpointName', e.target.value)} placeholder="Checkpoint name" />
                  )}
                </Field>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-500 space-y-6">
            {/* Vehicle */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-0 p-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#2c5173] mb-6">Vehicle & Shipment</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Plate Number" id="plateNumber">
                  <input id="plateNumber" className={inputCls} value={form.plateNumber} onChange={e => set('plateNumber', e.target.value)} placeholder="e.g. KDA 123A" />
                </Field>
                <Field label="Container Number" id="containerNumber">
                  <input id="containerNumber" className={inputCls} value={form.containerNumber} onChange={e => set('containerNumber', e.target.value)} placeholder="e.g. MSCU1234567" />
                </Field>
                <Field label="Shipment Reference" id="shipmentReference">
                  <input id="shipmentReference" className={inputCls} value={form.shipmentReference} onChange={e => set('shipmentReference', e.target.value)} placeholder="e.g. SHP-20240001" />
                </Field>
                <Field label="Truck Type" id="truckType">
                  <input id="truckType" className={inputCls} value={form.truckType} onChange={e => set('truckType', e.target.value)} placeholder="e.g. Flatbed, Container" />
                </Field>
                <Field label="Driver Name" id="driverName">
                  <input id="driverName" className={inputCls} value={form.driverName} onChange={e => set('driverName', e.target.value)} />
                </Field>
                <Field label="Seal Number" id="sealNumber">
                  <input id="sealNumber" className={inputCls} value={form.sealNumber} onChange={e => set('sealNumber', e.target.value)} />
                </Field>
                <Field label="Shipping Company" id="shippingCompany">
                  <input id="shippingCompany" className={inputCls} value={form.shippingCompany} onChange={e => set('shippingCompany', e.target.value)} />
                </Field>
              </div>
            </div>

            {/* Cargo */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-0 p-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#2c5173] mb-6">Cargo Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Cargo Type" id="cargoType">
                  <input id="cargoType" className={inputCls} value={form.cargoType} onChange={e => set('cargoType', e.target.value)} />
                </Field>
                <Field label="Cargo Category" id="cargoCategory">
                  <input id="cargoCategory" className={inputCls} value={form.cargoCategory} onChange={e => set('cargoCategory', e.target.value)} />
                </Field>
                <Field label="HS Code" id="hsCode">
                  <input id="hsCode" className={inputCls} value={form.hsCode} onChange={e => set('hsCode', e.target.value)} placeholder="e.g. 8703.10" />
                </Field>
                <Field label="Declared Weight (kg)" id="declaredWeight">
                  <input id="declaredWeight" type="number" className={inputCls} value={form.declaredWeight} onChange={e => set('declaredWeight', e.target.value)} />
                </Field>
                <Field label="Actual Weight (kg)" id="actualWeight">
                  <input id="actualWeight" type="number" className={inputCls} value={form.actualWeight} onChange={e => set('actualWeight', e.target.value)} />
                </Field>
                <Field label="Declared Quantity" id="declaredQuantity">
                  <input id="declaredQuantity" type="number" className={inputCls} value={form.declaredQuantity} onChange={e => set('declaredQuantity', e.target.value)} />
                </Field>
                <Field label="Actual Quantity" id="actualQuantity">
                  <input id="actualQuantity" type="number" className={inputCls} value={form.actualQuantity} onChange={e => set('actualQuantity', e.target.value)} />
                </Field>
                <Field label={`Declared Value (${form.currency})`} id="declaredValue">
                  <input id="declaredValue" type="number" className={inputCls} value={form.declaredValue} onChange={e => set('declaredValue', e.target.value)} placeholder="Commercial invoice value" />
                </Field>
                <Field label={`Duty Amount (${form.currency})`} id="dutyAmount">
                  <input id="dutyAmount" type="number" className={inputCls} value={form.dutyAmount} onChange={e => set('dutyAmount', e.target.value)} placeholder="Assessed duty" />
                </Field>
                <Field label={`Tax Amount (${form.currency})`} id="taxAmount">
                  <input id="taxAmount" type="number" className={inputCls} value={form.taxAmount} onChange={e => set('taxAmount', e.target.value)} placeholder="VAT / GST / other tax" />
                </Field>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-500 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-0 p-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#2c5173] mb-6">Risk & Inspection</h2>
              
              <div className="grid grid-cols-1 gap-4">
                <Field label="Risk Level" id="riskLevel">
                  <select id="riskLevel" className={inputCls} value={form.riskLevel} onChange={e => {
                    const val = e.target.value;
                    set('riskLevel', val);
                    if (val === 'LOW') set('inspectionChannel', 'GREEN');
                    else if (val === 'MEDIUM') set('inspectionChannel', 'YELLOW');
                    else set('inspectionChannel', 'RED');
                  }}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </Field>
              </div>

              {/* WCO Inspection Channel */}
              <div className="mt-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Inspection Channel</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { val: 'GREEN',  label: 'Green Lane',  sub: 'Auto-clear — no inspection' },
                    { val: 'YELLOW', label: 'Yellow Lane', sub: 'Document check only' },
                    { val: 'RED',    label: 'Red Lane',    sub: 'Full physical inspection' },
                  ].map(ch => (
                    <button
                      key={ch.val}
                      type="button"
                      onClick={() => set('inspectionChannel', ch.val)}
                      className={`p-5 rounded-2xl border-0 text-left transition-all duration-300 outline-none ${
                        form.inspectionChannel === ch.val 
                          ? 'bg-[#2c5173] text-white scale-[1.02]' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <p className="text-sm font-black">{ch.label}</p>
                      <p className={`text-[10px] mt-1 font-bold ${form.inspectionChannel === ch.val ? 'text-white/70' : 'text-slate-400'}`}>{ch.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam Type */}
              <div className="mt-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Exam Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { val: 'NONE',      label: 'None',       sub: 'No exam' },
                    { val: 'DOCUMENT',  label: 'Document', sub: 'Docs only' },
                    { val: 'X_RAY',     label: 'X-Ray',    sub: 'NII / VACIS scan' },
                    { val: 'TAILGATE',  label: 'Tailgate', sub: 'Seal break, visual' },
                    { val: 'INTENSIVE', label: 'Intensive', sub: 'Full devanning' },
                  ].map(ex => (
                    <button key={ex.val} type="button" onClick={() => set('examType', ex.val)}
                      className={`p-4 rounded-2xl border-0 text-left transition-all duration-300 outline-none ${
                        form.examType === ex.val 
                          ? 'bg-[#2c5173] text-white scale-[1.02]' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}>
                      <p className="text-sm font-black">{ex.label}</p>
                      <p className={`text-[10px] mt-1 font-bold ${form.examType === ex.val ? 'text-white/70' : 'text-slate-400'}`}>{ex.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hold Type */}
              <div className="mt-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Hold Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { val: 'NONE',                 label: 'No Hold' },
                    { val: 'MANIFEST',             label: 'Manifest' },
                    { val: 'STATISTICAL',          label: 'Statistical' },
                    { val: 'COMMERCIAL_ENFORCEMENT', label: 'Commercial' },
                    { val: 'ANTI_TERRORISM',       label: 'Anti-Terror' },
                    { val: 'AGENCY',               label: 'Agency (FDA/USDA)' },
                    { val: 'SANCTIONS',            label: 'Sanctions' },
                    { val: 'DANGEROUS_GOODS',      label: 'Dangerous Goods' },
                    { val: 'DUTY_ARREARS',         label: 'Duty Arrears' },
                  ].map(h => (
                    <button key={h.val} type="button" onClick={() => set('holdType', h.val)}
                      className={`p-3 rounded-2xl border-0 text-center text-xs font-black transition-all duration-300 outline-none ${
                        form.holdType === h.val
                          ? 'bg-[#2c5173] text-white scale-[1.02]'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}>
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dangerous Goods - IMDG */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="IMDG Class (Dangerous Goods)" id="imdgClass">
                  <select id="imdgClass" className={inputCls} value={form.imdgClass} onChange={e => { set('imdgClass', e.target.value); if (e.target.value) set('hasDangerousGoods', true); }}>
                    <option value="">None</option>
                    <option value="1">Class 1 — Explosives</option>
                    <option value="2">Class 2 — Gases</option>
                    <option value="3">Class 3 — Flammable Liquids</option>
                    <option value="4">Class 4 — Flammable Solids</option>
                    <option value="5">Class 5 — Oxidizing Substances</option>
                    <option value="6">Class 6 — Toxic & Infectious</option>
                    <option value="7">Class 7 — Radioactive</option>
                    <option value="8">Class 8 — Corrosives</option>
                    <option value="9">Class 9 — Misc. Dangerous Goods</option>
                  </select>
                </Field>
                <Field label="UN Number" id="unNumber">
                  <input id="unNumber" className={inputCls} value={form.unNumber} onChange={e => set('unNumber', e.target.value)} placeholder="e.g. UN1234" />
                </Field>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-4 mt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={form.hasDangerousGoods} onChange={e => set('hasDangerousGoods', e.target.checked)} />
                  <span className="text-sm font-bold text-rose-600 flex items-center gap-1"><AlertTriangle size={13} /> Dangerous Goods</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={form.isRestrictedGoods} onChange={e => set('isRestrictedGoods', e.target.checked)} />
                  <span className="text-sm font-bold text-purple-600">Restricted Goods</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={form.sanctionsScreened} onChange={e => set('sanctionsScreened', e.target.checked)} />
                  <span className="text-sm font-bold text-blue-600">✅ Sanctions Screened</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={form.deniedPartyFlag} onChange={e => set('deniedPartyFlag', e.target.checked)} />
                  <span className="text-sm font-bold text-red-700">🚫 Denied Party Match</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-0 p-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#2c5173] mb-4">Inspection Notes</h2>
              <textarea
                className={`${inputCls} resize-none`}
                rows={4}
                value={form.inspectionNotes}
                onChange={e => set('inspectionNotes', e.target.value)}
                placeholder="Initial observations, notes..."
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center gap-4 py-4 mt-8">
          <button 
            type="button" 
            onClick={currentStep === 1 ? () => navigate(-1) : prevStep} 
            className="px-8 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-sm font-black text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {currentStep === 1 ? 'CANCEL' : 'PREVIOUS STEP'}
          </button>
          
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-10 py-3.5 rounded-2xl text-white text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
              style={{ background: BRAND }}
            >
              NEXT STEP
            </button>
          ) : (
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-10 py-3.5 rounded-2xl text-white text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: BRAND }}
            >
              {mutation.isPending ? 'CREATING...' : 'CREATE INSPECTION'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NewInspectionPage;
