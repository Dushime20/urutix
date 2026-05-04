import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';
import { cn } from '../../utils/cn';

interface ModernLoaderProps {
  isLoading: boolean;
  text?: string;
  containerRelative?: boolean;
}

const ModernLoader: React.FC<ModernLoaderProps> = ({ 
  isLoading, 
  text = "Syncing_Data",
  containerRelative = false
}) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "z-[9999] flex items-center justify-center overflow-hidden bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl",
            containerRelative ? "absolute inset-0 rounded-[inherit]" : "fixed inset-0 z-[999999]"
          )}
        >
          {/* Cloud/Nebula Aesthetic Background Blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                x: [0, 100, -50, 0],
                y: [0, -50, 50, 0],
                scale: [1, 1.2, 0.9, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-400/10 blur-[100px] dark:bg-blue-600/5"
            />
            <motion.div
              animate={{
                x: [0, -100, 50, 0],
                y: [0, 100, -50, 0],
                scale: [1, 1.1, 1.2, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[100px] dark:bg-indigo-600/5"
            />
            <motion.div
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-slate-200/20 blur-[80px] dark:bg-slate-800/10"
            />
          </div>

          {/* Central Content */}
          <div className="relative flex flex-col items-center">
            {/* Logo with pulsing effect */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: 1
              }}
              transition={{
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                opacity: { duration: 0.5 }
              }}
              className="mb-8"
            >
              <img 
                src={logoUrutiX} 
                alt="UrutiX" 
                className="h-16 md:h-24 w-auto object-contain drop-shadow-2xl" 
              />
            </motion.div>

            {/* Spinner and Text */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-12 h-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-[#345E85] dark:border-t-blue-500"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border-2 border-slate-50 dark:border-slate-900 border-b-[#345E85]/50 dark:border-b-blue-400/30"
                />
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500"
                >
                  {text}
                </motion.p>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1 h-1 rounded-full bg-[#345E85] dark:bg-blue-400"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModernLoader;
