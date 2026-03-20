require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('🔍 Listing available Gemini models...\n');
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different model names
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'models/gemini-pro',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash'
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello');
        const response = result.response.text();
        console.log(`✅ ${modelName} WORKS!`);
        console.log(`   Response: ${response.substring(0, 50)}...\n`);
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message.substring(0, 100)}\n`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

listModels();
