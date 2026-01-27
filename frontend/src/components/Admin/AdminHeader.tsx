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
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-500/20">
                        <FaShieldAlt className="text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-white leading-none">Admin<span className="text-indigo-400">Panel</span></h2>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">System Administration</p>
                    </div>
                </div>

                <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
                    <Link to="/admin" className={navLinkClass('/admin')}>
                        <Layers size={16} /> Dashboard
                    </Link>
                    <Link to="/admin/users" className={navLinkClass('/admin/users')}>
                        <LucideUsers size={16} /> Users
                    </Link>
                    <Link to="/admin/monitoring" className={navLinkClass('/admin/monitoring')}>
                        <Activity size={16} /> Monitoring
                    </Link>
                    <Link to="/admin/activity-logs" className={navLinkClass('/admin/activity-logs')}>
                        <FileText size={16} /> Activity
                    </Link>
                    <Link to="/admin/enhanced-permissions" className={navLinkClass('/admin/enhanced-permissions')}>
                        <FaShieldAlt size={16} /> Permissions
                    </Link>
                    <Link to="/admin/advanced-settings" className={navLinkClass('/admin/advanced-settings')}>
                        <Settings size={16} /> Settings
                    </Link>
                    <Link to="/onboarding" className={navLinkClass('/onboarding')}>
                        <FaShieldAlt size={16} /> Onboarding
                    </Link>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center relative">
                    <FaSearch className="absolute left-3 text-slate-500" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={handleSearchChange}
                        className="bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 w-64 placeholder-slate-500"
                    />
                </div>

                <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                    <FaBell size={18} />
                    {/* Badge logic could be passed as prop if needed, placeholder for now */}
                </button>

                <div className="w-px h-8 bg-white/10 mx-2"></div>

                <div className="flex items-center gap-3">
                    {customRightContent}

                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-white">
                            {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Administrator'}
                        </p>
                        <p className="text-xs text-indigo-400">
                            {user?.role?.replace('_', ' ') || 'Super User'}
                        </p>
                    </div>

                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white/10 shadow-lg cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
                        >
                            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'AD'}
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Link
                                    to="/admin/profile"
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                    onClick={() => setShowUserMenu(false)}
                                >
                                    <FaUser className="w-4 h-4 text-gray-400" />
                                    <span>Profile</span>
                                </Link>
                                <Link
                                    to="/admin/settings"
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                    onClick={() => setShowUserMenu(false)}
                                >
                                    <FaCog className="w-4 h-4 text-gray-400" />
                                    <span>Settings</span>
                                </Link>
                                <div className="h-px bg-gray-100 my-2"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                >
                                    <FaSignOutAlt className="w-4 h-4" />
                                    <span>Logout</span>
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
