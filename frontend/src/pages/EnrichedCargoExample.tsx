import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaTruck, FaRoute, FaChartLine, FaPlus } from 'react-icons/fa';
import EnrichedCargoLocations from '../components/CargoDashboard/EnrichedCargoLocations';
import { 
  getCargoWithEnrichedLocations, 
  analyzeCargoRoute, 
  getCargoTruckCompatibility,
  getAllCargosWithEnrichedLocations,
  createCargoWithEnrichedLocations,
  EnrichedLocation 
} from '../services/enrichedCargoApi';

const EnrichedCargoExample: React.FC = () => {
  const [selectedCargoId, setSelectedCargoId] = useState<string>('');
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [routeAnalysis, setRouteAnalysis] = useState<any>(null);
  const [compatibilityData, setCompatibilityData] = useState<any>(null);
  const [allCargos, setAllCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'locations' | 'analysis' | 'compatibility'>('locations');

  // Test truck data
  const testTruckData = {
    height: 4.2,
    capacityWeight: 18,
    hasForklift: true,
    hasCrane: false,
    hasSecurityClearance: false,
    requiresParking: true
  };

  useEffect(() => {
    loadAllCargos();
  }, []);

  const loadAllCargos = async () => {
    try {
      setLoading(true);
      const { cargos } = await getAllCargosWithEnrichedLocations();
      setAllCargos(cargos);
      if (cargos.length > 0) {
        setSelectedCargoId(cargos[0].id);
      }
    } catch (error) {
      console.error('Error loading cargos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrichedData = async (cargoId: string) => {
    try {
      setLoading(true);
      const [cargoData, analysis, compatibility] = await Promise.all([
        getCargoWithEnrichedLocations(cargoId),
        analyzeCargoRoute(cargoId),
        getCargoTruckCompatibility(cargoId, testTruckData)
      ]);
      
      setEnrichedData(cargoData);
      setRouteAnalysis(analysis);
      setCompatibilityData(compatibility);
    } catch (error) {
      console.error('Error loading enriched data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCargoSelect = (cargoId: string) => {
    setSelectedCargoId(cargoId);
    loadEnrichedData(cargoId);
  };

  const handleCreateTestCargo = async () => {
    try {
      setLoading(true);
      const testCargoData = {
        title: "Test Electronics - Nairobi to Mombasa",
        description: "High-value electronics requiring secure transport",
        cargoType: "ELECTRONICS",
        weight: 2.5,
        volume: 15.0,
        status: "DRAFT",
        locations: [
          {
            type: "PICKUP",
            sequence: 1,
            locationData: {
              name: "Nairobi Industrial Area",
              address: "123 Industrial Area, Nairobi, Kenya",
              coordinates: { latitude: -1.2921, longitude: 36.8219 }
            },
            scheduledDate: "2024-02-01T08:00:00Z",
            estimatedTime: 60
          },
          {
            type: "DELIVERY",
            sequence: 2,
            locationData: {
              name: "Mombasa Beach Resort",
              address: "321 Beach Road, Mombasa, Kenya",
              coordinates: { latitude: -4.05, longitude: 39.65 }
            },
            scheduledDate: "2024-02-03T14:00:00Z",
            estimatedTime: 60
          }
        ],
        offeredPrice: 50000,
        currency: "USD",
        isUrgent: false,
        specialRequirements: {
          requiresRefrigeration: false,
          requiresSecurity: true,
          requiresInsurance: true
        }
      };

      const result = await createCargoWithEnrichedLocations(testCargoData);
      console.log('Test cargo created:', result);
      await loadAllCargos(); // Refresh the list
    } catch (error) {
      console.error('Error creating test cargo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enriched Cargo Locations Demo</h1>
              <p className="text-gray-600 mt-2">
                See how geo coordinates are transformed into meaningful location intelligence
              </p>
            </div>
            <button
              onClick={handleCreateTestCargo}
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              <FaPlus className="w-4 h-4" />
              <span>Create Test Cargo</span>
            </button>
          </div>

          {/* Cargo Selector */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Select Cargo:</label>
            <select
              value={selectedCargoId}
              onChange={(e) => handleCargoSelect(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {allCargos.map(cargo => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.title || `Cargo ${cargo.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && selectedCargoId && enrichedData && (
          <>
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('locations')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'locations' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FaMapMarkerAlt className="w-4 h-4" />
                  <span>Enriched Locations</span>
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'analysis' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FaRoute className="w-4 h-4" />
                  <span>Route Analysis</span>
                </button>
                <button
                  onClick={() => setActiveTab('compatibility')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'compatibility' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FaTruck className="w-4 h-4" />
                  <span>Truck Compatibility</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'locations' && (
                <div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Cargo Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Title</p>
                        <p className="text-gray-900">{enrichedData.cargo.title}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <p className="text-gray-900">{enrichedData.cargo.status}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cargo Type</p>
                        <p className="text-gray-900">{enrichedData.cargo.cargoType}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Weight</p>
                        <p className="text-gray-900">{enrichedData.cargo.weight} tons</p>
                      </div>
                    </div>
                  </div>
                  
                  <EnrichedCargoLocations 
                    locations={enrichedData.enrichedLocations} 
                  />
                </div>
              )}

              {activeTab === 'analysis' && routeAnalysis && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Analysis</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaRoute className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-blue-900">Total Distance</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {routeAnalysis.routeAnalysis.totalDistance} km
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaChartLine className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-green-900">Estimated Duration</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {routeAnalysis.routeAnalysis.estimatedDuration} hours
                      </p>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaMapMarkerAlt className="w-5 h-5 text-orange-500" />
                        <span className="font-medium text-orange-900">Restrictions</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-900">
                        {routeAnalysis.routeAnalysis.restrictions.length}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Optimal Schedule</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-500">Pickup Time</p>
                          <p className="text-gray-900">{routeAnalysis.routeAnalysis.optimalSchedule.pickupTime}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-500">Delivery Time</p>
                          <p className="text-gray-900">{routeAnalysis.routeAnalysis.optimalSchedule.deliveryTime}</p>
                        </div>
                      </div>
                    </div>

                    {routeAnalysis.routeAnalysis.restrictions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Route Restrictions</h3>
                        <div className="bg-red-50 rounded-lg p-4">
                          <ul className="space-y-1">
                            {routeAnalysis.routeAnalysis.restrictions.map((restriction: string, index: number) => (
                              <li key={index} className="flex items-center space-x-2 text-red-700">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                <span>{restriction}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'compatibility' && compatibilityData && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Truck Compatibility Analysis</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className={`rounded-lg p-4 ${
                      compatibilityData.isCompatible ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <FaTruck className={`w-5 h-5 ${
                          compatibilityData.isCompatible ? 'text-green-500' : 'text-red-500'
                        }`} />
                        <span className={`font-medium ${
                          compatibilityData.isCompatible ? 'text-green-900' : 'text-red-900'
                        }`}>
                          Overall Compatibility
                        </span>
                      </div>
                      <p className={`text-2xl font-bold ${
                        compatibilityData.isCompatible ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {compatibilityData.isCompatible ? '✅ Compatible' : '❌ Incompatible'}
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaChartLine className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-blue-900">Compatibility Score</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {compatibilityData.score}/100
                      </p>
                    </div>
                  </div>

                  {compatibilityData.issues.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Compatibility Issues</h3>
                      <div className="bg-red-50 rounded-lg p-4">
                        <ul className="space-y-2">
                          {compatibilityData.issues.map((issue: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2 text-red-700">
                              <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Location-Specific Compatibility</h3>
                    <div className="space-y-3">
                      {compatibilityData.locationCompatibility.map((location: any) => (
                        <div key={location.locationId} className={`border rounded-lg p-3 ${
                          location.isCompatible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{location.locationName}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              location.isCompatible 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {location.isCompatible ? 'Compatible' : 'Incompatible'}
                            </span>
                          </div>
                          {location.issues.length > 0 && (
                            <ul className="space-y-1">
                              {location.issues.map((issue: string, index: number) => (
                                <li key={index} className="text-sm text-red-600">
                                  • {issue}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!loading && allCargos.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FaMapMarkerAlt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Cargos Found</h3>
            <p className="text-gray-500 mb-4">
              Create a test cargo to see the enriched location intelligence in action.
            </p>
            <button
              onClick={handleCreateTestCargo}
              className="btn btn-primary"
            >
              Create Test Cargo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrichedCargoExample; 