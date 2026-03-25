import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Bell, User, PlusCircle, Activity, DollarSign, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
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

    // Base navigation items for all users
    const navItems: NavItem[] = [
        { icon: Home, label: 'Home', path: '/dashboard' },
    ];

    // Role-specific primary actions
    if (user?.role === 'CARGO_OWNER' || user?.role === 'CARGO_RECEIVER') {
        navItems.push({ icon: Package, label: 'Cargos', path: user.role === 'CARGO_OWNER' ? '/dashboard/cargos/list' : '/cargo-owner/cargos/my-cargos' });
        navItems.push({ icon: PlusCircle, label: 'Create', path: '/dashboard/cargos/create' });
    } else if (user?.role === 'DRIVER') {
        navItems.push({ icon: Home, label: 'Overview', path: '/dashboard/driver' });
        navItems.push({ icon: Activity, label: 'Missions', path: '/dashboard/driver/missions' });
        navItems.push({ icon: DollarSign, label: 'Finance', path: '/dashboard/driver/finance' });
        navItems.push({ icon: MessageSquare, label: 'Chat', path: '/dashboard/driver/messages' });
    } else if (user?.role === 'TRUCK_OWNER') {
        navItems.push({ icon: Activity, label: 'Trips', path: '/dashboard/trips' });
    }
 else if (user?.role === 'BROKER') {
        navItems.push({ icon: Package, label: 'Loads', path: '/dashboard/broker/loads' });
        navItems.push({ icon: Activity, label: 'Ops', path: '/dashboard/broker/discovery' });
    } else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        navItems.push({ icon: Activity, label: 'Ops', path: '/admin/monitoring' });
    }

    // Common items
    navItems.push({ icon: Bell, label: 'Alerts', path: '/dashboard/notifications' });
    navItems.push({ icon: User, label: 'Profile', path: '/dashboard/settings' });

    // Ensure we only show 5 items max for better UI
    const finalItems = navItems.slice(0, 5);

    return (
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-[100] h-16 bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-[2rem] shadow-[0_15px_40px_-5px_rgba(0,0,0,0.15)] flex items-center justify-around px-2">
            {finalItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                
                return (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className={cn(
                            "relative flex flex-col items-center justify-center p-1.5 min-w-[56px] transition-all duration-300",
                            isActive ? "text-[#345E85] -translate-y-1" : "text-slate-400"
                        )}
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
                            {item.count && (
                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white">
                                    {item.count}
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
