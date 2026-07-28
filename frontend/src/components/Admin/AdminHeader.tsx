import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ChevronDown, LogOut, Settings, Shield, Menu, X, LayoutDashboard, BarChart3, Users, Building2, Route, Truck, Package, Activity, Server, DollarSign, ShieldCheck, Gavel, FileText, Landmark, UserCircle, FileCheck, Tags, CreditCard, Bell, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminNotificationDropdown from './AdminNotificationDropdown';
import ThemeToggle from '../Theme/ThemeToggle';
import LanguageSwitcher from '../LanguageSwitcher';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { TranslatedText } from '../translated-text';

interface AdminHeaderProps {
    searchPlaceholder?: string;
    onSearch?: (value: string) => void;
    customRightContent?: React.ReactNode;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
    searchPlaceholder = "Search...",
    onSearch,
    customRightContent
}) => {
    const { user, logout } = useAuth();
    const { tSync } = useTranslation();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [searchValue, setSearchValue] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            if (logout) logout();
            navigate('/auth', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
            localStorage.clear();
            window.location.href = '/auth';
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        if (onSearch) onSearch(value);
    };

    return (
        <>
            <header className="sticky top-0 z-[300] w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 h-20 flex items-center justify-between">
            {/* Left: Branding/Search */}
            <div className="flex items-center gap-4 lg:gap-8 flex-1">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setShowMobileMenu(true)}
                    className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Desktop Branding */}
                <div className="hidden lg:flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center rounded-xl">
                        <Shield className="text-primary-600 dark:text-primary-400 w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none uppercase">
                            Admin<span className="text-primary-600 dark:text-primary-400">Core</span>
                        </h2>
                    </div>
                </div>

                {/* Mobile Branding */}
                <div className="lg:hidden flex items-center min-w-max">
                    <div className="w-8 h-8 bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center rounded-lg">
                        <Shield className="text-primary-600 dark:text-primary-400 w-4 h-4" />
                    </div>
                </div>

                <div className="flex-1 max-w-md relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors w-4 h-4" />
                    <input
                        type="text"
                        placeholder={tSync(searchPlaceholder)}
                        value={searchValue}
                        onChange={handleSearchChange}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-primary-100 dark:focus:border-primary-900/50 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-700 dark:text-slate-200 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                    />
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-3 border-r border-slate-100 dark:border-slate-800 pr-4 mr-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <AdminNotificationDropdown />
                </div>

                {customRightContent}

                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">
                                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Super Admin'}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">
                                {user?.role?.replace('_', ' ') || 'Platform Owner'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-black text-xs border border-white/20 shadow-sm transition-transform active:scale-95">
                            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'AD'}
                        </div>
                        <ChevronDown className={`text-slate-400 w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2.5 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 mb-1">
                                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Identity" /></p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user?.email || 'admin@urutix.com'}</p>
                            </div>

                            <div className="h-px bg-slate-50 dark:bg-slate-800 mx-4 mb-2"></div>

                             <Link
                                to="/admin/profile"
                                className="w-full px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-3 transition-colors"
                                onClick={() => setShowUserMenu(false)}
                            >
                                <User size={16} />
                                <span><TranslatedText text="Account & Settings" /></span>
                            </Link>

                            <div className="h-px bg-slate-50 dark:bg-slate-800 mx-4 my-2"></div>

                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-2.5 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-colors"
                            >
                                <LogOut size={16} />
                                <span><TranslatedText text="Terminate Session" /></span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
            {showMobileMenu && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowMobileMenu(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden"
                    />
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-[300px] bg-white dark:bg-slate-900 z-[101] lg:hidden overflow-y-auto shadow-2xl"
                    >
                        <div className="p-6 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center rounded-lg">
                                        <Shield className="text-primary-600 dark:text-primary-400 w-4 h-4" />
                                    </div>
                                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase">
                                        Admin<span className="text-primary-600 dark:text-primary-400">Core</span>
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowMobileMenu(false)}
                                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="space-y-8">
                                {[
                                    {
                                        title: 'Overview',
                                        items: [
                                            { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
                                            { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
                                        ]
                                    },
                                    {
                                        title: 'Management',
                                        items: [
                                            { label: 'Users', icon: Users, path: '/admin/users' },
                                            { label: 'Tenants', icon: Building2, path: '/admin/tenants' },
                                            { label: 'Routes', icon: Route, path: '/admin/routes' },
                                        ]
                                    },
                                    {
                                        title: 'Operations',
                                        items: [
                                            { label: 'Trucks', icon: Truck, path: '/admin/trucks' },
                                            { label: 'Loads', icon: Package, path: '/admin/loads' },
                                            { label: 'Trips', icon: Activity, path: '/admin/trips' },
                                        ]
                                    },
                                    {
                                        title: 'Financial',
                                        items: [
                                            { label: 'Transactions', icon: DollarSign, path: '/admin/financial' },
                                            { label: 'Escrow', icon: ShieldCheck, path: '/admin/escrow-management' },
                                            { label: 'Disputes', icon: Gavel, path: '/admin/disputes' },
                                            { label: 'Bidding', icon: FileText, path: '/admin/bidding' },
                                        ]
                                    },
                                    {
                                        title: 'Lending',
                                        items: [
                                            { label: 'Lenders', icon: Landmark, path: '/admin/lenders/register' },
                                            { label: 'Borrowers', icon: UserCircle, path: '/admin/borrowers' },
                                        ]
                                    },
                                    {
                                        title: 'Subscription',
                                        items: [
                                            { label: 'Subscriptions', icon: FileCheck, path: '/admin/subscriptions' },
                                            { label: 'Subscription Plans', icon: FileText, path: '/admin/subscription-plans' },
                                            { label: 'Pricing Rules', icon: Tags, path: '/admin/pricing-rules' },
                                            { label: 'Credit Usage', icon: CreditCard, path: '/admin/credit-usage' },
                                        ]
                                    },
                                    {
                                        title: 'System',
                                        items: [
                                            { label: 'Monitoring', icon: Server, path: '/admin/monitoring' },
                                            { label: 'Bulk Email', icon: Mail, path: '/admin/bulk-email' },
                                            { label: 'Onboarding', icon: Bell, path: '/admin/onboarding' },
                                            { label: 'Settings', icon: Settings, path: '/admin/advanced-settings' },
                                        ]
                                    }
                                ].map((category, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <TranslatedText text={category.title} />
                                        </h3>
                                        <div className="space-y-1">
                                            {category.items.map((item, itemIdx) => {
                                                const Icon = item.icon;
                                                const active = window.location.pathname === item.path;
                                                return (
                                                    <button
                                                        key={itemIdx}
                                                        onClick={() => { navigate(item.path); setShowMobileMenu(false); }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${active
                                                            ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                                                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        <Icon size={18} />
                                                        <span className="text-xs font-bold capitalize"><TranslatedText text={item.label} /></span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </nav>
                        </div>
                    </motion.div>
            </>
        )}
    </AnimatePresence>
        </>
    );
};

export default AdminHeader;
