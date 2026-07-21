import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  MessageSquare,
  MessageCircle,
  Truck,
  User,
  Package,
  Phone,
  Zap,
  AppWindow,
  ArrowUpRight
} from 'lucide-react';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface ContactInfo {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  inAppId?: string;
  icon: any;
}

interface CommunicationRelayProps {
  isOpen: boolean;
  onClose: () => void;
  trip?: any;
  onInAppMessage?: (recipientId: string) => void;
}

export const CommunicationRelay: React.FC<CommunicationRelayProps> = ({
  isOpen,
  onClose,
  trip,
  onInAppMessage
}) => {
  const { tSync: t } = useTranslation();
  const [draftMessage, setDraftMessage] = React.useState('');

  // Extract contacts from trip or use defaults for demo
  const contacts: ContactInfo[] = [
    {
      name: trip?.customer?.name || 'Global Logistics Solutions',
      role: t('The Shipper'),
      phone: trip?.customer?.phone || '+256 700 000 000',
      email: trip?.customer?.email || 'shipper@example.com',
      whatsapp: trip?.customer?.phone || '+256 700 000 000',
      inAppId: 'shipper-123',
      icon: Package
    },
    {
      name: trip?.destination?.contactPerson || 'Express Delivery Hub',
      role: t('The Receiver'),
      phone: trip?.destination?.phone || '+256 701 111 222',
      email: trip?.destination?.email || 'receiver@example.com',
      whatsapp: trip?.destination?.phone || '+256 701 111 222',
      inAppId: 'receiver-456',
      icon: User
    },
    {
      name: 'Eagle Fleet Management',
      role: t('Truck Owner'),
      phone: '+256 705 555 666',
      email: 'fleet@eagle.com',
      whatsapp: '+256 705 555 666',
      inAppId: 'owner-789',
      icon: Truck
    },
    {
      name: 'UrutiX Hub',
      role: t('UrutiX Support'),
      phone: '+256 800 123 456',
      email: 'support@urutix.com',
      whatsapp: '+256 800 123 456',
      inAppId: 'dispatch-hub',
      icon: Zap
    }
  ];

  const handleAction = (type: 'email' | 'sms' | 'whatsapp' | 'inapp', contact: ContactInfo) => {
    const body = encodeURIComponent(draftMessage);
    switch (type) {
      case 'email':
        window.location.href = `mailto:${contact.email}?body=${body}`;
        break;
      case 'sms':
        // For Android and iOS compatibility
        const separator = (navigator.userAgent.match(/iPhone|iPad|iPod/i)) ? '&' : '?';
        window.location.href = `sms:${contact.phone}${separator}body=${body}`;
        break;
      case 'whatsapp':
        const cleanPhone = contact.whatsapp?.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${body}`, '_blank');
        break;
      case 'inapp':
        onInAppMessage?.(contact.inAppId || '');
        onClose();
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
          >
            {/* Header */}
            <div className="bg-[#0f172a] px-10 py-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1"><TranslatedText text="Get In Touch" /></h3>
                    <p className="text-xl font-black text-white uppercase tracking-tight"><TranslatedText text="Send a Message" /></p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contacts.map((contact, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-50 rounded-[2rem] border border-slate-200 p-6 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 group-hover:rotate-12 transition-transform">
                          <contact.icon size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text={contact.role} /></p>
                          <h4 className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{contact.name}</h4>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                       <button
                        onClick={() => handleAction('whatsapp', contact)}
                        className="w-full aspect-square rounded-2xl bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center gap-1 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 group/btn"
                        title={t('WhatsApp')}
                      >
                        <MessageCircle size={14} className="group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[7px] font-black uppercase tracking-tighter">WA</span>
                      </button>
                      
                      <button
                        onClick={() => handleAction('sms', contact)}
                        className="w-full aspect-square rounded-2xl bg-blue-50 text-blue-600 flex flex-col items-center justify-center gap-1 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 group/btn"
                        title={t('SMS')}
                      >
                        <MessageSquare size={14} className="group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[7px] font-black uppercase tracking-tighter">SMS</span>
                      </button>

                      <button
                        onClick={() => handleAction('email', contact)}
                        className="w-full aspect-square rounded-2xl bg-slate-100 text-slate-600 flex flex-col items-center justify-center gap-1 hover:bg-slate-600 hover:text-white transition-all border border-slate-200 group/btn"
                        title={t('Email')}
                      >
                        <Mail size={14} className="group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[7px] font-black uppercase tracking-tighter">Mail</span>
                      </button>

                      <button
                        onClick={() => handleAction('inapp', contact)}
                        className="w-full aspect-square rounded-2xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center gap-1 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 group/btn"
                        title={t('In-App Messenger')}
                      >
                        <AppWindow size={14} className="group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[7px] font-black uppercase tracking-tighter">App</span>
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between group/call">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover/call:bg-emerald-50 group-hover/call:text-emerald-500 transition-colors">
                                <Phone size={10} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">{contact.phone}</span>
                        </div>
                        <a href={`tel:${contact.phone}`} className="p-1 rounded bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                            <ArrowUpRight size={14} />
                        </a>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <MessageSquare size={16} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Type your message here" /></p>
                  </div>
                  <textarea 
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    placeholder={t('e.g. I have arrived at the pickup location.')}
                    className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none"
                  />
                  <p className="text-[9px] text-slate-400 mt-2 italic"><TranslatedText text="* We will put this text into your SMS or WhatsApp for you." /></p>
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Zap size={18} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest"><TranslatedText text="Support Line" /></p>
                    <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight"><TranslatedText text="Need help? We are online 24/7" /></p>
                 </div>
                 <button className="ml-auto px-5 py-2.5 bg-white border border-blue-200 text-[#345E85] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors shadow-sm">
                    <TranslatedText text="Contact Now" />
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
