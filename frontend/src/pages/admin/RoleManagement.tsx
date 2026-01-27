import React from 'react';
import { FaLayerGroup } from 'react-icons/fa';
import { RolePermissionsMatrix } from '../../components/Admin/Permissions/RolePermissionsMatrix';

const RoleManagement = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-[#0f172a] text-white">
                <header className="max-w-[1920px] mx-auto flex items-center justify-between px-4 md:px-8 py-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-500/20">
                            <FaLayerGroup className="text-white text-xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white leading-none">Role Definitions</h1>
                            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-1">Global Default Permissions</p>
                        </div>
                    </div>
                </header>
            </div>

            <main className="max-w-[1920px] mx-auto px-4 md:px-8 py-8">
                <RolePermissionsMatrix />
            </main>
        </div>
    );
};
export default RoleManagement;
