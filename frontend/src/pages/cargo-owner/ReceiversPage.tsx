import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import receiverService from '../../services/receiverService';
import type { Receiver, CreateReceiverDto } from '../../types/receiver';
import { FaPlus, FaEdit, FaTrash, FaBox, FaUserPlus, FaEnvelope } from 'react-icons/fa';

const ReceiversPage: React.FC = () => {
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState<Receiver | null>(null);
  const [cargos, setCargos] = useState<any[]>([]);
  const [formData, setFormData] = useState<CreateReceiverDto>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadReceivers();
  }, []);

  const loadReceivers = async () => {
    try {
      setLoading(true);
      console.log('Loading receivers...');
      const data = await receiverService.getReceivers();
      console.log('Receivers loaded:', data);
      setReceivers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading receivers:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load receivers');
      setReceivers([]); // Set empty array on error to prevent white page
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReceiver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await receiverService.createReceiver(formData);
      toast.success(result.message || 'Receiver created successfully');
      setShowCreateModal(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '' });
      loadReceivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create receiver');
    }
  };

  const handleDeleteReceiver = async (receiverId: string) => {
    if (!window.confirm('Are you sure you want to delete this receiver?')) {
      return;
    }

    try {
      await receiverService.deleteReceiver(receiverId);
      toast.success('Receiver deleted successfully');
      loadReceivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete receiver');
    }
  };

  const handleOpenAssignModal = async (receiver: Receiver) => {
    setSelectedReceiver(receiver);
    try {
      const data = await receiverService.getCargosForAssignment();
      setCargos(data);
      setShowAssignModal(true);
    } catch (error: any) {
      toast.error('Failed to load cargos');
    }
  };

  const handleAssignCargo = async (cargoId: string) => {
    if (!selectedReceiver) return;

    try {
      await receiverService.assignCargoToReceiver(cargoId, selectedReceiver.id);
      toast.success('Cargo assigned successfully');
      setShowAssignModal(false);
      setSelectedReceiver(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign cargo');
    }
  };

  const handleUnassignCargo = async (cargoId: string) => {
    if (!window.confirm('Are you sure you want to unassign this cargo?')) {
      return;
    }

    try {
      await receiverService.unassignCargoFromReceiver(cargoId);
      toast.success('Cargo unassigned successfully');
      loadReceivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unassign cargo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading receivers...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receiver Management</h1>
          <p className="text-gray-600 mt-1">Manage your cargo receivers and assign cargo to them</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FaPlus /> Create Receiver
        </button>
      </div>

      {/* Receivers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Receivers</h2>
        </div>
        <div className="p-4">
          {receivers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaUserPlus className="mx-auto text-4xl mb-4 text-gray-300" />
              <p>No receivers created yet</p>
              <p className="text-sm mt-2">Create your first receiver to get started</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {receivers.map((receiver) => (
                <div
                  key={receiver.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <FaUserPlus className="text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {receiver.profile?.firstName || receiver.profile?.lastName
                              ? `${receiver.profile.firstName || ''} ${receiver.profile.lastName || ''}`.trim()
                              : receiver.email.split('@')[0] || 'Receiver'}
                          </h3>
                          <p className="text-sm text-gray-600">{receiver.email}</p>
                          {receiver.phone && (
                            <p className="text-sm text-gray-500">{receiver.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded ${
                            receiver.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {receiver.status}
                        </span>
                        <span className="text-gray-500">
                          Created: {new Date(receiver.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenAssignModal(receiver)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                        title="Assign Cargo"
                      >
                        <FaBox /> Assign Cargo
                      </button>
                      <button
                        onClick={() => handleDeleteReceiver(receiver.id)}
                        className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                        title="Delete Receiver"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Receiver Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Receiver</h2>
            <form onSubmit={handleCreateReceiver}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create Receiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Cargo Modal */}
      {showAssignModal && selectedReceiver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Assign Cargo to {selectedReceiver.profile?.firstName || selectedReceiver.profile?.lastName
                ? `${selectedReceiver.profile.firstName || ''} ${selectedReceiver.profile.lastName || ''}`.trim()
                : selectedReceiver.email.split('@')[0] || 'Receiver'}
            </h2>
            <div className="space-y-2">
              {cargos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No cargos available for assignment</p>
              ) : (
                cargos.map((cargo) => (
                  <div
                    key={cargo.id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-semibold">{cargo.title}</h3>
                      <p className="text-sm text-gray-600">{cargo.reference || cargo.id}</p>
                      <p className="text-sm text-gray-500">
                        Status: {cargo.status} | Current Receiver:{' '}
                        {cargo.receiver
                          ? `${cargo.receiver.profile?.firstName} ${cargo.receiver.profile?.lastName}`
                          : 'None'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {cargo.receiverId === selectedReceiver.id ? (
                        <button
                          onClick={() => handleUnassignCargo(cargo.id)}
                          className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                        >
                          Unassign
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAssignCargo(cargo.id)}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                          disabled={!!cargo.receiverId && cargo.receiverId !== selectedReceiver.id}
                        >
                          {cargo.receiverId ? 'Reassign' : 'Assign'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedReceiver(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiversPage;

