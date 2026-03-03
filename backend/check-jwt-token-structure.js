/**
 * Check JWT Token Structure
 * 
 * This script helps verify if JWT tokens include permissions array
 * 
 * Usage:
 * 1. Get your token from browser localStorage
 * 2. Run: node check-jwt-token-structure.js "YOUR_TOKEN_HERE"
 */

const jwt = require('jsonwebtoken');

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.log('\n❌ No token provided!');
  console.log('\nUsage:');
  console.log('  node check-jwt-token-structure.js "YOUR_TOKEN_HERE"');
  console.log('\nTo get your token:');
  console.log('  1. Open browser console (F12)');
  console.log('  2. Type: localStorage.getItem("token")');
  console.log('  3. Copy the token (without quotes)');
  console.log('  4. Run this script with the token\n');
  process.exit(1);
}

console.log('\n🔍 Analyzing JWT Token Structure...\n');

try {
  // Decode without verification (we just want to see the payload)
  const decoded = jwt.decode(token);
  
  if (!decoded) {
    console.log('❌ Invalid token format\n');
    process.exit(1);
  }

  console.log('✅ Token decoded successfully!\n');
  console.log('📋 Token Payload:');
  console.log(JSON.stringify(decoded, null, 2));
  console.log('\n');

  // Check for permissions
  if (decoded.permissions) {
    console.log(`✅ Permissions array found! (${decoded.permissions.length} permissions)`);
    console.log('\n📝 Permissions:');
    decoded.permissions.forEach((perm, index) => {
      console.log(`  ${index + 1}. ${perm}`);
    });
    
    // Check for truck:view specifically
    if (decoded.permissions.includes('truck:view')) {
      console.log('\n✅ truck:view permission is present!');
    } else {
      console.log('\n⚠️  truck:view permission is NOT present!');
    }
  } else {
    console.log('❌ NO permissions array in token!');
    console.log('\n🔧 This means:');
    console.log('  1. Backend code may not have compiled with the new changes');
    console.log('  2. Backend may not have been restarted');
    console.log('  3. You may need to log out and log back in');
  }

  console.log('\n📊 Token Info:');
  console.log(`  User ID: ${decoded.sub}`);
  console.log(`  Email: ${decoded.email}`);
  console.log(`  Role: ${decoded.role}`);
  console.log(`  Tenant ID: ${decoded.tenantId}`);
  
  if (decoded.exp) {
    const expiryDate = new Date(decoded.exp * 1000);
    console.log(`  Expires: ${expiryDate.toLocaleString()}`);
  }

  console.log('\n');

} catch (error) {
  console.log(`❌ Error decoding token: ${error.message}\n`);
  process.exit(1);
}
