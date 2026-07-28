import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Droplets, Fuel, X, Search, User, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import QuickActions from '../Widgets/QuickActions';

interface DashboardHeaderProps {
    onCreateClick?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onCreateClick }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    const handleLogout = () => {
        console.log('🔴 handleLogout called - starting logout process');
        setShowUserMenu(false);
        try {
            if (logout && typeof logout === 'function') {
                console.log('✅ Calling logout() from AuthContext');
                logout();
            } else {
                console.log('⚠️ Using fallback logout - clearing localStorage');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            }
            console.log('🔄 Navigating to /auth');
            navigate('/auth');
        } catch (error) {
            console.error('❌ Logout error:', error);
            navigate('/auth');
        }
    };

    return (
        <>
            {/* Marquee Alert Bar */}
            <div className="bg-[#0a101f] text-white py-2 overflow-hidden border-b border-white/5 fixed top-0 left-0 right-0 z-[301]">
                <div className="flex items-center animate-marquee whitespace-nowrap">
                    <div className="flex gap-16 items-center text-[11px] font-bold tracking-widest uppercase opacity-80">
                        <span className="flex items-center gap-2 text-amber-400">
                            <AlertTriangle size={14} /> Port Congestion: Lagos Apapa (3-day delay)
                        </span>
                        <span className="flex items-center gap-2">
                            <Droplets size={14} className="text-blue-400" /> Heavy Rain Alert: Accra-Lome Corridor
                        </span>
                        <span className="flex items-center gap-2 text-green-400">
                            <CheckCircle size={14} /> Border Clearance: Mombasa-Kampala operating normally
                        </span>
                        <span className="flex items-center gap-2 text-amber-400">
                            <Fuel size={14} /> Fuel Surcharge Update: +2% effective Nov 1st
                        </span>
                    </div>
                </div>
            </div>

            {/* Header Section - Dark Theme */}
            <div className="bg-[#0f172a] text-white fixed top-8 left-0 right-0 z-[300]">
                <header className="max-w-[1536px] mx-auto flex items-center justify-between px-4 md:px-8 lg:px-12 xl:px-20 py-5 border-b border-white/10">
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
                        <div className="flex items-center gap-3 cursor-pointer">
                            <div className="size-10 bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center rounded-xl shadow-lg shadow-teal-500/20">
                                <svg className="size-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                </svg>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black tracking-tighter text-white">UrutiX<span className="text-teal-400">.</span></h2>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-10">
                            <Link className="text-white text-sm font-bold relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-teal-500" to="/dashboard">Dashboard</Link>
                            <Link className="text-white/60 hover:text-white text-sm font-semibold transition-all" to="/dashboard/cargos">Shipments</Link>
                            <Link className="text-white/60 hover:text-white text-sm font-semibold transition-all" to="/dashboard/financing">Financing</Link>
                            <Link className="text-white/60 hover:text-white text-sm font-semibold transition-all" to="#">Wallet</Link>
                            <Link className="text-white/60 hover:text-white text-sm font-semibold transition-all" to="#">Reports</Link>
                        </nav>

                        {/* Search Bar */}
                        <div className="hidden xl:flex items-center relative ml-8 group">
                            <Search className="absolute left-3 text-white/40 group-focus-within:text-teal-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search cargo ID, route..."
                                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-12 text-sm text-white focus:outline-none focus:border-teal-500/50 w-64 transition-all"
                            />
                            <span className="absolute right-3 text-[10px] font-bold text-white/20 border border-white/10 rounded px-1.5 py-0.5">⌘K</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="hidden 2xl:flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-teal-400">🌿</span>
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Carbon Saver Tier 1</span>
                        </div>

                        <QuickActions onCreateClick={onCreateClick} />

                        <button className="p-2 text-white/60 hover:text-white transition-all relative">
                            <Bell size={24} />
                            <span className="absolute top-2 right-2 size-2 bg-teal-500 rounded-full border-2 border-[#0f172a]"></span>
                        </button>

                        {/* User Profile with Dropdown */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-3 pl-4 md:pl-6 border-l border-white/10 hover:opacity-80 transition-opacity cursor-pointer"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Kofi Annan'}</p>
                                    <p className="text-[9px] font-bold text-teal-400 uppercase tracking-widest">Premium Exporter</p>
                                </div>
                                <div className="size-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 border-2 border-white/20 shadow-inner overflow-hidden">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Kofi" alt="User" className="size-full" />
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
                                        <Link
                                            to="/dashboard/settings"
                                            onClick={() => setShowUserMenu(false)}
                                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2 mt-1"
                                        >
                                            <Settings size={16} />
                                            Profile Settings
                                        </Link>
                                        <Link
                                            to="/dashboard/settings"
                                            onClick={() => setShowUserMenu(false)}
                                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2"
                                        >
                                            <User size={16} />
                                            Account
                                        </Link>
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
                            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-white px-3 py-2 bg-white/5 rounded-lg">Dashboard</Link>
                            <Link to="/dashboard/cargos" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white px-3 py-2">Shipments</Link>
                            <Link to="/dashboard/financing" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white px-3 py-2">Financing</Link>
                            <Link to="#" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white px-3 py-2">Wallet</Link>
                            <Link to="#" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-white px-3 py-2">Reports</Link>
                        </nav>
                    </div>
                )}
            </div>
            <div className="h-[120px]" aria-hidden="true" />
        </>
    );
};

export default DashboardHeader;
