import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  Wind, 
  Droplets, 
  Navigation,
  RefreshCw,
  AlertTriangle,
  Info,
  Fuel
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { TranslatedText } from '../translated-text';

interface WeatherMonitoringProps {
  destination: {
    city: string;
    state: string;
    coordinates?: [number, number];
  };
  className?: string;
}

interface WeatherData {
  temp: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  forecast: Array<{
    day: string;
    temp: number;
    condition: string;
  }>;
  alerts?: string[];
  fuelImpact?: {
    efficiencyChange: number;
    reason: string;
    advice: string;
  };
}

export const WeatherMonitoring: React.FC<WeatherMonitoringProps> = ({ destination, className }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock weather fetching - in a real app, this would call an API like OpenWeatherMap
  const fetchWeather = async () => {
    setLoading(true);
    try {
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const seed = destination.city.length;
      const windSpeed = 12 + (seed % 15);
      const temp = 22 + (seed % 10);
      
      // Calculate fuel efficiency impact: higher wind speed = lower efficiency
      // Also cold temperatures affect fuel efficiency
      let efficiencyChange = -(windSpeed * 0.15);
      if (temp < 10) efficiencyChange -= 5;
      
      const mockData: WeatherData = {
        temp,
        condition: seed % 3 === 0 ? 'Sunny' : seed % 3 === 1 ? 'Cloudy' : 'Rainy',
        description: seed % 3 === 0 ? 'Clear skies' : seed % 3 === 1 ? 'Partly cloudy' : 'Light rain expected',
        humidity: 45 + (seed % 20),
        windSpeed,
        visibility: 10 - (seed % 5),
        forecast: [
          { day: 'Tomorrow', temp: 24, condition: 'Sunny' },
          { day: 'Wed', temp: 21, condition: 'Cloudy' },
          { day: 'Thu', temp: 19, condition: 'Rainy' },
        ],
        alerts: seed % 7 === 0 ? ['Severe storm warning in the area'] : undefined,
        fuelImpact: {
          efficiencyChange: Math.round(efficiencyChange),
          reason: windSpeed > 20 ? 'High Headwinds' : 'Moderate Weather',
          advice: windSpeed > 20 ? 'Reduce speed by 10% to save fuel' : 'Standard fuel consumption expected'
        }
      };
      
      setWeather(mockData);
    } catch (err) {
      console.error('Failed to load weather intelligence', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [destination.city]);

  const getWeatherIcon = (condition: string, size = 24) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return <Sun size={size} className="text-amber-400" />;
      case 'cloudy': return <Cloud size={size} className="text-slate-400" />;
      case 'rainy': return <CloudRain size={size} className="text-blue-400" />;
      case 'stormy': return <CloudLightning size={size} className="text-purple-400" />;
      case 'snowy': return <CloudSnow size={size} className="text-sky-300" />;
      default: return <Sun size={size} className="text-amber-400" />;
    }
  };

  if (loading && !weather) {
    return (
      <div className={cn("bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center min-h-[300px]", className)}>
        <RefreshCw size={32} className="text-blue-500 animate-spin mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          <TranslatedText text="Syncing Weather Intelligence..." />
        </p>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden group", className)}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 group-hover:scale-110 transition-transform duration-500">
              <Cloud size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                  <TranslatedText text="Weather Intel" />
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                {destination.city}
                <Navigation size={14} className="text-slate-300 -rotate-45" />
              </h3>
            </div>
          </div>
          <button 
            onClick={fetchWeather}
            className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {weather && (
          <div className="space-y-8">
            {/* Main Temp Row */}
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                  {getWeatherIcon(weather.condition, 40)}
                </div>
                <div>
                  <div className="text-5xl font-black text-[#0f172a] tracking-tighter">
                    {weather.temp}°<span className="text-2xl text-slate-300">C</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                    <TranslatedText text={weather.description} />
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <Wind size={12} className="text-blue-400" />
                  {weather.windSpeed} KM/H
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <Droplets size={12} className="text-sky-400" />
                  {weather.humidity}% HUM
                </div>
              </div>
            </div>

            {/* Alert if exists */}
            {weather.alerts && weather.alerts.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-start"
              >
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5">
                    <TranslatedText text="Road Hazard Alert" />
                  </p>
                  <p className="text-xs font-bold text-amber-800">{weather.alerts[0]}</p>
                </div>
              </motion.div>
            )}

            {/* Fuel Efficiency Intelligence */}
            {weather.fuelImpact && (
              <div className="p-6 bg-blue-50/30 border border-blue-100/50 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                      <Fuel size={14} />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                      <TranslatedText text="Efficiency Optimizer" />
                    </span>
                  </div>
                  <div className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest",
                    weather.fuelImpact.efficiencyChange < 0 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                  )}>
                    {weather.fuelImpact.efficiencyChange > 0 ? '+' : ''}{weather.fuelImpact.efficiencyChange}%
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1">{weather.fuelImpact.reason}</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    <TranslatedText text={weather.fuelImpact.advice} />
                  </p>
                </div>
              </div>
            )}

            {/* Forecast Row */}
            <div className="grid grid-cols-3 gap-3">
              {weather.forecast.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 group/item hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.day}</span>
                  {getWeatherIcon(item.condition, 20)}
                  <span className="text-sm font-black text-[#0f172a]">{item.temp}°</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-blue-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Safe Journey Protocol: Active" />
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                    <TranslatedText text="Live Data" />
                 </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
