import { Truck, Package, MapPin, FileText, Phone, ChevronDown, Clock, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface ActiveShipmentsProps {
    cargos?: any[];
}

const ActiveShipments = ({ cargos = [] }: ActiveShipmentsProps) => {
    const [expandedID, setExpandedID] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedID(expandedID === id ? null : expandedID);
    };

    // Filter for active shipments (In Transit, Assigned, Published)
    // and map to display format
    const activeShipments = cargos
        .filter(c => ['IN_TRANSIT', 'ASSIGNED', 'PUBLISHED', 'PICKED_UP'].includes(c.status))
        .slice(0, 3) // Show top 3
        .map(c => ({
            id: c.id,
            origin: c.pickupLocation?.city || c.pickupLocation?.name || 'Unknown',
            destination: c.deliveryLocation?.city || c.deliveryLocation?.name || 'Unknown',
            status: c.status,
            statusColor: c.status === 'IN_TRANSIT' ? 'blue' : (c.status === 'PUBLISHED' ? 'amber' : 'green'),
            progress: c.status === 'IN_TRANSIT' ? 50 : (c.status === 'DELIVERED' ? 100 : 10),
            stages: [
                c.pickupLocation?.city || 'Origin',
                'In Transit',
                c.deliveryLocation?.city || 'Destination'
            ],
            eta: c.deliveryDate ? new Date(c.deliveryDate).toLocaleDateString() : 'TBD',
            driver: c.driver?.name || 'Unassigned',
            icon: c.cargoType === 'VEHICLES' ? Truck : Package
        }));

    // If no active shipments, show a placeholder or empty state
    const hasShipments = activeShipments.length > 0;

    return (
        <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl md:text-2xl font-black text-[#0f172a] tracking-tight">Active Shipments</h3>
                    {hasShipments && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {activeShipments.length} Live
                        </span>
                    )}
                </div>
                <Link to="/dashboard/cargos" className="text-teal-600 font-extrabold text-xs md:text-sm hover:underline flex items-center gap-1">
                    View All <ArrowRight size={14} />
                </Link>
            </div>

            <div className="space-y-4 md:space-y-6">
                {!hasShipments && (
                    <div className="text-center py-8 text-slate-400">
                        <Package size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No active shipments</p>
                        <Link to="/dashboard/cargos/create" className="text-teal-600 text-xs font-bold mt-2 inline-block hover:underline">
                            Create First Cargo
                        </Link>
                    </div>
                )}

                {activeShipments.map((shipment) => (
                    <div
                        key={shipment.id}
                        className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all group ${expandedID === shipment.id
                            ? 'border-teal-500 bg-teal-50/10 shadow-lg'
                            : 'border-slate-100 bg-slate-50/20 hover:bg-white hover:border-blue-200 hover:shadow-xl'
                            }`}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
                            <div className="flex items-center gap-4 md:gap-5 cursor-pointer" onClick={() => toggleExpand(shipment.id)}>
                                <div className={`size-12 md:size-14 rounded-xl md:rounded-2xl shadow-sm flex items-center justify-center border transition-colors ${expandedID === shipment.id ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-[#0f172a] border-slate-100 group-hover:border-blue-200'
                                    }`}>
                                    <shipment.icon size={24} className="md:w-7 md:h-7" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 md:gap-3 mb-1 flex-wrap">
                                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">UID: {shipment.id.slice(0, 8)}...</p>
                                        <span className={`bg-${shipment.statusColor}-50 text-${shipment.statusColor}-600 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                                            <span className={`size-1.5 md:size-2 rounded-full bg-${shipment.statusColor}-500 ${shipment.status === 'IN_TRANSIT' ? 'animate-pulse' : ''}`}></span> {shipment.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h4 className="font-extrabold text-lg md:text-xl text-[#0f172a]">
                                        {shipment.origin} <span className="text-teal-500 mx-1 md:mx-2">→</span> {shipment.destination}
                                    </h4>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="hidden md:block text-right mr-2">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ETA</p>
                                    <p className="text-sm font-black text-[#0f172a] flex items-center gap-1 justify-end">
                                        <Clock size={12} className="text-teal-500" /> {shipment.eta}
                                    </p>
                                </div>

                                {shipment.statusColor === 'blue' ? (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button className="px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-200 shadow-sm transition-all" title="Call Driver">
                                            <Phone size={16} />
                                        </button>
                                        <button className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white text-[10px] md:text-xs font-extrabold flex items-center gap-2 shadow-sm flex-1 sm:flex-initial justify-center hover:shadow-teal-500/20 hover:-translate-y-0.5 transition-all">
                                            <MapPin size={14} className="md:w-[18px] md:h-[18px]" /> Live Track
                                        </button>
                                    </div>
                                ) : (
                                    <Link to={`/dashboard/cargos`} className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-slate-200 text-slate-600 text-[10px] md:text-xs font-extrabold flex items-center gap-2 hover:bg-slate-50 w-full sm:w-auto justify-center transition-all">
                                        <FileText size={14} className="md:w-[18px] md:h-[18px]" /> Details
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative px-2 mt-2">
                            <div className="absolute top-1/2 left-2 right-2 h-1.5 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-${shipment.statusColor}-500 rounded-full shadow-[0_0_8px_rgba(${shipment.statusColor === 'blue' ? '20,184,166' : '245,158,11'},0.4)] relative`}
                                    style={{ width: `${shipment.progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                            <div className="relative z-10 flex justify-between">
                                <div className={`size-3 md:size-4 rounded-full bg-${shipment.statusColor}-500 ring-4 ring-white shadow-sm transition-transform hover:scale-125 cursor-help`}></div>
                                <div className={`size-3 md:size-4 rounded-full ${shipment.progress > 50 ? `bg-${shipment.statusColor}-500` : 'bg-slate-200'} ring-4 ring-white shadow-sm transition-transform hover:scale-125 cursor-help`}></div>
                                <div className="size-3 md:size-4 rounded-full bg-slate-200 ring-4 ring-white shadow-sm transition-transform hover:scale-125 cursor-help"></div>
                            </div>

                            {/* Expanded Details */}
                            <div className={`overflow-hidden transition-all duration-300 ${expandedID === shipment.id ? 'max-h-20 opacity-100 mt-4' : 'max-h-6 opacity-80 mt-3 md:mt-4'}`}>
                                <div className="flex justify-between">
                                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">{shipment.stages[0]}</span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-teal-600 uppercase text-center">{shipment.stages[1]}</span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-slate-300 uppercase text-right">{shipment.stages[2]}</span>
                                </div>
                                {expandedID === shipment.id && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 p-2 rounded-lg">
                                        <p className="text-[10px] text-slate-500">Driver: <span className="font-bold text-slate-700">{shipment.driver}</span></p>
                                        <p className="text-[10px] text-slate-500">Status: <span className="font-bold text-slate-700">{shipment.status}</span></p>
                                        <p className="text-[10px] text-slate-500">ID: <span className="font-bold text-slate-700">{shipment.id}</span></p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveShipments;
