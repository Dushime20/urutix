import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'system', icon: Monitor, label: 'System' }
            ].map(({ id, icon: Icon, label }) => {
                const isActive = theme === id;
                return (
                    <button
                        key={id}
                        onClick={() => setTheme(id as any)}
                        className={`relative p-2 rounded-lg transition-all flex items-center justify-center group ${
                            isActive 
                                ? 'text-indigo-600 dark:text-indigo-400' 
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                        title={label}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-theme"
                                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <Icon size={16} className="relative z-10" />
                    </button>
                );
            })}
        </div>
    );
};

export default ThemeToggle;
