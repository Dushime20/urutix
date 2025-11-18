// Final comprehensive test
console.log('🎉 FINAL INTEGRATION TEST RESULTS');
console.log('=====================================');

const testEndpoint = async (name, url) => {
  try {
    const response = await fetch(url);
    const status = response.status;
    const isSuccess = status >= 200 && status < 300;
    console.log(`${name}: ${isSuccess ? '✅' : '❌'} (${status})`);
    return isSuccess;
  } catch (error) {
    console.log(`${name}: ❌ (Error: ${error.message})`);
    return false;
  }
};

const runTests = async () => {
  console.log('\n🧪 Testing Backend Integration...\n');
  
  const results = await Promise.all([
    testEndpoint('Health API', 'http://localhost:3000/api/health'),
    testEndpoint('Matching API', 'http://localhost:3000/api/matching/algorithms'),
    testEndpoint('Loads API', 'http://localhost:3000/api/loads-v2/test/health'),
    testEndpoint('Bidding API', 'http://localhost:3000/api/bidding/test'),
  ]);

  const workingCount = results.filter(r => r).length;
  
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Working APIs: ${workingCount}/4`);
  console.log(`❌ Failed APIs: ${4 - workingCount}/4`);
  
  if (workingCount === 4) {
    console.log('\n🎉 SUCCESS! All APIs are working!');
    console.log('\n🚀 REAL BACKEND INTEGRATION STATUS:');
    console.log('✅ Health API - Working');
    console.log('✅ Matching API - Working');
    console.log('✅ Loads API - Working');
    console.log('✅ Bidding API - Working');
    console.log('\n🎯 READY FOR TESTING:');
    console.log('Navigate to: http://localhost:5173/dashboard/cargos/create');
    console.log('to test the complete cargo owner journey with real data!');
  } else {
    console.log('\n⚠️ Some APIs need attention.');
    console.log('Check the backend logs for more details.');
  }
};

runTests(); 