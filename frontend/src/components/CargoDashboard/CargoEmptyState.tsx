import React from 'react';
import { Package, Plus, FileText, TrendingUp, Zap } from 'lucide-react';

interface EmptyStateProps {
    onCreateCargo: () => void;
}

export const CargoEmptyState: React.FC<EmptyStateProps> = ({ onCreateCargo }) => {
    return (
        <div className="flex items-center justify-center min-h-[500px] p-8">
            <div className="max-w-2xl w-full text-center">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-full p-6 shadow-lg">
                            <Package className="w-16 h-16 text-white" />
                        </div>
                    </div>
                </div>

                {/* Welcome Message */}
                <h2 className="ui-page-title mb-3">
                    Welcome to Your Cargo Dashboard! 📦
                </h2>
                <p className="ui-body font-medium text-gray-600 mb-8">
                    Get started by creating your first cargo shipment. It only takes a few minutes!
                </p>

                {/* Quick Start Guide */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <h3 className="ui-card-title mb-4 flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        Quick Start Guide
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-xl font-bold text-blue-600">1</span>
                            </div>
                            <h4 className="ui-body text-gray-900 mb-1">Create Cargo</h4>
                            <p className="ui-caption text-gray-600">Add cargo details, pickup & delivery locations</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-xl font-bold text-green-600">2</span>
                            </div>
                            <h4 className="ui-body text-gray-900 mb-1">Publish & Get Bids</h4>
                            <p className="ui-caption text-gray-600">Publish to marketplace and receive competitive bids</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                                <span className="text-xl font-bold text-purple-600">3</span>
                            </div>
                            <h4 className="ui-body text-gray-900 mb-1">Track & Deliver</h4>
                            <p className="ui-caption text-gray-600">Monitor shipment progress in real-time</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                    <button
                        onClick={onCreateCargo}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#345E85] text-white rounded-2xl ui-button shadow-lg shadow-blue-900/10 hover:bg-slate-800 transition-all transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5" />
                        CREATE YOUR FIRST CARGO
                    </button>
                    <button
        <p className="ui-caption text-gray-600">{item}</p>
                    >
                        <FileText className="w-5 h-5" />
                        View Documentation
                    </button>
                </div>

                {/* Feature Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h4 className="ui-body text-gray-900 mb-1">Real-time Tracking</h4>
                            <p className="ui-caption text-gray-600">Monitor your shipments 24/7</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="ui-body text-gray-900 mb-1">Smart Matching</h4>
                            <p className="ui-caption text-gray-600">AI-powered carrier matching</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <h4 className="ui-body text-gray-900 mb-1">Instant Quotes</h4>
                            <p className="ui-caption text-gray-600">Get competitive bids instantly</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
