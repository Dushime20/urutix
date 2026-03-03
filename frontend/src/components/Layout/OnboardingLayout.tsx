import React from 'react';
import { Outlet } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const SimpleNavbar = () => (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">U</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Urutix</span>
            </div>
            <div className="text-sm text-gray-500">
                Need help? <a href="mailto:support@urutix.com" className="text-blue-600 hover:text-blue-700">Contact Support</a>
            </div>
        </div>
    </nav>
);

const OnboardingLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SimpleNavbar />
            <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
                <Outlet />
            </main>
            <footer className="py-6 text-center text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Urutix. All rights reserved.
            </footer>
        </div>
    );
};

export default OnboardingLayout;
