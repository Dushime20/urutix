import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Bell,
    ChevronDown,
    HelpCircle,
    LayoutDashboard,
    Truck,
    Settings,
    LogOut,
    User,
    Menu,
    X,
    Layers,
    DollarSign
} from 'lucide-react';
import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';

interface FleetHeaderProps {
    maintenanceAlerts?: any[];
}

export const FleetHeader: React.FC<FleetHeaderProps> = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Dropdown states
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);

    const isActive = (path: string) => location.pathname === path;
    const isSectionActive = (paths: string[]) => paths.some(path => location.pathname.startsWith(path));

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        try {
            if (logout) logout();
            else {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
            }
            navigate('/auth');
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/auth');
        }
    };

    const NavDropdown = ({ title, icon: Icon, paths, children }: { title: string, icon: any, paths: string[], children: React.ReactNode }) => {
        const isOpen = activeDropdown === title;
        const active = isSectionActive(paths);

        return (
            <div className="relative group">
                <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200
            ${active || isOpen ? 'text-[#345E85] bg-blue-50/50' : 'text-slate-600 hover:text-[#345E85] hover:bg-slate-50'}
          `}
                    onClick={() => setActiveDropdown(isOpen ? null : title)}
                >
                    <Icon size={18} className={active || isOpen ? 'text-[#345E85]' : 'text-slate-400 group-hover:text-[#345E85]'} />
                    <span>{title}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    const DropdownItem = ({ to, label }: { to: string, label: string }) => (
        <button
            onClick={() => {
                navigate(to);
                setActiveDropdown(null);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${isActive(to) ? 'bg-blue-50 text-[#345E85]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
      `}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white border-b border-gray-200 text-gray-900 px-4 pt-6 pb-3 sm:px-6 sm:pt-8 sm:pb-4 sticky top-0 z-[100] shadow-sm">
            <header className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 flex items-center justify-between">

                {/* Logo Section */}
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard/fleet')}>
                        <img src={logoUrutiX} alt="UrutiX" className="h-10 w-auto object-contain" />
                    </div>

                    {/* Desktop Navigation */}
                    <nav ref={navRef} className="hidden lg:flex items-center gap-2">

                        {/* Dashboard Link */}
                        <button
                            onClick={() => navigate('/dashboard/fleet')}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-200
                ${location.pathname === '/dashboard/fleet'
                                    ? 'bg-blue-50 text-[#345E85] shadow-sm ring-1 ring-blue-100'
                                    : 'text-slate-500 hover:text-[#345E85] hover:bg-slate-50'}
              `}
                        >
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </button>

                        {/* Fleet Management Dropdown */}
                        <NavDropdown
                            title="Fleet Management"
                            icon={Truck}
                            paths={['/dashboard/fleet/trucks', '/dashboard/fleet/drivers', '/dashboard/fleet/maintenance', '/dashboard/fleet/fuel']}
                        >
                            <DropdownItem to="/dashboard/fleet/trucks" label="Fleet Assets" />
                            <DropdownItem to="/dashboard/fleet/drivers" label="Drivers" />
                            <DropdownItem to="/dashboard/fleet/maintenance" label="Maintenance" />
                            <DropdownItem to="/dashboard/fleet/fuel" label="Fuel Management" />
                        </NavDropdown>

                        {/* Operations Dropdown */}
                        <NavDropdown
                            title="Operations"
                            icon={Layers}
                            paths={['/dashboard/fleet/bids', '/dashboard/fleet/smart-bookings', '/dashboard/fleet/dispatch', '/dashboard/fleet/routes']}
                        >
                            <DropdownItem to="/dashboard/fleet/bids" label="Load Board" />
                            <DropdownItem to="/dashboard/fleet/smart-bookings" label="Smart Bookings" />
                            <DropdownItem to="/dashboard/fleet/dispatch" label="Dispatch & Trips" />
                            <DropdownItem to="/dashboard/fleet/routes" label="Route Planning" />
                        </NavDropdown>

                        {/* Financial Dropdown */}
                        <NavDropdown
                            title="Financial"
                            icon={DollarSign}
                            paths={['/dashboard/fleet/reports', '/dashboard/fleet/financial']}
                        >
                            <DropdownItem to="/dashboard/fleet/reports" label="Financial Reports" />
                            <DropdownItem to="/dashboard/fleet/financial" label="Payments & Invoices" />
                            <DropdownItem to="/dashboard/fleet/analytics" label="Analytics" />
                        </NavDropdown>

                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">

                    {/* Notifications */}
                    <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all relative group">
                        <Bell size={20} />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
                    </button>

                    {/* Help Button */}
                    <button
                        onClick={() => navigate('/dashboard/fleet/support')}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 text-xs font-black uppercase tracking-widest hover:border-[#345E85] hover:text-[#345E85] transition-all"
                    >
                        <HelpCircle size={16} />
                        <span>Help</span>
                    </button>

                    {/* User Profile */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="h-10 w-10 rounded-full bg-[#1e293b] text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm ring-2 ring-white"
                        >
                            <User size={20} />
                        </button>

                        {/* Profile Dropdown */}
                        {showUserMenu && (
                            <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-3 border-b border-slate-50 mb-2">
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                        {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Fleet Manager'}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>

                                <button
                                    onClick={() => navigate('/dashboard/fleet/settings')}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-3 transition-colors"
                                >
                                    <Settings size={16} /> Settings
                                </button>
                                <div className="h-px bg-slate-50 my-2" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"
                                >
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden p-2 text-slate-600"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-slate-100 bg-white absolute w-full left-0 shadow-lg py-4 px-4 flex flex-col gap-2">
                    <DropdownItem to="/dashboard/fleet" label="Dashboard" />
                    <div className="h-px bg-slate-100 my-1" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 py-2">Fleet</p>
                    <DropdownItem to="/dashboard/fleet/trucks" label="Fleet Assets" />
                    <DropdownItem to="/dashboard/fleet/drivers" label="Drivers" />
                    <DropdownItem to="/dashboard/fleet/maintenance" label="Maintenance" />
                    <div className="h-px bg-slate-100 my-1" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 py-2">Operations</p>
                    <DropdownItem to="/dashboard/fleet/bids" label="Load Board" />
                    <DropdownItem to="/dashboard/fleet/dispatch" label="Dispatch" />
                    <DropdownItem to="/dashboard/fleet/smart-bookings" label="Smart Bookings" />
                </div>
            )}
        </div>
    );
};
