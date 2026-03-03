import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search,
    Bell,
    LogOut,
    User,
    Settings,
    Shield,
    ChevronDown,
    Globe,
    Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminHeaderProps {
    searchPlaceholder?: string;
    onSearch?: (value: string) => void;
    customRightContent?: React.ReactNode;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
    searchPlaceholder = "Search...",
    onSearch,
    customRightContent
}) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [searchValue, setSearchValue] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            if (logout) logout();
            navigate('/auth', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
            localStorage.clear();
            window.location.href = '/auth';
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        if (onSearch) onSearch(value);
    };

    return (
        <header className="sticky top-0 z-10 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 h-20 flex items-center justify-between">
            {/* Left: Branding/Search */}
            <div className="flex items-center gap-8 flex-1">
                <div className="hidden lg:flex items-center gap-2">
                    <div className="w-10 h-10 bg-indigo-50 flex items-center justify-center rounded-xl">
                        <Shield className="text-indigo-600 w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-800 tracking-tight leading-none uppercase">
                            Admin<span className="text-indigo-600">Core</span>
                        </h2>
                    </div>
                </div>

                <div className="flex-1 max-w-md relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-4 h-4" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={handleSearchChange}
                        className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-100 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-700 transition-all placeholder-slate-400"
                    />
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1 border-r border-slate-100 pr-4 mr-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Globe size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Moon size={18} />
                    </button>
                    <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Bell size={18} />
                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                    </button>
                </div>

                {customRightContent}

                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-slate-800 leading-none">
                                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Super Admin'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {user?.role?.replace('_', ' ') || 'Platform Owner'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-xs border border-white/20 shadow-sm transition-transform active:scale-95">
                            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'AD'}
                        </div>
                        <ChevronDown className={`text-slate-400 w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 mb-1">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Identity</p>
                                <p className="text-sm font-bold text-slate-800 truncate">{user?.email || 'admin@urutix.com'}</p>
                            </div>

                            <div className="h-px bg-slate-50 mx-4 mb-2"></div>

                            <Link
                                to="/admin/profile"
                                className="w-full px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                                onClick={() => setShowUserMenu(false)}
                            >
                                <User size={16} />
                                <span>Administrative Profile</span>
                            </Link>
                            <Link
                                to="/admin/settings"
                                className="w-full px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                                onClick={() => setShowUserMenu(false)}
                            >
                                <Settings size={16} />
                                <span>Platform Settings</span>
                            </Link>

                            <div className="h-px bg-slate-50 mx-4 my-2"></div>

                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                                <LogOut size={16} />
                                <span>Terminate Session</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
