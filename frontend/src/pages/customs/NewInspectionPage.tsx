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
    ['declaredWeight', 'actualWeight', 'declaredQuantity', 'actualQuantity'].forEach(k => {
      if (payload[k]) payload[k] = Number(payload[k]);
      else delete payload[k];
    });
    if (!payload.tripId) delete payload.tripId;
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
            <Field label="Risk Level" id="riskLevel">
              <select id="riskLevel" className={inputCls} value={form.riskLevel} onChange={e => set('riskLevel', e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </Field>
          </div>

          {/* Flags */}
          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={form.hasDangerousGoods} onChange={e => set('hasDangerousGoods', e.target.checked)} />
              <span className="text-sm font-bold text-rose-600 flex items-center gap-1"><AlertTriangle size={13} /> Dangerous Goods</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={form.isRestrictedGoods} onChange={e => set('isRestrictedGoods', e.target.checked)} />
              <span className="text-sm font-bold text-purple-600">Restricted Goods</span>
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
