import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FaShieldAlt, FaSearch, FaBell, FaSignOutAlt,
    FaUser, FaCog
} from 'react-icons/fa';
import { Layers, FileText, Settings, Activity, Users as LucideUsers } from 'lucide-react';
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
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [searchValue, setSearchValue] = useState('');

    // Handle click outside to close menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            if (logout) logout();
            navigate('/auth', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
            // Fallback for immediate cleanup if context fails
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/auth';
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        if (onSearch) {
            onSearch(value);
        }
    };

    const isActive = (path: string) => location.pathname === path;

    const navLinkClass = (path: string) => `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive(path)
        ? 'text-white bg-white/10'
        : 'hover:text-white hover:bg-white/5 text-slate-400'
        }`;

    return (
        <header className="max-w-[1536px] mx-auto flex items-center justify-between px-4 md:px-8 lg:px-12 xl:px-20 py-4 border-b border-white/10">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-500/30">
                        <FaShieldAlt className="text-white text-xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-white leading-none">
                            Admin<span className="text-indigo-400">Panel</span>
                        </h2>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
                            System Administration
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center relative">
                    <FaSearch className="absolute left-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={handleSearchChange}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-72 placeholder-slate-400 transition-all"
                    />
                </div>

                <button className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <FaBell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
                </button>

                <div className="w-px h-8 bg-white/10 mx-2"></div>

                <div className="flex items-center gap-3">
                    {customRightContent}

                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-white">
                            {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Administrator'}
                        </p>
                        <p className="text-xs text-indigo-400 font-medium">
                            {user?.role?.replace('_', ' ') || 'Super User'}
                        </p>
                    </div>

                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white/20 shadow-lg cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all hover:scale-105"
                        >
                            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'AD'}
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-bold text-gray-900">
                                        {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Administrator'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {user?.email || 'admin@example.com'}
                                    </p>
                                </div>
                                <Link
                                    to="/admin/profile"
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center space-x-3 transition-colors"
                                    onClick={() => setShowUserMenu(false)}
                                >
                                    <FaUser className="w-4 h-4" />
                                    <span className="font-medium">My Profile</span>
                                </Link>
                                <Link
                                    to="/admin/settings"
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center space-x-3 transition-colors"
                                    onClick={() => setShowUserMenu(false)}
                                >
                                    <FaCog className="w-4 h-4" />
                                    <span className="font-medium">Settings</span>
                                </Link>
                                <div className="h-px bg-gray-100 my-2"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                                >
                                    <FaSignOutAlt className="w-4 h-4" />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
