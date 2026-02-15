import React, { useState, useEffect } from 'react';
import { FaPlus, FaFilter, FaSearch, FaTools, FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MaintenanceSchedulerModal from '../components/FleetDashboard/Maintenance/MaintenanceSchedulerModal';
import MaintenanceHistoryTable from '../components/FleetDashboard/Maintenance/MaintenanceHistoryTable';
import MaintenanceStatsCards from '../components/FleetDashboard/Maintenance/MaintenanceStatsCards';
import { fleetApi } from '../services/fleetApi';
import toast from 'react-hot-toast';
import logoUrutiX from '../assets/logo-urutix.svg';
import {
    Zap,
    Bell,
    Search,
    X,
    Settings,
    LogOut,
    CheckCircle,
    Droplets,
    Fuel
} from 'lucide-react';

const MaintenancePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Header State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // State
    const [loading, setLoading] = useState(true);
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
    const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalCost: 0,
        activeRepairs: 0,
        upcomingServices: 0,
        healthScore: 85 // Mock baseline
    });

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // In a real app, we'd have a specific endpoint for all fleet maintenance
            // For now, we might need to iterate trucks or use a new endpoint if available
            // Let's assume we can get alerts and use that as a proxy for active stuff, 
            // but for full history, we really need a proper endpoint.
            // Since we implemented `fleetApi.getMaintenanceHistory(truckId)`, we would need to call it for all trucks.
            // To simulate a "Fleet Wide" view efficiently, we will mock the aggregation or assume backend support.

            // Checking fleetApi again... 
            // It has `getMaintenanceHistory(truckId)`. It does NOT have `getAllMaintenance()`.
            // Strategy: Get all trucks, then fetch maintenance for each (parallel).

            const trucks = await fleetApi.getTrucks();
            const maintenancePromises = trucks.map(truck =>
                fleetApi.getMaintenanceHistory(truck.id).then(records =>
                    records.map(r => ({ ...r, truckId: truck.id, plateNumber: truck.plateNumber }))
                )
            );

            const results = await Promise.all(maintenancePromises);
            const allRecords = results.flat();

            // Calculate Stats
            const totalCost = allRecords.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
            const activeRepairs = allRecords.filter(r => ['IN_PROGRESS', 'SCHEDULED'].includes(r.status)).length;
            const upcomingServices = allRecords.filter(r => r.status === 'SCHEDULED').length;

            // Simple mock health score based on active repairs
            // Fewer active repairs = higher score
            const healthScore = Math.max(0, 100 - (activeRepairs * 5));

            setMaintenanceRecords(allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setStats({
                totalCost,
                activeRepairs,
                upcomingServices,
                healthScore
            });

        } catch (error) {
            console.error('Error loading maintenance data:', error);
            toast.error('Failed to load maintenance data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        loadData();
    };

    const handleDelete = async (id: string, truckId: string) => {
        if (!window.confirm('Are you sure you want to delete this maintenance record?')) return;

        try {
            await fleetApi.deleteMaintenance(truckId, id);
            toast.success('Record deleted');
            loadData();
        } catch (error) {
            console.error('Error deleting record:', error);
            toast.error('Failed to delete record');
        }
    };

    const handleView = (record: any) => {
        // Implement view details logic (e.g., open a modal)
        console.log('View', record);
        toast('View details implemented soon', { icon: 'ℹ️' });
    };

    const handleEdit = (record: any) => {
        // Implement edit logic
        console.log('Edit', record);
        toast('Edit feature implemented soon', { icon: 'ℹ️' });
    };

    const handleLogout = () => {
        if (logout) logout();
        navigate('/auth');
    };

    // Filter Logic
    const filteredRecords = maintenanceRecords.filter(record => {
        const matchesSearch =
            record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.vendor?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const Header = () => (
        <>
            {/* Marquee Alert Bar */}
            <div className="bg-[#0a101f] text-white py-2 overflow-hidden border-b border-white/5">
                <div className="flex items-center animate-marquee whitespace-nowrap">
                    <div className="flex gap-16 items-center text-[11px] font-bold tracking-widest uppercase opacity-80">
                        <span className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle size={14} /> Fleet Health: {stats.healthScore}% Operational
                        </span>
                        <span className="flex items-center gap-2 text-amber-400">
                            <FaTools size={14} /> Active Repairs: {stats.activeRepairs} vehicles
                        </span>
                        <span className="flex items-center gap-2 text-blue-400">
                            <Droplets size={14} /> Maintenance Due: {stats.upcomingServices} vehicles
                        </span>
                    </div>
                </div>
            </div>

            {/* Header Section - Dark Theme */}
            <div className="bg-[#0f172a] text-white">
                <header className="max-w-[1920px] mx-auto flex items-center justify-between px-4 md:px-8 lg:px-12 xl:px-20 py-5 border-b border-white/10">
                    <div className="flex items-center gap-4 md:gap-10">
                        {/* Mobile Menu Toggle */}
                        <button
                            className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>

                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard/fleet')}>
                            <img src={logoUrutiX} alt="UrutiX Logistics Logo" className="h-14 md:h-20 w-auto object-contain py-1" />
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-10">
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet">Dashboard</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/trucks">Fleet</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/fleet-manager">Fleet Manager</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/drivers">Drivers</a>
                            <a className="text-white text-sm font-bold relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-blue-500" href="/dashboard/fleet/maintenance">Maintenance</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/bids">Load Board</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/smart-bookings">Smart Bookings</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/reports">Reports</a>
                        </nav>

                        {/* Search Bar */}
                        <div className="hidden xl:flex items-center relative ml-8 group">
                            <Search className="absolute left-3 text-white/40 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search trucks, drivers, IDs..."
                                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-12 text-sm text-white focus:outline-none focus:border-blue-500/50 w-64 transition-all"
                            />
                            <span className="absolute right-3 text-[10px] font-bold text-white/20 border border-white/10 rounded px-1.5 py-0.5">⌘K</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Fleet Status Badge */}
                        <div className="hidden 2xl:flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-blue-400">🛡️</span>
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Maintenance Mode</span>
                        </div>

                        {/* Quick Actions Button */}
                        <button
                            onClick={() => navigate('/dashboard/fleet/dispatch')}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
                        >
                            <Zap size={16} /> Dispatch
                        </button>

                        {/* Notification Bell */}
                        <button className="p-2 text-white/60 hover:text-white transition-all relative">
                            <Bell size={24} />
                            {stats.upcomingServices > 0 && (
                                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
                            )}
                        </button>

                        {/* User Profile with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-3 pl-4 md:pl-6 border-l border-white/10 hover:opacity-80 transition-opacity cursor-pointer"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Fleet Manager'}</p>
                                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Fleet Owner</p>
                                </div>
                                <div className="size-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 border-2 border-white/20 shadow-inner overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Fleet'}`} alt="User" className="size-full" />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e293b] rounded-lg shadow-2xl border border-white/10 z-[9999] overflow-hidden">
                                    <div className="p-2">
                                        <div className="px-3 py-2 border-b border-white/10">
                                            <div className="text-sm font-semibold text-white">
                                                {user?.firstName && user?.lastName
                                                    ? `${user.firstName} ${user.lastName}`
                                                    : user?.firstName || user?.email || 'User'
                                                }
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                navigate('/dashboard/fleet/settings');
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2 mt-1"
                                        >
                                            <Settings size={16} />
                                            Profile Settings
                                        </button>
                                        <div className="border-t border-white/10 my-1"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile Nav Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden absolute top-[120px] left-0 right-0 bg-[#0f172a] border-b border-white/10 p-4 z-50 shadow-xl">
                        <nav className="flex flex-col space-y-3 text-sm font-semibold text-gray-400">
                            <a href="/dashboard/fleet" className="hover:text-white px-3 py-2">Dashboard</a>
                            <a href="/dashboard/fleet/trucks" className="hover:text-white px-3 py-2">Fleet</a>
                            <a href="/fleet-manager" className="hover:text-white px-3 py-2">Fleet Manager</a>
                            <a href="/dashboard/fleet/drivers" className="hover:text-white px-3 py-2">Drivers</a>
                            <a href="/dashboard/fleet/maintenance" className="text-white px-3 py-2 bg-white/5 rounded-lg">Maintenance</a>
                            <a href="/dashboard/fleet/bids" className="hover:text-white px-3 py-2">Load Board</a>
                            <a href="/dashboard/fleet/smart-bookings" className="hover:text-white px-3 py-2">Smart Bookings</a>
                            <a href="/dashboard/fleet/reports" className="hover:text-white px-3 py-2">Reports</a>
                        </nav>
                    </div>
                )}
            </div>
        </>
    );

    const Footer = () => (
        <footer className="bg-[#0a101f] text-white pt-16 md:pt-20 pb-8 md:pb-10 border-t border-white/5">
            <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center md:text-left">
                            © 2026 UrutiX Technologies Inc. All Rights Reserved.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase text-white tracking-widest">Maintenance System Online</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc]">
            <Header />

            <main className="flex-1 px-4 md:px-8 lg:px-12 xl:px-20 py-8 max-w-[1536px] mx-auto w-full">
                {/* Header Actions Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Fleet Maintenance</h1>
                        <p className="text-slate-500 mt-1 font-medium">Manage service schedules, repairs, and maintenance history</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <button
                            onClick={() => setIsSchedulerOpen(true)}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                        >
                            <FaPlus className="mr-2" />
                            Schedule Service
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <MaintenanceStatsCards stats={stats} loading={loading} />

                {/* Filters & Actions */}
                <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm mt-8">
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-72 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search vehicle, service, or vendor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 block w-full border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 bg-slate-50 hover:bg-white transition-colors"
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaFilter className="text-slate-400" />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-10 block w-full border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 bg-slate-50 hover:bg-white transition-colors appearance-none pr-8 cursor-pointer font-medium text-slate-600"
                            >
                                <option value="ALL">All Status</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <MaintenanceHistoryTable
                    records={filteredRecords}
                    loading={loading}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={(id) => {
                        // Find truckId for the record
                        const record = maintenanceRecords.find(r => r.id === id);
                        if (record) handleDelete(id, record.truckId);
                    }}
                />

                {/* Modals */}
                <MaintenanceSchedulerModal
                    isOpen={isSchedulerOpen}
                    onClose={() => setIsSchedulerOpen(false)}
                    onSuccess={handleCreateSuccess}
                />
            </main>

            <Footer />
        </div>
    );
};

export default MaintenancePage;
