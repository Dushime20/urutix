import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Bell, User, PlusCircle, Activity } from 'lucide-react';
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
    } else if (user?.role === 'TRUCK_OWNER' || user?.role === 'DRIVER') {
        navItems.push({ icon: Activity, label: 'Trips', path: user.role === 'TRUCK_OWNER' ? '/dashboard/trips' : '/dashboard/driver/trips' });
    } else if (user?.role === 'BROKER') {
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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] pb-safe">
            <div className="flex justify-around items-center px-2 py-3">
                {finalItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                    
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center gap-1 p-1 min-w-[64px] transition-all duration-300",
                                isActive ? "text-primary-500" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <div className={cn(
                                "relative p-2 rounded-xl transition-all",
                                isActive ? "bg-primary-50 scale-110" : ""
                            )}>
                                <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                                {item.count && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                        {item.count}
                                    </span>
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider transition-all",
                                isActive ? "opacity-100 translate-y-0" : "opacity-70"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
