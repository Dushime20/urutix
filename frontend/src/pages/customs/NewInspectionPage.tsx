import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
import { customsApi } from '../../services/customsApi';

const BRAND = '#345E85';

const Field: React.FC<{
  label: string; id: string; required?: boolean;
  children: React.ReactNode;
}> = ({ label, id, required, children }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#345E85]/30";

const NewInspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();

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
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Declaration & Trade Identity */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Trade & Declaration</h2>
          <p className="text-[10px] text-slate-400 mb-4">Official customs declaration identifiers — required for filing with national customs authorities</p>
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

        {/* Vehicle */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Vehicle & Shipment</h2>
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

        {/* Route */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Route</h2>
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

        {/* Cargo */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Cargo Details</h2>
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

          {/* Exam Type */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Exam Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { val: 'NONE',      label: 'None',       sub: 'No exam', cls: 'bg-slate-50 border-slate-200 text-slate-600', active: 'bg-slate-200 border-slate-500 ring-2 ring-slate-300' },
                { val: 'DOCUMENT',  label: '📄 Document', sub: 'Docs only', cls: 'bg-blue-50 border-blue-200 text-blue-700', active: 'bg-blue-100 border-blue-500 ring-2 ring-blue-300' },
                { val: 'X_RAY',     label: '☢️ X-Ray',    sub: 'NII / VACIS scan', cls: 'bg-purple-50 border-purple-200 text-purple-700', active: 'bg-purple-100 border-purple-500 ring-2 ring-purple-300' },
                { val: 'TAILGATE',  label: '🚪 Tailgate', sub: 'Seal break, visual', cls: 'bg-amber-50 border-amber-200 text-amber-700', active: 'bg-amber-100 border-amber-500 ring-2 ring-amber-300' },
                { val: 'INTENSIVE', label: '🔍 Intensive', sub: 'Full devanning', cls: 'bg-rose-50 border-rose-200 text-rose-700', active: 'bg-rose-100 border-rose-500 ring-2 ring-rose-300' },
              ].map(ex => (
                <button key={ex.val} type="button" onClick={() => set('examType', ex.val)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${form.examType === ex.val ? ex.active : ex.cls}`}>
                  <p className="text-xs font-black">{ex.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{ex.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Hold Type */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hold Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { val: 'NONE',                 label: 'No Hold' },
                { val: 'MANIFEST',             label: '📋 Manifest' },
                { val: 'STATISTICAL',          label: '📊 Statistical' },
                { val: 'COMMERCIAL_ENFORCEMENT', label: '⚖️ Commercial' },
                { val: 'ANTI_TERRORISM',       label: '🚨 Anti-Terror' },
                { val: 'AGENCY',               label: '🏛️ Agency (FDA/USDA)' },
                { val: 'SANCTIONS',            label: '🚫 Sanctions' },
                { val: 'DANGEROUS_GOODS',      label: '☣️ Dangerous Goods' },
                { val: 'DUTY_ARREARS',         label: '💰 Duty Arrears' },
              ].map(h => (
                <button key={h.val} type="button" onClick={() => set('holdType', h.val)}
                  className={`p-2 rounded-xl border text-left text-xs font-bold transition-all ${
                    form.holdType === h.val
                      ? 'bg-rose-100 border-rose-500 text-rose-800 ring-2 ring-rose-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* WCO Inspection Channel */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Inspection Channel</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 'GREEN',  label: '🟢 Green Lane',  sub: 'Auto-clear — no inspection', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', active: 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-300' },
                { val: 'YELLOW', label: '🟡 Yellow Lane', sub: 'Document check only',         bg: 'bg-amber-50 border-amber-200 text-amber-800',     active: 'bg-amber-100 border-amber-500 ring-2 ring-amber-300' },
                { val: 'RED',    label: '🔴 Red Lane',    sub: 'Full physical inspection',     bg: 'bg-rose-50 border-rose-200 text-rose-800',         active: 'bg-rose-100 border-rose-500 ring-2 ring-rose-300' },
              ].map(ch => (
                <button
                  key={ch.val}
                  type="button"
                  onClick={() => set('inspectionChannel', ch.val)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.inspectionChannel === ch.val ? ch.active : ch.bg
                  }`}
                >
                  <p className="text-xs font-black">{ch.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{ch.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dangerous Goods - IMDG */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="flex flex-wrap gap-4 mt-4">
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Inspection Notes</h2>
          <textarea
            className={`${inputCls} resize-none`}
            rows={4}
            value={form.inspectionNotes}
            onChange={e => set('inspectionNotes', e.target.value)}
            placeholder="Initial observations, notes..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-8 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {mutation.isPending ? 'Creating...' : 'Create Inspection'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewInspectionPage;
