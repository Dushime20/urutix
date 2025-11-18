import React, { useEffect, useMemo, useState } from 'react';
import { fleetApi } from '../services/fleetApi';
import type { Route } from '../services/fleetApi';

const RoutesPage: React.FC = () => {
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
    if (!window.confirm(`Delete route "${route.name}"?`)) return;
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
      <div className="p-6">
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
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
          <p className="text-gray-600">Manage and monitor your routes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadRoutes}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            New Route
          </button>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-600">
          No routes available. Create routes in the backend or via API to see them here.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (km)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA (h)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Trucks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((route) => (
                  <tr key={route.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{route.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{route.origin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{route.destination}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{route.distance}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{route.estimatedTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        route.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' :
                        route.status?.toLowerCase() === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {route.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{route.assignedTrucks?.length || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(route)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(route)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
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
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editing ? 'Edit Route' : 'New Route'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input className="w-full border rounded px-3 py-2" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={(formData.status as string) || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                  <input className="w-full border rounded px-3 py-2" value={formData.origin || ''} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                  <input className="w-full border rounded px-3 py-2" value={formData.destination || ''} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={formData.distance || 0} onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })} min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ETA (hours)</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={formData.estimatedTime || 0} onChange={(e) => setFormData({ ...formData, estimatedTime: Number(e.target.value) })} min={0} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">{editing ? 'Save Changes' : 'Create Route'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutesPage;


