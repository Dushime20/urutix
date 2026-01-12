import React, { useState, useEffect } from 'react';
import DispatchMap from '../components/Dispatch/DispatchMap';
import ActiveUnitsList from '../components/Dispatch/ActiveUnitsList';
import DispatchModal from '../components/Dispatch/DispatchModal';
import { toast } from 'react-hot-toast';
import { FaSearch, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { fleetApi, type FleetItem } from '../services/fleetApi';

// Internal Vehicle Interface for Dispatch View
interface Vehicle {
    id: string;
    name: string;
    status: 'moving' | 'idle' | 'offline';
    position: [number, number];
    speed?: number;
    driver?: string;
    destination?: string;
    eta?: string;
    location?: string;
}

const DispatchPage: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFleetData();
    }, []);

    const loadFleetData = async () => {
        setLoading(true);
        try {
            const trucks: FleetItem[] = await fleetApi.getTrucks();

            // Map FleetItem to Dispatch Vehicle format
            const mappedVehicles: Vehicle[] = trucks.map(t => {
                // Determine internal status
                let status: Vehicle['status'] = 'offline';
                if (t.status === 'IN_TRANSIT') status = 'moving';
                else if (t.status === 'AVAILABLE') status = 'idle';

                // Extract lat/lng or use defaults/mock based on known IDs for demo
                // In real app, t.currentLocation would provide { lat, lng }
                let pos: [number, number] = [39.8283, -98.5795]; // Center US
                if (t.currentLocation?.lat && t.currentLocation?.lng) {
                    pos = [t.currentLocation.lat, t.currentLocation.lng];
                } else {
                    // Spread them out randomly for demo visualization if no location data
                    pos = [
                        35 + Math.random() * 10,
                        -100 + Math.random() * 20
                    ];
                }

                return {
                    id: t.id,
                    name: t.plateNumber,
                    status: status,
                    position: pos,
                    speed: t.status === 'IN_TRANSIT' ? 65 : 0,
                    driver: t.assignedDrivers?.[0]?.driverName || 'Unassigned',
                    destination: t.assignedRoutes?.[0]?.routeName || 'Unknown', // Show active route name/dest
                    location: 'Unknown' // API doesn't give reverse geocoded address yet
                };
            });

            setVehicles(mappedVehicles);
        } catch (error) {
            console.error('Error loading fleet data:', error);
            toast.error('Failed to load fleet status');
        } finally {
            setLoading(false);
        }
    };

    const handleVehicleSelect = (id: string) => {
        setSelectedVehicleId(id);
    };

    const handleNewDispatch = async (data: any) => {
        console.log('New Dispatch Request:', data);
        const toastId = toast.loading('Creating dispatch...');

        try {
            // 1. Create Route
            const newRoute = await fleetApi.createRoute({
                name: `Trip to ${data.destination}`,
                origin: data.origin,
                destination: data.destination,
                status: 'active',
                description: data.notes
            });

            // 2. Assign Route to Truck
            if (data.truckId) {
                await fleetApi.assignRouteToTruck(data.truckId, newRoute.id);
            }

            // 3. Assign Driver to Truck (if not already assigned, or enforce override)
            if (data.driverId) {
                try {
                    await fleetApi.assignDriverToTruck(data.truckId, data.driverId);
                } catch (e) {
                    console.warn('Driver might already be assigned', e);
                }
            }

            toast.success(`Dispatch created for ${data.destination}`, { id: toastId });

            // Refresh data to show changes
            loadFleetData();

        } catch (error) {
            console.error('Dispatch failed:', error);
            toast.error('Failed to create dispatch', { id: toastId });
        }
    };

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50">
            {/* Header Section - Matches NewFleetManager */}
            <div className="relative z-50 bg-[#0f172a] border-b border-[#1e293b] shadow-2xl">
                <header className="max-w-[1920px] mx-auto flex items-center justify-between px-4 md:px-8 lg:px-12 xl:px-20 py-5 border-b border-white/10">
                    <div className="flex items-center gap-4 md:gap-10">
                        {/* Logo */}
                        <a href="/dashboard/fleet" className="flex items-center gap-3 cursor-pointer">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center rounded-xl shadow-lg shadow-blue-500/20">
                                <span className="material-symbols-outlined text-white text-xl">local_shipping</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black tracking-tighter text-white">UrutiX<span className="text-blue-400">.</span></h2>
                        </a>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-10">
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet">Dashboard</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/fleet-manager">Fleet Assets</a>
                            <a className="text-white text-sm font-bold relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-blue-500" href="/dashboard/fleet/dispatch">Dispatch</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/bids">Load Board</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/smart-bookings">Smart Bookings</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/reports">Reports</a>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Fleet Status Badge */}
                        <div className="hidden 2xl:flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-blue-400">⚡</span>
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Live Operations</span>
                        </div>

                        {/* Notification Bell */}
                        <button className="p-2 text-white/60 hover:text-white transition-all relative">
                            <span className="material-symbols-outlined text-2xl">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0f172a]"></span>
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-white/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white">Alex Morgan</p>
                                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Ops Manager</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 border-2 border-white/20 shadow-inner overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fleet" alt="User" className="w-full h-full" />
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar */}
                {loading ? (
                    <div className="w-96 h-full bg-white flex items-center justify-center border-r border-slate-200 z-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-slate-500 font-medium">Loading Fleet Status...</p>
                        </div>
                    </div>
                ) : (
                    <ActiveUnitsList
                        vehicles={vehicles}
                        onSelectVehicle={handleVehicleSelect}
                        onNewDispatch={() => setShowDispatchModal(true)}
                    />
                )}

                {/* Map Area */}
                <div className="flex-1 relative bg-slate-200">
                    <DispatchMap
                        vehicles={vehicles}
                        selectedVehicleId={selectedVehicleId}
                        onVehicleSelect={handleVehicleSelect}
                    />

                    {/* Search Overlay on Map */}
                    <div className="absolute top-4 left-4 z-[400] w-96 max-w-full">
                        <div className="bg-white rounded-xl shadow-lg p-1 flex items-center">
                            <FaSearch className="text-slate-400 ml-3" />
                            <input
                                type="text"
                                placeholder="Search ID, Driver, or Location"
                                className="w-full px-3 py-2 outline-none text-sm text-slate-700"
                            />
                        </div>
                    </div>

                    {/* Right-side Map Controls (Zoom etc) - Leaflet handles this usually, but we can add custom ones */}
                    <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                        <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:text-blue-600 font-bold text-xl transition-colors">+</button>
                        <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:text-blue-600 font-bold text-xl transition-colors">-</button>
                        <div className="h-2"></div>
                        <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors">
                            <FaMapMarkerAlt />
                        </button>
                    </div>

                    {/* Route Replay Overlay (Bottom) */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-xl z-[400] flex items-center gap-6 w-[600px] max-w-[90%]">
                        <div className="flex items-center gap-3">
                            <button className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-sm">history</span>
                            </button>
                            <div>
                                <p className="text-xs font-bold text-slate-800">Route Replay</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Active Vehicle: {selectedVehicleId ? vehicles.find(v => v.id === selectedVehicleId)?.name : 'Select Unit'}</p>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center gap-3">
                            <span className="text-[10px] font-medium text-slate-500">08:00 AM</span>
                            <div className="flex-1 h-1 bg-slate-200 rounded-full relative group cursor-pointer">
                                <div className="absolute top-0 left-0 h-full w-[60%] bg-blue-600 rounded-full"></div>
                                <div className="absolute top-1/2 left-[60%] -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-sm group-hover:scale-110 transition-transform"></div>
                            </div>
                            <span className="text-[10px] font-medium text-slate-500">14:20 PM</span>
                        </div>
                    </div>

                    {/* Deviation Alert Toast (Mock) */}
                    <div className="absolute bottom-24 right-6 bg-white rounded-xl shadow-xl z-[400] p-4 flex items-start gap-4 animate-in slide-in-from-right duration-500 w-80 border-l-4 border-amber-500">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">Route Deviation Alert</h4>
                            <p className="text-xs text-slate-500 mt-1">Vehicle VX-4412 left geofence G-12</p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                            <FaTimes />
                        </button>
                    </div>
                </div>
            </div>

            {/* Dispatch Modal */}
            <DispatchModal
                isOpen={showDispatchModal}
                onClose={() => setShowDispatchModal(false)}
                onSubmit={handleNewDispatch}
            />
        </div>
    );
};

export default DispatchPage;
