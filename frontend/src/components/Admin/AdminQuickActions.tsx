import React, { useState, useRef, useEffect } from 'react';
import {
    Zap,
    UserPlus,
    Building,
    Route as RouteIcon,
    Download,
    ChevronDown,
    Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminQuickActions: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const actions = [
        {
            label: 'Invite User',
            icon: UserPlus,
            description: 'Add new administrator or staff',
            onClick: () => {
                navigate('/admin/users');
                setIsOpen(false);
            },
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        },
        {
            label: 'Register Tenant',
            icon: Building,
            description: 'Onboard a new company',
            onClick: () => {
                navigate('/admin/tenants');
                setIsOpen(false);
            },
            color: 'text-indigo-500',
            bg: 'bg-indigo-50'
        },
        {
            label: 'Create Route',
            icon: RouteIcon,
            description: 'Define a new logistics corridor',
            onClick: () => {
                navigate('/admin/routes');
                setIsOpen(false);
            },
            color: 'text-emerald-500',
            bg: 'bg-emerald-50'
        },
        {
            label: 'Export Reports',
            icon: Download,
            description: 'Download platform metrics',
            onClick: () => {
                navigate('/admin/financial');
                setIsOpen(false);
            },
            color: 'text-amber-500',
            bg: 'bg-amber-50'
        }
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold border border-indigo-700 transition-all"
            >
                <Zap size={16} />
                <span>Quick Actions</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 flex items-center gap-2">
                            <Plus size={12} /> Command Center
                        </h3>
                    </div>
                    <div className="p-2">
                        {actions.map((action, idx) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={idx}
                                    onClick={action.onClick}
                                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                                >
                                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">{action.label}</h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{action.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <button
                            className="w-full py-2 px-4 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-center"
                            onClick={() => {
                                navigate('/admin/advanced-settings');
                                setIsOpen(false);
                            }}
                        >
                            View System Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminQuickActions;
