import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  MapPin,
  Calendar,
  Clock,
  Truck,
  FileText,
  Edit,
  Trash2,
  Shield,
  Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface IncidentDetailModalProps {
  incident: any;
  onClose: () => void;
  onEdit: (incident: any) => void;
  onDelete: (incidentId: string) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { tSync: t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case 'ACCIDENT':
      case 'accident':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'NEAR_MISS':
      case 'near_miss':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'INJURY':
      case 'injury':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'PROPERTY_DAMAGE':
      case 'property_damage':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'TRAFFIC_VIOLATION':
      case 'traffic_violation':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getIncidentSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MAJOR':
      case 'major':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'MODERATE':
      case 'moderate':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MINOR':
      case 'minor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
      case 'resolved':
      case 'closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INVESTIGATING':
      case 'investigating':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'REPORTED':
      case 'reported':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('N/A');
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    onDelete(incident.id);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-6 h-6" />
                  <h2 className="text-2xl font-black"><TranslatedText text="Incident Details" /></h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase bg-white/20 border-white/30 text-white")}>
                    <TranslatedText text={incident.type.replace('_', ' ')} />
                  </span>
                  <span className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase bg-white/20 border-white/30 text-white")}>
                    <TranslatedText text={incident.severity} />
                  </span>
                  <span className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase bg-white/20 border-white/30 text-white")}>
                    <TranslatedText text={incident.status} />
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-2"><TranslatedText text="Description" /></h3>
              <p className="text-slate-900 dark:text-white">{incident.description}</p>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider"><TranslatedText text="Date & Time" /></span>
                  </div>
                  <p className="text-slate-900 dark:text-white font-bold">{formatDate(incident.date)}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider"><TranslatedText text="Location" /></span>
                  </div>
                  <p className="text-slate-900 dark:text-white font-bold">{incident.location}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Truck className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider"><TranslatedText text="Truck" /></span>
                  </div>
                  <p className="text-slate-900 dark:text-white font-bold">{incident.truckPlate || t('N/A')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider"><TranslatedText text="Police Report" /></span>
                  </div>
                  <p className="text-slate-900 dark:text-white font-bold">{incident.policeReport ? <TranslatedText text="Yes" /> : <TranslatedText text="No" />}</p>
                  {incident.policeReport && incident.reportNumber && (
                    <p className="text-xs text-slate-500 mt-1"><TranslatedText text="Report #:" /> {incident.reportNumber}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider"><TranslatedText text="Insurance Claim" /></span>
                  </div>
                  <p className="text-slate-900 dark:text-white font-bold">{incident.insuranceClaim ? <TranslatedText text="Yes" /> : <TranslatedText text="No" />}</p>
                  {incident.insuranceClaim && incident.claimNumber && (
                    <p className="text-xs text-slate-500 mt-1"><TranslatedText text="Claim #:" /> {incident.claimNumber}</p>
                  )}
                </div>

                {incident.cost > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider"><TranslatedText text="Estimated Cost" /></span>
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold">${Number(incident.cost).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Conditions */}
            {(incident.weatherConditions || incident.roadConditions) && (
              <div className="mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-3"><TranslatedText text="Conditions" /></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incident.weatherConditions && (
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1"><TranslatedText text="Weather" /></p>
                      <p className="text-slate-900 dark:text-white">{incident.weatherConditions}</p>
                    </div>
                  )}
                  {incident.roadConditions && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1"><TranslatedText text="Road Conditions" /></p>
                      <p className="text-slate-900 dark:text-white">{incident.roadConditions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Injuries */}
            {incident.injuries && (
              <div className="mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-2"><TranslatedText text="Injuries" /></h3>
                <div className="p-4 bg-rose-50 rounded-xl">
                  <p className="text-slate-900 dark:text-white">{incident.injuries}</p>
                </div>
              </div>
            )}

            {/* Corrective Actions */}
            {incident.correctiveActions && incident.correctiveActions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-3"><TranslatedText text="Corrective Actions" /></h3>
                <ul className="space-y-2">
                  {incident.correctiveActions.map((action: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                      <span className="text-emerald-600 mt-0.5 font-bold">✓</span>
                      <span className="text-slate-900 dark:text-white">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Assigned To */}
            {incident.assignedTo && (
              <div className="mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-2"><TranslatedText text="Assigned To" /></h3>
                <p className="text-slate-900 dark:text-white font-bold">{incident.assignedTo}</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-800/50">
            {showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-300"><TranslatedText text="Are you sure you want to delete this incident?" /></p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors"
                  >
                    <TranslatedText text="Cancel" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    <TranslatedText text="Delete" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors"
                >
                  <TranslatedText text="Close" />
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <TranslatedText text="Delete" />
                  </button>
                  <button
                    onClick={() => onEdit(incident)}
                    className="px-4 py-2 bg-[#345E85] hover:bg-[#2a4d6d] text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    <TranslatedText text="Edit" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
