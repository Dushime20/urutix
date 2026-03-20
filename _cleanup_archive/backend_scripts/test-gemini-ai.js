/**
 * Test script for Gemini AI Email Assistant
 * 
 * This script tests the AI Email Assistant with Google Gemini
 * Run: node test-gemini-ai.js
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAI() {
  console.log('\n🧪 Testing Gemini AI Email Assistant\n');
  console.log('='.repeat(60));

  // Check if API key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.log('\n❌ GEMINI_API_KEY not configured in .env file');
    console.log('\n📝 To fix:');
    console.log('1. Visit: https://makersuite.google.com/app/apikey');
    console.log('2. Create a free API key');
    console.log('3. Add to backend/.env: GEMINI_API_KEY=your-key-here');
    console.log('4. Run this test again\n');
    process.exit(1);
  }

  console.log('✅ API Key found in .env');
  console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);

  try {
    // Initialize Gemini
    console.log('\n📡 Initializing Google Gemini...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });
    console.log('✅ Gemini initialized successfully');

    // Test 1: Generate Email
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Generate Email');
    console.log('='.repeat(60));
    
    const generatePrompt = `You are an expert email copywriter for logistics companies.

Create a professional email with the following:

Purpose: announcement
Tone: professional
Key Points:
1. New feature launch
2. Improved performance
3. Special offer for early adopters

Return in this format:
SUBJECT: [subject line]

BODY:
[HTML email body]

REASONING:
[Brief explanation]`;

    console.log('📤 Sending request to Gemini...');
    const generateResult = await model.generateContent(generatePrompt);
    const generateResponse = generateResult.response.text();
    
    console.log('✅ Email generated successfully!');
    console.log('\n📧 Generated Content:');
    console.log('-'.repeat(60));
    console.log(generateResponse.substring(0, 500) + '...');
    console.log('-'.repeat(60));

    // Test 2: Generate Subject Lines
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Generate Subject Lines');
    console.log('='.repeat(60));

    const subjectPrompt = `Generate 5 compelling email subject lines for:

Context: New fleet management features that save time and reduce costs

Requirements:
- Under 60 characters
- Professional B2B tone
- Action-oriented
- Varied styles

Return ONLY the subject lines, numbered.`;

    console.log('📤 Sending request to Gemini...');
    const subjectResult = await model.generateContent(subjectPrompt);
    const subjectResponse = subjectResult.response.text();
    
    console.log('✅ Subject lines generated!');
    console.log('\n📝 Generated Subject Lines:');
    console.log('-'.repeat(60));
    console.log(subjectResponse);
    console.log('-'.repeat(60));

    // Test 3: Analyze Email
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Analyze Email Effectiveness');
    console.log('='.repeat(60));

    const analyzePrompt = `Analyze this email and return ONLY valid JSON (no markdown):

Subject: Important System Update
Body: Dear Customer, We have updated our system. Please check it out. Thanks.

Return in this exact JSON format:
{
  "score": <number 0-100>,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "recommendations": ["rec1", "rec2"]
}`;

    console.log('📤 Sending request to Gemini...');
    const analyzeResult = await model.generateContent(analyzePrompt);
    let analyzeResponse = analyzeResult.response.text();
    
    // Remove markdown code blocks if present
    analyzeResponse = analyzeResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(analyzeResponse);
    
    console.log('✅ Email analyzed successfully!');
    console.log('\n📊 Analysis Results:');
    console.log('-'.repeat(60));
    console.log(`Score: ${analysis.score}/100`);
    console.log(`\nStrengths: ${analysis.strengths.length}`);
    analysis.strengths.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    console.log(`\nImprovements: ${analysis.improvements.length}`);
    analysis.improvements.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    console.log(`\nRecommendations: ${analysis.recommendations.length}`);
    analysis.recommendations.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    console.log('-'.repeat(60));

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ Gemini AI Email Assistant is working perfectly!');
    console.log('\n📋 Summary:');
    console.log('   ✓ API key valid');
    console.log('   ✓ Email generation working');
    console.log('   ✓ Subject line generation working');
    console.log('   ✓ Email analysis working');
    console.log('   ✓ JSON parsing working');
    console.log('\n🚀 Ready to use in production!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart backend: npm run start:dev');
    console.log('   2. Login as super admin');
    console.log('   3. Go to /admin/bulk-email');
    console.log('   4. Click "AI Assistant" button');
    console.log('   5. Try all 4 AI features!\n');

  } catch (error) {
    console.log('\n❌ TEST FAILED');
    console.log('='.repeat(60));
    console.log('\nError:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n📝 API Key Issue:');
      console.log('   - Check if key is correct');
      console.log('   - Verify no extra spaces');
      console.log('   - Get new key from: https://makersuite.google.com/app/apikey');
    } else if (error.message.includes('quota') || error.message.includes('rate')) {
      console.log('\n⏱️ Rate Limit Issue:');
      console.log('   - Wait 1 minute and try again');
      console.log('   - Free tier: 60 requests/minute');
    } else {
      console.log('\n🔍 Debug Info:');
      console.log('   - Check internet connection');
      console.log('   - Verify Gemini API status');
      console.log('   - Check backend logs');
    }
    
    console.log('\n');
    process.exit(1);
  }
}

// Run the test
testGeminiAI().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
