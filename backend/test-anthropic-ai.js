require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

async function testAnthropicAI() {
  console.log('🧪 Testing Anthropic Claude AI Integration\n');
  console.log('='.repeat(60));

  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');
  console.log('');

  try {
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    console.log('✅ Anthropic client initialized');
    console.log('');

    // Test 1: Simple email generation
    console.log('📧 Test 1: Generating a simple email...');
    console.log('-'.repeat(60));

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.7,
      system: 'You are an expert email copywriter for logistics companies.',
      messages: [
        {
          role: 'user',
          content: `Create a professional email announcement about a new feature launch.

Requirements:
- Subject line under 60 characters
- Professional tone
- Include a call-to-action

Return in this format:
SUBJECT: [subject line]

BODY:
[email body in HTML]

REASONING:
[brief explanation]`,
        },
      ],
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('✅ Email generated successfully!\n');
    console.log('Response:');
    console.log(response);
    console.log('');

    // Test 2: Subject line generation
    console.log('📝 Test 2: Generating subject lines...');
    console.log('-'.repeat(60));

    const subjectMessage = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      temperature: 0.8,
      system: 'You are an expert at writing compelling email subject lines.',
      messages: [
        {
          role: 'user',
          content: `Generate 5 compelling email subject lines for announcing a new fleet tracking feature.

Requirements:
- Under 60 characters each
- Professional but engaging
- Action-oriented

Return ONLY the subject lines, one per line, numbered.`,
        },
      ],
    });

    const subjectResponse = subjectMessage.content[0].type === 'text' ? subjectMessage.content[0].text : '';
    console.log('✅ Subject lines generated!\n');
    console.log('Response:');
    console.log(subjectResponse);
    console.log('');

    // Test 3: Email analysis
    console.log('📊 Test 3: Analyzing email effectiveness...');
    console.log('-'.repeat(60));

    const analysisMessage = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.5,
      system: 'You are an expert email marketing analyst.',
      messages: [
        {
          role: 'user',
          content: `Analyze this email:

Subject: New Feature Alert
Body: We have a new feature. Check it out.

Return ONLY valid JSON:
{
  "score": <number 0-100>,
  "strengths": [<list>],
  "improvements": [<list>],
  "recommendations": [<list>]
}`,
        },
      ],
    });

    let analysisResponse = analysisMessage.content[0].type === 'text' ? analysisMessage.content[0].text : '';
    analysisResponse = analysisResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(analysisResponse);
    console.log('✅ Email analyzed successfully!\n');
    console.log('Analysis:');
    console.log(JSON.stringify(analysis, null, 2));
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('');
    console.log('Anthropic Claude AI is working correctly with:');
    console.log('  • Model: claude-3-5-sonnet-20241022');
    console.log('  • Email generation: ✅');
    console.log('  • Subject line generation: ✅');
    console.log('  • Email analysis: ✅');
    console.log('');
    console.log('🎉 AI Email Assistant is ready to use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

testAnthropicAI();
