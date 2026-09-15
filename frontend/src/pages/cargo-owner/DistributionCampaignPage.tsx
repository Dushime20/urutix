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
  ChevronDown,
  ChevronRight,
  Package,
  MapPin,
  Wallet,
  Shield,
  Truck,
  AlertTriangle,
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
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import ModernLoader from '../../components/common/ModernLoader';

const STEPS = ['Brief', 'Plan', 'Review', 'Board'] as const;
const EXAMPLE =
  'I need 100,000 units of bottled water delivered from Kigali next month';

const apiError = (err: any, fallback: string) =>
  err?.response?.data?.message ||
  (Array.isArray(err?.response?.data?.message) ? err.response.data.message[0] : null) ||
  err?.response?.data?.error ||
  fallback;

const prettyStatus = (value?: string) =>
  String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Only trust an explicit total mass — never invent from a silent kg/unit default. */
const tonnesFromIntent = (intent: any): number => {
  if (!intent) return 0;
  if (Number(intent.totalWeightKg) > 0) return Number(intent.totalWeightKg) / 1000;
  return 0;
};

const DistributionCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const existingId = params.get('id');

  const [step, setStep] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [originText, setOriginText] = useState('');
  const [budgetCap, setBudgetCap] = useState(0);
  const [totalTonnes, setTotalTonnes] = useState<number | ''>('');
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
  const { format, convert, currency, currencyMeta, rates } = useCurrencyFormat();
  const [loading, setLoading] = useState(Boolean(existingId));
  const [selectedCities, setSelectedCities] = useState<CampaignCity[]>([]);
  /** cityId → offered freight in the user's preferred currency (what they type). */
  const [offeredPrices, setOfferedPrices] = useState<Record<string, number>>({});

  const plan = campaign?.plan;
  const origin = plan?.origin || campaign?.intent?.origin;
  const moneyDecimals = currencyMeta?.decimals ?? 2;

  const roundMoney = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    if (moneyDecimals <= 0) return Math.round(value);
    const factor = 10 ** moneyDecimals;
    return Math.round(value * factor) / factor;
  };

  /** Indicative engine amounts are always USD. */
  const moneyUsd = (usdAmount: number) => format(Number(usdAmount) || 0, 'USD');

  /** Amounts already in preferred currency (offers / budget inputs). */
  const moneyLocal = (amount: number) => format(Number(amount) || 0, currency);

  const hasCustomOffers = (data: any) => {
    const offers = data?.intent?.destinationOffers;
    if (Array.isArray(offers) && offers.some((o: any) => Number(o?.offeredPrice) > 0)) return true;
    return (data?.plan?.destinations || []).some(
      (d: any) =>
        Number(d.offeredPrice) > 0 &&
        Math.abs(Number(d.offeredPrice) - Number(d.estimatedFreight)) > 1,
    );
  };

  const syncOffersFromPlan = (data: any, preserveEdits = false) => {
    const rows = data?.plan?.destinations || [];
    const stored = String(data?.intent?.currencyCode || 'USD').toUpperCase();
    const custom = hasCustomOffers(data);
    setOfferedPrices((prev) => {
      const next: Record<string, number> = {};
      for (const dest of rows) {
        const id = dest.cityId;
        if (!id) continue;
        if (preserveEdits && Number(prev[id]) > 0) {
          next[id] = prev[id];
          continue;
        }
        if (custom && Number(dest.offeredPrice) > 0) {
          next[id] = roundMoney(convert(Number(dest.offeredPrice), stored));
        } else {
          next[id] = roundMoney(convert(Number(dest.estimatedFreight) || 0, 'USD'));
        }
      }
      return next;
    });
  };

  const applyCampaign = (data: any, nextStep?: number) => {
    if (!data) return;
    setCampaign(data);
    if (data.intent?.prompt) setPrompt(data.intent.prompt);
    if (data.intent?.origin?.name) setOriginText(data.intent.origin.name);
    if (data.intent?.destinations?.length) setSelectedCities(data.intent.destinations);
    const stored = String(data.intent?.currencyCode || 'USD').toUpperCase();
    if (typeof data.intent?.budgetCap === 'number' && data.intent.budgetCap > 0) {
      setBudgetCap(roundMoney(convert(Number(data.intent.budgetCap), stored)));
    } else {
      setBudgetCap(0);
    }
    const tonnes = tonnesFromIntent(data.intent);
    setTotalTonnes(tonnes > 0 ? Number(tonnes.toFixed(3)) : '');
    setGoodsReady(Boolean(data.intent?.goodsReady));
    syncOffersFromPlan(data, false);
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

  const destinationOffers = () =>
    Object.entries(offeredPrices)
      .filter(([, price]) => Number(price) > 0)
      .map(([cityId, offeredPrice]) => ({ cityId, offeredPrice: roundMoney(Number(offeredPrice)) }));

  const offeredFreightTotal = (plan?.destinations || []).reduce((sum: number, dest: any) => {
    const typed = Number(offeredPrices[dest.cityId]);
    if (typed > 0) return sum + typed;
    return sum + roundMoney(convert(Number(dest.estimatedFreight) || 0, 'USD'));
  }, 0);

  const insurancePreferred = roundMoney(convert(Number(plan?.insurancePremium) || 0, 'USD'));
  const spendAgainstCap = offeredFreightTotal + insurancePreferred;
  const overBudget = budgetCap > 0 && spendAgainstCap > budgetCap;
  const canPropose =
    !planning && selectedCities.length >= 1 && typeof totalTonnes === 'number' && totalTonnes > 0;

  const payload = () => ({
    prompt: prompt.trim(),
    originText: originText.trim() || undefined,
    budgetCap: Number(budgetCap) > 0 ? Number(budgetCap) : 0,
    totalTonnes: typeof totalTonnes === 'number' && totalTonnes > 0 ? totalTonnes : undefined,
    destinations: selectedCities,
    destinationOffers: destinationOffers(),
    currencyCode: currency,
  });

  // When the user switches preferred currency, re-express offers from USD indicative (or stored).
  useEffect(() => {
    if (!campaign?.plan) return;
    syncOffersFromPlan(campaign, false);
    const stored = String(campaign.intent?.currencyCode || 'USD').toUpperCase();
    if (typeof campaign.intent?.budgetCap === 'number' && campaign.intent.budgetCap > 0) {
      setBudgetCap(roundMoney(convert(Number(campaign.intent.budgetCap), stored)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, rates]);

  const goPlan = async () => {
    if (prompt.trim().length < 12) {
      toast.error('Tell UrutiX what must move in one sentence');
      return;
    }
    if (!(typeof totalTonnes === 'number' && totalTonnes > 0)) {
      toast.error('Enter the actual cargo weight in tonnes');
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

  const goApprove = async () => {
    const rows = plan?.destinations || [];
    const missing = rows.filter((d: any) => !(Number(offeredPrices[d.cityId]) > 0));
    if (missing.length) {
      toast.error(`Set your offered price for: ${missing.map((d: any) => d.cityName).join(', ')}`);
      return;
    }
    if (!campaign?.id) {
      setStep(2);
      return;
    }
    setPlanning(true);
    try {
      const data = await campaignsApi.update(campaign.id, payload());
      applyCampaign(data, 2);
    } catch (err: any) {
      toast.error(apiError(err, 'Could not save offered prices'));
    } finally {
      setPlanning(false);
    }
  };

  const approveAndCreate = async () => {
    if (!campaign?.id) return;
    if (!(typeof totalTonnes === 'number' && totalTonnes > 0) && !(Number(campaign?.intent?.totalWeightKg) > 0)) {
      toast.error('Enter the actual cargo weight in tonnes before approving');
      return;
    }
    const missing = (plan?.destinations || []).filter((d: any) => !(Number(offeredPrices[d.cityId]) > 0));
    if (missing.length) {
      toast.error(`Set your offered price for: ${missing.map((d: any) => d.cityName).join(', ')}`);
      return;
    }
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
    setPrompt('');
    setOriginText('');
    setBudgetCap(0);
    setTotalTonnes('');
    setOfferedPrices({});
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
    return <ModernLoader isLoading type="form" fields={6} />;
  }

  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="size-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#345E85] hover:text-[#345E85]"
            aria-label="Back to overview"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="ui-page-title">
              <TranslatedText text="Campaigns" />
            </h1>
            {campaign?.intent?.productName && step > 0 && (
              <p className="ui-body-small truncate mt-0.5">{campaign.intent.productName}</p>
            )}
          </div>
        </div>
        <button type="button" onClick={startFresh} className={ghostBtnClass}>
          <TranslatedText text="New campaign" />
        </button>
      </header>

      <Stepper current={step} onGoTo={(index) => index < step && setStep(index)} />

      {step === 0 && (
        <div className={`grid gap-5 ${savedList.length > 0 ? 'lg:grid-cols-[minmax(0,1fr)_272px]' : ''}`}>
          <section className={cardClass}>
            <div className="p-5 md:p-6 space-y-5">
              <Field label="What to move">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      if (!listeningRef.current) spokenBaseRef.current = e.target.value;
                    }}
                    rows={3}
                    className={`${inputClass} min-h-[92px] py-3 pr-12 resize-none`}
                    placeholder={EXAMPLE}
                    aria-label="What your company needs to move"
                  />
                  <button
                    type="button"
                    onClick={() => void startVoice()}
                    className={`absolute top-2.5 right-2.5 size-8 inline-flex items-center justify-center rounded-md border ${
                      listening
                        ? 'border-[#345E85] bg-[#345E85] text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#345E85] hover:text-[#345E85]'
                    }`}
                    title={listening ? 'Stop microphone' : 'Dictate brief'}
                    aria-pressed={listening}
                    aria-label={listening ? 'Stop microphone' : 'Start microphone'}
                  >
                    {listening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Weight (t)">
                  <input
                    type="number"
                    min={0.001}
                    step="any"
                    value={totalTonnes}
                    onChange={(e) => {
                      const next = e.target.value;
                      setTotalTonnes(next === '' ? '' : Number(next));
                    }}
                    placeholder="0.00"
                    className={inputClass}
                    required
                  />
                </Field>
                <Field label="Origin">
                  <input
                    value={originText}
                    onChange={(e) => setOriginText(e.target.value)}
                    placeholder="City"
                    className={inputClass}
                  />
                </Field>
                <Field label={`Budget (${currency})`}>
                  <input
                    type="number"
                    min={0}
                    value={budgetCap || ''}
                    onChange={(e) => setBudgetCap(Number(e.target.value) || 0)}
                    placeholder="Optional"
                    className={inputClass}
                  />
                </Field>
              </div>

              <CitySearchPicker selected={selectedCities} onAdd={addCity} onRemove={dropCity} />
            </div>

            <div className="px-5 md:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500 tabular-nums">
                {selectedCities.length} {selectedCities.length === 1 ? 'city' : 'cities'}
              </p>
              <PrimaryButton onClick={goPlan} disabled={!canPropose}>
                {planning ? 'Building…' : 'Build plan'} <ArrowRight size={16} />
              </PrimaryButton>
            </div>
          </section>

          {savedList.length > 0 && (
            <aside className={`${cardClass} h-fit`}>
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  <TranslatedText text="Recent" />
                </h2>
              </div>
              <ul>
                {savedList.slice(0, 8).map((item) => {
                  const active = campaign?.id === item.id;
                  return (
                    <li key={item.id} className="border-t border-slate-100 dark:border-slate-800 first:border-t-0">
                      <button
                        type="button"
                        onClick={() => openSaved(item)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          active ? 'bg-slate-50 dark:bg-slate-800/50' : ''
                        }`}
                      >
                        <span className="block text-sm font-medium text-slate-900 dark:text-white truncate">
                          {item.intent?.productName || item.productName || 'Untitled'}
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500 tabular-nums">
                            {(item.intent?.totalUnits || item.totalUnits || 0).toLocaleString()}
                          </span>
                          <StatusPill>{prettyStatus(item.status)}</StatusPill>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>
          )}
        </div>
      )}

      {step === 1 && plan && (
        <section className="space-y-4">
          <div className={cardClass}>
            <div className="grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
              <Kpi label="Weight" value={`${(plan.totalWeightKg / 1000).toFixed(1)} t`} />
              <Kpi label="Loads" value={String(plan.destinations.length)} />
              <Kpi label="Shared" value={`${plan.sharedCapacityPct}%`} />
              <Kpi label="Indicative" value={moneyUsd(plan.estimatedFreight)} />
              <Kpi label="Offer" value={moneyLocal(offeredFreightTotal)} warn={overBudget} />
            </div>
          </div>

          {!(Number(campaign?.intent?.totalWeightKg) > 0) && (
            <Notice>Enter tonnes and update the plan before review.</Notice>
          )}
          {overBudget && (
            <Notice>Offer plus cover exceeds the budget cap.</Notice>
          )}

          <div className={cardClass}>
            <div className="px-5 py-3 md:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={15} className="text-[#345E85] shrink-0" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {origin?.name}
                  <span className="font-normal text-slate-400 mx-1.5">→</span>
                  {plan.destinations.length} cities
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0.001}
                  step="any"
                  value={totalTonnes}
                  onChange={(e) => {
                    const next = e.target.value;
                    setTotalTonnes(next === '' ? '' : Number(next));
                  }}
                  className={`${inputClass} w-24`}
                  aria-label="Cargo weight in tonnes"
                />
                <button
                  type="button"
                  onClick={goPlan}
                  disabled={!canPropose}
                  className="h-10 px-3 text-sm font-medium text-[#345E85] hover:text-[#2c5173] disabled:opacity-40"
                >
                  {planning ? 'Updating…' : 'Update'}
                </button>
              </div>
            </div>

            <details className="group border-b border-slate-200 dark:border-slate-800">
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-5 md:px-6 py-3 flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span>
                  Destinations
                  <span className="ml-2 tabular-nums text-slate-400">{selectedCities.length}</span>
                </span>
                <ChevronDown size={14} className="text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 md:px-6 pb-4">
                <CitySearchPicker selected={selectedCities} onAdd={addCity} onRemove={dropCity} compact />
              </div>
            </details>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left ui-table-header border-b border-slate-200 dark:border-slate-800">
                    <th className="px-5 md:px-6 py-2.5 font-medium">City</th>
                    <th className="px-3 py-2.5 font-medium text-right">Units</th>
                    <th className="px-3 py-2.5 font-medium text-right">t</th>
                    <th className="px-3 py-2.5 font-medium text-right">Km</th>
                    <th className="px-3 py-2.5 font-medium">Type</th>
                    <th className="px-3 py-2.5 font-medium text-right">Indicative</th>
                    <th className="px-5 md:px-6 py-2.5 font-medium text-right">Offer</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.destinations.map((dest: any) => (
                    <tr
                      key={dest.cityId}
                      className="border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <td className="px-5 md:px-6 py-3">
                        <span className="block font-medium text-slate-900 dark:text-white">{dest.cityName}</span>
                        <span className="block text-xs text-slate-500">
                          {dest.country}
                          {dest.crossBorder ? ' · Border' : ''}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{dest.units.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{(dest.weightKg / 1000).toFixed(1)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{dest.distanceKm}</td>
                      <td className="px-3 py-3">
                        <StatusPill>{dest.loadType}</StatusPill>
                      </td>
                      <td
                        className="px-3 py-3 text-right tabular-nums text-slate-500"
                        title={dest.freightBreakdown?.method || ''}
                      >
                        {moneyUsd(dest.estimatedFreight)}
                      </td>
                      <td className="px-5 md:px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min={1}
                            step={moneyDecimals > 0 ? 0.01 : 1}
                            value={offeredPrices[dest.cityId] ?? ''}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setOfferedPrices((prev) => ({
                                ...prev,
                                [dest.cityId]: Number.isFinite(value) ? value : 0,
                              }));
                            }}
                            className="w-28 h-9 px-2 text-sm text-right border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#345E85] focus:border-[#345E85]"
                            aria-label={`Offered price for ${dest.cityName}`}
                          />
                          <button
                            type="button"
                            className="text-[11px] font-medium text-[#345E85] hover:text-[#2c5173] whitespace-nowrap"
                            onClick={() =>
                              setOfferedPrices((prev) => ({
                                ...prev,
                                [dest.cityId]: roundMoney(convert(Number(dest.estimatedFreight) || 0, 'USD')),
                              }))
                            }
                          >
                            Match
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {Array.isArray(plan.operatorSteps) && plan.operatorSteps.length > 0 && (
            <details className={`group ${cardClass}`}>
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-5 md:px-6 py-3 flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span>Pipeline</span>
                <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                  {plan.operatorSteps.length}
                  <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <ul className="border-t border-slate-200 dark:border-slate-800">
                {plan.operatorSteps.map((op: any) => (
                  <li
                    key={op.id}
                    className="px-5 md:px-6 py-3 border-t border-slate-100 dark:border-slate-800 first:border-t-0"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{op.label}</p>
                      <StatusPill>{prettyStatus(op.status)}</StatusPill>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{op.detail}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <StepFooter onBack={() => setStep(0)}>
            <PrimaryButton onClick={goApprove} disabled={planning}>
              {planning ? 'Saving…' : 'Continue'} <ArrowRight size={16} />
            </PrimaryButton>
          </StepFooter>
        </section>
      )}

      {step === 2 && plan && (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className={cardClass}>
            <div className="px-5 py-3 md:px-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                <TranslatedText text="Summary" />
              </h2>
            </div>
            <dl>
              <SummaryRow icon={Package} label="Loads">
                {plan.destinations.length} from {origin?.name}
                {campaign?.intent?.productName ? ` · ${campaign.intent.productName}` : ''}
              </SummaryRow>
              <SummaryRow icon={Truck} label="Mix">
                {plan.ltlCount} shared · {plan.ftlCount} exclusive
              </SummaryRow>
              <SummaryRow icon={Wallet} label="Freight">
                {moneyLocal(offeredFreightTotal)}
                {plan.estimatedFreight ? ` · ${moneyUsd(plan.estimatedFreight)} indicative` : ''}
                {campaign?.intent?.fundOnEscrow
                  ? ` · ${moneyLocal(offeredFreightTotal * 0.7)} escrow`
                  : ''}
              </SummaryRow>
              <SummaryRow icon={Shield} label="Cover">
                {campaign?.intent?.requireInsurance
                  ? moneyUsd(plan.insurancePremium)
                  : 'Not requested'}
              </SummaryRow>
            </dl>
          </div>

          <div className={`${cardClass} h-fit`}>
            <div className="p-5 space-y-4">
              <Field label={`Budget (${currency})`}>
                <input
                  type="number"
                  min={0}
                  value={budgetCap || ''}
                  onChange={(e) => setBudgetCap(Number(e.target.value) || 0)}
                  placeholder="Optional"
                  className={inputClass}
                />
              </Field>

              {overBudget && (
                <Notice>
                  {moneyLocal(spendAgainstCap)} exceeds {moneyLocal(Number(budgetCap))}.
                </Notice>
              )}

              <Toggle
                label="Goods ready at origin"
                checked={goodsReady}
                onChange={setGoodsReady}
              />

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Back
                </button>
                <PrimaryButton
                  onClick={approveAndCreate}
                  disabled={approving || !goodsReady || overBudget}
                >
                  {approving ? 'Creating…' : 'Approve'}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 3 && campaign && (
        <section className="space-y-4">
          <div className={`${cardClass} px-5 py-3.5 md:px-6 flex flex-wrap items-center justify-between gap-3`}>
            <div className="flex items-center gap-3 min-w-0">
              <StatusPill>{prettyStatus(campaign.status)}</StatusPill>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {campaign.loadIds?.length || 0} loads
              </h2>
            </div>
            <button type="button" onClick={repeatPlan} className={ghostBtnClass}>
              Repeat
            </button>
          </div>

          {campaign.live && (
            <div className={cardClass}>
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
                <Kpi label="Live" value={String(campaign.live.loadCount ?? 0)} />
                <Kpi label="Matches" value={String(campaign.live.matchesFound ?? 0)} />
                <Kpi label="Trips" value={String(campaign.live.trips ?? 0)} />
                <Kpi label="Delivered" value={String(campaign.live.delivered ?? 0)} />
              </div>
            </div>
          )}

          <div className={cardClass}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left ui-table-header border-b border-slate-200 dark:border-slate-800">
                    <th className="px-5 md:px-6 py-2.5 font-medium">City</th>
                    <th className="px-3 py-2.5 font-medium">Load</th>
                    <th className="px-3 py-2.5 font-medium">Matching</th>
                    <th className="px-5 md:px-6 py-2.5 font-medium text-right" />
                  </tr>
                </thead>
                <tbody>
                  {(campaign.plan?.destinations || []).map((dest: any) => (
                    <tr
                      key={dest.cityId}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-5 md:px-6 py-3">
                        <span className="block font-medium text-slate-900 dark:text-white">{dest.cityName}</span>
                        <span className="block text-xs text-slate-500">
                          {(dest.units || 0).toLocaleString()} · {dest.loadType}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusPill>
                            {prettyStatus(dest.loadStatus) || (dest.loadId ? 'Created' : 'Pending')}
                          </StatusPill>
                          {dest.tripStatus ? <StatusPill>{prettyStatus(dest.tripStatus)}</StatusPill> : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusPill>{prettyStatus(dest.matchingStatus) || '—'}</StatusPill>
                          {typeof dest.matchCount === 'number' ? (
                            <span className="text-xs tabular-nums text-slate-500">{dest.matchCount}</span>
                          ) : null}
                          {dest.financeStatus ? <StatusPill>{prettyStatus(dest.financeStatus)}</StatusPill> : null}
                        </div>
                      </td>
                      <td className="px-5 md:px-6 py-3 text-right">
                        {dest.loadId ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/cargos/list?view=${dest.loadId}`)}
                            className="text-sm font-medium text-[#345E85] hover:text-[#2c5173]"
                          >
                            Open
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Jump to="/dashboard/cargos/list" label="Inventory" />
            <Jump to="/dashboard/smart-matching" label="Matching" />
            <Jump to="/dashboard/loan-requests" label="Finance" />
            <Jump to="/dashboard/tracking" label="Tracking" />
            <Jump to="/dashboard/payments" label="Payments" />
          </nav>
        </section>
      )}
    </div>
  );
};

const cardClass =
  'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden';

const inputClass =
  'w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#345E85] focus:border-[#345E85]';

const ghostBtnClass =
  'h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-[#345E85] hover:text-[#345E85]';

const StatusPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center h-6 px-2 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
    {children}
  </span>
);

const Stepper: React.FC<{ current: number; onGoTo: (index: number) => void }> = ({
  current,
  onGoTo,
}) => (
  <nav aria-label="Campaign steps" className="border-b border-slate-200 dark:border-slate-800">
    <ol className="flex">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex-1 min-w-0">
            <button
              type="button"
              disabled={!done}
              onClick={() => done && onGoTo(index)}
              className={`w-full pb-3 text-left border-b-2 -mb-px ${
                active
                  ? 'border-[#345E85] text-slate-900 dark:text-white'
                  : done
                    ? 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                    : 'border-transparent text-slate-400 cursor-default'
              }`}
            >
              <span className="block text-[11px] font-medium tracking-wider tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className={`block text-sm mt-0.5 truncate ${active ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

const CitySearchPicker: React.FC<{
  selected: CampaignCity[];
  onAdd: (city: CampaignCity) => void;
  onRemove: (city: CampaignCity) => void;
  compact?: boolean;
}> = ({ selected, onAdd, onRemove, compact }) => {
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
      {!compact && (
        <p className="ui-label mb-1.5">
          Destinations
          {selected.length > 0 ? ` · ${selected.length}` : ''}
        </p>
      )}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cities"
          className={`${inputClass} pl-9`}
        />
        {query.trim().length >= 2 && (
          <div className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {searching && <p className="px-3 py-2.5 text-xs text-slate-400">Searching…</p>}
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
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-100">{city.name}</span>
                  <span className="block text-xs text-slate-500">
                    {[city.region, city.country || city.countryCode].filter(Boolean).join(', ')}
                  </span>
                </button>
              ))}
            {!searching && hits.length === 0 && (
              <p className="px-3 py-2.5 text-xs text-slate-400">No match</p>
            )}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {selected.map((city) => (
            <button
              key={city.id || `${city.name}-${city.lat}-${city.lng}`}
              type="button"
              onClick={() => onRemove(city)}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#345E85] hover:text-[#345E85]"
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
    <span className="ui-label mb-1.5">{label}</span>
    {children}
  </label>
);

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 cursor-pointer">
    <input
      type="checkbox"
      className="rounded border-slate-300 text-[#345E85] focus:ring-[#345E85]"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
  </label>
);

const Kpi: React.FC<{ label: string; value: string; warn?: boolean }> = ({ label, value, warn }) => (
  <div className="px-4 py-3.5">
    <p className="ui-label mb-1">{label}</p>
    <p className={`text-base font-semibold tracking-tight tabular-nums ${warn ? 'text-[#345E85]' : 'text-slate-900 dark:text-white'}`}>
      {value}
    </p>
  </div>
);

const Notice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200">
    <AlertTriangle size={15} className="mt-0.5 shrink-0 text-slate-500" />
    <p>{children}</p>
  </div>
);

const SummaryRow: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}> = ({ icon: Icon, label, children }) => (
  <div className="px-5 md:px-6 py-3.5 grid grid-cols-[72px_minmax(0,1fr)] gap-3 items-start border-t border-slate-100 dark:border-slate-800 first:border-t-0">
    <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
      <Icon size={14} className="text-slate-400" />
      {label}
    </dt>
    <dd className="text-sm text-slate-800 dark:text-slate-100">{children}</dd>
  </div>
);

const PrimaryButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onClick, children, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={primaryBtnClass}>
    {children}
  </button>
);

const primaryBtnClass =
  'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#345E85] text-white text-sm font-semibold hover:bg-[#2c5173] disabled:opacity-40 disabled:pointer-events-none';

const StepFooter: React.FC<{ onBack: () => void; children: React.ReactNode }> = ({ onBack, children }) => (
  <div className="flex items-center justify-between">
    <button
      type="button"
      onClick={onBack}
      className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
    >
      Back
    </button>
    {children}
  </div>
);

const Jump: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="inline-flex items-center gap-0.5 h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-[#345E85] hover:text-[#345E85]"
    >
      {label}
      <ChevronRight size={14} />
    </button>
  );
};

export default DistributionCampaignPage;
