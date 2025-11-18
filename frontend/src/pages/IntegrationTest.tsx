import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchCargos } from '../services/cargoApi';

const IntegrationTest: React.FC = () => {
  const { user, accessToken, login, isLoading } = useAuth();
  const [testResults, setTestResults] = useState<any>({});
  const [running, setRunning] = useState(false);

  const runIntegrationTest = async () => {
    setRunning(true);
    const results: any = {};

    try {
      // Test 1: Authentication
      console.log('🧪 Test 1: Authentication');
      results.auth = {
        user: !!user,
        token: !!accessToken,
        userDetails: user ? {
          id: user.id,
          email: user.email,
          role: user.role
        } : null
      };

      // Test 2: API Call
      console.log('🧪 Test 2: API Call');
      if (accessToken) {
        try {
          const cargosData = await fetchCargos(1, '', {});
          results.api = {
            success: true,
            cargosCount: cargosData.items?.length || 0,
            hasMore: cargosData.hasMore,
            total: cargosData.total
          };
        } catch (error: any) {
          results.api = {
            success: false,
            error: error.message,
            status: error.response?.status
          };
        }
      } else {
        results.api = {
          success: false,
          error: 'No access token'
        };
      }

      // Test 3: Login Flow
      console.log('🧪 Test 3: Login Flow');
      try {
        const loginResult = await login('cargo@test.com', 'test123');
        results.login = {
          success: !!loginResult,
          user: loginResult ? {
            id: loginResult.id,
            email: loginResult.email,
            role: loginResult.role
          } : null
        };
      } catch (error: any) {
        results.login = {
          success: false,
          error: error.message
        };
      }

    } catch (error: any) {
      results.general = {
        error: error.message
      };
    }

    setTestResults(results);
    setRunning(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Integration Test</h1>
      
      <div className="mb-6">
        <button
          onClick={runIntegrationTest}
          disabled={running}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {running ? 'Running Tests...' : 'Run Integration Test'}
        </button>
      </div>

      {/* Current State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <div className="space-y-2">
            <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
            <div><strong>User:</strong> {user ? 'Logged In' : 'Not Logged In'}</div>
            <div><strong>Token:</strong> {accessToken ? 'Present' : 'Missing'}</div>
            {user && (
              <div className="bg-gray-50 p-3 rounded">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Role:</strong> {user.role}</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {Object.keys(testResults).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(testResults).map(([testName, result]: [string, any]) => (
                <div key={testName} className="border rounded p-3">
                  <h3 className="font-semibold capitalize">{testName}</h3>
                  <pre className="text-sm bg-gray-50 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tests run yet</p>
          )}
        </div>
      </div>

      {/* Manual Tests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Manual Login Test</h3>
          <button
            onClick={() => login('cargo@test.com', 'test123')}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Login with Test User
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">API Test</h3>
          <button
            onClick={async () => {
              try {
                const data = await fetchCargos(1, '', {});
                alert(`API Success! Found ${data.items?.length || 0} cargos`);
              } catch (error: any) {
                alert(`API Error: ${error.message}`);
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Cargos API
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Navigation Test</h3>
          <button
            onClick={() => window.location.href = '/dashboard/cargos'}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Go to Cargos Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationTest; 