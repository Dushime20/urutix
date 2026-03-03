import { Truck, MapPin, Zap, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';



interface QuickActionsProps {
    onCreateClick?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onCreateClick }) => {

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg ${isOpen ? 'bg-teal-600 text-white shadow-teal-500/30 ring-2 ring-teal-500/50 ring-offset-2 ring-offset-[#0f172a]' : 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/20'}`}
            >
                {isOpen ? <X size={14} /> : <Zap size={14} fill="currentColor" />}
                {isOpen ? 'Close' : 'Quick Action'}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-slate-50 border-b border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create New</p>
                    </div>

                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onCreateClick?.();
                            }}
                            className="w-full flex items-start gap-3 p-3 hover:bg-teal-50 rounded-xl transition-colors group text-left"
                        >
                            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg group-hover:bg-teal-500 group-hover:text-white transition-colors">
                                <Truck size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-[#0f172a]">Post New Load</h4>
                                <p className="text-[10px] text-slate-500 leading-tight">Match with 500+ verified carriers</p>
                            </div>
                        </button>

                        <button className="w-full flex items-start gap-3 p-3 hover:bg-amber-50 rounded-xl transition-colors group text-left">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <Zap size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-[#0f172a]">Request Instant Quote</h4>
                                <p className="text-[10px] text-slate-500 leading-tight">Get spot rates in minutes</p>
                            </div>
                        </button>
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recent Templates</p>
                        <div className="flex flex-col gap-2">
                            <button className="flex items-center justify-between text-xs font-medium text-slate-600 hover:text-teal-600 transition-colors bg-white border border-slate-200 hover:border-teal-300 rounded-lg p-2 group">
                                <span className="flex items-center gap-1.5"><MapPin size={10} /> Accra <span className="text-slate-300">→</span> Lagos</span>
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-teal-500">USE</span>
                            </button>
                            <button className="flex items-center justify-between text-xs font-medium text-slate-600 hover:text-teal-600 transition-colors bg-white border border-slate-200 hover:border-teal-300 rounded-lg p-2 group">
                                <span className="flex items-center gap-1.5"><MapPin size={10} /> Tema <span className="text-slate-300">→</span> Kumasi</span>
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-teal-500">USE</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickActions;
