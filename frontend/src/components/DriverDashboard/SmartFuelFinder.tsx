import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Droplets, 
  DollarSign, 
  Zap,
  Search,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Station {
  id: string;
  name: string;
  address: string;
  distance: string;
  price: number;
  fuelType: string;
  isCheapest?: boolean;
  isNearest?: boolean;
}

export const SmartFuelFinder: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const stations: Station[] = [
    { 
      id: '1', 
      name: 'TotalEnergies Highway', 
      address: 'Plot 45, Gulu Highway', 
      distance: '1.2 km', 
      price: 1.42, 
      fuelType: 'Diesel Pro',
      isNearest: true 
    },
    { 
      id: '2', 
      name: 'Shell Express North', 
      address: 'North Rd, Entebbe', 
      distance: '3.5 km', 
      price: 1.38, 
      fuelType: 'Diesel',
      isCheapest: true 
    },
    { 
      id: '3', 
      name: 'Petrocity Terminal', 
      address: 'Jinja Rd, Kampala', 
      distance: '5.1 km', 
      price: 1.45, 
      fuelType: 'Diesel Pro' 
    },
    { 
      id: '4', 
      name: 'Stabex Station', 
      address: 'Bombo Rd, Kawempe', 
      distance: '7.8 km', 
      price: 1.40, 
      fuelType: 'Diesel' 
    }
  ];

  const handleNavigate = (station: Station) => {
    const query = encodeURIComponent(`${station.name} ${station.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
              <Droplets size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Logistics AI</p>
              <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">Smart Fuel Finder</h3>
           </div>
        </div>
        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
            <Zap size={14} fill="currentColor" />
            Live Prices
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input 
            type="text" 
            placeholder="Search stations or cities..."
            className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {stations.map((station) => (
          <motion.div
            key={station.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 hover:border-blue-100 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-[#0f172a] uppercase tracking-tight">{station.name}</h4>
                    {station.isCheapest && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded">Cheapest</span>
                    )}
                    {station.isNearest && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded">Nearest</span>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <MapPin size={10} />
                    {station.address}
                  </p>
               </div>
               <div className="text-right">
                  <div className="flex items-center justify-end text-emerald-600 mb-1">
                     <DollarSign size={14} />
                     <span className="text-xl font-black tracking-tighter">{station.price.toFixed(2)}</span>
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">PER GALLON</p>
               </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Distance</span>
                        <span className="text-xs font-black text-[#0f172a] uppercase">{station.distance}</span>
                    </div>
                    <div className="flex flex-col border-l border-slate-200 pl-4">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Type</span>
                        <span className="text-xs font-black text-blue-500 uppercase">{station.fuelType}</span>
                    </div>
                </div>
                
                <button 
                  onClick={() => handleNavigate(station)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-[#0f172a] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:bg-[#345E85] group-hover:text-white group-hover:border-[#345E85] transition-all shadow-sm"
                >
                    Navigate
                    <Navigation size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
         <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
            <CheckCircle2 size={16} />
         </div>
         <p className="text-[10px] font-bold text-emerald-700 italic">
            UrutiX Fleet Cards are accepted at all listed locations.
         </p>
      </div>
    </div>
  );
};
