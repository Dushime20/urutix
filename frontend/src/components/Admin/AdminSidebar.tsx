import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    Users,
    Building2,
    Route,
    Truck,
    Package,
    Activity,
    DollarSign,
    ShieldCheck,
    Gavel,
    FileText,
    Landmark,
    UserCircle,

    FileCheck,
    Server,
    Bell,
    Settings,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Mail,
} from 'lucide-react';
import { TranslatedText } from '../translated-text';
import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';

interface NavItem {
    label: string;
    icon: React.ComponentType<{ size?: string | number; className?: string }>;
    path: string;
    badge?: string | number;
}

interface NavCategory {
    title: string;
    items: NavItem[];
}

const AdminSidebar: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    const navCategories: NavCategory[] = [
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
            ]
        },
        {
            title: 'System',
            items: [
                { label: 'Monitoring', icon: Server, path: '/admin/monitoring' },
                { label: 'Bulk Email', icon: Mail, path: '/admin/bulk-email' },
                { label: 'Onboarding', icon: Bell, path: '/admin/onboarding' },
                { label: 'Settings', icon: Settings, path: '/admin/advanced-settings' },
                { label: 'System Settings', icon: Settings, path: '/admin/system-settings' },
            ]
        },
    ];

    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <aside
            className={`${collapsed ? 'w-20' : 'w-64'} hidden lg:flex bg-white dark:bg-slate-900 h-full transition-all duration-300 flex-col border-r border-slate-200 dark:border-slate-800 flex-shrink-0 z-20`}
        >
            {/* Logo Section */}
            <div className="p-6 h-20 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
                {!collapsed ? (
                    <Link to="/admin" className="flex items-center">
                        <div className="flex items-center justify-center w-full py-2">
                            <img
                                src={logoUrutiX}
                                alt="UrutiX Logistics Logo"
                                className="w-18 h-18 md:w-24 md:h-24 object-contain"
                            />
                        </div>
                    </Link>
                ) : (
                    <div className="flex justify-center w-full">
                        <img
                            src={logoUrutiX}
                            alt="UrutiX Logistics Logo"
                            className="h-10 w-auto object-contain"
                        />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
                {navCategories.map((category, idx) => (
                    <div key={idx} className="space-y-2">
                        {!collapsed && (
                            <h3 className="px-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                                <TranslatedText text={category.title} />
                            </h3>
                        )}
                        <div className="space-y-1">
                            {category.items.map((item, itemIdx) => {
                                const Icon = item.icon;
                                const active = isActive(item.path);
                                return (
                                    <Link
                                        key={itemIdx}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${active
                                            ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                                            }`}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        {active && (
                                            <div className="absolute left-[-1rem] top-1/4 bottom-1/4 w-1 bg-primary-600 rounded-r-full" />
                                        )}
                                        <Icon
                                            size={20}
                                            className={active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}
                                        />
                                        {!collapsed && (
                                            <>
                                                <span className="text-sm font-bold flex-1"><TranslatedText text={item.label} /></span>
                                                {item.badge && (
                                                    <span className="px-1.5 py-0.5 bg-primary-600 text-white text-[10px] font-black rounded-md">
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {active && <ArrowRight size={14} className="opacity-50" />}
                                            </>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer / Toggle */}
            <div className="p-4 border-t border-slate-50 dark:border-slate-800">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-100 dark:border-slate-800 dark:hover:border-slate-700"
                >
                    {collapsed ? <ChevronRight size={18} /> : (
                        <div className="flex items-center gap-2">
                            <ChevronLeft size={18} />
                            <span className="text-xs font-bold"><TranslatedText text="Minimize Sidebar" /></span>
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
