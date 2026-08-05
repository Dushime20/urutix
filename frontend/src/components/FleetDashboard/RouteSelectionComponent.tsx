import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, CheckCircle2, X } from 'lucide-react';
import { fleetApi } from '../../services/fleetApi';
import type { Route } from '../../services/fleetApi';
import toast from 'react-hot-toast';

interface RouteSelectionComponentProps {
  selectedRoutes: string[];
  onRouteChange: (routeIds: string[]) => void;
}

export const RouteSelectionComponent: React.FC<RouteSelectionComponentProps> = ({
  selectedRoutes,
  onRouteChange
}) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRoutes = await fleetApi.fetchRoutes();
      setRoutes(fetchedRoutes);
    } catch (error: any) {
      console.error('Error loading routes:', error);
      setError('Failed to load routes');
      toast.error('Failed to load available routes');
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRouteToggle = (routeId: string) => {
    const isSelected = selectedRoutes.includes(routeId);
    let newSelectedRoutes: string[];

    if (isSelected) {
      newSelectedRoutes = selectedRoutes.filter(id => id !== routeId);
    } else {
      newSelectedRoutes = [...selectedRoutes, routeId];
    }

    onRouteChange(newSelectedRoutes);
  };

  const handleRemoveRoute = (routeId: string) => {
    const newSelectedRoutes = selectedRoutes.filter(id => id !== routeId);
    onRouteChange(newSelectedRoutes);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-200 rounded-[20px] mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-200 rounded-[16px]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-[24px] text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button
          onClick={loadRoutes}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
          placeholder="Search routes by name, origin, or destination..."
        />
      </div>

      {/* Selected Routes */}
      {selectedRoutes.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-[10px] font-black text-primary-500 uppercase tracking-widest px-1">
            Selected Routes ({selectedRoutes.length})
          </h5>
          <div className="space-y-2">
            {selectedRoutes.map(routeId => {
              const route = routes.find(r => r.id === routeId);
              if (!route) return null;
              
              return (
                <div
                  key={routeId}
                  className="flex items-center justify-between p-4 bg-primary-50 border border-primary-100 rounded-[16px] group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{route.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span>{route.origin} → {route.destination}</span>
                        {route.distance && (
                          <>
                            <span>•</span>
                            <span>{route.distance} km</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRoute(routeId)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Routes */}
      <div className="space-y-3">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          Available Routes ({filteredRoutes.length})
        </h5>
        
        {filteredRoutes.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[24px]">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">
              {searchTerm ? 'No routes match your search' : 'No routes available'}
            </p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredRoutes.map(route => {
              const isSelected = selectedRoutes.includes(route.id);
              
              return (
                <div
                  key={route.id}
                  onClick={() => handleRouteToggle(route.id)}
                  className={`p-4 border rounded-[16px] cursor-pointer transition-all group ${
                    isSelected
                      ? 'bg-primary-50 border-primary-200 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-primary-100 group-hover:text-primary-500'
                      }`}>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-bold transition-colors ${
                          isSelected ? 'text-primary-700' : 'text-slate-900 dark:text-white'
                        }`}>
                          {route.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />
                          <span>{route.origin} → {route.destination}</span>
                          {route.distance && (
                            <>
                              <span>•</span>
                              <span>{route.distance} km</span>
                            </>
                          )}
                          {route.estimatedTime && (
                            <>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>{route.estimatedTime}h</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      route.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {route.status || 'active'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};