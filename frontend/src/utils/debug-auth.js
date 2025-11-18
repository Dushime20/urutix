// Debug utility for authentication
export function debugAuth() {
  console.log('🔍 Auth Debug Info:');
  
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  console.log('Access token in localStorage:', !!accessToken);
  console.log('Refresh token in localStorage:', !!refreshToken);
  
  if (accessToken) {
    console.log('Access token preview:', accessToken.substring(0, 50) + '...');
    
    // Try to decode the token (basic check)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      console.log('Token payload:', payload);
      console.log('Token expires:', new Date(payload.exp * 1000));
      console.log('Token is expired:', Date.now() > payload.exp * 1000);
    } catch (error) {
      console.log('Could not decode token:', error.message);
    }
  } else {
    console.log('❌ No access token found in localStorage');
  }
  
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  console.log('User in localStorage:', user);
  
  return {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    user: user
  };
}

// Test function to check API calls
export function testApiCall() {
  console.log('🧪 Testing API call...');
  
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.log('❌ No token available for API test');
    return;
  }
  
  console.log('✅ Token available, API calls should work');
  console.log('Token preview:', token.substring(0, 20) + '...');
}

// Export for use in components
window.debugAuth = debugAuth;
window.testApiCall = testApiCall; 