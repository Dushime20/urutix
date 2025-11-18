import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EnhancedCargoDisplay from '../components/CargoDashboard/EnhancedCargoDisplay';
import { getEnhancedCargo, enrichCargoLocations } from '../services/enhancedCargoApi';
import { fetchCargos, convertBasicCargoToEnhanced } from '../services/cargoApi';
import type { EnhancedCargoData } from '../services/enhancedCargoApi';
import { useAuth } from '../contexts/AuthContext';

const EnhancedCargoDemo: React.FC = () => {
  const { cargoId } = useParams<{ cargoId: string }>();
  const { user, login, accessToken } = useAuth();
  const [enhancedCargoData, setEnhancedCargoData] = useState<EnhancedCargoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [dataSource, setDataSource] = useState<'database' | 'generated' | 'enhanced'>('database');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (user && accessToken) {
      loadCargoData();
    } else {
      setLoading(false);
      setError('Please log in to view enhanced cargo data');
    }
  }, [cargoId, user, accessToken]);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      // Use the test credentials
      const loggedInUser = await login('cargo@test.com', 'testpassword123');
      
      if (loggedInUser) {
        console.log('✅ Login successful, loading cargo data...');
        await loadCargoData();
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loadCargoData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always try to fetch real data first
      if (cargoId) {
        // Try to get enhanced cargo data for specific cargo
        try {
          console.log('🔍 Fetching enhanced cargo data for ID:', cargoId);
          const enhancedData = await getEnhancedCargo(cargoId);
          console.log('✅ Successfully fetched enhanced data:', enhancedData);
          setEnhancedCargoData(enhancedData);
          setDataSource('enhanced');
          return; // Success, exit early
        } catch (error) {
          console.error('❌ Failed to fetch enhanced data:', error);
          setError(`Failed to fetch enhanced cargo data for ID ${cargoId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // If no specific cargo ID, try to fetch all cargos and use the first one
      try {
        console.log('🔍 Fetching all cargos from database...');
        const cargos = await fetchCargos(1, '', {});
        console.log('📦 Fetched cargos from database:', cargos);
        
        if (cargos && cargos.length > 0) {
          // Use the first available cargo
          const firstCargo = cargos[0];
          console.log('🎯 Using first cargo from database:', firstCargo);
          
          // Try to get enhanced data for this cargo
          try {
            const enhancedData = await getEnhancedCargo(firstCargo.id);
            console.log('✅ Successfully enhanced cargo data:', enhancedData);
            setEnhancedCargoData(enhancedData);
            setDataSource('enhanced');
            return; // Success, exit early
          } catch (error) {
            console.log('⚠️ Could not get enhanced data, converting basic cargo data');
            // Convert basic cargo data to enhanced format
            const enhancedData = convertBasicCargoToEnhanced(firstCargo);
            console.log('✅ Converted basic cargo to enhanced format:', enhancedData);
            setEnhancedCargoData(enhancedData);
            setDataSource('database');
            return; // Success, exit early
          }
        } else {
          console.log('⚠️ No cargos found in database');
          setError('No cargo data found in database');
        }
      } catch (error) {
        console.error('❌ Failed to fetch cargos from database:', error);
        setError(`Failed to fetch cargo data from database: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Only fall back to generated data if all database attempts fail
      console.log('🔄 All database attempts failed, using generated data');
      setEnhancedCargoData(getDynamicEnhancedData());
      setDataSource('generated');
      
    } catch (error) {
      console.error('❌ Error loading cargo data:', error);
      setError(`Failed to load cargo data: ${error instanceof Error ? error.message : String(error)}`);
      setEnhancedCargoData(getDynamicEnhancedData());
      setDataSource('generated');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrichLocations = async () => {
    if (!enhancedCargoData?.id) return;

    try {
      setIsEnriching(true);
      const enrichedData = await enrichCargoLocations(enhancedCargoData.id);
      setEnhancedCargoData(enrichedData);
    } catch (error) {
      console.error('Error enriching locations:', error);
      setError('Failed to enrich locations');
    } finally {
      setIsEnriching(false);
    }
  };

  const getDynamicEnhancedData = (): EnhancedCargoData => {
    return {
      id: "343b7e20-31e3-43c6-9c2c-eb75bc0410ef",
      title: "Imyenda",
      description: "test000987e21iy78y",
      weight: 7.00,
      volume: 7.00,
      cargoType: "GENERAL",
      status: "DRAFT",
      loadValue: 70000.00,
      insuranceAmount: 1200.00,
      currency: "USD",
      pickupDate: "2025-08-04T00:00:00+02",
      deliveryDate: "2025-08-05T00:00:00+02",
      locations: [
        {
          type: "PICKUP",
          sequence: 1,
          status: "PENDING",
          locationData: {
            name: "Pickup Location",
            address: "Lat: -2.8306, Lng: 29.6208",
            coordinates: {
              latitude: -2.830577446603139,
              longitude: 29.620767771004978,
            },
            contactInfo: {
              contactPerson: "",
              contactPhone: "",
              contactEmail: "",
            },
            operatingHours: {},
            accessInstructions: "",
            specialInstructions: "",
          },
          requirements: {
            requiresCrane: false,
            hazmatCertified: false,
            requiresForklift: false,
            securityClearance: "",
            requiresLoadingDock: false,
            temperatureControlled: false,
          },
          estimatedTime: 60,
          scheduledDate: "2025-08-04",
        },
        {
          type: "DELIVERY",
          sequence: 2,
          status: "PENDING",
          locationData: {
            name: "Delivery Location",
            address: "Lat: -2.0594, Lng: 30.1030",
            coordinates: {
              latitude: -2.059394510942008,
              longitude: 30.103011940185773,
            },
            contactInfo: {
              contactPerson: "",
              contactPhone: "",
              contactEmail: "",
            },
            operatingHours: {},
            accessInstructions: "",
            specialInstructions: "",
          },
          requirements: {
            requiresCrane: false,
            hazmatCertified: false,
            requiresForklift: false,
            securityClearance: "",
            requiresLoadingDock: false,
            temperatureControlled: false,
          },
          estimatedTime: 60,
          scheduledDate: "2025-08-05",
        },
      ],
      // Enhanced location intelligence data
      enrichedLocations: [
        {
          name: "Kigali Industrial Zone Warehouse",
          category: "INDUSTRIAL_WAREHOUSE",
          city: "Kigali",
          state: "Kigali Province",
          country: "Rwanda",
          fullAddress: "Kigali Industrial Zone, Kigali, Rwanda",
          businessHours: {
            open: "06:00",
            close: "18:00",
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          },
          accessType: "TRUCK_ACCESS",
          securityLevel: "MEDIUM",
          loadingDockCount: 4,
          maxTruckHeight: 4.2,
          maxTruckWeight: 25000,
          specialInstructions: "Enter through Gate A, security checkpoint required. Valid ID and cargo manifest needed.",
          trafficPattern: "Low congestion (industrial area)",
          bestAccessTime: "08:00 - 10:00 or 14:00 - 16:00",
          parkingAvailable: true,
          fuelStationsNearby: 2,
          restAreasNearby: 1,
        },
        {
          name: "Butare Retail Distribution Center",
          category: "RETAIL_DISTRIBUTION",
          city: "Butare",
          state: "Southern Province",
          country: "Rwanda",
          fullAddress: "Butare Commercial District, Southern Province, Rwanda",
          businessHours: {
            open: "07:00",
            close: "19:00",
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
          },
          accessType: "STREET_ACCESS",
          securityLevel: "LOW",
          loadingDockCount: 2,
          maxTruckHeight: 3.8,
          maxTruckWeight: 15000,
          specialInstructions: "Street parking available, unloading zone clearly marked. No special permits required.",
          trafficPattern: "Medium congestion (commercial area)",
          bestAccessTime: "09:00 - 11:00 or 15:00 - 17:00",
          parkingAvailable: true,
          fuelStationsNearby: 3,
          restAreasNearby: 2,
        },
      ],
      routeAnalysis: {
        totalDistance: 108.5,
        estimatedDuration: 2.25,
        routeType: "HIGHWAY_PRIMARY",
        tollRoads: 0,
        borderCrossings: 0,
        restrictions: [],
        recommendedDeparture: "08:00 (pickup) → 10:15 (delivery)",
        fuelStops: 2,
        restStops: 1,
        alternativeRoutes: 2,
      },
      truckCompatibility: {
        routeCompatible: true,
        heightCompatible: true,
        weightCompatible: true,
        accessCompatible: true,
        compatibilityScore: 95,
      },
      riskAssessment: {
        lowRiskFactors: [
          "Both locations have good access",
          "No special permits required",
          "Standard business hours",
          "No border crossings",
          "No toll roads"
        ],
        mediumRiskFactors: [
          "Delivery location in commercial area (traffic)",
          "Single-day delivery window"
        ],
        highRiskFactors: [],
      },
      costOptimization: {
        fuelEfficiency: "High (highway route)",
        tollCosts: 0,
        additionalCosts: 0,
        insuranceRecommendation: "Standard coverage sufficient",
      },
      performanceMetrics: {
        routeEfficiencyScore: 85,
        accessibilityScore: 90,
        riskScore: 15,
        costEfficiency: 95,
      },
      smartRecommendations: {
        optimizationSuggestions: [
          "Consider 09:00 pickup to avoid morning traffic",
          "Use alternative route during peak hours",
          "Pre-schedule loading dock at pickup location",
          "Extend delivery window to 17:00 for flexibility"
        ],
        intelligenceAlerts: [
          {
            type: "warning" as const,
            message: "Commercial area delivery may have delays during peak hours"
          },
          {
            type: "success" as const,
            message: "Both locations have proper truck access"
          },
          {
            type: "success" as const,
            message: "All cargo requirements satisfied by locations"
          },
          {
            type: "info" as const,
            message: "Multiple fuel stations along route"
          }
        ],
      },
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading enhanced cargo data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-700 mb-4">{error}</p>
            
            {!user && (
              <div className="mt-4">
                <p className="text-gray-600 mb-4">You need to be logged in to view enhanced cargo data.</p>
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoggingIn ? 'Logging in...' : 'Log in with Test Account'}
                </button>
              </div>
            )}
            
            {user && (
              <button
                onClick={loadCargoData}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Enhanced Cargo Display Demo
              </h1>
              <p className="text-gray-600">
                Showcasing cargo data with integrated location intelligence
              </p>
              <div className="flex items-center mt-2 space-x-2">
                <span className="text-sm text-gray-500">Data Source:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  dataSource === 'enhanced' ? 'bg-green-100 text-green-800' :
                  dataSource === 'database' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {dataSource === 'enhanced' ? 'Enhanced Database' :
                   dataSource === 'database' ? 'Basic Database' :
                   'Generated Data'}
                </span>
                {user && (
                  <>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">Logged in as: {user.email}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={loadCargoData}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Refresh from Database
              </button>
              <button
                onClick={handleEnrichLocations}
                disabled={isEnriching}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isEnriching ? 'Enriching...' : 'Enrich Locations'}
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Cargo List
              </button>
            </div>
          </div>
        </div>
        
        {enhancedCargoData && (
          <EnhancedCargoDisplay 
            cargoData={enhancedCargoData} 
            showIntelligence={true}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedCargoDemo; 