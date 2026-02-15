require('dotenv').config();

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('\n🧪 Testing different Gemini model names...\n');

  const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest'
  ];

  for (const modelName of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
    
    const body = {
      contents: [{
        parts: [{
          text: 'Say hello'
        }]
      }]
    };

    try {
      console.log(`Testing: ${modelName}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        console.log(`✅ ${modelName} WORKS!`);
        console.log(`   Response: ${text}\n`);
        return modelName; // Return the working model
      } else {
        console.log(`❌ ${modelName} - ${response.status}\n`);
      }
    } catch (error) {
      console.log(`❌ ${modelName} - Error: ${error.message}\n`);
    }
  }

  console.log('❌ No working models found. Wait 2-3 minutes and try again.');
}

testModels();
