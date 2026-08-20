/**
 * Distribution Campaign — CARGO_OWNER representing their company
 * Route: /dashboard/campaigns
 *
 * One prompt. Cities, origin, window, and rates are resolved live on the server.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Package,
  MapPin,
  Wallet,
  Shield,
  Truck,
  AlertTriangle,
  ExternalLink,
  Mic,
  MicOff,
  Search,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TranslatedText } from '../../components/translated-text';
import { useI18n } from '../../contexts/i18n-context';
import { campaignsApi } from '../../services/campaignsApi';
import type { CampaignCity } from '../../services/campaignsApi';

const STEPS = ['Intent', 'Plan', 'Approve', 'Board'] as const;
const EXAMPLE =
  'I need 100,000 units of bottled water delivered from Kigali next month';

const apiError = (err: any, fallback: string) =>
  err?.response?.data?.message ||
  (Array.isArray(err?.response?.data?.message) ? err.response.data.message[0] : null) ||
  err?.response?.data?.error ||
  fallback;

const DistributionCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const existingId = params.get('id');

  const [step, setStep] = useState(0);
  const [prompt, setPrompt] = useState(EXAMPLE);
  const [originText, setOriginText] = useState('');
  const [budgetCap, setBudgetCap] = useState(0);
  const [goodsReady, setGoodsReady] = useState(false);
  const [campaign, setCampaign] = useState<any | null>(null);
  const [savedList, setSavedList] = useState<any[]>([]);
  const [approving, setApproving] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const spokenBaseRef = useRef('');
  const { language } = useI18n();
  const [loading, setLoading] = useState(Boolean(existingId));
  const [selectedCities, setSelectedCities] = useState<CampaignCity[]>([]);

  const plan = campaign?.plan;
  const origin = plan?.origin || campaign?.intent?.origin;

  const applyCampaign = (data: any, nextStep?: number) => {
    if (!data) return;
    setCampaign(data);
    if (data.intent?.prompt) setPrompt(data.intent.prompt);
    if (data.intent?.origin?.name) setOriginText(data.intent.origin.name);
    if (data.intent?.destinations?.length) setSelectedCities(data.intent.destinations);
    if (typeof data.intent?.budgetCap === 'number') setBudgetCap(data.intent.budgetCap);
    setGoodsReady(Boolean(data.intent?.goodsReady));
    if (data.id) setParams({ id: data.id });
    if (typeof nextStep === 'number') {
      setStep(nextStep);
    } else if (['EXECUTING', 'APPROVED', 'COMPLETE'].includes(data.status)) {
      setStep(3);
    } else if (data.plan) {
      setStep(1);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await campaignsApi.list();
        if (!cancelled) setSavedList(Array.isArray(list) ? list : []);
        if (existingId) {
          const data = await campaignsApi.get(existingId);
          if (!cancelled) applyCampaign(data);
        }
      } catch (err: any) {
        if (!cancelled) toast.error(apiError(err, 'Could not load campaigns'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingId]);

  const payload = () => ({
    prompt: prompt.trim(),
    originText: originText.trim() || undefined,
    budgetCap: budgetCap || undefined,
    destinations: selectedCities,
  });

  const goPlan = async () => {
    if (prompt.trim().length < 12) {
      toast.error('Tell UrutiX what must move in one sentence');
      return;
    }
    if (selectedCities.length < 1) {
      toast.error('Search and add the destination cities you want');
      return;
    }
    setPlanning(true);
    try {
      const data = campaign?.id
        ? await campaignsApi.update(campaign.id, payload())
        : await campaignsApi.create(payload());
      applyCampaign(data, 1);
      toast.success(`Plan for ${selectedCities.length} cities you selected`);
    } catch (err: any) {
      toast.error(apiError(err, 'Could not compute plan'));
    } finally {
      setPlanning(false);
    }
  };

  const addCity = (city: CampaignCity) => {
    setSelectedCities((prev) => {
      if (
        prev.some(
          (c) =>
            (c.id && city.id && c.id === city.id) ||
            (c.name === city.name &&
              c.countryCode === city.countryCode &&
              Number(c.lat).toFixed(3) === Number(city.lat).toFixed(3)),
        )
      ) {
        return prev;
      }
      return [...prev, city];
    });
  };

  const dropCity = (city: CampaignCity) => {
    setSelectedCities((prev) =>
      prev.filter((c) => {
        if (c.id && city.id) return c.id !== city.id;
        return !(c.name === city.name && Number(c.lat).toFixed(3) === Number(city.lat).toFixed(3));
      }),
    );
  };

  const goApprove = () => setStep(2);

  const approveAndCreate = async () => {
    if (!campaign?.id) return;
    if (!goodsReady) {
      toast.error('Confirm goods are ready at your origin warehouse before committing loads');
      return;
    }
    setApproving(true);
    try {
      const data = await campaignsApi.approve(campaign.id, { ...payload(), goodsReady: true });
      applyCampaign(data, 3);
      const created = data?.execution?.loadsCreated ?? data?.loadIds?.length ?? 0;
      toast.success(`${created} loads created and sent to matching`);
    } catch (err: any) {
      toast.error(apiError(err, 'Approve failed'));
    } finally {
      setApproving(false);
    }
  };

  const stopVoice = () => {
    listeningRef.current = false;
    setListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
    recognitionRef.current = null;
  };

  const startVoice = async () => {
    if (listeningRef.current) {
      stopVoice();
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error('Voice typing needs Chrome, Edge, or Safari. Firefox does not support it.');
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      toast.error('Microphone needs a secure page (https or localhost).');
      return;
    }

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        toast.error('Allow the microphone so UrutiX can type what you say.');
        return;
      }
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = language && language !== 'en' ? language : navigator.language || 'en-US';

    const current = prompt.trim();
    spokenBaseRef.current = !current || current === EXAMPLE ? '' : current;
    if (!spokenBaseRef.current) setPrompt('');

    rec.onstart = () => {
      listeningRef.current = true;
      setListening(true);
    };

    rec.onresult = (event: any) => {
      let finals = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finals += `${piece} `;
        else interim += piece;
      }
      if (finals.trim()) {
        spokenBaseRef.current = `${spokenBaseRef.current} ${finals}`.replace(/\s+/g, ' ').trim();
        setPrompt(spokenBaseRef.current);
        return;
      }
      if (interim) {
        setPrompt(`${spokenBaseRef.current} ${interim}`.replace(/\s+/g, ' ').trim());
      }
    };

    rec.onerror = (event: any) => {
      const code = event?.error;
      if (code === 'aborted') return;
      listeningRef.current = false;
      setListening(false);
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        toast.error('Microphone was blocked. Allow it in the browser address bar, then try again.');
      } else if (code === 'no-speech') {
        toast.error('Nothing was heard. Click the microphone and speak again.');
      } else if (code === 'network') {
        toast.error('Voice typing needs an internet connection.');
      } else if (code === 'audio-capture') {
        toast.error('No microphone was found on this device.');
      } else {
        toast.error('Could not type from voice. Try again.');
      }
    };

    rec.onend = () => {
      if (listeningRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through and stop */
        }
      }
      listeningRef.current = false;
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      toast.error('Could not open the microphone. Click again.');
      stopVoice();
    }
  };

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        /* unmount */
      }
    };
  }, []);

  const startFresh = () => {
    setCampaign(null);
    setPrompt(EXAMPLE);
    setOriginText('');
    setBudgetCap(0);
    setSelectedCities([]);
    setGoodsReady(false);
    setStep(0);
    setParams({});
  };

  const openSaved = async (item: any) => {
    try {
      const data = await campaignsApi.get(item.id);
      applyCampaign(data);
    } catch (err: any) {
      toast.error(apiError(err, 'Could not open campaign'));
    }
  };

  const repeatPlan = async () => {
    if (!campaign?.id) return;
    try {
      const data = await campaignsApi.repeat(campaign.id);
      applyCampaign(data, 0);
      toast.success('Next window cloned. Confirm goods ready before you approve.');
    } catch (err: any) {
      toast.error(apiError(err, 'Could not repeat plan'));
    }
  };

  useEffect(() => {
    if (step !== 3 || !campaign?.id) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const data = await campaignsApi.get(campaign.id);
        if (!cancelled) setCampaign(data);
      } catch {
        /* keep last snapshot */
      }
    };
    const timer = window.setInterval(() => void tick(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [step, campaign?.id]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading campaigns…</p>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#345E85] mb-3"
          >
            <ArrowLeft size={12} />
            <TranslatedText text="Overview" />
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            <TranslatedText text="AI Distribution Planner" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            <TranslatedText text="You represent your company. Tell UrutiX what must move, then search and pick every destination city yourself. UrutiX will not auto-fill cities." />
          </p>
        </div>
        <button
          type="button"
          onClick={startFresh}
          className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#345E85] hover:text-[#345E85]"
        >
          <TranslatedText text="New intent" />
        </button>
      </div>

      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`rounded-2xl px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-widest border ${
              index === step
                ? 'bg-[#345E85] text-white border-[#345E85]'
                : index < step
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-[#345E85] border-blue-100 dark:border-blue-900/40'
                  : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800'
            }`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            <TranslatedText text="One sentence for what to move. You pick every destination city — UrutiX will not guess." />
          </p>

          <label className="block">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              What does your company need to move?
            </span>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (!listeningRef.current) spokenBaseRef.current = e.target.value;
                }}
                rows={4}
                className={`${inputClass} pr-14 resize-none`}
                placeholder={EXAMPLE}
                aria-label="What your company needs to move"
              />
              <button
                type="button"
                onClick={() => void startVoice()}
                className={`absolute top-3 right-3 p-2.5 rounded-full ${
                  listening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-[#345E85] text-white hover:bg-[#2c5173]'
                }`}
                title={listening ? 'Stop microphone' : 'Speak — UrutiX will type what you say'}
                aria-pressed={listening}
                aria-label={listening ? 'Stop microphone' : 'Start microphone'}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </div>
            {listening && (
              <p className="mt-2 text-xs font-bold text-rose-600">
                Listening — say what you need. Tap the microphone to stop.
              </p>
            )}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Warehouse city (optional — overrides “from”)">
              <input
                value={originText}
                onChange={(e) => setOriginText(e.target.value)}
                placeholder="Any warehouse city worldwide"
                className={inputClass}
              />
            </Field>
            <Field label="Budget cap (optional, 0 = none)">
              <input
                type="number"
                min={0}
                value={budgetCap}
                onChange={(e) => setBudgetCap(Number(e.target.value) || 0)}
                className={inputClass}
              />
            </Field>
          </div>

          <CitySearchPicker
            selected={selectedCities}
            onAdd={addCity}
            onRemove={dropCity}
          />

          <div className="flex justify-end">
            <PrimaryButton onClick={goPlan} disabled={planning || selectedCities.length < 1}>
              {planning ? 'Building plan…' : 'Propose plan'} <ArrowRight size={16} />
            </PrimaryButton>
          </div>

          {savedList.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Your company plans
              </p>
              <div className="space-y-2">
                {savedList.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openSaved(item)}
                    className="w-full text-left px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-[#345E85] flex items-center justify-between"
                  >
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {item.intent?.productName || item.productName} · {(item.intent?.totalUnits || item.totalUnits || 0).toLocaleString()} units
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {step === 1 && plan && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Tonnes" value={(plan.totalWeightKg / 1000).toFixed(1)} />
            <Kpi label="Child loads" value={String(plan.destinations.length)} />
            <Kpi label="Shared / LTL" value={`${plan.sharedCapacityPct}%`} />
            <Kpi
              label="Est. freight"
              value={`${campaign?.intent?.currencyCode || 'USD'} ${plan.estimatedFreight.toLocaleString()}`}
              warn={plan.overBudget}
            />
          </div>

          {plan.overBudget && (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Estimated freight plus cover is above your budget cap. Raise the cap or drop cities before you approve.
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <MapPin size={16} className="text-[#345E85]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                {origin?.name} → {plan.destinations.length} cities
              </h2>
            </div>
            <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800">
              <CitySearchPicker
                selected={selectedCities}
                onAdd={addCity}
                onRemove={dropCity}
              />
              <button
                type="button"
                onClick={goPlan}
                disabled={planning || selectedCities.length < 1}
                className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#345E85]"
              >
                {planning ? 'Updating plan…' : 'Update plan with selected cities'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">
                    <th className="px-6 py-3">City</th>
                    <th className="px-4 py-3">Units</th>
                    <th className="px-4 py-3">Tonnes</th>
                    <th className="px-4 py-3">Km</th>
                    <th className="px-4 py-3">Mix</th>
                    <th className="px-4 py-3">Border</th>
                    <th className="px-6 py-3 text-right">Freight</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.destinations.map((dest) => (
                    <tr key={dest.cityId} className="border-t border-slate-50 dark:border-slate-800">
                      <td className="px-6 py-3 font-bold text-slate-800 dark:text-slate-100">
                        {dest.cityName}
                        <span className="block text-[10px] font-medium text-slate-400">{dest.country}</span>
                      </td>
                      <td className="px-4 py-3">{dest.units.toLocaleString()}</td>
                      <td className="px-4 py-3">{(dest.weightKg / 1000).toFixed(1)}</td>
                      <td className="px-4 py-3">{dest.distanceKm}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${dest.loadType === 'LTL' ? 'text-teal-600' : 'text-slate-500'}`}>
                          {dest.loadType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">
                        {dest.crossBorder ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-3 text-right font-bold">{dest.estimatedFreight.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-4">
              Operator pipeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.operatorSteps.map((op) => (
                <div key={op.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{op.label}</p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {op.layer === 'C' ? 'Freight' : 'Later'} · {op.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{op.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(0)} className="text-sm font-bold text-slate-500">
              Back
            </button>
            <PrimaryButton onClick={goApprove} disabled={planning}>
              {planning ? 'Saving…' : 'Review & approve'} <ArrowRight size={16} />
            </PrimaryButton>
          </div>
        </section>
      )}

      {step === 2 && plan && (
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            You approve before anything is committed
          </h2>
          <p className="text-sm text-slate-500">
            Approving creates live child loads (one per city), requests AI truck matches, quotes cargo cover, flags escrow advances for after trip assignment, and marks cross-border loads for a customs pack. Supplier purchase orders are not created.
          </p>

          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <Package className="text-[#345E85] shrink-0 mt-0.5" size={18} />
              {plan.destinations.length} loads from {origin?.name} for {campaign?.intent?.productName}
            </li>
            <li className="flex gap-3">
              <Truck className="text-[#345E85] shrink-0 mt-0.5" size={18} />
              {plan.ltlCount} shared / leftover-space movements, {plan.ftlCount} exclusive trucks
            </li>
            <li className="flex gap-3">
              <Wallet className="text-[#345E85] shrink-0 mt-0.5" size={18} />
              {campaign?.intent?.fundOnEscrow
                ? `About ${campaign?.intent?.currencyCode || 'USD'} ${plan.estimatedAdvance.toLocaleString()} trip advance if lenders fund escrow`
                : 'No escrow advance requested'}
            </li>
            <li className="flex gap-3">
              <Shield className="text-[#345E85] shrink-0 mt-0.5" size={18} />
              {campaign?.intent?.requireInsurance
                ? `Cargo cover quote ${campaign?.intent?.currencyCode || 'USD'} ${plan.insurancePremium.toLocaleString()}`
                : 'No cargo cover requested'}
            </li>
          </ul>

          <Toggle
            label="Goods are ready at my origin warehouse"
            hint="Required. UrutiX will not place a supplier purchase order."
            checked={goodsReady}
            onChange={setGoodsReady}
          />

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-slate-500">
              Back
            </button>
            <PrimaryButton onClick={approveAndCreate} disabled={approving || !goodsReady}>
              {approving ? 'Creating loads…' : 'Approve & create loads'}
            </PrimaryButton>
          </div>
        </section>
      )}

      {step === 3 && campaign && (
        <section className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-1">{campaign.status}</p>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {campaign.loadIds?.length || 0} live loads in cargo inventory
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Matching, escrow, cover, and border packs stay on each load. This board refreshes from the server.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={repeatPlan}
                className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#345E85] hover:text-[#345E85]"
              >
                Repeat next window
              </button>
              <CheckCircle2 className="text-teal-600" size={32} />
            </div>
          </div>

          {campaign.live && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi label="Live loads" value={String(campaign.live.loadCount ?? 0)} />
              <Kpi label="Matches" value={String(campaign.live.matchesFound ?? 0)} />
              <Kpi label="Trips" value={String(campaign.live.trips ?? 0)} />
              <Kpi label="Delivered" value={String(campaign.live.delivered ?? 0)} />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Jump to="/dashboard/cargos/list" label="Cargo inventory" />
            <Jump to="/dashboard/smart-matching" label="Smart matching" />
            <Jump to="/dashboard/loan-requests" label="Trip finance" />
            <Jump to="/dashboard/tracking" label="Live tracking" />
            <Jump to="/dashboard/payments" label="Payments" />
            <Jump to="/dashboard/customs-inspections" label="Customs packs" />
            <Jump to="/dashboard/epod-reports" label="ePOD" />
            <Jump to="/dashboard/analytics/predictive" label="Lane forecast" />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
            {(campaign.plan?.destinations || []).map((dest) => (
              <div
                key={dest.cityId}
                className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 last:border-0 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{dest.cityName}</p>
                  <p className="text-[11px] text-slate-400">
                    {(dest.units || 0).toLocaleString()} units · {dest.loadType}
                    {dest.loadStatus ? ` · ${dest.loadStatus}` : ''}
                    {dest.matchingStatus ? ` · ${dest.matchingStatus}` : ''}
                    {typeof dest.matchCount === 'number' ? ` · ${dest.matchCount} matches` : ''}
                    {dest.tripStatus ? ` · trip ${dest.tripStatus}` : ''}
                    {dest.financeStatus ? ` · ${dest.financeStatus}` : ''}
                  </p>
                </div>
                {dest.loadId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/cargos/list?view=${dest.loadId}`)}
                    className="text-[10px] font-black uppercase tracking-widest text-[#345E85]"
                  >
                    Open load
                  </button>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Not created</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const inputClass =
  'w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#345E85] focus:border-transparent';

const CitySearchPicker: React.FC<{
  selected: CampaignCity[];
  onAdd: (city: CampaignCity) => void;
  onRemove: (city: CampaignCity) => void;
}> = ({ selected, onAdd, onRemove }) => {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<CampaignCity[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const rows = await campaignsApi.searchCities(q);
        if (!cancelled) setHits(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
        Destination cities worldwide ({selected.length})
      </p>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any city worldwide — Lagos, Dubai, Rotterdam, São Paulo…"
          className={`${inputClass} pl-9`}
        />
        {query.trim().length >= 2 && (
          <div className="absolute z-20 mt-1 w-full max-h-80 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {searching && (
              <p className="px-4 py-2 text-xs text-slate-400">Searching live cities…</p>
            )}
            {!searching &&
              hits.map((city) => (
                <button
                  key={city.id || `${city.name}-${city.lat}-${city.lng}`}
                  type="button"
                  onClick={() => {
                    onAdd(city);
                    setQuery('');
                    setHits([]);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-100">{city.name}</span>
                  <span className="block text-[11px] text-slate-400">
                    {[city.region, city.country || city.countryCode].filter(Boolean).join(', ')}
                  </span>
                </button>
              ))}
            {!searching && hits.length === 0 && (
              <p className="px-4 py-2 text-xs text-slate-400">No match. Try another spelling.</p>
            )}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selected.map((city) => (
            <button
              key={city.id || `${city.name}-${city.lat}-${city.lng}`}
              type="button"
              onClick={() => onRemove(city)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#345E85] text-white"
            >
              {[city.name, city.country || city.countryCode].filter(Boolean).join(', ')}
              <X size={12} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</span>
    {children}
  </label>
);

const Toggle: React.FC<{
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, hint, checked, onChange }) => (
  <label className="flex items-start gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 cursor-pointer">
    <input
      type="checkbox"
      className="mt-1 rounded border-slate-300 text-[#345E85] focus:ring-[#345E85]"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span>
      <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
      <span className="block text-xs text-slate-400 mt-0.5">{hint}</span>
    </span>
  </label>
);

const Kpi: React.FC<{ label: string; value: string; warn?: boolean }> = ({ label, value, warn }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className={`text-xl font-black mt-1 ${warn ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>{value}</p>
  </div>
);

const PrimaryButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onClick, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#345E85] text-white text-sm font-black uppercase tracking-widest hover:bg-[#2c5173] disabled:opacity-50"
  >
    {children}
  </button>
);

const Jump: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#345E85]"
    >
      {label}
      <ExternalLink size={12} className="text-slate-400" />
    </button>
  );
};

export default DistributionCampaignPage;
