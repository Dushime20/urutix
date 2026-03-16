import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { errorMessage } from '../utils/error';
import { fetchHealth, fetchTenants } from '../services/adminApi';

const AuthDebug: React.FC = () => {
  const { user, accessToken } = useAuth();

  const checkBackendHealth = async () => {
    try {
      const data = await fetchHealth();
      
      console.log('Backend Health Check:');
      console.log('Health Data:', data);
      alert('✅ Backend is healthy and accessible');
    } catch (error) {
      const err = errorMessage(error, 'Network error occurred');
      console.error('Network Error:', err);
      alert(`🔌 Network error: ${err}\nMake sure backend is running on http://localhost:3001`);
    }
  };

  const testAdminAccess = async () => {
    try {
      const data = await fetchTenants();
      
      console.log('Admin Access Test:');
      console.log('Tenants Data:', data);
      alert('✅ Admin access successful');
    } catch (error) {
      const err = errorMessage(error, 'Admin access denied');
      console.error('Admin Access Error:', err);
      alert(`❌ Admin access denied: ${err}`);
    }
  };

  const checkLocalStorage = () => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    console.log('LocalStorage Debug:');
    console.log('Access Token:', token ? `${token.substring(0, 20)}...` : 'Not found');
    console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'Not found');
    
    alert(`Token Status:\n${token ? '✅ Access token found' : '❌ No access token'}\n${refreshToken ? '✅ Refresh token found' : '❌ No refresh token'}`);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="font-bold text-lg mb-3">🔧 Auth Debug Panel</h3>
      
      <div className="space-y-2 mb-4">
        <div className="text-sm">
          <span className="font-medium">User:</span> {user ? 
            (user.firstName?.trim() || user.lastName?.trim() 
              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
              : user.email || 'Unknown User'
            ) : 'Not logged in'}
        </div>
        <div className="text-sm">
          <span className="font-medium">Role:</span> {user?.role || 'N/A'}
        </div>
        <div className="text-sm">
          <span className="font-medium">Token:</span> {accessToken ? '✅ Present' : '❌ Missing'}
        </div>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={checkLocalStorage}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Check Storage
        </button>
        <button
          onClick={checkBackendHealth}
          className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
        >
          Test Backend
        </button>
        <button
          onClick={testAdminAccess}
          className="w-full bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
        >
          Test Admin API
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;
