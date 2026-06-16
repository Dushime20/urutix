import React, { type ReactNode } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

interface AdminPageLayoutProps {
    title: string | ReactNode;
    description: string | ReactNode;
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
        <div className="flex min-h-screen lg:h-screen bg-slate-50 dark:bg-slate-950 lg:overflow-hidden font-sans uppercase-none">
            {/* Sidebar */}
            {showSidebar && <AdminSidebar />}

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Integrated Sticky Header */}
                <AdminHeader
                    searchPlaceholder="Search the UrutiX platform..."
                />

                {/* Content Area */}
                <main className="flex-1 lg:overflow-y-auto bg-[#fafafa] dark:bg-slate-900">
                    {/* Page Header / Title Area */}
                    <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <div className="max-w-[1536px] mx-auto px-6 md:px-10 lg:px-14 xl:px-20 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                    {title}
                                </h1>
                                <p className="text-sm text-slate-400 font-medium mt-1">
                                    {description}
                                </p>
                            </div>
                            {actions && (
                                <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500 w-full md:w-auto mt-2 md:mt-0">
                                    {actions}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="max-w-[1536px] mx-auto px-6 md:px-10 lg:px-14 xl:px-20 py-8 min-h-screen">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminPageLayout;
