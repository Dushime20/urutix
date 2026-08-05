import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Cpu, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Info,
  Terminal,
  Activity,
  Maximize2,
  ChevronRight
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: 'text' | 'tactical_card' | 'recommendation';
  timestamp: Date;
}

interface TacticalAiAssistantProps {
  currentTrip?: any;
  driverName?: string;
}

export const TacticalAiAssistant: React.FC<TacticalAiAssistantProps> = ({ 
  currentTrip, 
  driverName 
}) => {
  const { format: formatCurrency } = useCurrencyFormat();
  const { tSync: t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: t(`Tactical AI initialized. Welcome back, ${driverName || t('Commander')}. Systems nominal. How can I assist your mission today?`),
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleSend = (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // AI Response Simulation
    setTimeout(() => {
      let aiResponse = t("I'm analyzing that request against current mission protocols...");
      
      const lowerText = text.toLowerCase();
      if (lowerText.includes('route') || lowerText.includes('traffic')) {
        aiResponse = currentTrip 
          ? t(`Analysis complete. Route to ${currentTrip.destination.city} is currently status: OPTIMAL. Avoid the Bypass due to construction. Save: 8 mins.`)
          : t("No active mission detected. I recommend checking for high-yield assignments in the Mission Hub.");
      } else if (lowerText.includes('fuel')) {
        aiResponse = t(`Scanning for optimized refill nodes... Smart Fuel Finder suggests 'PetroPlus' at km 142 (${formatCurrency(5.23)}/gal). Efficiency would increase by 4%.`);
      } else if (lowerText.includes('weather')) {
        aiResponse = t("Meteorological forecast: Sunny, 24°C in your current corridor. Visibility is at 100%. No atmospheric disruptions expected for 4 hours.");
      } else if (lowerText.includes('thanks') || lowerText.includes('thank')) {
        aiResponse = t("Operational excellence is my directive. Safe driving, Commander.");
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 2500);
  };

  // Helper icons due to lucide mapping
  const MsgSquareIcon = MessageSquare;
  const CloudIcon = ShieldCheck;

  const quickGestures = [
    { label: "Optimize Route", icon: Zap },
    { label: "Fuel Scan", icon: MsgSquareIcon },
    { label: "Weather Intel", icon: CloudIcon },
    { label: "Mission Summary", icon: Info }
  ];


  return (
    <>
      {/* Floating Tactical Bubble */}
      <motion.button
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 lg:bottom-8 right-6 lg:right-8 z-[250] w-14 h-14 lg:w-16 lg:h-16 rounded-[2rem] bg-[#0F172A] border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-2xl shadow-blue-500/20 group",
          isOpen && "opacity-0 pointer-events-none"
        )}
        aria-label={t('Open Mission Assistant')}
      >

        <div className="absolute inset-0 bg-blue-500/10 rounded-[2rem] animate-ping group-hover:animate-none" />
        <Cpu size={28} className="relative z-10 transition-transform group-hover:rotate-12" />
        
        {/* Unread Alert */}
        <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0F172A] shadow-sm animate-pulse" />
      </motion.button>

      {/* Chat Terminal Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, y: 50, filter: 'blur(10px)' }}
            className="fixed bottom-0 lg:bottom-8 right-0 lg:right-8 z-[300] w-full lg:w-[400px] h-full lg:h-[600px] bg-white dark:bg-slate-900 rounded-none lg:rounded-[3rem] shadow-[0_20px_80px_rgba(15,23,42,0.3)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col"
          >

            {/* Terminal Header */}
            <div className="bg-[#0F172A] p-6 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Terminal size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]"><TranslatedText text="AI Tactical Engine" /></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight"><TranslatedText text="Mission Assistant v4.0" /></h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400" title={t('Maximize')}>
                    <Maximize2 size={16} />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400"
                    title={t('Close')}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Status Banner */}
            <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
               <div className="flex items-center gap-2 text-[8px] font-black text-blue-600 uppercase tracking-widest">
                  <Activity size={10} />
                  <TranslatedText text="Processing Capability: 98%" />
               </div>
               <div className="text-[8px] font-black text-slate-400 uppercase italic">
                  <TranslatedText text="End-to-End Encryption Enabled" />
               </div>
            </div>

            {/* Chat Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-transparent">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.role === 'ai' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex flex-col gap-1.5",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "px-5 py-3.5 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none italic"
                  )}>
                    {msg.content}
                    <div className={cn(
                      "text-[8px] mt-1.5 uppercase font-black tracking-widest block opacity-40",
                      msg.role === 'user' ? "text-right" : "text-left"
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-1 text-[8px] font-black text-blue-400 uppercase tracking-widest ml-1">
                       <Sparkles size={8} /> <TranslatedText text="Verified Tactical Insight" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl w-fit">
                   <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1 h-1 bg-blue-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, delay: 0.2, repeat: Infinity }} className="w-1 h-1 bg-blue-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, delay: 0.4, repeat: Infinity }} className="w-1 h-1 bg-blue-400 rounded-full" />
                   </div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic"><TranslatedText text="AI analyzing matrix..." /></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Gestures */}
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950 border-t border-slate-50 flex items-center gap-3 overflow-x-auto no-scrollbar">
              {quickGestures.map((gesture, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSend(gesture.label)}
                  className="whitespace-nowrap flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-[9px] font-black text-blue-600 uppercase tracking-widest shadow-sm hover:border-blue-300 hover:text-blue-700 transition-all active:scale-95"
                >
                  <gesture.icon size={10} />
                  <TranslatedText text={gesture.label} />
                </button>
              ))}
            </div>

            {/* Terminal Input */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
               <div className="relative group">
                  <Terminal size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder={t("Enter command or query...")}
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl pl-13 pr-16 text-xs font-bold text-slate-700 dark:text-slate-300 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <button 
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#0F172A] text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all mt-[-1px]"
                    aria-label={t('Send message')}
                  >
                    <ChevronRight size={18} />
                  </button>
               </div>
               <p className="mt-4 text-center text-[8px] font-black text-slate-300 uppercase tracking-widest italic flex items-center justify-center gap-3">
                  <ShieldCheck size={10} className="text-emerald-500" /> <TranslatedText text="System: All interactions are training-set secured" />
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
