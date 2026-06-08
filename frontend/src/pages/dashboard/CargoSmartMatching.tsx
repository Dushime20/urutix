import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaTruck, FaStar, FaMapMarkerAlt, FaClock, FaWeightHanging,
  FaShieldAlt, FaThermometerHalf, FaRoute, FaCheck, FaTimes,
  FaChartLine, FaChartBar, FaSearch, FaFilter,
} from 'react-icons/fa';
import { Brain, Zap, Target, ArrowLeft, RefreshCw, Package } from 'lucide-react';
import { cargoOwnerAPI } from '../../services/cargoOwnerAPI';
import { fetchCargos } from '../../services/cargoApi';
import type { MatchedTruck, MarketInsights } from '../../services/cargoOwnerAPI';
import { enhancedMatchingApi } from '../../services/enhancedMatchingApi';
import toast from 'react-hot-toast';

const CargoSmartMatching: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCargoId = searchParams.get('cargoId') || '';

  const [cargos, setCargos] = useState<any[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState(preselectedCargoId);
  const [matchedTrucks, setMatchedTrucks] = useState<MatchedTruck[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<MatchedTruck | null>(null);
  const [loading, setLoading] = useState(false);
  const [cargosLoading, setCargosLoading] = useState(true);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'comparison'>('list');
  const [compareList, setCompareList] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'cost' | 'rating' | 'distance'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    minScore: 0, maxCost: 0, minRating: 0,
    truckType: '', hasGPS: false, hasRefrigeration: false, hasHazmat: false,
  });

  // Load eligible cargos on mount
  useEffect(() => {
    const loadCargos = async () => {
      setCargosLoading(true);
      try {
        const data = await fetchCargos(1, '', { limit: 50 });
        const eligible = (Array.isArray(data) ? data : []).filter(
          (c: any) => c.status === 'CREATED' || c.status === 'PUBLISHED'
        );
        setCargos(eligible);
        // Auto-run if cargoId was passed in URL
        if (preselectedCargoId && eligible.find((c: any) => c.id === preselectedCargoId)) {
          findMatches(preselectedCargoId);
        }
      } catch {
        toast.error('Failed to load cargos');
      } finally {
        setCargosLoading(false);
      }
    };
    loadCargos();
  }, []);

  const findMatches = async (cargoId?: string) => {
    const id = cargoId || selectedCargoId;
    if (!id) { toast.error('Please select a cargo first'); return; }
    setLoading(true);
    setMatchedTrucks([]);
    setSelectedTruck(null);
    try {
      const cargo = cargos.find((c: any) => c.id === id);
      const [matchesRes, insightsRes] = await Promise.all([
        cargoOwnerAPI.findMatches(id, {
          minRating: 0,
          maxCost: cargo ? (Number(cargo.loadValue) || 0) * 0.3 : undefined,
          requiresRefrigeration: cargo?.requiresRefrigeration,
          requiresHazmat: cargo?.isHazardous,
          isTimeCritical: cargo?.urgencyLevel === 'CRITICAL',
          includeDrivers: true,
          limit: 15,
        }),
        cargoOwnerAPI.getMarketInsights().catch(() => ({ data: null })),
      ]);
      // API returns { data: [...], matches: [...] } — extract the array
      const responseBody = matchesRes.data;
      const rawMatches = Array.isArray(responseBody)
        ? responseBody
        : Array.isArray(responseBody?.data)
          ? responseBody.data
          : Array.isArray(responseBody?.matches)
            ? responseBody.matches
            : [];

      // Warn if fewer than 3 qualified trucks were returned
      if (rawMatches.length > 0 && rawMatches.length < 3) {
        toast('Only ' + rawMatches.length + ' qualified truck(s) found for this cargo', { icon: '⚠️' });
      }

      // Normalize flat MatchResultDto → MatchedTruck shape the UI expects
      const trucks: MatchedTruck[] = rawMatches.map((m: any) => ({
        id: m.truckId || m.id,
        score: Math.round((m.overallScore || 0) * 100),
        estimatedCost: m.estimatedCost || 0,
        estimatedTime: m.estimatedDeliveryTime || 0,
        distance: m.distanceKm || 0,
        matchReason: m.matchReason || '',
        successProbability: m.successProbability || 0,
        riskScore: m.riskScore || 0,
        confidence: m.confidence || 0,
        truck: {
          id: m.truckId || m.id,
          plateNumber: m.plateNumber || '',
          make: m.truckMake || '',
          model: m.truckModel || '',
          year: m.year || 0,
          capacityWeight: m.capacityWeight || 0,
          capacityVolume: Number(m.capacityVolume) || 0,
          truckType: m.truckType || '',
          hasRefrigeration: m.hasRefrigeration || false,
          hasHazmatPermit: m.hasHazmatPermit || false,
          hasGpsTracking: m.hasGps || false,
          hasTemperatureMonitoring: false,
          hasSecurityMonitoring: false,
          insuranceCoverage: 0,
        },
        driver: {
          id: m.driverId || '',
          firstName: m.driverName?.split(' ')[0] || 'N/A',
          lastName: m.driverName?.split(' ').slice(1).join(' ') || '',
          rating: Number(m.driverRating) || Number(m.truckRating) || 0,
          experience: 0,
          endorsements: [],
          certifications: [],
        },
        truckOwner: {
          id: m.ownerId || '',
          name: m.ownerName || 'Unknown',
          rating: Number(m.ownerRating) || 0,
          verified: m.ownerVerified || false,
        },
      }));
      setMatchedTrucks(trucks);
      if (insightsRes.data) setMarketInsights(insightsRes.data);
      if (trucks.length === 0) toast('No matches found for this cargo', { icon: '🔍' });
      else toast.success(`Found ${trucks.length} qualified truck${trucks.length === 1 ? '' : 's'} — review the top matches below`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Matching failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const filteredTrucks = matchedTrucks
    .filter(t => {
      if (filters.minScore && t.score < filters.minScore) return false;
      if (filters.maxCost && t.estimatedCost > filters.maxCost) return false;
      if (filters.minRating && t.driver?.rating < filters.minRating) return false;
      if (filters.truckType && t.truck?.truckType !== filters.truckType) return false;
      if (filters.hasGPS && !t.truck?.hasGpsTracking) return false;
      if (filters.hasRefrigeration && !t.truck?.hasRefrigeration) return false;
      if (filters.hasHazmat && !t.truck?.hasHazmatPermit) return false;
      return true;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortBy === 'score') diff = a.score - b.score;
      else if (sortBy === 'cost') diff = a.estimatedCost - b.estimatedCost;
      else if (sortBy === 'rating') diff = (a.driver?.rating || 0) - (b.driver?.rating || 0);
      else if (sortBy === 'distance') diff = a.distance - b.distance;
      return sortOrder === 'asc' ? diff : -diff;
    });

  const toggleCompare = (id: string) => {
    setCompareList(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const selectedCargo = cargos.find((c: any) => c.id === selectedCargoId);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-[#345E85]/10 rounded-lg">
                <Target className="w-4 h-4 text-[#345E85]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#345E85]">AI Engine</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Smart Matching</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Find the best trucks for your cargo
            </p>
          </div>
        </div>
        {matchedTrucks.length > 0 && (
          <button
            onClick={() => findMatches()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        )}
      </div>

      {/* Cargo Selector */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Select Cargo to Match</h2>
        {cargosLoading ? (
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-[#345E85] rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Loading cargos...</span>
          </div>
        ) : cargos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Package className="w-10 h-10 text-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              No eligible cargos found. Create a cargo first.
            </p>
            <button
              onClick={() => navigate('/dashboard/cargos/list')}
              className="px-4 py-2 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Go to Cargos
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={selectedCargoId}
              onChange={e => setSelectedCargoId(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:border-[#345E85] focus:ring-1 focus:ring-[#345E85]/20 transition-all"
            >
              <option value="">— Choose a cargo —</option>
              {cargos.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.title || `Cargo ${c.id.slice(0, 8)}`} · {c.weight}kg · {c.status}
                </option>
              ))}
            </select>
            <button
              onClick={() => findMatches()}
              disabled={!selectedCargoId || loading}
              className="flex items-center gap-2 px-6 py-3 bg-[#345E85] hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
            >
              {loading ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Matching...</>
              ) : (
                <><Zap className="w-3.5 h-3.5" /> Find Matches</>
              )}
            </button>
          </div>
        )}

        {/* Selected cargo summary */}
        {selectedCargo && (
          <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-slate-50">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
              <FaWeightHanging className="text-[#345E85]" /> {selectedCargo.weight} kg
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
              <Package className="w-3 h-3 text-[#345E85]" /> {selectedCargo.cargoType || 'General'}
            </span>
            {selectedCargo.requiresRefrigeration && (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                <FaThermometerHalf /> Refrigerated
              </span>
            )}
            {selectedCargo.isHazardous && (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
                <FaShieldAlt /> Hazardous
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
              <FaClock className="text-[#345E85]" /> Pickup: {new Date(selectedCargo.pickupDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-16 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-t-4 border-[#345E85] animate-spin" />
            <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#345E85] w-8 h-8 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">AI Matching in Progress</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analyzing cargo specs and available trucks...</p>
          </div>
        </div>
      )}

      {/* Market Insights section removed per request */}

      {/* Results */}
      {!loading && matchedTrucks.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          {/* ── Top 3 Qualified Trucks Banner ── */}
          {(() => {
            const top3 = filteredTrucks.slice(0, 3);
            const rankColors = [
              'border-yellow-400 bg-yellow-50',
              'border-slate-300 bg-slate-50',
              'border-amber-600 bg-amber-50',
            ];
            const rankLabels = ['#1 Best Match', '#2', '#3'];
            const rankTextColors = ['text-yellow-700', 'text-slate-600', 'text-amber-800'];
            if (top3.length === 0) return null;
            return (
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-[#345E85]" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Top {top3.length} Qualified Trucks</h2>
                  <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review &amp; select one to proceed</span>
                </div>
                <div className={`grid gap-3 ${top3.length === 1 ? 'grid-cols-1' : top3.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                  {top3.map((truck, idx) => (
                    <button
                      key={truck.id}
                      onClick={() => setSelectedTruck(truck)}
                      className={`relative text-left rounded-2xl border-2 p-4 transition-all ${rankColors[idx]} ${selectedTruck?.id === truck.id ? 'ring-2 ring-[#345E85] ring-offset-1' : 'hover:ring-1 hover:ring-[#345E85]/40'}`}
                    >
                      {/* Rank badge */}
                      <span className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${rankTextColors[idx]} bg-white/70`}>
                        {rankLabels[idx]}
                      </span>
                      <div className="mb-2 pr-16">
                        <p className="text-xs font-black text-slate-900 leading-tight">{truck.truckOwner?.name || 'Unknown Owner'}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{truck.truck?.make} {truck.truck?.model} · {truck.truck?.truckType}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black ${getScoreColor(truck.score)}`}>
                          <FaStar className="w-2 h-2" /> {truck.score}%
                        </span>
                        <span className="text-[9px] font-black text-slate-700 bg-white/60 px-2 py-0.5 rounded-full border border-slate-200">
                          ${truck.estimatedCost?.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 bg-white/60 px-2 py-0.5 rounded-full border border-slate-200">
                          {truck.distance} mi · {truck.estimatedTime}h
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {truck.truck?.hasGpsTracking && <span className="text-[8px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">GPS</span>}
                        {truck.truck?.hasRefrigeration && <span className="text-[8px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Fridge</span>}
                        {truck.truck?.hasHazmatPermit && <span className="text-[8px] font-black bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Hazmat</span>}
                        <span className="text-[8px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-white/60 border border-slate-200">
                          ★ {truck.driver?.rating || '—'}
                        </span>
                      </div>
                      <div className={`text-[9px] font-black uppercase tracking-widest py-1.5 text-center rounded-xl ${selectedTruck?.id === truck.id ? 'bg-[#345E85] text-white' : 'bg-white/70 text-[#345E85] border border-[#345E85]/30'}`}>
                        {selectedTruck?.id === truck.id ? '✓ Selected' : 'Select This Truck'}
                      </div>
                    </button>
                  ))}
                </div>
                {matchedTrucks.length > 3 && (
                  <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    + {matchedTrucks.length - 3} more trucks available in the full list below
                  </p>
                )}
              </div>
            );
          })()}
          {/* Controls bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-50 p-1 rounded-xl gap-1">
                {(['list', 'table', 'comparison'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {mode === 'comparison' ? `Compare (${compareList.length}/3)` : mode}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {filteredTrucks.length} of {matchedTrucks.length} matches
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 outline-none"
              >
                <option value="score">Score</option>
                <option value="cost">Cost</option>
                <option value="rating">Rating</option>
                <option value="distance">Distance</option>
              </select>
              <button
                onClick={() => setSortOrder(p => p === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 hover:bg-slate-100 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/50 flex flex-wrap gap-3 items-center">
            <FaFilter className="text-slate-300 text-xs" />
            <input type="number" min="0" max="100" placeholder="Min score" value={filters.minScore || ''} onChange={e => setFilters(p => ({ ...p, minScore: Number(e.target.value) }))}
              className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-[#345E85]" />
            <input type="number" min="0" placeholder="Max cost" value={filters.maxCost || ''} onChange={e => setFilters(p => ({ ...p, maxCost: Number(e.target.value) }))}
              className="w-28 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-[#345E85]" />
            {[
              { key: 'hasGPS', label: 'GPS' },
              { key: 'hasRefrigeration', label: 'Fridge' },
              { key: 'hasHazmat', label: 'Hazmat' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
                <input type="checkbox" checked={(filters as any)[key]} onChange={e => setFilters(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
                {label}
              </label>
            ))}
            <button onClick={() => setFilters({ minScore: 0, maxCost: 0, minRating: 0, truckType: '', hasGPS: false, hasRefrigeration: false, hasHazmat: false })}
              className="text-[10px] font-black uppercase tracking-widest text-[#345E85] hover:underline ml-auto">
              Reset
            </button>
          </div>

          {/* List View */}
          {viewMode === 'list' && (
            <div className="divide-y divide-slate-50">
              {filteredTrucks.map(truck => (
                <div
                  key={truck.id}
                  onClick={() => setSelectedTruck(truck)}
                  className={`p-6 cursor-pointer transition-all hover:bg-slate-50/50 ${selectedTruck?.id === truck.id ? 'bg-blue-50/50 border-l-4 border-[#345E85]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input type="checkbox" checked={compareList.includes(truck.id)} onChange={() => toggleCompare(truck.id)}
                        disabled={!compareList.includes(truck.id) && compareList.length >= 3}
                        className="mt-1 rounded" onClick={e => e.stopPropagation()} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-black text-slate-900">{truck.truckOwner?.name || 'Unknown Owner'}</h3>
                          <span className="text-[10px] font-bold text-slate-400">{truck.truck?.make} {truck.truck?.model} · {truck.truck?.truckType}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                          <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-[#345E85]" /> {truck.distance} mi</span>
                          <span className="flex items-center gap-1"><FaClock className="text-[#345E85]" /> {truck.estimatedTime}h</span>
                          <span className="flex items-center gap-1"><FaStar className="text-yellow-400" /> {truck.driver?.rating} ★</span>
                          <span className="flex items-center gap-1"><FaShieldAlt className="text-slate-400" /> Risk: {Math.round((truck.riskScore || 0) * 100)}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {truck.truck?.hasGpsTracking && <span className="text-[9px] font-black uppercase tracking-widest bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">GPS</span>}
                          {truck.truck?.hasRefrigeration && <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Fridge</span>}
                          {truck.truck?.hasHazmatPermit && <span className="text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">Hazmat</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getScoreColor(truck.score)}`}>
                        <FaStar className="w-2.5 h-2.5" /> {truck.score}%
                      </span>
                      <span className="text-lg font-black text-slate-900">${truck.estimatedCost?.toLocaleString()}</span>
                      {selectedTruck?.id === truck.id && (
                        <div className="w-5 h-5 bg-[#345E85] rounded-full flex items-center justify-center">
                          <FaCheck className="text-white text-[8px]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {showDetails === truck.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Driver</p>
                        <p className="text-sm font-bold text-slate-700">{truck.driver?.firstName} {truck.driver?.lastName}</p>
                        <p className="text-xs text-slate-500">{truck.driver?.experience} yrs experience · {truck.driver?.endorsements?.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Truck</p>
                        <p className="text-sm font-bold text-slate-700">{truck.truck?.make} {truck.truck?.model} ({truck.truck?.year})</p>
                        <p className="text-xs text-slate-500">Capacity: {truck.truck?.capacityWeight} kg · Insurance: ${truck.truck?.insuranceCoverage?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  <button onClick={e => { e.stopPropagation(); setShowDetails(showDetails === truck.id ? null : truck.id); }}
                    className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#345E85] hover:underline">
                    {showDetails === truck.id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    {['Owner / Truck', 'Score', 'Cost', 'Distance', 'Time', 'Rating', 'Features', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTrucks.map(truck => (
                    <tr key={truck.id} className={`hover:bg-slate-50/50 transition-colors ${selectedTruck?.id === truck.id ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-5 py-3">
                        <p className="font-black text-slate-900 text-xs">{truck.truckOwner?.name}</p>
                        <p className="text-[10px] text-slate-400">{truck.truck?.make} {truck.truck?.model}</p>
                      </td>
                      <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full border text-[9px] font-black ${getScoreColor(truck.score)}`}>{truck.score}%</span></td>
                      <td className="px-5 py-3 font-black text-slate-900 text-xs">${truck.estimatedCost?.toLocaleString()}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{truck.distance} mi</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{truck.estimatedTime}h</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{truck.driver?.rating} ★</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {truck.truck?.hasGpsTracking && <span className="text-[8px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-black">GPS</span>}
                          {truck.truck?.hasRefrigeration && <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black">Fridge</span>}
                          {truck.truck?.hasHazmatPermit && <span className="text-[8px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-black">Hazmat</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => setSelectedTruck(truck)} className="text-[10px] font-black uppercase tracking-widest text-[#345E85] hover:underline">Select</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Comparison View */}
          {viewMode === 'comparison' && (() => {
            const items = filteredTrucks.filter(t => compareList.includes(t.id));
            if (items.length === 0) return (
              <div className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                Check boxes in list view to compare up to 3 trucks
              </div>
            );
            const rows = [
              { label: 'Score', render: (t: MatchedTruck) => <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black ${getScoreColor(t.score)}`}>{t.score}%</span> },
              { label: 'Cost', render: (t: MatchedTruck) => <span className="font-black text-slate-900">${t.estimatedCost?.toLocaleString()}</span> },
              { label: 'Distance', render: (t: MatchedTruck) => `${t.distance} mi` },
              { label: 'Est. Time', render: (t: MatchedTruck) => `${t.estimatedTime}h` },
              { label: 'Driver Rating', render: (t: MatchedTruck) => `${t.driver?.rating} ★` },
              { label: 'Experience', render: (t: MatchedTruck) => `${t.driver?.experience} yrs` },
              { label: 'GPS', render: (t: MatchedTruck) => t.truck?.hasGpsTracking ? <FaCheck className="text-green-500 mx-auto" /> : <FaTimes className="text-red-400 mx-auto" /> },
              { label: 'Refrigeration', render: (t: MatchedTruck) => t.truck?.hasRefrigeration ? <FaCheck className="text-green-500 mx-auto" /> : <FaTimes className="text-red-400 mx-auto" /> },
              { label: 'Hazmat', render: (t: MatchedTruck) => t.truck?.hasHazmatPermit ? <FaCheck className="text-green-500 mx-auto" /> : <FaTimes className="text-red-400 mx-auto" /> },
            ];
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 w-32">Criteria</th>
                      {items.map(t => (
                        <th key={t.id} className="px-5 py-3 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-700">
                          {t.truckOwner?.name}<br /><span className="text-slate-400 font-bold normal-case">{t.truck?.make} {t.truck?.model}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map(row => (
                      <tr key={row.label} className="hover:bg-slate-50/30">
                        <td className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">{row.label}</td>
                        {items.map(t => <td key={t.id} className="px-5 py-3 text-center text-xs text-slate-700">{row.render(t)}</td>)}
                      </tr>
                    ))}
                    <tr>
                      <td className="px-5 py-3" />
                      {items.map(t => (
                        <td key={t.id} className="px-5 py-3 text-center">
                          <button onClick={() => setSelectedTruck(t)} className="px-4 py-2 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">Select</button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Confirm selection bar */}
          {selectedTruck && (
            <div className="px-6 py-4 border-t border-slate-100 bg-blue-50/50 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Selected</p>
                <p className="text-sm font-black text-slate-900">{selectedTruck.truckOwner?.name} · {selectedTruck.score}% match · ${selectedTruck.estimatedCost?.toLocaleString()}</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await enhancedMatchingApi.requestMatch(selectedCargoId, selectedTruck.id);
                    // res.data = { success, message, data: LoadMatch }
                    const matchId = res?.data?.data?.id || res?.data?.id || res?.id;
                    if (matchId) {
                      navigate(`/dashboard/accepted-matches`);
                    } else {
                      toast.error('Could not get match ID from server');
                    }
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || 'Failed to request match');
                  }
                }}
                className="px-6 py-3 bg-[#345E85] hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                Confirm Selection →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state after search */}
      {!loading && matchedTrucks.length === 0 && selectedCargoId && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
          <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center">
            <FaTruck className="text-slate-300 text-2xl" />
          </div>
          <p className="text-sm font-black text-slate-900 uppercase tracking-widest">No matches found</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs">
            No trucks matched your cargo requirements. Try a different cargo or check back later.
          </p>
          <button onClick={() => findMatches()} className="mt-2 px-5 py-2.5 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default CargoSmartMatching;
