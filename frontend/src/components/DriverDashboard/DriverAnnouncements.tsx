import React from 'react';
import { 
  Megaphone, 
  ArrowRight, 
  Calendar, 
  Shield, 
  AlertTriangle, 
  Info,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TranslatedText } from '../translated-text';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'URGENT' | 'MAINTENANCE' | 'GENERAL' | 'SAFETY';
  timestamp: string;
  read: boolean;
}

interface DriverAnnouncementsProps {
  announcements?: Announcement[];
  loading?: boolean;
}

export const DriverAnnouncements: React.FC<DriverAnnouncementsProps> = ({ announcements, loading }) => {
  // Only use real data — no mock fallback
  const currentAnnouncements = announcements || [];

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'URGENT':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'SAFETY':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'MAINTENANCE':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      default:
        return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'URGENT':
        return <AlertTriangle className="w-3 h-3" />;
      case 'SAFETY':
        return <Shield className="w-3 h-3" />;
      case 'MAINTENANCE':
        return <Clock className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[1.5rem] p-8 border border-slate-100 shadow-sm min-h-[300px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
          <Megaphone className="w-5 h-5 text-primary-600" />
          <TranslatedText text="Latest Announcements" />
        </h3>
        <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">
          <TranslatedText text="View Archive" />
        </button>
      </div>

      <div className="grid gap-4">
        {currentAnnouncements.map((announcement, index) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group p-6 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100/50 transition-all duration-300 relative overflow-hidden ${!announcement.read ? 'bg-blue-50/20' : ''}`}
          >
            {!announcement.read && (
              <div className="absolute top-0 left-0 w-1 h-full bg-primary-600" />
            )}
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start capitalize">
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${getCategoryStyles(announcement.category)}`}>
                  {getCategoryIcon(announcement.category)}
                  <TranslatedText text={announcement.category} />
                </span>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(announcement.timestamp).toLocaleDateString()}
                </span>
              </div>
              
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-primary-700 transition-colors">
                  {announcement.title}
                </h4>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  {announcement.content}
                </p>
              </div>
              
              <div className="flex justify-end pt-2">
                <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary-600 transition-colors">
                  <TranslatedText text="Read Full Details" /> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
