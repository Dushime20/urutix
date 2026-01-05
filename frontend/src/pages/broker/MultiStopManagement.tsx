import React, { useState } from 'react';
import { brokerAPI, type MultiStopLoad, type CreateMultiStopLoadData } from '../../services/brokerApi';
import { Route, Plus, MapPin, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MultiStopManagement: React.FC = () => {
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [multiStop, setMultiStop] = useState<MultiStopLoad | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleGetMultiStop = async () => {
    if (!selectedLoadId) {
      toast.error('Please enter a Load ID');
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.getMultiStopLoad(selectedLoadId);
      setMultiStop(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setMultiStop(null);
        toast.info('No multi-stop configuration found. Create one?');
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch multi-stop load');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMultiStop = async (data: CreateMultiStopLoadData) => {
    try {
      await brokerAPI.createMultiStopLoad(data);
      toast.success('Multi-stop load created successfully');
      setShowCreateModal(false);
      handleGetMultiStop();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create multi-stop load');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Multi-Stop Load Management</h1>
          <p className="text-gray-600 mt-1">Optimize routes for loads with multiple pickup/delivery locations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Multi-Stop</span>
        </button>
      </div>

      {/* Load Selection */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Load ID</label>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Enter Load ID"
            value={selectedLoadId}
            onChange={(e) => setSelectedLoadId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleGetMultiStop}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Route className="w-5 h-5" />}
            <span>Get Multi-Stop</span>
          </button>
        </div>
      </div>

      {/* Multi-Stop Display */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : !multiStop ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Route className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No multi-stop configuration found</h3>
          <p className="text-gray-600">Create a multi-stop configuration for this load</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Route Optimization Summary */}
          {multiStop.routeOptimization && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Route Optimization</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Distance Savings</div>
                  <div className="text-2xl font-bold text-green-600">
                    {multiStop.routeOptimization.distanceSavings.toFixed(2)} km
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Time Savings</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(multiStop.routeOptimization.timeSavings / 60)} hours
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Fuel Savings</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {multiStop.routeOptimization.fuelSavings.toFixed(2)} km
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Optimization Score</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {multiStop.routeOptimization.optimizationScore.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stops List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Stops ({multiStop.stops.length})</h3>
            <div className="space-y-4">
              {multiStop.stops
                .sort((a, b) => a.sequence - b.sequence)
                .map((stop, idx) => (
                  <div key={stop.stopId} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                      {stop.sequence}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{stop.location.name}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          stop.type === 'PICKUP' ? 'bg-blue-100 text-blue-800' :
                          stop.type === 'DELIVERY' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {stop.type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">{stop.location.address}</div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(stop.scheduledTime).toLocaleString()}</span>
                        </div>
                        <div>
                          Duration: {stop.estimatedDuration} min
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full ${
                          stop.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          stop.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {stop.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Optimized Route */}
          {multiStop.optimizedRoute && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Optimized Route</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Total Distance</div>
                  <div className="text-xl font-bold text-gray-900">
                    {multiStop.optimizedRoute.totalDistance.toFixed(2)} km
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Time</div>
                  <div className="text-xl font-bold text-gray-900">
                    {Math.round(multiStop.optimizedRoute.totalTime / 60)} hours
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Multi-Stop Modal */}
      {showCreateModal && (
        <CreateMultiStopModal
          loadId={selectedLoadId}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateMultiStop}
        />
      )}
    </div>
  );
};

const CreateMultiStopModal: React.FC<{
  loadId: string;
  onClose: () => void;
  onSubmit: (data: CreateMultiStopLoadData) => void;
}> = ({ loadId, onClose, onSubmit }) => {
  const [stops, setStops] = useState<CreateMultiStopLoadData['stops']>([
    {
      stopId: 'stop-1',
      sequence: 1,
      type: 'PICKUP',
      location: {
        name: '',
        address: '',
        coordinates: { lat: 0, lng: 0 },
      },
      scheduledTime: new Date().toISOString(),
      estimatedDuration: 30,
      status: 'PENDING',
    },
  ]);

  const addStop = () => {
    setStops([
      ...stops,
      {
        stopId: `stop-${stops.length + 1}`,
        sequence: stops.length + 1,
        type: 'DELIVERY',
        location: {
          name: '',
          address: '',
          coordinates: { lat: 0, lng: 0 },
        },
        scheduledTime: new Date().toISOString(),
        estimatedDuration: 30,
        status: 'PENDING',
      },
    ]);
  };

  const updateStop = (index: number, field: string, value: any) => {
    const updated = [...stops];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      (updated[index] as any)[parent][child] = value;
    } else {
      (updated[index] as any)[field] = value;
    }
    setStops(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadId) {
      toast.error('Please enter a Load ID');
      return;
    }
    onSubmit({ loadId, stops });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Multi-Stop Load</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Load ID</label>
            <input
              type="text"
              required
              value={loadId}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Stops</h3>
              <button
                type="button"
                onClick={addStop}
                className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                Add Stop
              </button>
            </div>

            {stops.map((stop, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={stop.type}
                      onChange={(e) => updateStop(idx, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="PICKUP">Pickup</option>
                      <option value="DELIVERY">Delivery</option>
                      <option value="STOP">Stop</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sequence</label>
                    <input
                      type="number"
                      value={stop.sequence}
                      onChange={(e) => updateStop(idx, 'sequence', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                  <input
                    type="text"
                    required
                    value={stop.location.name}
                    onChange={(e) => updateStop(idx, 'location.name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={stop.location.address}
                    onChange={(e) => updateStop(idx, 'location.address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={new Date(stop.scheduledTime).toISOString().slice(0, 16)}
                      onChange={(e) => updateStop(idx, 'scheduledTime', new Date(e.target.value).toISOString())}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      required
                      value={stop.estimatedDuration}
                      onChange={(e) => updateStop(idx, 'estimatedDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Create Multi-Stop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MultiStopManagement;

