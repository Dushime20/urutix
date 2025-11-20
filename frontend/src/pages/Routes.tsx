import React, { useEffect, useMemo, useState } from 'react';
import { fleetApi } from '../services/fleetApi';
import type { Route } from '../services/fleetApi';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

const RoutesPage: React.FC = () => {
  const { confirm, DialogComponent } = useConfirmDialog();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [formData, setFormData] = useState<Partial<Route>>({
    name: '',
    origin: '',
    destination: '',
    distance: 0,
    estimatedTime: 0,
    status: 'ACTIVE',
    isActive: true,
    description: '',
  });

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fleetApi.fetchRoutes();
      setRoutes(data);
    } catch (e: any) {
      setError('Failed to load routes');
      console.error('RoutesPage: Error loading routes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setFormData({
      name: '',
      origin: '',
      destination: '',
      distance: 0,
      estimatedTime: 0,
      status: 'ACTIVE',
      isActive: true,
      description: '',
    });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (route: Route) => {
    setEditing(route);
    setFormData({
      name: route.name,
      origin: route.origin,
      destination: route.destination,
      distance: route.distance,
      estimatedTime: route.estimatedTime,
      // Normalize status for the UI select (expects uppercase values)
      status: (route.status || '').toUpperCase() as any,
      isActive: route.isActive,
      description: route.description ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = async (route: Route) => {
    const confirmed = await confirm({
      title: 'Delete Route',
      message: `Are you sure you want to delete route "${route.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await fleetApi.deleteRoute(route.id);
      setRoutes((prev) => prev.filter((r) => r.id !== route.id));
    } catch (e) {
      console.error('Delete route failed', e);
      setError('Failed to delete route');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Normalize payload to match backend enum expectations
      const normalizedStatus = (formData.status || 'ACTIVE').toString().toUpperCase();
      const payload = {
        ...formData,
        status:
          normalizedStatus === 'ACTIVE'
            ? 'active'
            : normalizedStatus === 'INACTIVE'
            ? 'inactive'
            : normalizedStatus === 'MAINTENANCE'
            ? 'maintenance'
            : 'inactive',
        // Ensure numeric fields are numbers
        distance: Number(formData.distance || 0),
        estimatedTime: Number(formData.estimatedTime || 0),
      } as Partial<Route>;

      if (editing) {
        const updated = await fleetApi.updateRoute(editing.id, payload);
        setRoutes((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      } else {
        const created = await fleetApi.createRoute(payload);
        setRoutes((prev) => [created, ...prev]);
      }
      setShowForm(false);
      resetForm();
    } catch (e) {
      console.error('Save route failed', e);
      setError('Failed to save route');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2">Routes</h1>
              <p className="text-sm text-gray-600">Manage and monitor your routes</p>
            </div>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2">Routes</h1>
              <p className="text-sm text-gray-600">Manage and monitor your routes</p>
            </div>
          </div>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2">Routes</h1>
            <p className="text-sm text-gray-600">Manage and monitor your routes</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadRoutes}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              Refresh
            </button>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              New Route
            </button>
          </div>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No routes available. Create routes in the backend or via API to see them here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto custom-table-wrapper">
            <table className="custom-table min-w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Distance (km)</th>
                  <th>ETA (h)</th>
                  <th>Status</th>
                  <th>Assigned Trucks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.id}>
                    <td className="text-gray-900">{route.name}</td>
                    <td className="text-gray-700">{route.origin}</td>
                    <td className="text-gray-700">{route.destination}</td>
                    <td className="text-gray-700">{route.distance}</td>
                    <td className="text-gray-700">{route.estimatedTime}</td>
                    <td>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        route.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' :
                        route.status?.toLowerCase() === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {route.status}
                      </span>
                    </td>
                    <td className="text-gray-700">{route.assignedTrucks?.length || 0}</td>
                    <td>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(route)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(route)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editing ? 'Edit Route' : 'New Route'}
              </h2>
              <button 
                onClick={() => { setShowForm(false); resetForm(); }} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={(formData.status as string) || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                    value={formData.origin || ''} 
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                    value={formData.destination || ''} 
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                    value={formData.distance || 0} 
                    onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })} 
                    min={0} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ETA (hours)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                    value={formData.estimatedTime || 0} 
                    onChange={(e) => setFormData({ ...formData, estimatedTime: Number(e.target.value) })} 
                    min={0} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                  rows={3} 
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); resetForm(); }} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editing ? 'Save Changes' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {DialogComponent}
    </div>
  );
};

export default RoutesPage;


