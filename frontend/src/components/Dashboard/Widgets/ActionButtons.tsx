import { Mic, ScanLine, Map } from 'lucide-react';
import { useState } from 'react';
import AIAssistantModal from './AIAssistantModal';

const ActionButtons = () => {
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                {/* Voice Log - Triggers AI Assistant */}
                <div
                    onClick={() => setIsAIModalOpen(true)}
                    className="bg-white/75 backdrop-blur-xl border border-white/50 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.04)] p-6 md:p-8 rounded-2xl md:rounded-3xl group cursor-pointer hover:-translate-y-1 transition-all duration-300"
                >
                    <div className="size-14 md:size-16 rounded-2xl bg-gradient-to-br from-white to-gray-100 shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-teal-600 mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                        <Mic size={28} className="md:w-9 md:h-9" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-[#0f172a] text-base md:text-lg">Voice Log</h3>
                        <p className="text-slate-500 text-[10px] md:text-xs mt-1">AI dictation for rapid cargo entry.</p>
                    </div>
                </div>

                {/* OCR Scan */}
                <div className="bg-white/75 backdrop-blur-xl border border-white/50 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.04)] p-6 md:p-8 rounded-2xl md:rounded-3xl group cursor-pointer hover:-translate-y-1 transition-all duration-300">
                    <div className="size-14 md:size-16 rounded-2xl bg-gradient-to-br from-white to-gray-100 shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-indigo-600 mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                        <ScanLine size={28} className="md:w-9 md:h-9" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-[#0f172a] text-base md:text-lg">OCR Scan</h3>
                        <p className="text-slate-500 text-[10px] md:text-xs mt-1">Digitize waybills in seconds.</p>
                    </div>
                </div>

                {/* Corridor Map */}
                <div className="bg-white/75 backdrop-blur-xl border border-white/50 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.04)] p-6 md:p-8 rounded-2xl md:rounded-3xl group cursor-pointer hover:-translate-y-1 transition-all duration-300">
                    <div className="size-14 md:size-16 rounded-2xl bg-gradient-to-br from-white to-gray-100 shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-amber-600 mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                        <Map size={28} className="md:w-9 md:h-9" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-[#0f172a] text-base md:text-lg">Corridor Map</h3>
                        <p className="text-slate-500 text-[10px] md:text-xs mt-1">Real-time GPS heatmap & toll tracking.</p>
                    </div>
                </div>
            </div>

            <AIAssistantModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
        </>
    );
};

export default ActionButtons;
