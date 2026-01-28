import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Users, X, Search, CheckCircle } from 'lucide-react';
import receiverService from '@/services/receiverService';
import type { Receiver } from '@/services/receiverService';

interface ReceiverAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cargoId: string;
  currentReceiverId?: string;
  onAssignmentComplete: () => void;
}

export const ReceiverAssignmentModal: React.FC<ReceiverAssignmentModalProps> = ({
  isOpen,
  onClose,
  cargoId,
  currentReceiverId,
  onAssignmentComplete,
}) => {
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReceivers();
    }
  }, [isOpen]);

  const loadReceivers = async () => {
    try {
      setLoading(true);
      const data = await receiverService.getReceivers();
      setReceivers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading receivers:', error);
      toast.error('Failed to load receivers');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (receiverId: string) => {
    try {
      setProcessing(true);
      await receiverService.assignCargoToReceiver(cargoId, receiverId);
      toast.success('Receiver assigned successfully');
      onAssignmentComplete();
      onClose();
    } catch (error: any) {
      console.error('Error assigning receiver:', error);
      toast.error(error.response?.data?.message || 'Failed to assign receiver');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnassign = async () => {
    if (!window.confirm('Are you sure you want to unassign the current receiver?')) return;
    
    try {
      setProcessing(true);
      await receiverService.unassignCargoFromReceiver(cargoId);
      toast.success('Receiver unassigned successfully');
      onAssignmentComplete();
      onClose();
    } catch (error: any) {
      console.error('Error unassigning receiver:', error);
      toast.error(error.response?.data?.message || 'Failed to unassign receiver');
    } finally {
      setProcessing(false);
    }
  };

  const filteredReceivers = receivers.filter(receiver => {
    const searchLower = searchTerm.toLowerCase();
    const name = `${receiver.profile?.firstName || ''} ${receiver.profile?.lastName || ''}`.toLowerCase();
    const email = receiver.email.toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2 text-gray-800">
            <Users className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-lg">Assign Receiver</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search receivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredReceivers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No receivers found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentReceiverId && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-medium text-purple-900">Current Assignment</span>
                    <p className="text-purple-700 text-xs mt-0.5">
                      {receivers.find(r => r.id === currentReceiverId)?.email || 'Unknown Receiver'}
                    </p>
                  </div>
                  <button
                    onClick={handleUnassign}
                    disabled={processing}
                    className="px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded text-xs font-medium hover:bg-red-50 transition-colors"
                  >
                    Unassign
                  </button>
                </div>
              )}
              
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Available Receivers</h3>
              
              {filteredReceivers.map((receiver) => {
                const isCurrent = receiver.id === currentReceiverId;
                if (isCurrent) return null; // Already shown above if implemented differently, or just skip active assignment in list
                
                return (
                  <div 
                    key={receiver.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {receiver.profile?.firstName ? `${receiver.profile.firstName} ${receiver.profile.lastName}` : receiver.email}
                        </div>
                        { receiver.profile?.firstName && (
                           <div className="text-xs text-gray-500">{receiver.email}</div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAssign(receiver.id)}
                      disabled={processing}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
