import React, { useState } from 'react';
import { loadsAPI } from '../../services/api';

// Debug component to test cargo form submission
export const DebugCargoForm: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    setDebugInfo(`
🔍 Authentication Debug:
- Access Token: ${token ? '✅ Found' : '❌ Missing'}
- Refresh Token: ${refreshToken ? '✅ Found' : '❌ Missing'}
- Token Preview: ${token ? `${token.substring(0, 20)}...` : 'None'}
- Local Storage Keys: ${Object.keys(localStorage).join(', ')}
    `);
  };

  const testLoadCreation = async () => {
    setIsLoading(true);
    setDebugInfo('🚀 Testing load creation...\n');

    try {
      // Check auth first
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setDebugInfo(prev => prev + '❌ No access token found. Please login first.\n');
        return;
      }

      setDebugInfo(prev => prev + '✅ Token found, proceeding with test...\n');

      // Test payload
      const testPayload = {
        title: "Debug Test Load",
        description: "This is a test load from debug component",
        weight: 1500,
        volume: 10.5,
        cargoType: "FRAGILE",
        loadType: "FTL",
        equipmentType: "DRY_VAN",
        visibility: "public",
        unitsRequired: 1,
        loadValue: 5000,
        offeredPrice: 2500,
        currencyCode: "USD",
        paymentTerms: "Net30",
        isFragile: true,
        isHazardous: false,
        requiresRefrigeration: false,
        specialRequirements: "Handle with care",
        autoMatchEnabled: true,
        loadingInstructions: "Use loading dock",
        unloadingInstructions: "Deliver to main entrance",
        pickupDate: "2024-01-15T10:00:00Z",
        deliveryDate: "2024-01-17T14:00:00Z",
        locations: [
          {
            type: "PICKUP" as const,
            locationData: {
              name: "Debug Pickup Location",
              address: "123 Debug Street, Debug City",
              coordinates: {
                latitude: 40.7128,
                longitude: -74.0060,
              },
              contactInfo: {
                contactPerson: "Debug User",
                contactPhone: "+1234567890",
                contactEmail: "debug@test.com",
              },
              operatingHours: {
                open: "08:00",
                close: "18:00",
                days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              },
              specialInstructions: "Use loading dock",
              accessInstructions: "Enter through main gate",
            },
            scheduledDate: "2024-01-15T10:00:00Z",
            estimatedTime: 120,
            requirements: {
              requiresForklift: true,
              requiresCrane: false,
              requiresLoadingDock: true,
              hazmatCertified: false,
              temperatureControlled: false,
              securityClearance: "Standard",
            },
            status: "PENDING" as const,
          },
          {
            type: "DELIVERY" as const,
            locationData: {
              name: "Debug Delivery Location",
              address: "456 Delivery Ave, Delivery City",
              coordinates: {
                latitude: 34.0522,
                longitude: -118.2437,
              },
              contactInfo: {
                contactPerson: "Debug Receiver",
                contactPhone: "+1987654321",
                contactEmail: "receiver@test.com",
              },
              operatingHours: {
                open: "09:00",
                close: "21:00",
                days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              },
              specialInstructions: "Deliver to main entrance",
              accessInstructions: "Ring doorbell for access",
            },
            scheduledDate: "2024-01-17T14:00:00Z",
            estimatedTime: 90,
            requirements: {
              requiresForklift: false,
              requiresCrane: false,
              requiresLoadingDock: false,
              hazmatCertified: false,
              temperatureControlled: false,
              securityClearance: "None",
            },
            status: "PENDING" as const,
          },
        ],
      };

      setDebugInfo(prev => prev + '📦 Sending payload to /loads endpoint...\n');
      setDebugInfo(prev => prev + `Payload: ${JSON.stringify(testPayload, null, 2)}\n`);

      const response = await loadsAPI.create(testPayload);
      
      setDebugInfo(prev => prev + '✅ Load created successfully!\n');
      setDebugInfo(prev => prev + `Response: ${JSON.stringify(response.data, null, 2)}\n`);

    } catch (error: any) {
      setDebugInfo(prev => prev + `❌ Error creating load:\n`);
      setDebugInfo(prev => prev + `Status: ${error.response?.status}\n`);
      setDebugInfo(prev => prev + `Message: ${error.response?.data?.message || error.message}\n`);
      setDebugInfo(prev => prev + `Full Error: ${JSON.stringify(error.response?.data, null, 2)}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">🔧 Debug Cargo Form</h2>
      
      <div className="space-y-4">
        <button
          onClick={checkAuthStatus}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Check Auth Status
        </button>
        
        <button
          onClick={testLoadCreation}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Load Creation'}
        </button>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Debug Output:</h3>
        <pre className="bg-white p-4 rounded border text-sm overflow-auto max-h-96">
          {debugInfo || 'Click buttons above to start debugging...'}
        </pre>
      </div>
    </div>
  );
};

export default DebugCargoForm; 