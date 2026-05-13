import React from 'react';
import {
    X,
    Calendar,
    Clock,
    Truck,
    User,
    MapPin,
    TrendingUp,
    Globe,
    FileText,
    AlertTriangle,
    Download,
    ExternalLink,
    Fuel,
    Camera
} from 'lucide-react';
import type { FuelEntry } from '../../../services/fleetApi';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FilePreview: React.FC<{ url?: string; label: string; fallbackIcon: React.ReactNode }> = ({ url, label, fallbackIcon }) => {
    const isPdf = url?.toLowerCase().endsWith('.pdf');
    return (
        <div className="aspect-[16/9] bg-[#fafafa] dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 relative group overflow-hidden transition-all shadow-sm">
            {url ? (
                isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <FileText size={36} className="text-blue-400" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label} (PDF)</p>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                            <ExternalLink size={12} /> Open File
                        </a>
                    </div>
                ) : (
                    <>
                        <img src={url} alt={label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl hover:scale-110 transition-transform shadow-xl"
                            >
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </>
                )
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-3">
                    {fallbackIcon}
                    <p className="text-[9px] font-black uppercase tracking-widest">No capture identified</p>
                </div>
            )}
        </div>
    );
};

interface FuelDetailsModalProps {
    log: FuelEntry | null;
    isOpen: boolean;
    onClose: () => void;
}

const FuelDetailsModal: React.FC<FuelDetailsModalProps> = ({ log, isOpen, onClose }) => {
    if (!log) return null;

    const handleDownload = () => {
        if (!log) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(26, 28, 30);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('URUTIX FUEL REPORT', 20, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`PROTOCOL: ${log.id.toUpperCase()}`, 20, 33);

        // Body
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Transaction Details', 20, 55);

        autoTable(doc, {
            startY: 60,
            head: [['Field', 'Information']],
            body: [
                ['Date', new Date(log.date).toLocaleDateString()],
                ['Time', new Date(log.date).toLocaleTimeString()],
                ['Truck ID', log.truckId],
                ['Driver', log.driverId],
                ['Fuel Type', log.fuelType],
                ['Volume', `${log.gallons.toFixed(2)} Gallons`],
                ['Price per Gallon', `$${log.costPerGallon.toFixed(2)}`],
                ['Total Cost', `$${log.totalCost.toFixed(2)}`],
                ['Odometer', `${log.odometer.toLocaleString()} miles`],
                ['Location', log.location],
                ['Jurisdiction', log.jurisdiction],
                ['Status', log.status.toUpperCase()],
            ],
            theme: 'striped',
            headStyles: { fillColor: [52, 94, 133], textColor: [255, 255, 255] },
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: { 0: { fontStyle: 'bold', minCellWidth: 50 } }
        });

        // Verification Section
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Verification & Notes', 20, finalY);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Status: ${log.status.toUpperCase()}`, 20, finalY + 10);
        if (log.notes) {
            doc.text('Notes:', 20, finalY + 17);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            const splitNotes = doc.splitTextToSize(log.notes, pageWidth - 40);
            doc.text(splitNotes, 20, finalY + 23);
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Generated on ${new Date().toLocaleString()} by UrutiX Smart Logistic`, 20, 285);

        doc.save(`UrutiX_Fuel_Log_${log.id.substring(0, 8)}.pdf`);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 transition-colors">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors"
                    >
                        {/* Header Image/Background */}
                        <div className="h-32 bg-[#1A1C1E] dark:bg-slate-950 relative overflow-hidden flex items-center px-10 border-b border-white/5 dark:border-slate-800 transition-colors">
                            <div className="absolute top-0 right-0 p-10 opacity-10 scale-[2] pointer-events-none">
                                <Fuel size={120} className="text-white" />
                            </div>
                            <div className="relative z-10 flex items-center justify-between w-full">
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-400 dark:text-blue-400 mb-1">Details</h2>
                                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">ID: {log.id.substring(0, 8)}</h1>
                                </div>
                                <button onClick={onClose} className="size-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-slate-800 rounded-xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                            {/* Key Stats Row */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="p-6 bg-[#fafafa] dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 transition-all hover:border-blue-100 dark:hover:border-blue-900">
                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Cost</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white transition-colors tracking-tight">${log.totalCost.toFixed(2)}</p>
                                </div>
                                <div className="p-6 bg-[#fafafa] dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 transition-all hover:border-emerald-100 dark:hover:border-emerald-900">
                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Efficiency</p>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} className="text-emerald-500 dark:text-emerald-400" />
                                        <p className="text-2xl font-black text-gray-900 dark:text-white transition-colors tracking-tight">7.2 <span className="text-[10px] text-slate-400 dark:text-slate-500">MPG</span></p>
                                    </div>
                                </div>
                                <div className="p-6 bg-[#fafafa] dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 transition-all">
                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Status</p>
                                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors border ${log.status === 'verified' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/30'
                                        }`}>
                                        {log.status}
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                            <span className="w-8 h-px bg-slate-900 dark:bg-blue-500/50"></span>
                                            Time & Location
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                                    <Calendar size={14} />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-tight">{new Date(log.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                                    <Clock size={14} />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-tight">{new Date(log.date).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                                    <MapPin size={14} />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-tight">{log.location}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                                    <Globe size={14} />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-tight">Tax State: {log.jurisdiction}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                            <span className="w-8 h-px bg-slate-900 dark:bg-blue-500/50"></span>
                                            Vehicle & Driver
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                                    <Truck size={14} />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-tight">Truck: {log.truckId}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                                    <User size={14} />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-tight">Driver: {log.driverId}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                            <span className="w-8 h-px bg-slate-900 dark:bg-blue-500/50"></span>
                                            Visual Evidence
                                        </h4>
                                        <div className="grid grid-cols-1 gap-6">
                                            {/* Receipt */}
                                            <div className="space-y-3">
                                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Fuel Receipt</p>
                                                <FilePreview url={log.receiptUrl} label="Receipt" fallbackIcon={<FileText size={32} />} />
                                            </div>

                                            {/* Odometer */}
                                            <div className="space-y-3">
                                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Odometer Verification</p>
                                                <FilePreview url={log.odometerImageUrl} label="Odometer" fallbackIcon={<Camera size={32} />} />
                                            </div>
                                        </div>
                                    </div>

                                    {log.notes && (
                                        <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 space-y-3 transition-colors">
                                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                                <AlertTriangle size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Dispatcher Notes</span>
                                            </div>
                                            <p className="text-[11px] font-medium text-amber-800 dark:text-amber-200 leading-relaxed italic">
                                                "{log.notes}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-10 border-t border-slate-50 dark:border-slate-800 flex gap-4 bg-[#fafafa]/50 dark:bg-slate-800/30">
                            <button className="flex-1 h-14 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95 border border-slate-100 dark:border-slate-800 shadow-sm">
                                Report Discrepancy
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-1 h-14 bg-gray-900 dark:bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-800 dark:hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-gray-900/10 dark:shadow-blue-600/20"
                            >
                                <Download size={16} /> Export Analysis
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default FuelDetailsModal;
