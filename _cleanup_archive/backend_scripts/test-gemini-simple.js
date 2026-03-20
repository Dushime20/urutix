require('dotenv').config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('\n🧪 Testing Gemini API with direct fetch...\n');
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);

  // Try direct API call
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
  
  const body = {
    contents: [{
      parts: [{
        text: 'Say hello in one sentence'
      }]
    }]
  };

  try {
    console.log('📤 Sending request to Gemini API...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS!');
      console.log('\nResponse:', JSON.stringify(data, null, 2));
      
      if (data.candidates && data.candidates[0]) {
        const text = data.candidates[0].content.parts[0].text;
        console.log('\n📝 Generated text:', text);
      }
    } else {
      console.log('❌ FAILED');
      console.log('\nError:', JSON.stringify(data, null, 2));
      
      if (data.error) {
        console.log('\n💡 Solution:');
        if (data.error.message.includes('API key not valid')) {
          console.log('   - Check your API key is correct');
          console.log('   - Get new key: https://makersuite.google.com/app/apikey');
        } else if (data.error.message.includes('not found') || data.error.message.includes('404')) {
          console.log('   - Enable the API: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
          console.log('   - Wait 1-2 minutes after enabling');
        } else if (data.error.message.includes('quota') || data.error.message.includes('rate')) {
          console.log('   - Wait 1 minute and try again');
          console.log('   - Free tier: 60 requests/minute');
        }
      }
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

testGemini();
