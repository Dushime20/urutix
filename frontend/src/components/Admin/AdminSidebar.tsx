import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FaChartLine, FaUsers, FaBuilding, FaTruck, FaBox, FaRoute,
    FaDollarSign, FaShieldAlt, FaCog, FaExclamationCircle,
    FaChevronLeft, FaChevronRight, FaUserShield, FaKey,
    FaClipboardList, FaServer, FaBell, FaFileAlt, FaGavel,
    FaHandshake, FaUniversity, FaUserTie
} from 'react-icons/fa';
import { Activity, BarChart3, Settings } from 'lucide-react';
import logoUrutiX from '../../assets/logo-urutix.svg';

interface NavItem {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
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
                { label: 'Dashboard', icon: FaChartLine, path: '/admin' },
                { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
            ]
        },
        {
            title: 'Management',
            items: [
                { label: 'Users', icon: FaUsers, path: '/admin/users' },
                { label: 'Tenants', icon: FaBuilding, path: '/admin/tenants' },
                { label: 'Routes', icon: FaRoute, path: '/admin/routes' },
            ]
        },
        {
            title: 'Operations',
            items: [
                { label: 'Trucks', icon: FaTruck, path: '/admin/trucks' },
                { label: 'Loads', icon: FaBox, path: '/admin/loads' },
                { label: 'Trips', icon: Activity, path: '/admin/trips' },
            ]
        },
        {
            title: 'Financial',
            items: [
                { label: 'Transactions', icon: FaDollarSign, path: '/admin/financial' },
                { label: 'Escrow', icon: FaHandshake, path: '/admin/escrow-management' },
                { label: 'Disputes', icon: FaGavel, path: '/admin/disputes' },
                { label: 'Bidding', icon: FaFileAlt, path: '/admin/bidding' },
            ]
        },
        {
            title: 'Lending',
            items: [
                { label: 'Lenders', icon: FaUniversity, path: '/admin/lenders/register' },
                { label: 'Borrowers', icon: FaUserTie, path: '/admin/borrowers' },
            ]
        },
        {
            title: 'Security',
            items: [
                { label: 'Permissions', icon: FaShieldAlt, path: '/admin/permissions' },
                { label: 'Roles', icon: FaUserShield, path: '/admin/roles' },
                { label: 'Enhanced Permissions', icon: FaKey, path: '/admin/enhanced-permissions' },
                { label: 'Activity Logs', icon: FaClipboardList, path: '/admin/activity-logs' },
            ]
        },
        {
            title: 'System',
            items: [
                { label: 'Monitoring', icon: FaServer, path: '/admin/monitoring' },
                { label: 'Onboarding', icon: FaBell, path: '/admin/onboarding' },
                { label: 'Settings', icon: Settings, path: '/admin/advanced-settings' },
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
            className={`${collapsed ? 'w-20' : 'w-64'} bg-[#0f172a] text-white h-full transition-all duration-300 flex flex-col border-r border-white/10 flex-shrink-0 z-20`}
        >
            {/* UrutiX Logo */}
            <div className="p-4 border-b border-white/10">
                {!collapsed ? (
                    <div className="flex items-center gap-3">
                        <img 
                            src={logoUrutiX} 
                            alt="UrutiX Logo" 
                            className="w-10 h-10 object-contain"
                        />
                        <div>
                            <h1 className="font-black text-xl text-white">UrutiX</h1>
                            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Admin Portal</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <img 
                            src={logoUrutiX} 
                            alt="UrutiX Logo" 
                            className="w-10 h-10 object-contain"
                        />
                    </div>
                )}
            </div>

            {/* Toggle Button */}
            <div className="px-4 py-2 border-b border-white/10 flex items-center justify-end">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    {collapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
                {navCategories.map((category, idx) => (
                    <div key={idx}>
                        {!collapsed && (
                            <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {category.title}
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
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${active
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <Icon
                                            size={18}
                                            className={active ? 'text-white' : 'text-slate-400 group-hover:text-white'}
                                        />
                                        {!collapsed && (
                                            <>
                                                <span className="text-sm font-medium flex-1">{item.label}</span>
                                                {item.badge && (
                                                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer Stats */}
            {!collapsed && (
                <div className="p-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">System Status</span>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-emerald-400 font-bold">Operational</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/5 rounded p-2">
                            <div className="text-slate-400 text-[10px]">Uptime</div>
                            <div className="font-bold text-white">99.9%</div>
                        </div>
                        <div className="bg-white/5 rounded p-2">
                            <div className="text-slate-400 text-[10px]">Active</div>
                            <div className="font-bold text-white">1,284</div>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default AdminSidebar;
