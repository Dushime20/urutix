import React, { type ReactNode } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

interface AdminPageLayoutProps {
    title?: string | ReactNode;
    description?: string | ReactNode;
    children: ReactNode;
    actions?: ReactNode;
    showSidebar?: boolean;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({
    title,
    description,
    actions,
    children,
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
                    <div className="max-w-[1536px] mx-auto px-6 md:px-10 lg:px-14 xl:px-20 py-8 min-h-screen">
                        {(title || description || actions) && (
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                                <div>
                                    {title && (
                                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {title}
                                        </h1>
                                    )}
                                    {description && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 normal-case">
                                            {description}
                                        </p>
                                    )}
                                </div>
                                {actions && (
                                    <div className="flex items-center gap-3 shrink-0">
                                        {actions}
                                    </div>
                                )}
                            </div>
                        )}
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
