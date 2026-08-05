import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Wrench, AlertTriangle, Truck, History, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { driverApi } from '../../services/driverApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface MaintenanceTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  truckId: string;
  truckPlate: string;
}

export const MaintenanceTicketModal: React.FC<MaintenanceTicketModalProps> = ({
  isOpen,
  onClose,
  truckId,
  truckPlate
}) => {
  const { tSync: t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    taskName: '',
    description: '',
    type: 'FAULT_REPORT',
    odometerReading: ''
  });

  const mutation = useMutation({
    mutationFn: (data: any) => driverApi.reportTruckFault(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['truck-maintenance', truckId] });
      toast.success(t('Maintenance ticket submitted successfully'));
      onClose();
      setFormData({ taskName: '', description: '', type: 'FAULT_REPORT', odometerReading: '' });
    },
    onError: () => {
      toast.error(t('Failed to submit maintenance ticket'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.taskName || !formData.description) {
      toast.error(t('Please fill in all required fields'));
      return;
    }

    mutation.mutate({
      truckId,
      taskName: formData.taskName,
      description: formData.description,
      type: formData.type,
      odometerReading: formData.odometerReading ? parseInt(formData.odometerReading) : undefined
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none rounded-[2.5rem] shadow-2xl">
        <div className="bg-[#0F172A] p-8 text-white relative h-32 flex items-center overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
           <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                 <Wrench size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1"><TranslatedText text="Fleet Maintenance" /></p>
                 <h2 className="text-xl font-black uppercase tracking-tight"><TranslatedText text="Open Maintenance Ticket" /></h2>
              </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><TranslatedText text="Assigned Truck" /></Label>
                    <div className="h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 flex items-center gap-3">
                       <Truck size={14} className="text-[#345E85]" />
                       <span className="text-xs font-black text-slate-700 dark:text-slate-300">{truckPlate}</span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><TranslatedText text="Issue Priority" /></Label>
                    <select 
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#345E85] transition-all"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                       <option value="FAULT_REPORT">{t('Standard Fault')}</option>
                       <option value="REPAIR">{t('Urgent Repair')}</option>
                       <option value="EMERGENCY">{t('Emergency (AOG)')}</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-2">
                 <Label htmlFor="taskName" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><TranslatedText text="Issue Headline" /></Label>
                 <Input 
                   id="taskName"
                   placeholder={t('e.g., Brake pad grinding noise, Left headlight out')}
                   className="h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 text-xs font-bold placeholder:text-slate-300 focus:ring-[#345E85]"
                   value={formData.taskName}
                   onChange={(e) => setFormData({...formData, taskName: e.target.value})}
                 />
              </div>

              <div className="space-y-2">
                 <Label htmlFor="description" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><TranslatedText text="Detailed Observations" /></Label>
                 <Textarea 
                   id="description"
                   placeholder={t('Describe what you hear, feel, or see in detail...')}
                   className="min-h-[100px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-xs font-bold placeholder:text-slate-300 focus:ring-[#345E85] resize-none"
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                 />
              </div>

              <div className="space-y-2">
                 <Label htmlFor="odo" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><TranslatedText text="Current Odometer (Optional)" /></Label>
                 <Input 
                   id="odo"
                   type="number"
                   placeholder="124502"
                   className="h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 text-xs font-bold placeholder:text-slate-300 focus:ring-[#345E85]"
                   value={formData.odometerReading}
                   onChange={(e) => setFormData({...formData, odometerReading: e.target.value})}
                 />
              </div>
           </div>

           <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                 <TranslatedText text="Cancel" />
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-[#345E85] text-white hover:bg-slate-900 shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2"
              >
                 {mutation.isPending ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   <>
                     <Send size={16} />
                     <TranslatedText text="Submit Ticket" />
                   </>
                 )}
              </Button>
           </div>

           <p className="mt-4 text-center text-[8px] font-black text-slate-300 uppercase tracking-widest italic flex items-center justify-center gap-2">
              <AlertTriangle size={10} className="text-amber-500" /> <TranslatedText text="Maintenance team will review within 2 hours" />
           </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
