import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { FaBalanceScale, FaChartLine, FaHandshake, FaInfoCircle, FaBell, FaExclamationTriangle } from 'react-icons/fa';
import { getMarketRates, getCompetitorRates, getHistoricalRates, estimatePrice } from '../../services/pricingApi';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const PricingCalculatorWidget: React.FC = () => {
  const queryClient = useQueryClient();
  const [route, setRoute] = useState<string[]>([]);
  const [cargo, setCargo] = useState({ weight: '', volume: '', special: '' });
  const [season, setSeason] = useState('normal');
  const [price, setPrice] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number>(90);
  const [marketRates, setMarketRates] = useState<number[]>([]);
  const [historicalRates, setHistoricalRates] = useState<number[]>([]);
  const [competitorRates, setCompetitorRates] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [volatility, setVolatility] = useState<number>(0);
  const [demandIndex, setDemandIndex] = useState<number>(0);
  const [routePopularity, setRoutePopularity] = useState<number>(0);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [forecast, setForecast] = useState<number[]>([]);
  const [anomaly, setAnomaly] = useState<string>('');
  const [aiPrediction, setAiPrediction] = useState<number | null>(null);
  const [riskAlert, setRiskAlert] = useState<string>('');

  useEffect(() => {
    async function fetchRates() {
      setLoading(true);
      setMarketRates(await getMarketRates());
      setCompetitorRates(await getCompetitorRates());
      setHistoricalRates(await getHistoricalRates());
      setLoading(false);
    }
    fetchRates();

    // Real-time updates via WebSocket
    const socket: Socket = io('http://localhost:3001/pricing', { transports: ['websocket'] });
    socket.on('marketRates:update', (rates: number[]) => setMarketRates(rates));
    socket.on('competitorRates:update', (rates: number[]) => setCompetitorRates(rates));
    socket.on('historicalRates:update', (rates: number[]) => setHistoricalRates(rates));
    socket.on('volatility:update', (v: number) => setVolatility(v));
    socket.on('demandIndex:update', (d: number) => setDemandIndex(d));
    socket.on('routePopularity:update', (p: number) => setRoutePopularity(p));
    socket.on('notification', (msg: string) => setNotifications(n => [...n, msg]));
    socket.on('forecast:update', (f: number[]) => setForecast(f));
    socket.on('anomaly:update', (a: string) => setAnomaly(a));
    socket.on('aiPrediction:update', (p: number) => setAiPrediction(p));
    socket.on('riskAlert', (r: string) => setRiskAlert(r));
    return () => { socket.disconnect(); };
  }, []);

  // Advanced drag-and-drop route planning
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const loc = e.dataTransfer.getData('text/plain');
    if (loc) setRoute([...route, loc]);
  };
  const handleAddLocation = () => {
    const loc = prompt('Add location:');
    if (loc) setRoute([...route, loc]);
  };
  const handleRemoveLocation = (i: number) => {
    setRoute(route.filter((_, idx) => idx !== i));
  };

  // Custom pricing logic via backend
  const calculatePrice = async () => {
    setLoading(true);
    const payload = { route, cargo, season };
    const result = await estimatePrice(payload);
    setPrice(result.price);
    setConfidence(result.confidence);
    // Update KPIs and financials in real time
    queryClient.invalidateQueries({ queryKey: ['kpi'] });
    queryClient.invalidateQueries({ queryKey: ['financials'] });
    // Update disputes, audit logs, health, notifications
    queryClient.invalidateQueries({ queryKey: ['disputes'] });
    queryClient.invalidateQueries({ queryKey: ['audit'] });
    queryClient.invalidateQueries({ queryKey: ['health'] });
    // Optionally send notification event
    window.dispatchEvent(new CustomEvent('pricing:estimate', { detail: { price: result.price, route, cargo, season } }));
    setLoading(false);
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="font-bold mb-2 flex items-center gap-2">
        <FaBalanceScale /> Pricing Calculator
      </div>
      {notifications.length > 0 && (
        <div className="mb-2">
          {notifications.map((msg, i) => (
            <div key={i} className="flex items-center gap-2 text-blue-600"><FaBell /> {msg}</div>
          ))}
        </div>
      )}
      {riskAlert && (
        <div className="mb-2 flex items-center gap-2 text-red-600"><FaExclamationTriangle /> {riskAlert}</div>
      )}
      {anomaly && (
        <div className="mb-2 flex items-center gap-2 text-yellow-600"><FaExclamationTriangle /> {anomaly}</div>
      )}
      <div className="mb-4 flex gap-4 flex-wrap">
        <div onDragOver={handleDragOver} onDrop={handleDrop} className="border rounded p-2 min-w-[180px]">
          <div className="font-semibold">Route Planning (Drag locations here)</div>
          <ul className="mb-2">
            {route.map((loc, i) => (
              <li key={i} className="flex gap-2 items-center">
                <span>{loc}</span>
                <button className="text-xs text-red-600" onClick={() => handleRemoveLocation(i)}>Remove</button>
              </li>
            ))}
          </ul>
          <button className="bg-blue-600 text-white px-2 py-1 rounded text-xs" onClick={handleAddLocation}>Add Location</button>
        </div>
        <div>
          <div className="font-semibold">Cargo Specs</div>
          <input type="number" placeholder="Weight (kg)" className="border rounded px-2 py-1 mb-1 w-full" value={cargo.weight} onChange={e => setCargo({ ...cargo, weight: e.target.value })} />
          <input type="number" placeholder="Volume (m³)" className="border rounded px-2 py-1 mb-1 w-full" value={cargo.volume} onChange={e => setCargo({ ...cargo, volume: e.target.value })} />
          <input type="text" placeholder="Special requirements" className="border rounded px-2 py-1 w-full" value={cargo.special} onChange={e => setCargo({ ...cargo, special: e.target.value })} />
        </div>
        <div>
          <div className="font-semibold">Seasonal Adjustment</div>
          <select className="border rounded px-2 py-1 w-full" value={season} onChange={e => setSeason(e.target.value)}>
            <option value="normal">Normal</option>
            <option value="peak">Peak</option>
            <option value="off">Off-season</option>
          </select>
        </div>
      </div>
      <button className="bg-green-600 text-white px-4 py-2 rounded mb-4" onClick={calculatePrice} disabled={loading}>{loading ? 'Estimating...' : 'Estimate Price'}</button>
      {price !== null && (
        <div className="mb-4 p-2 bg-gray-50 rounded flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FaChartLine className="text-blue-600" />
            <span className="font-semibold">Estimated Price:</span> ${price.toFixed(2)}
            <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${confidence > 90 ? 'bg-green-100 text-green-800' : confidence > 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>Confidence: {confidence}%</span>
            {aiPrediction !== null && <span className="ml-2 text-purple-600">AI Predicted: ${aiPrediction.toFixed(2)}</span>}
          </div>
          <div className="flex gap-2 items-center">
            <FaInfoCircle className="text-gray-500" />
            <span>Market Rate: ${marketRates[marketRates.length - 1] || 0}</span>
            <span>Competitor Avg: ${competitorRates[competitorRates.length - 1] || 0}</span>
            <span className="text-green-600 font-semibold">Savings: ${Math.max(0, (competitorRates[competitorRates.length - 1] || 0) - (price || 0)).toFixed(2)}</span>
          </div>
          <div className="flex gap-4 mt-2">
            <span className="text-blue-600">Volatility: {volatility}%</span>
            <span className="text-purple-600">Demand Index: {demandIndex}</span>
            <span className="text-orange-600">Route Popularity: {routePopularity}</span>
          </div>
        </div>
      )}
      <div className="mb-4">
        <div className="font-semibold mb-1">Historical & Forecast Price Trends</div>
        <Line
          data={{
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
            datasets: [
              { label: 'Your Estimate', data: Array(9).fill(price || 0), borderColor: '#2563eb', fill: false },
              { label: 'Market', data: marketRates, borderColor: '#10b981', fill: false },
              { label: 'Competitor', data: competitorRates, borderColor: '#ef4444', fill: false },
              { label: 'Historical', data: historicalRates, borderColor: '#f59e42', fill: false },
              { label: 'Forecast', data: forecast, borderColor: '#a855f7', borderDash: [5,5], fill: false },
            ],
          }}
        />
      </div>
      <div className="mb-4">
        <div className="font-semibold mb-1">Negotiation Tools</div>
        <Bar
          data={{
            labels: ['Your Price', 'Market', 'Competitor'],
            datasets: [
              {
                label: 'Rates',
                data: [price || 0, marketRates[marketRates.length - 1] || 0, competitorRates[competitorRates.length - 1] || 0],
                backgroundColor: ['#2563eb', '#10b981', '#ef4444'],
              },
            ],
          }}
        />
      </div>
    </div>
  );
};

export default PricingCalculatorWidget;
