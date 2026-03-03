import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, UserPlus } from 'lucide-react';
import receiverService from '../../services/receiverService';
import type { Receiver, CreateReceiverDto } from '../../types/receiver';
import toast from 'react-hot-toast';

interface AssignReceiverModalProps {
    isOpen: boolean;
    onClose: () => void;
    loadId: string;
    loadTitle?: string;
    currentReceiverId?: string;
    onSuccess?: () => void;
}

export const AssignReceiverModal: React.FC<AssignReceiverModalProps> = ({
    isOpen,
    onClose,
    loadId,
    loadTitle,
    currentReceiverId,
    onSuccess,
}) => {
    const [receivers, setReceivers] = useState<Receiver[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [selectedReceiverId, setSelectedReceiverId] = useState<string>(currentReceiverId || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newReceiverData, setNewReceiverData] = useState<CreateReceiverDto>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });

    // Fetch available receivers
    useEffect(() => {
        if (isOpen) {
            fetchReceivers();
        }
    }, [isOpen]);

    // Update selected receiver when currentReceiverId changes
    useEffect(() => {
        if (currentReceiverId) {
            setSelectedReceiverId(currentReceiverId);
        }
    }, [currentReceiverId]);

    const fetchReceivers = async () => {
        setLoading(true);
        try {
            const data = await receiverService.getReceivers();
            setReceivers(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error('Failed to fetch receivers:', error);
            toast.error(error.response?.data?.message || 'Failed to load receivers');
            setReceivers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReceiver = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await receiverService.createReceiver(newReceiverData);
            toast.success(result.message || 'Receiver created successfully');
            setNewReceiverData({ firstName: '', lastName: '', email: '', phone: '' });
            setShowCreateForm(false);
            await fetchReceivers();
            // Auto-select the newly created receiver
            if (result.receiver?.id) {
                setSelectedReceiverId(result.receiver.id);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create receiver');
        }
    };

    const handleAssign = async () => {
        // Prevent assignment if receiver already exists
        if (currentReceiverId) {
            toast.error('A receiver is already assigned. Please unassign first.');
            return;
        }

        if (!selectedReceiverId) {
            toast.error('Please select a receiver');
            return;
        }

        setAssigning(true);
        try {
            await receiverService.assignCargoToReceiver(loadId, selectedReceiverId);

            const selectedReceiver = receivers.find(r => r.id === selectedReceiverId);
            const receiverName = selectedReceiver?.profile?.firstName
                ? `${selectedReceiver.profile.firstName} ${selectedReceiver.profile.lastName || ''}`.trim()
                : selectedReceiver?.email || 'Receiver';

            toast.success(`Receiver ${receiverName} assigned successfully!`);

            // Wait a bit before calling onSuccess to ensure backend has saved
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Call onSuccess to refresh data
            if (onSuccess) {
                onSuccess();
            }

            // Close modal after a short delay
            setTimeout(() => {
                onClose();
            }, 200);
        } catch (error: any) {
            console.error('Failed to assign receiver:', error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to assign receiver';
            toast.error(errorMessage);
        } finally {
            setAssigning(false);
        }
    };

    const handleUnassign = async () => {
        if (!currentReceiverId) return;

        setAssigning(true);
        try {
            await receiverService.unassignCargoFromReceiver(loadId);
            toast.success('Receiver unassigned successfully');

            if (onSuccess) {
                onSuccess();
            }

            onClose();
        } catch (error: any) {
            console.error('Failed to unassign receiver:', error);
            toast.error(error.response?.data?.message || 'Failed to unassign receiver');
        } finally {
            setAssigning(false);
        }
    };

    // Filter receivers by search term
    const filteredReceivers = receivers.filter(receiver => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const name = `${receiver.profile?.firstName || ''} ${receiver.profile?.lastName || ''}`.trim().toLowerCase();
        const email = receiver.email.toLowerCase();
        return name.includes(search) || email.includes(search);
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
            <div
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {currentReceiverId ? 'Manage Receiver' : 'Assign Receiver'}
                        </h2>
                        {loadTitle && (
                            <p className="text-sm text-gray-600 mt-1">
                                Cargo: {loadTitle}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Current Receiver (if exists) */}
                    {currentReceiverId && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Current Receiver</p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        {receivers.find(r => r.id === currentReceiverId)?.email || 'Unknown'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleUnassign}
                                    disabled={assigning}
                                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {assigning ? 'Unassigning...' : 'Unassign'}
                                </button>
                            </div>
                        </div>
                    )}

                    {!currentReceiverId && (
                        <>
                            {/* Create New Receiver Button */}
                            <div className="mb-4">
                                <button
                                    onClick={() => setShowCreateForm(!showCreateForm)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    {showCreateForm ? 'Cancel' : 'Create New Receiver'}
                                </button>
                            </div>

                            {/* Create Receiver Form */}
                            {showCreateForm && (
                                <form onSubmit={handleCreateReceiver} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">New Receiver Details</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={newReceiverData.firstName}
                                                onChange={(e) => setNewReceiverData({ ...newReceiverData, firstName: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={newReceiverData.lastName}
                                                onChange={(e) => setNewReceiverData({ ...newReceiverData, lastName: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={newReceiverData.email}
                                                onChange={(e) => setNewReceiverData({ ...newReceiverData, email: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={newReceiverData.phone}
                                                onChange={(e) => setNewReceiverData({ ...newReceiverData, phone: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="mt-3 w-full px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Create & Select Receiver
                                    </button>
                                </form>
                            )}

                            {/* Search */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search receivers by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Receivers List */}
                            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="text-center py-8 text-gray-500">Loading receivers...</div>
                                ) : filteredReceivers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <UserPlus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No receivers found</p>
                                        <p className="text-sm mt-1">Create a new receiver to get started</p>
                                    </div>
                                ) : (
                                    filteredReceivers.map((receiver) => (
                                        <div
                                            key={receiver.id}
                                            onClick={() => setSelectedReceiverId(receiver.id)}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedReceiverId === receiver.id
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedReceiverId === receiver.id ? 'bg-primary-100' : 'bg-gray-100'
                                                        }`}>
                                                        <User className={`w-5 h-5 ${selectedReceiverId === receiver.id ? 'text-primary-600' : 'text-gray-600'
                                                            }`} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">
                                                            {receiver.profile?.firstName || receiver.profile?.lastName
                                                                ? `${receiver.profile.firstName || ''} ${receiver.profile.lastName || ''}`.trim()
                                                                : receiver.email.split('@')[0]}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            <span>{receiver.email}</span>
                                                        </div>
                                                        {receiver.phone && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-0.5">
                                                                <Phone className="w-3.5 h-3.5" />
                                                                <span>{receiver.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 text-xs rounded ${receiver.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {receiver.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssign}
                                    disabled={!selectedReceiverId || assigning}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {assigning ? 'Assigning...' : 'Assign Receiver'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
