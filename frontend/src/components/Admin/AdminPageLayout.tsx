import React, { type ReactNode } from 'react';
import { FaBell } from 'react-icons/fa';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

interface AdminPageLayoutProps {
    title: string;
    description: string;
    children: ReactNode;
    actions?: ReactNode;
    showSidebar?: boolean;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
    title,
    description,
    children,
    actions,
    showSidebar = true,
}) => {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar - Fixed height with internal scrolling */}
            {showSidebar && <AdminSidebar />}

            {/* Main Content - Scrollable area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Dark Header - Fixed at top of content area */}
                <div className="bg-[#0f172a] text-white flex-shrink-0 z-10 relative shadow-md">
                    <AdminHeader
                        searchPlaceholder="Search admin panel..."
                        customRightContent={
                            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                                <FaBell size={18} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
                            </button>
                        }
                    />

                    {/* Hero Section */}
                    <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
                        <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 py-8 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                                    {title}
                                </h1>
                                <p className="text-slate-400 max-w-xl">{description}</p>
                            </div>
                            {actions && <div className="flex items-center gap-3">{actions}</div>}
                        </div>
                    </div>
                </div>

                {/* Page Content - Scrollable */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 w-full">
                    <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 py-8 min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminPageLayout;
