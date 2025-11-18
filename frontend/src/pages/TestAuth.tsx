import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchCargos } from '../services/cargoApi';

const TestAuth: React.FC = () => {
  const { user, accessToken, login } = useAuth();
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔐 Testing login...');
      
      const user = await login('cargo@test.com', 'test123');
      console.log('✅ Login successful:', user);
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Testing auth...');
      console.log('User:', user);
      console.log('Token:', accessToken);
      
      const data = await fetchCargos(1, '', {});
      console.log('📦 Cargos data:', data);
      setCargos(data.items);
    } catch (err: any) {
      console.error('❌ Auth test failed:', err);
      setError(err.message || 'Failed to test auth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Current Auth State:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}</p>
          <p><strong>Token:</strong> {accessToken ? `${accessToken.substring(0, 20)}...` : 'No token'}</p>
        </div>
      </div>

      <div className="space-x-4">
        <button
          onClick={testLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login with Test User'}
        </button>

        <button
          onClick={testAuth}
          disabled={loading || !accessToken}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API Call'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {cargos.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Cargos Found ({cargos.length}):</h2>
          <div className="bg-green-100 p-4 rounded">
            <pre>{JSON.stringify(cargos, null, 2)}</pre>
          </div>
        </div>
      )}

      {cargos.length === 0 && !loading && !error && accessToken && (
        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          No cargos found. This might indicate an authentication issue.
        </div>
      )}
    </div>
  );
};

export default TestAuth; 