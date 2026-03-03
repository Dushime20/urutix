import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoUrutiX from '../assets/logo-urutix.svg';
import { useAuth } from '../contexts/AuthContext';
import { fleetApi } from '../services/fleetApi';
import toast from 'react-hot-toast';
import {
    FaSearch,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaTruck,
    FaBox,
    FaStar,
    FaChartLine
} from 'react-icons/fa';
import {
    Search,
    Bell,
    Settings,
    LogOut,
    Zap,
    X,
    CheckCircle,
    Droplets,
    Fuel
} from 'lucide-react';

const SmartBookingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PENDING'); // 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ALL'
    const [searchTerm, setSearchTerm] = useState('');

    // Header State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    // const maintenanceAlerts: any[] = []; // Removed unused variable

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await fleetApi.getBookingRequests();
            setBookings(data || []);
        } catch (error) {
            console.error('Error loading bookings:', error);
            toast.error('Failed to load booking requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (bookingId: string, action: 'accept' | 'reject') => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)), // Mock API call
            {
                loading: `${action === 'accept' ? 'Accepting' : 'Rejecting'} booking request...`,
                success: `Booking ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
                error: 'Action failed',
            }
        ).then(() => {
            // Optimistic update
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' } : b
            ));
        });
    };

    const filteredBookings = bookings.filter(b => {
        const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            b.load?.title?.toLowerCase().includes(searchLower) ||
            b.cargoOwner?.name?.toLowerCase().includes(searchLower) ||
            b.id.toLowerCase().includes(searchLower);
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleLogout = () => {
        if (logout) logout();
        navigate('/auth');
    };

    // --- Components ---

    const Header = () => (
        <>
            {/* Marquee Alert Bar */}
            <div className="bg-[#0a101f] text-white py-2 overflow-hidden border-b border-white/5">
                <div className="flex items-center animate-marquee whitespace-nowrap">
                    <div className="flex gap-16 items-center text-[11px] font-bold tracking-widest uppercase opacity-80">
                        <span className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle size={14} /> Fleet Health: All systems operational
                        </span>
                        <span className="flex items-center gap-2">
                            <Droplets size={14} className="text-blue-400" /> Weather Update: Heavy Rain Expected (Nairobi-Mombasa)
                        </span>
                        <span className="flex items-center gap-2 text-green-400">
                            <CheckCircle size={14} /> Border Status: Busia & Malaba operating normally
                        </span>
                        <span className="flex items-center gap-2 text-amber-400">
                            <Fuel size={14} /> Fuel Price: Diesel KES 210.00 (+2% effective Jan 15th)
                        </span>
                    </div>
                </div>
            </div>

            {/* Header Section - Dark Theme (matches Cargo Owner) */}
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

                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard/fleet')}>
                            <img src={logoUrutiX} alt="UrutiX Logistics Logo" className="h-14 md:h-20 w-auto object-contain py-1" />
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-10">
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet">Dashboard</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/trucks">Fleet</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/fleet-manager">Fleet Manager</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/drivers">Drivers</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/maintenance">Maintenance</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/bids">Load Board</a>
                            <a className="text-white text-sm font-bold relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-blue-500" href="/dashboard/fleet/smart-bookings">Bookings</a>
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
                            <span className="text-blue-400">🚛</span>
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Commander</span>
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
                            <span className="absolute top-2 right-2 size-2 bg-blue-500 rounded-full border-2 border-[#0f172a]"></span>
                        </button>

                        {/* User Profile with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-3 pl-4 md:pl-6 border-l border-white/10 hover:opacity-80 transition-opacity cursor-pointer"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName} ` : user?.email || 'Fleet Manager'}</p>
                                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Fleet Owner</p>
                                </div>
                                <div className="size-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 border-2 border-white/20 shadow-inner overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Fleet'}`} alt="User" className="size-full" />
                                </div >
                            </button >

                            {/* Dropdown Menu */}
                            {
                                showUserMenu && (
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
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    navigate('/dashboard/fleet/trucks');
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2"
                                            >
                                                <FaTruck size={16} />
                                                Manage Fleet
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
                                )
                            }
                        </div >
                    </div >
                </header >

                {/* Mobile Nav Menu */}
                {
                    isMobileMenuOpen && (
                        <div className="lg:hidden absolute top-[120px] left-0 right-0 bg-[#0f172a] border-b border-white/10 p-4 z-50 shadow-xl">
                            <nav className="flex flex-col space-y-3 text-sm font-semibold text-gray-400">
                                <a href="/dashboard/fleet" className="text-white px-3 py-2 bg-white/5 rounded-lg">Dashboard</a>
                                <a href="/dashboard/fleet/trucks" className="hover:text-white px-3 py-2">Fleet</a>
                                <a href="/fleet-manager" className="hover:text-white px-3 py-2">Fleet Manager</a>
                                <a href="/dashboard/fleet/drivers" className="hover:text-white px-3 py-2">Drivers</a>
                                <a href="/dashboard/fleet/maintenance" className="hover:text-white px-3 py-2">Maintenance</a>
                                <a href="/dashboard/fleet/bids" className="hover:text-white px-3 py-2">Load Board</a>
                                <a href="/dashboard/fleet/smart-bookings" className="text-white px-3 py-2 bg-white/5 rounded-lg">Bookings</a>
                                <a href="/dashboard/fleet/reports" className="hover:text-white px-3 py-2">Reports</a>
                            </nav>
                        </div>
                    )
                }
            </div >
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
                                <p className="text-[9px] font-black uppercase text-white tracking-widest">Systems Online</p>
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

                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">Requests</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage your booking requests</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/dashboard/fleet')}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <FaChartLine /> Dashboard
                        </button>
                    </div>
                </div>

                {/* Control Bar */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* Status Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['PENDING', 'ACCEPTED', 'REJECTED', 'ALL'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${statusFilter === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {tab.charAt(0) + tab.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by load, owner, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                        />
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading requests...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-2xl border-dashed">
                        <div className="bg-gray-50 p-6 rounded-full mb-4">
                            <FaBox className="text-gray-400 text-3xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No requests found</h3>
                        <p className="text-gray-500 mt-1">No booking requests match your current filters.</p>
                        <button
                            onClick={() => { setStatusFilter('ALL'); setSearchTerm(''); }}
                            className="mt-4 text-blue-600 font-bold hover:underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredBookings.map((booking) => (
                            <div key={booking.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                                {/* Header Stripe */}
                                <div className={`h-1.5 w-full ${booking.status === 'PENDING' ? 'bg-blue-500' :
                                    booking.status === 'ACCEPTED' ? 'bg-green-500' : 'bg-red-500'
                                    }`}></div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">
                                                ID: {booking.id}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-500">Price</div>
                                            <div className="text-xl font-black text-gray-900">
                                                ${booking.price?.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Load Details */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                            {booking.load?.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                            <FaStar className="text-yellow-400" />
                                            <span className="font-semibold text-gray-900">{booking.cargoOwner?.rating}</span>
                                            <span>•</span>
                                            <span>{booking.cargoOwner?.name}</span>
                                            {booking.cargoOwner?.verified && (
                                                <FaCheckCircle className="text-blue-500 ml-1" title="Verified Owner" />
                                            )}
                                        </div>

                                        {/* Route Visual */}
                                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                                                <div className="w-0.5 h-8 bg-gray-300"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div>
                                                    <div className="text-xs text-gray-500 font-semibold uppercase">Origin</div>
                                                    <div className="text-sm font-bold text-gray-900">{booking.load?.origin?.city}, {booking.load?.origin?.country}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 font-semibold uppercase">Destination</div>
                                                    <div className="text-sm font-bold text-gray-900">{booking.load?.destination?.city}, {booking.load?.destination?.country}</div>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col justify-between h-full py-1">
                                                <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                                    <FaClock /> {new Date(booking.load?.pickupDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Match Info */}
                                    <div className="flex items-center justify-between text-sm bg-blue-50 p-3 rounded-lg border border-blue-100 mb-6">
                                        <div className="flex items-center gap-2 text-blue-800">
                                            <div className="bg-blue-100 p-1.5 rounded text-blue-600">
                                                <FaTruck />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold opacity-70">Requested For</span>
                                                <span className="font-bold">{booking.requestedTruckPlate}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-semibold text-blue-600 opacity-70">Match</span>
                                            <span className="font-black text-blue-700 text-lg">{(booking.matchScore * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {booking.status === 'PENDING' ? (
                                        <div className="flex gap-3 mt-auto">
                                            <button
                                                onClick={() => handleAction(booking.id, 'reject')}
                                                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <FaTimesCircle /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleAction(booking.id, 'accept')}
                                                className="flex-1 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                            >
                                                <FaCheckCircle /> Accept
                                            </button>
                                        </div>
                                    ) : (
                                        <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 font-bold rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                                            {booking.status === 'ACCEPTED' ? (
                                                <><FaCheckCircle /> Accepted</>
                                            ) : (
                                                <><FaTimesCircle /> Rejected</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default SmartBookingsPage;
