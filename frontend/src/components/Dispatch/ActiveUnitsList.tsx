import React, { useState } from 'react';
import { FaSearch, FaCircle, FaGasPump, FaPlus } from 'react-icons/fa';

interface Vehicle {
    id: string;
    name: string;
    status: 'moving' | 'idle' | 'offline';
    speed?: number;
    driver?: string;
    eta?: string;
    location?: string;
    destination?: string;
}

interface ActiveUnitsListProps {
    vehicles: Vehicle[];
    onSelectVehicle: (id: string) => void;
    onNewDispatch: () => void;
}

const ActiveUnitsList: React.FC<ActiveUnitsListProps> = ({ vehicles, onSelectVehicle, onNewDispatch }) => {
    const [filter, setFilter] = useState<'all' | 'moving' | 'idle'>('all');
    const [search, setSearch] = useState('');

    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
            v.driver?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || v.status === filter;
        return matchesSearch && matchesFilter;
    });

    const counts = {
        moving: vehicles.filter(v => v.status === 'moving').length,
        idle: vehicles.filter(v => v.status === 'idle').length
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200 w-96 shadow-xl z-20">
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Active Units</h2>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                        {vehicles.length} TOTAL
                    </span>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter dispatch queue..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('moving')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${filter === 'moving' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <FaCircle className="text-[6px] text-emerald-500" />
                        Moving ({counts.moving})
                    </button>
                    <button
                        onClick={() => setFilter('idle')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${filter === 'idle' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <FaCircle className="text-[6px] text-amber-500" />
                        Idle ({counts.idle})
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filteredVehicles.map(vehicle => (
                    <div
                        key={vehicle.id}
                        onClick={() => onSelectVehicle(vehicle.id)}
                        className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{vehicle.name}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                    {vehicle.driver || 'No Driver'}
                                </p>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${vehicle.status === 'moving' ? 'bg-emerald-100 text-emerald-700' :
                                vehicle.status === 'idle' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                {vehicle.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Velocity</p>
                                <p className="text-sm font-medium text-slate-700">{vehicle.speed || 0} mph</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                                    {vehicle.destination ? `ETA (${vehicle.destination.split(',')[0]})` : 'Location'}
                                </p>
                                <p className="text-sm font-medium text-slate-700">{vehicle.eta || 'N/A'}</p>
                            </div>
                        </div>

                        {vehicle.status === 'idle' && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                <FaGasPump />
                                <span className="font-medium">Refueling at Station #401</span>
                            </div>
                        )}
                    </div>
                ))}

                {filteredVehicles.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        No vehicles found matching your filters.
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                    onClick={onNewDispatch}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold shadow-sm transition-all active:scale-[0.98]"
                >
                    <FaPlus /> New Dispatch Trip
                </button>
            </div>
        </div>
    );
};

export default ActiveUnitsList;
