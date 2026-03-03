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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
                    >
                        {/* Header Image/Background */}
                        <div className="h-32 bg-[#1A1C1E] relative overflow-hidden flex items-center px-10">
                            <div className="absolute top-0 right-0 p-10 opacity-10 scale-[2] pointer-events-none">
                                <Fuel size={120} className="text-white" />
                            </div>
                            <div className="relative z-10 flex items-center justify-between w-full">
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-400 mb-1">Details</h2>
                                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">ID: {log.id.substring(0, 8)}</h1>
                                </div>
                                <button onClick={onClose} className="size-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-10 space-y-8 overflow-y-auto">
                            {/* Key Stats Row */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Cost</p>
                                    <p className="text-xl font-black text-slate-900">${log.totalCost.toFixed(2)}</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={14} className="text-emerald-500" />
                                        <p className="text-xl font-black text-slate-900">7.2 <span className="text-[10px] text-slate-400">MPG</span></p>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.status === 'verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                        }`}>
                                        {log.status}
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Time & Location</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Calendar size={14} className="text-slate-400" />
                                                <span className="text-[11px] font-bold uppercase tracking-wide">{new Date(log.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Clock size={14} className="text-slate-400" />
                                                <span className="text-[11px] font-bold uppercase tracking-wide">{new Date(log.date).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <MapPin size={14} className="text-slate-400" />
                                                <span className="text-[11px] font-bold uppercase tracking-wide">{log.location}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Globe size={14} className="text-slate-400" />
                                                <span className="text-[11px] font-bold uppercase tracking-wide">Tax State: {log.jurisdiction}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Vehicle & Driver</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Truck size={14} className="text-slate-400" />
                                                <span className="text-[11px] font-bold uppercase tracking-wide">Truck: {log.truckId}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <User size={14} className="text-slate-400" />
                                                <span className="text-[11px] font-bold uppercase tracking-wide">Driver: {log.driverId}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Photos</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Receipt Photo */}
                                            <div className="space-y-2">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Fuel Receipt</p>
                                                <div className="aspect-[16/9] bg-slate-50 rounded-[24px] border border-slate-100 relative group overflow-hidden">
                                                    {log.receiptUrl ? (
                                                        <>
                                                            <img src={log.receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                                <button className="p-2.5 bg-white text-slate-900 rounded-lg hover:scale-110 transition-transform">
                                                                    <ExternalLink size={14} />
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                                            <FileText size={24} />
                                                            <p className="text-[8px] font-black uppercase tracking-widest">No receipt image</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Odometer Photo */}
                                            <div className="space-y-2">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Odometer Capture</p>
                                                <div className="aspect-[16/9] bg-slate-50 rounded-[24px] border border-slate-100 relative group overflow-hidden">
                                                    {log.odometerImageUrl ? (
                                                        <>
                                                            <img src={log.odometerImageUrl} alt="Odometer" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                                <button className="p-2.5 bg-white text-slate-900 rounded-lg hover:scale-110 transition-transform">
                                                                    <ExternalLink size={14} />
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                                            <Camera size={24} />
                                                            <p className="text-[8px] font-black uppercase tracking-widest">No odometer image</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {log.notes && (
                                        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                                            <div className="flex items-center gap-2 text-amber-600">
                                                <AlertTriangle size={14} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Important Notes</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-amber-800 leading-relaxed italic">
                                                "{log.notes}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Protocol */}
                        <div className="p-8 border-t border-slate-50 flex gap-4">
                            <button className="flex-1 h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95 border border-slate-100">
                                Report Issue
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-1 h-12 bg-primary-50 text-primary-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-primary-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Download size={14} /> Download
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default FuelDetailsModal;
