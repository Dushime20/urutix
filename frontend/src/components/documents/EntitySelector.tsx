import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Box, Truck, CreditCard, Loader2, X } from 'lucide-react';
import { cargoApi } from '../../services/cargoApi';
import api from '../../services/api';

interface Entity {
  id: string;
  name: string;
  description?: string;
  type: string;
}

interface EntitySelectorProps {
  entityType: string;
  value?: string;
  onChange: (entity: Entity | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const EntitySelector: React.FC<EntitySelectorProps> = ({
  entityType,
  value,
  onChange,
  disabled = false,
  placeholder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  // Fetch entities based on type
  const { data: entities, isLoading } = useQuery({
    queryKey: ['entities', entityType, searchTerm],
    queryFn: async () => {
      if (entityType === 'CARGO') {
        const tenantId = localStorage.getItem('tenantId') || '';
        const result = await cargoApi.getLoads(tenantId, { search: searchTerm, limit: 20 });
        return result.loads.map((cargo: any) => ({
          id: cargo.id,
          name: cargo.loadNumber || cargo.description || `Cargo ${cargo.id?.slice(0, 8)}`,
          description: `${cargo.origin} → ${cargo.destination}`,
          type: 'CARGO',
        }));
      } else if (entityType === 'TRIP') {
        try {
          const response = await api.get('/trips', { params: { search: searchTerm } });
          const trips = response.data?.data || response.data || [];
          return trips.map((trip: any) => ({
            id: trip.id,
            name: trip.name || `Trip ${trip.id?.slice(0, 8)}`,
            description: trip.route?.origin || trip.origin,
            type: 'TRIP',
          }));
        } catch (error) {
          console.warn('Failed to fetch trips:', error);
          return [];
        }
      } else if (entityType === 'FINANCIAL') {
        // For financial, we might not have a list - return empty or use a different approach
        return [];
      }
      return [];
    },
    enabled: isOpen && !disabled,
    staleTime: 30000,
  });

  // Load selected entity when value changes
  useEffect(() => {
    if (value && !selectedEntity) {
      // Try to find entity in current list or fetch it
      const findEntity = async () => {
        if (entityType === 'CARGO') {
          try {
            const response = await api.get(`/loads/${value}`);
            const cargo = response.data;
            setSelectedEntity({
              id: cargo.id,
              name: cargo.title || cargo.description || `Cargo ${cargo.id?.slice(0, 8)}`,
              description: cargo.pickupLocation?.address,
              type: 'CARGO',
            });
          } catch (error) {
            // If fetch fails, just use the ID
            setSelectedEntity({
              id: value,
              name: `Entity ${value.slice(0, 8)}`,
              type: entityType,
            });
          }
        }
      };
      findEntity();
    }
  }, [value, entityType]);

  const handleSelect = (entity: Entity) => {
    setSelectedEntity(entity);
    onChange(entity);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedEntity(null);
    onChange(null);
    setSearchTerm('');
  };

  const getEntityIcon = () => {
    switch (entityType) {
      case 'CARGO':
        return <Box className="w-4 h-4" />;
      case 'TRIP':
        return <Truck className="w-4 h-4" />;
      case 'FINANCIAL':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Box className="w-4 h-4" />;
    }
  };

  const defaultPlaceholder = placeholder || `Search for ${entityType.toLowerCase()}...`;

  return (
    <div className="relative">
      {selectedEntity ? (
        <div className="flex items-center justify-between p-2 border border-green-300 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getEntityIcon()}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {selectedEntity.name}
              </div>
              {selectedEntity.description && (
                <div className="text-xs text-gray-500 truncate">
                  {selectedEntity.description}
                </div>
              )}
            </div>
          </div>
          {!disabled && (
            <button
              onClick={handleClear}
              className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={defaultPlaceholder}
              disabled={disabled}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                    <p className="text-xs text-gray-500 mt-2">Loading...</p>
                  </div>
                ) : entities && entities.length > 0 ? (
                  <div className="py-1">
                    {entities.map((entity) => (
                      <button
                        key={entity.id}
                        onClick={() => handleSelect(entity)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                        type="button"
                      >
                        {getEntityIcon()}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {entity.name}
                          </div>
                          {entity.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {entity.description}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No results found' : `No ${entityType.toLowerCase()}s available`}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {!selectedEntity && !isOpen && (
        <p className="mt-1 text-xs text-gray-500">
          💡 Tip: Search for your {entityType.toLowerCase()} by name or description. You can also enter the ID manually below.
        </p>
      )}
    </div>
  );
};

export default EntitySelector;

