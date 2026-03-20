const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Frontend Environment Variables');
console.log('==========================================');

const envContent = `# Frontend Environment Variables

# PostHog Analytics (Optional - set to your actual API key if you want analytics)
# VITE_POSTHOG_API_KEY=your_actual_posthog_api_key_here

# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Development Configuration
VITE_APP_ENV=development
VITE_APP_NAME=UrutiX Fleet Management

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
`;

const envPath = path.join(__dirname, '.env');

try {
  // Check if .env file already exists
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists');
    console.log('📝 Current content:');
    console.log(fs.readFileSync(envPath, 'utf8'));
  } else {
    // Create .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file with default configuration');
  }
  
  console.log('\n📋 Environment Variables:');
  console.log('   VITE_POSTHOG_API_KEY: Set to your PostHog API key (optional)');
  console.log('   VITE_API_BASE_URL: Backend API URL');
  console.log('   VITE_ENABLE_ANALYTICS: Enable/disable PostHog analytics');
  console.log('   VITE_ENABLE_DEBUG: Enable debug mode');
  
  console.log('\n🔧 To fix the PostHog MIME type error:');
  console.log('   1. Set VITE_ENABLE_ANALYTICS=false (default)');
  console.log('   2. Or provide a valid PostHog API key');
  console.log('   3. Restart the development server');
  
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📝 Manual setup:');
  console.log('   Create a .env file in the frontend directory with:');
  console.log('   VITE_ENABLE_ANALYTICS=false');
  console.log('   VITE_API_BASE_URL=http://localhost:3000/api');
} 