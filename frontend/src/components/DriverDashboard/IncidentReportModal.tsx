import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  X, 
  Car, 
  Wrench, 
  ShieldAlert, 
  HelpCircle,
  MapPin,
  FileText,
  Camera,
  CheckCircle,
  Navigation,
  Activity,
  DollarSign
} from 'lucide-react';
import { TranslatedText } from '../translated-text';
import { driverApi } from '../../services/driverApi';
import { documentApi } from '../../services/documents/documentApi';
import { Upload, File } from 'lucide-react';
import toast from 'react-hot-toast';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({ 
  isOpen, 
  onClose, 
  driverId 
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    type: '',
    severity: 'moderate',
    description: '',
    location: '',
    policeReport: false,
    reportNumber: '',
    insuranceClaim: false,
    claimNumber: '',
    amount: '',
    date: new Date().toISOString()
  });

  const incidentTypes = [
    { id: 'accident', title: 'Accident', icon: Car, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'near_miss', title: 'Near Miss', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'expense', title: 'Trip Fee/Expense', icon: DollarSign, color: 'text-[#345E85]', bg: 'bg-blue-50' },
    { id: 'property_damage', title: 'Damage', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'hazard', title: 'Road Hazard', icon: ShieldAlert, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'other', title: 'Other', icon: HelpCircle, color: 'text-slate-600', bg: 'bg-slate-50' }
  ];

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      toast.loading('Fetching GPS coordinates...', { id: 'gps-fetch' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ ...prev, location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
          toast.success('Location tagged successfully!', { id: 'gps-fetch' });
        },
        (error) => {
          console.error('GPS Error:', error);
          toast.error('Failed to get location. Please enter manually.', { id: 'gps-fetch' });
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await driverApi.reportIncident(driverId, formData);
      
      // If a file is selected, upload it as a supporting document
      if (selectedFile) {
        try {
          await documentApi.createDocument({
            entityType: 'DRIVER',
            entityId: driverId,
            documentType: formData.type === 'expense' ? 'EXPENSE_RECEIPT' : 'INCIDENT_PHOTO',
            category: formData.type === 'expense' ? 'FINANCIAL' : 'SAFETY',
            title: `${formData.type === 'expense' ? 'Receipt' : 'Incident Proof'} - ${new Date().toLocaleDateString()}`,
            description: formData.description,
            priority: formData.severity.toUpperCase() as any,
          }, selectedFile);
        } catch (uploadError) {
          console.error('Failed to upload document:', uploadError);
          toast.error('Incident reported, but photo upload failed.');
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setStep(1);
        setFormData({
          type: '',
          severity: 'moderate',
          description: '',
          location: '',
          policeReport: false,
          reportNumber: '',
          insuranceClaim: false,
          claimNumber: '',
          amount: '',
          date: new Date().toISOString()
        });
        setSelectedFile(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to report incident:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <motion.div 
            initial={{ width: '33.3%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
            className="h-full bg-[#345E85] rounded-r-full"
          />
        </div>

        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-tight">
                <TranslatedText text="Report Safety Incident" />
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                <TranslatedText text={`Step ${step} of 3`} />
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} />
                </div>
                <h4 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">
                  <TranslatedText text="Incident Reported" />
                </h4>
                <p className="text-sm font-bold text-slate-500 mt-2">
                  <TranslatedText text="Management has been alerted. Stay safe!" />
                </p>
              </motion.div>
            ) : step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {incidentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFormData({ ...formData, type: type.id })}
                      className={`p-6 rounded-[2rem] border-2 transition-all group flex flex-col items-center gap-3 ${
                        formData.type === type.id 
                          ? 'border-[#345E85] bg-blue-50/50' 
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${type.bg} ${type.color}`}>
                        <type.icon size={24} />
                      </div>
                      <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest text-center">
                        <TranslatedText text={type.title} />
                      </span>
                    </button>
                  ))}
                </div>
                
                <div className="pt-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                    <TranslatedText text="Severity Level" />
                  </label>
                  <div className="flex gap-2">
                    {['minor', 'moderate', 'major', 'critical'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFormData({ ...formData, severity: s as any })}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          formData.severity === s 
                            ? 'bg-[#345E85] text-white shadow-lg' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <TranslatedText text={s} />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : step === 2 ? (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      <TranslatedText text="Description of Events" />
                    </label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={formData.type === 'expense' ? "What was this fee for? (e.g. Parking, Local Tax)" : "What happened?"}
                      className="w-full h-32 px-5 py-4 rounded-2xl border border-slate-100 focus:border-[#345E85] focus:outline-none transition-all text-sm font-bold text-[#0f172a] placeholder:text-slate-300 resize-none"
                    />
                  </div>
                  {formData.type === 'expense' && (
                    <div className="animate-in slide-in-from-top-4">
                      <label className="text-[10px] font-black text-[#345E85] uppercase tracking-widest mb-2 block">
                        <TranslatedText text="Expense Amount Paid ($)" />
                      </label>
                      <div className="relative">
                        <DollarSign size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#345E85]" />
                        <input 
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-12 pr-5 h-16 rounded-2xl border-2 border-blue-100 bg-blue-50/30 text-2xl font-black text-[#0f172a] focus:border-[#345E85] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        <TranslatedText text="Location" />
                      </label>
                      <button 
                        type="button"
                        onClick={handleGetLocation}
                        className="flex items-center gap-1.5 text-[8px] font-black text-[#345E85] uppercase tracking-widest hover:text-blue-700 transition-colors"
                      >
                        <Navigation size={10} />
                        Auto-Tag GPS
                      </button>
                    </div>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Current address or coordinates"
                        className="w-full pl-12 pr-5 py-4 rounded-xl border border-slate-100 focus:border-[#345E85] text-sm font-bold text-[#0f172a]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  {/* Police Report */}
                  <div className={`p-6 rounded-3xl border-2 transition-all ${formData.policeReport ? 'border-indigo-100 bg-indigo-50/20' : 'border-slate-50 bg-slate-50/30'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Navigation size={20} className="text-indigo-500" />
                        <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">
                          <TranslatedText text="Police Report Involved?" />
                        </span>
                      </div>
                      <button 
                        onClick={() => setFormData({ ...formData, policeReport: !formData.policeReport })}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.policeReport ? 'bg-indigo-500' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.policeReport ? 'translate-x-6' : ''}`} />
                      </button>
                    </div>
                    {formData.policeReport && (
                      <input 
                        type="text"
                        value={formData.reportNumber}
                        onChange={(e) => setFormData({ ...formData, reportNumber: e.target.value })}
                        placeholder="Police Report Number"
                        className="w-full px-5 py-3 rounded-xl border border-indigo-100 bg-white text-sm font-bold text-[#0f172a] placeholder:text-slate-300"
                      />
                    )}
                  </div>

                  {/* Insurance Claim */}
                  <div className={`p-6 rounded-3xl border-2 transition-all ${formData.insuranceClaim ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-50 bg-slate-50/30'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">
                          <TranslatedText text="Insurance Claim Initiated?" />
                        </span>
                      </div>
                      <button 
                        onClick={() => setFormData({ ...formData, insuranceClaim: !formData.insuranceClaim })}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.insuranceClaim ? 'bg-emerald-500' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.insuranceClaim ? 'translate-x-6' : ''}`} />
                      </button>
                    </div>
                    {formData.insuranceClaim && (
                      <input 
                        type="text"
                        value={formData.claimNumber}
                        onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
                        placeholder="Insurance Claim Number"
                        className="w-full px-5 py-3 rounded-xl border border-emerald-100 bg-white text-sm font-bold text-[#0f172a] placeholder:text-slate-300"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block">
                    <TranslatedText text="Photo/Document Proof" />
                  </label>
                  
                  <div 
                    onClick={() => document.getElementById('incident-file-upload')?.click()}
                    className={`relative p-10 rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group ${
                      selectedFile 
                        ? 'border-emerald-200 bg-emerald-50/20' 
                        : 'border-slate-100 bg-slate-50/50 hover:border-[#345E85] hover:bg-blue-50/30'
                    }`}
                  >
                    <input 
                      id="incident-file-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                      accept="image/*,.pdf"
                    />

                    {selectedFile ? (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <File size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-[#0f172a] truncate max-w-[250px]">{selectedFile.name}</p>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                            {documentApi.formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          className="px-6 py-2 bg-white border border-rose-100 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 text-[#345E85] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Camera size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">
                            <TranslatedText text="Snap Photo or Upload" />
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 mt-1">
                            <TranslatedText text="JPG, PNG or PDF (Max 10MB)" />
                          </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <Upload size={12} />
                          Browse Gallery
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4 p-5 bg-[#345E85]/5 rounded-2xl border border-blue-100/30">
                    <Camera size={20} className="text-[#345E85] shrink-0" />
                    <p className="text-[10px] font-black text-[#345E85] uppercase leading-loose tracking-widest">
                      <TranslatedText text="Proof is required for financial reimbursement and safety validation." />
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-8 pt-0 flex gap-4">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
              >
                <TranslatedText text="Back" />
              </button>
            )}
            <button 
              disabled={loading || (step === 1 && !formData.type)}
              onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
              className="flex-1 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <TranslatedText text={step === 3 ? "Submit Report" : "Continue"} />
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
