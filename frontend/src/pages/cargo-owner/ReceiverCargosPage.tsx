import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import receiverService from '../../services/receiverService';
import { FaBox, FaSpinner, FaMapMarkerAlt, FaCalendarAlt, FaTruck, FaClipboardCheck, FaCheckCircle, FaEye } from 'react-icons/fa';

interface Cargo {
  id: string;
  cargoType: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  deliveryDate?: string;
  status: string;
  weight?: number;
  volume?: number;
  cargoOwner?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
}

const ReceiverCargosPage: React.FC = () => {
  const navigate = useNavigate();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectionStatuses, setInspectionStatuses] = useState<Record<string, any>>({});

  useEffect(() => {
    loadMyCargos();
  }, []);

  const loadMyCargos = async () => {
    try {
      setLoading(true);
      const data = await receiverService.getMyCargos();
      setCargos(data);
      
      // Load inspection statuses for all cargos
      const statuses: Record<string, any> = {};
      for (const cargo of data) {
        try {
          const inspection = await receiverService.getCargoInspection(cargo.id);
          if (inspection) {
            statuses[cargo.id] = inspection;
          }
        } catch (error) {
          // No inspection found, that's fine
        }
      }
      setInspectionStatuses(statuses);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load your cargos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary-600 text-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assigned Cargos</h1>
          <p className="text-sm text-gray-600 mt-1">
            View all cargos that have been assigned to you
          </p>
        </div>
      </div>

      {cargos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FaBox className="mx-auto text-gray-400 text-4xl mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cargos Assigned</h3>
          <p className="text-sm text-gray-600">
            You don't have any cargos assigned to you yet. Contact your cargo owner for assignments.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {cargos.map((cargo) => (
            <div
              key={cargo.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-primary-100 rounded-lg p-2">
                      <FaBox className="text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {cargo.cargoType || 'Cargo'}
                      </h3>
                      {cargo.cargoOwner?.profile && (
                        <p className="text-sm text-gray-600">
                          From: {cargo.cargoOwner.profile.firstName} {cargo.cargoOwner.profile.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-start gap-3">
                      <FaMapMarkerAlt className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup Location</p>
                        <p className="text-sm font-medium text-gray-900">
                          {cargo.pickupLocation || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FaMapMarkerAlt className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500">Delivery Location</p>
                        <p className="text-sm font-medium text-gray-900">
                          {cargo.deliveryLocation || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FaCalendarAlt className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {cargo.pickupDate ? new Date(cargo.pickupDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {cargo.deliveryDate && (
                      <div className="flex items-start gap-3">
                        <FaCalendarAlt className="text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Delivery Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(cargo.deliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {(cargo.weight || cargo.volume) && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                      {cargo.weight && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Weight:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {cargo.weight} kg
                          </span>
                        </div>
                      )}
                      {cargo.volume && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Volume:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {cargo.volume} m³
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col items-end gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      cargo.status,
                    )}`}
                  >
                    {cargo.status?.replace('_', ' ') || 'Unknown'}
                  </span>
                  {inspectionStatuses[cargo.id]?.status === 'COMPLETED' || inspectionStatuses[cargo.id]?.allItemsVerified ? (
                    <div className="flex flex-col items-end gap-2">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        <FaCheckCircle />
                        Inspection Completed
                      </span>
                      <button
                        onClick={() => navigate(`/dashboard/cargos/${cargo.id}/inspect`)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        <FaEye />
                        View Inspection
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(`/dashboard/cargos/${cargo.id}/inspect`)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      <FaClipboardCheck />
                      Inspect Cargo
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiverCargosPage;

