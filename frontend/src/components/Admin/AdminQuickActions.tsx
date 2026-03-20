import React, { useState, useRef, useEffect } from 'react';
import {
    Zap,
    UserPlus,
    Building,
    Route as RouteIcon,
    Download,
    ChevronDown,
    Plus,
    Settings,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TranslatedText } from '../translated-text';

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
            color: 'text-primary-600',
            bg: 'bg-primary-50'
        },
        {
            label: 'Register Tenant',
            icon: Building,
            description: 'Onboard a new company',
            onClick: () => {
                navigate('/admin/tenants');
                setIsOpen(false);
            },
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
        {
            label: 'Create Route',
            icon: RouteIcon,
            description: 'Define a new logistics corridor',
            onClick: () => {
                navigate('/admin/routes');
                setIsOpen(false);
            },
            color: 'text-emerald-600',
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
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        }
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-primary-100 border border-primary-700 group"
            >
                <Zap size={14} className={`transition-transform duration-300 ${isOpen ? 'scale-110 text-amber-400' : 'group-hover:scale-110'}`} />
                <TranslatedText text="Command Center" />
                <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl dark:bg-slate-900/95 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Plus size={12} /> <TranslatedText text="Direct Access" />
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <ArrowRight size={14} className="rotate-90" />
                            </button>
                        </div>
                    </div>
                    <div className="p-2">
                        {actions.map((action, idx) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={idx}
                                    onClick={action.onClick}
                                    className="w-full flex items-start gap-4 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-800 transition-all text-left group"
                                >
                                    <div className={`p-2.5 rounded-xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight group-hover:text-primary-600 transition-colors">
                                            <TranslatedText text={action.label} />
                                        </h4>
                                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest leading-none">
                                            <TranslatedText text={action.description} />
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="p-3 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                        <button
                            className="w-full py-2.5 px-4 text-[10px] font-black text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                            onClick={() => {
                                navigate('/admin/advanced-settings');
                                setIsOpen(false);
                            }}
                        >
                            <Settings size={14} />
                            <TranslatedText text="Global Parameters" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminQuickActions;
