import { useRef, useEffect, useState } from 'react';
import { X, Mic, Box, Route, Truck, Clock, Sparkles, ChevronRight, Check } from 'lucide-react';

interface AIAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsAnalyzing(true);
            const timer = setTimeout(() => setIsAnalyzing(false), 2000); // Simulate analysis
            return () => clearTimeout(timer);
        }
    }, [isOpen]);


    if (!isOpen) return null;

    const suggestions = [
        {
            id: 1,
            type: 'packaging',
            icon: <Box size={18} />,
            title: 'Packaging Optimization',
            desc: 'Use anti-static bubble wrap to prevent damage.',
            savings: '$500',
            confidence: 95
        },
        {
            id: 2,
            type: 'route',
            icon: <Route size={18} />,
            title: 'Route Efficiency',
            desc: 'Switch to I-95 corridor to save 2 hours transit time.',
            savings: '2 hrs',
            confidence: 88
        },
        {
            id: 3,
            type: 'cost',
            icon: <Sparkles size={18} />,
            title: 'Smart Cost Savings',
            desc: 'Bulk insurance discount available for this load value.',
            savings: '$200',
            confidence: 92
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div ref={modalRef} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-white/20">
                {/* Header */}
                <div className="relative bg-indigo-600 p-8 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -ml-12 -mb-12"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                                <Sparkles className="text-white w-7 h-7 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">AI Assistant</h2>
                                <p className="text-indigo-100 text-sm font-medium mt-1">Analyzing cargo payload for optimizations...</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="relative size-20">
                                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                                <Mic className="absolute inset-0 m-auto text-indigo-600 w-8 h-8 animate-pulse" />
                            </div>
                            <p className="text-slate-500 font-bold text-sm animate-pulse">Processing voice data & route constraints...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-extrabold text-slate-900">3 Optimizations Found</h3>
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                    High Confidence Match
                                </span>
                            </div>

                            <div className="grid gap-4">
                                {suggestions.map((item, idx) => (
                                    <div key={item.id} className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                {item.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{item.title}</h4>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-md mb-1">
                                                            Save {item.savings}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">{item.confidence}% match</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                                            </div>
                                            <div className="self-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-600">
                                                <ChevronRight />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4 mt-4 border-t border-slate-100">
                                <button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                                    Dismiss
                                </button>
                                <button className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                                    <Sparkles size={18} /> Apply All Optimizations
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIAssistantModal;
