import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Bell, User, PlusCircle, Activity, DollarSign, MessageSquare, ShieldCheck, Search, Radio } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../utils/cn';

interface NavItem {
  icon: any;
  label: string;
  path: string;
  count?: number;
}

const MobileBottomNav: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { unreadCount } = useNotifications();

    const getHomePath = () => {
        if (!user) return '/dashboard';
        switch (user.role) {
            case 'SUPER_ADMIN': return '/admin';
            case 'ADMIN': return '/admin-operational';
            case 'TENANT_ADMIN': return '/tenant-admin';
            case 'TRUCK_OWNER': return '/dashboard/fleet';
            case 'DRIVER': return '/dashboard/driver';
            case 'BROKER': return '/dashboard/broker';
            case 'CUSTOMS_OFFICER': return '/dashboard/customs';
            case 'LENDER': return '/lender';
            case 'CARGO_OWNER': 
            case 'CARGO_RECEIVER':
            default: return '/dashboard';
        }
    };

    const getProfilePath = () => {
        if (!user) return '/dashboard/settings';
        switch (user.role) {
            case 'SUPER_ADMIN': return '/admin/profile';
            case 'ADMIN': return '/admin-operational/profile';
            case 'TENANT_ADMIN': return '/tenant-admin/profile';
            case 'TRUCK_OWNER': return '/dashboard/profile/fleet';
            case 'DRIVER': return '/dashboard/driver/profile';
            case 'BROKER': return '/dashboard/broker';
            case 'CUSTOMS_OFFICER': return '/dashboard/customs';
            case 'LENDER': return '/lender';
            case 'CARGO_OWNER': 
            case 'CARGO_RECEIVER':
            default: return '/dashboard/settings';
        }
    };

    const getNotificationsPath = () => {
        if (!user) return '/dashboard/notifications';
        switch (user.role) {
            case 'SUPER_ADMIN': return '/admin/activity-logs';
            case 'ADMIN': return '/admin-operational/activity-logs';
            case 'TENANT_ADMIN': return '/tenant-admin/activity-logs';
            case 'TRUCK_OWNER': return '/dashboard/fleet'; 
            case 'DRIVER': return '/dashboard/driver/notifications';
            case 'BROKER': return '/dashboard/broker';
            case 'CUSTOMS_OFFICER': return '/dashboard/customs'; 
            case 'LENDER': return '/lender';
            case 'CARGO_OWNER': 
            case 'CARGO_RECEIVER':
            default: return '/dashboard/notifications';
        }
    };

    const getTrackingPath = () => {
        if (!user) return '/dashboard/tracking';
        switch (user.role) {
            case 'TRUCK_OWNER': return '/dashboard/fleet/tracking';
            case 'DRIVER': return '/dashboard/driver/tracking';
            case 'BROKER': return '/dashboard/broker/tracking';
            case 'CARGO_OWNER':
            case 'CARGO_RECEIVER':
            default: return '/dashboard/tracking';
        }
    };

    // Base navigation items for all users
    const navItems: NavItem[] = [
        { icon: Home, label: 'Home', path: getHomePath() },
    ];

    // Role-specific primary actions
    if (user?.role === 'CUSTOMS_OFFICER') {
        navItems.push({ icon: ShieldCheck, label: 'Inspections', path: '/dashboard/customs/inspections' });
        navItems.push({ icon: Search, label: 'Search', path: '/dashboard/customs/search' });
        navItems.push({ icon: Activity, label: 'Flagged', path: '/dashboard/customs/flagged' });
    } else if (user?.role === 'CARGO_OWNER' || user?.role === 'CARGO_RECEIVER') {
        navItems.push({ icon: Package, label: 'Cargos', path: user.role === 'CARGO_OWNER' ? '/dashboard/cargos/list' : '/cargo-owner/cargos/my-cargos' });
        navItems.push({ icon: Radio, label: 'Track', path: getTrackingPath() });
        navItems.push({ icon: PlusCircle, label: 'Create', path: '/dashboard/cargos/create' });
    } else if (user?.role === 'DRIVER') {
        navItems.push({ icon: Radio, label: 'Track', path: getTrackingPath() });
        navItems.push({ icon: Activity, label: 'Missions', path: '/dashboard/driver/missions' });
        navItems.push({ icon: DollarSign, label: 'Finance', path: '/dashboard/driver/finance' });
    } else if (user?.role === 'TRUCK_OWNER') {
        navItems.push({ icon: Radio, label: 'Track', path: getTrackingPath() });
        navItems.push({ icon: Activity, label: 'Trips', path: '/dashboard/trips' });
    } else if (user?.role === 'BROKER') {
        navItems.push({ icon: Package, label: 'Loads', path: '/dashboard/broker/loads' });
        navItems.push({ icon: Radio, label: 'Track', path: getTrackingPath() });
    } else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        navItems.push({ icon: Activity, label: 'Ops', path: '/admin/monitoring' });
    }

    // Common items — Bell gets the live unread count
    navItems.push({ icon: Bell, label: 'Alerts', path: getNotificationsPath(), count: unreadCount > 0 ? unreadCount : undefined });
    navItems.push({ icon: User, label: 'Profile', path: getProfilePath() });

    // Ensure we only show 5 items max for better UI
    const finalItems = navItems.slice(0, 5);

    return (
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-[100] h-16 bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-[2rem] shadow-[0_15px_40px_-5px_rgba(0,0,0,0.15)] flex items-center justify-around px-2">
            {finalItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                const displayCount = item.count && item.count > 0 ? (item.count > 99 ? '99+' : String(item.count)) : null;

                return (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className={cn(
                            "relative flex flex-col items-center justify-center p-1.5 min-w-[56px] transition-all duration-300",
                            isActive ? "text-[#345E85] -translate-y-1" : "text-slate-400"
                        )}
                        aria-label={`${item.label}${displayCount ? `, ${item.count} unread` : ''}`}
                    >
                        {/* Active Indicator Bar */}
                        {isActive && (
                            <div className="absolute -top-1 w-6 h-1 bg-[#345E85] rounded-full shadow-[0_0_10px_rgba(52,94,133,0.3)]" />
                        )}

                        <div className={cn(
                            "relative p-1.5 rounded-xl transition-all duration-500",
                            isActive ? "scale-110" : ""
                        )}>
                            <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                            {displayCount && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center border border-white">
                                    {displayCount}
                                </span>
                            )}
                        </div>
                        <span className={cn(
                            "text-[8px] font-black uppercase tracking-[0.1em] transition-all duration-300 mt-0.5",
                            isActive ? "opacity-100" : "opacity-0 scale-75"
                        )}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default MobileBottomNav;
