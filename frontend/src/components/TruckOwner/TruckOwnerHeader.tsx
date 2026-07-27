import React, { useState } from 'react';
import {
  Bell,
  Search,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Truck,
  FileText,
  CreditCard,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import CargoOwnerNotificationDropdown from '../notifications/CargoOwnerNotificationDropdown';
import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';
import { motion, AnimatePresence } from 'framer-motion';

interface TruckOwnerHeaderProps {
  onMenuClick?: () => void;
  showSearch?: boolean;
  className?: string;
}

const TruckOwnerHeader: React.FC<TruckOwnerHeaderProps> = ({
  onMenuClick,
  showSearch = true,
  className = '',
}) => {
  const { user, logout } = useAuth();
  const { tSync } = useTranslation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  const navigationItems = [
    { icon: Truck, label: 'Fleet Dashboard', href: '/dashboard/fleet' },
    { icon: CreditCard, label: 'Credits', href: '/dashboard/fleet/credits' },
    { icon: FileText, label: 'Trips', href: '/dashboard/fleet/trips' },
  ];

  return (
    <header className={`bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            )}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logoUrutiX} alt="UrutiX" className="h-8 sm:h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                <TranslatedText text="Truck Owner Portal" />
              </h1>
            </div>
          </div>
        </div>

        {/* Center Section - Search */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={tSync('Search fleet, trips, analytics...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications - Hidden on mobile as it's in the bottom nav */}
          <div className="hidden lg:block">
            <CargoOwnerNotificationDropdown />
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <TranslatedText text="Truck Owner" />
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user?.email}
                    </p>
                  </div>

                  <div className="py-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <User className="w-4 h-4" />
                      <TranslatedText text="Profile Settings" />
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Settings className="w-4 h-4" />
                      <TranslatedText text="Account Settings" />
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <TranslatedText text="Sign Out" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <div className="px-4 py-4 space-y-2">
              {/* Mobile Search */}
              {showSearch && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={tSync('Search fleet, trips, analytics...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Navigation Items */}
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <TranslatedText text={item.label} />
                </a>
              ))}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default TruckOwnerHeader;