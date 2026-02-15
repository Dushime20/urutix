import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface EmailGenerationRequest {
  purpose: string; // e.g., "announcement", "update", "marketing", "notification"
  tone: string; // e.g., "professional", "friendly", "urgent", "casual"
  keyPoints: string[]; // Main points to include
  targetAudience: string; // e.g., "logistics companies", "fleet owners"
  additionalContext?: string;
}

export interface EmailImprovementRequest {
  currentSubject?: string;
  currentBody?: string;
  improvementType: 'subject' | 'body' | 'both';
  tone?: string;
}

export interface EmailSuggestion {
  subject: string;
  body: string;
  reasoning: string;
}

@Injectable()
export class AIEmailAssistantService {
  private readonly logger = new Logger(AIEmailAssistantService.name);
  private anthropic: Anthropic | null = null;
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    
    if (apiKey && apiKey.trim() !== '') {
      try {
        this.anthropic = new Anthropic({
          apiKey: apiKey,
        });
        this.isConfigured = true;
        this.logger.log('✅ AI Email Assistant initialized with Anthropic Claude');
      } catch (error) {
        this.logger.error('❌ Failed to initialize Anthropic:', error.message);
        this.isConfigured = false;
      }
    } else {
      this.logger.warn('⚠️ Anthropic API key not configured. AI features will be disabled.');
      this.logger.warn('⚠️ Add ANTHROPIC_API_KEY to .env to enable AI email assistance');
      this.isConfigured = false;
    }
  }

  isAvailable(): boolean {
    return this.isConfigured && this.anthropic !== null;
  }

  async generateEmail(request: EmailGenerationRequest): Promise<EmailSuggestion> {
    if (!this.isAvailable()) {
      throw new Error('AI Email Assistant is not configured. Please add ANTHROPIC_API_KEY to environment variables.');
    }

    this.logger.log(`Generating email for purpose: ${request.purpose}`);

    const systemPrompt = `You are an expert email copywriter specializing in business communications for logistics and fleet management companies. 
You create professional, engaging emails that drive action while maintaining a ${request.tone} tone.
Always format emails in clean HTML with proper structure.`;

    const userPrompt = this.buildGenerationPrompt(request);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';
      return this.parseEmailResponse(response);
    } catch (error) {
      this.logger.error('Failed to generate email:', error.message);
      throw new Error(`AI email generation failed: ${error.message}`);
    }
  }

  async improveEmail(request: EmailImprovementRequest): Promise<EmailSuggestion> {
    if (!this.isAvailable()) {
      throw new Error('AI Email Assistant is not configured. Please add ANTHROPIC_API_KEY to environment variables.');
    }

    this.logger.log(`Improving email: ${request.improvementType}`);

    const systemPrompt = `You are an expert email editor specializing in improving business communications. 
You enhance clarity, engagement, and effectiveness while maintaining the original intent.
Always provide constructive improvements with clear reasoning.`;

    const userPrompt = this.buildImprovementPrompt(request);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';
      return this.parseEmailResponse(response);
    } catch (error) {
      this.logger.error('Failed to improve email:', error.message);
      throw new Error(`AI email improvement failed: ${error.message}`);
    }
  }

  async generateSubjectLines(context: string, count: number = 5): Promise<string[]> {
    if (!this.isAvailable()) {
      throw new Error('AI Email Assistant is not configured. Please add ANTHROPIC_API_KEY to environment variables.');
    }

    this.logger.log(`Generating ${count} subject line variations`);

    const systemPrompt = 'You are an expert at writing compelling email subject lines for B2B communications.';

    const userPrompt = `Generate ${count} compelling email subject lines for the following context:

${context}

Requirements:
- Keep subject lines under 60 characters
- Make them attention-grabbing but professional
- Include action-oriented language
- Vary the style (some direct, some curiosity-driven, some benefit-focused)
- Suitable for B2B logistics/fleet management audience

Return ONLY the subject lines, one per line, numbered.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';
      return this.parseSubjectLines(response);
    } catch (error) {
      this.logger.error('Failed to generate subject lines:', error.message);
      throw new Error(`AI subject line generation failed: ${error.message}`);
    }
  }

  async analyzeEmailEffectiveness(subject: string, body: string): Promise<{
    score: number;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  }> {
    if (!this.isAvailable()) {
      throw new Error('AI Email Assistant is not configured. Please add ANTHROPIC_API_KEY to environment variables.');
    }

    this.logger.log('Analyzing email effectiveness');

    const systemPrompt = 'You are an expert email marketing analyst specializing in B2B communications.';

    const userPrompt = `Analyze the effectiveness of this email:

Subject: ${subject}

Body:
${body}

Provide a detailed analysis in the following JSON format (return ONLY valid JSON, no markdown):
{
  "score": <number 0-100>,
  "strengths": [<list of strengths>],
  "improvements": [<list of areas to improve>],
  "recommendations": [<specific actionable recommendations>]
}

Consider:
- Subject line effectiveness
- Email structure and readability
- Call-to-action clarity
- Tone appropriateness for B2B audience
- Length and conciseness
- Engagement potential`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.5,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      let response = message.content[0].type === 'text' ? message.content[0].text : '';
      
      // Remove markdown code blocks if present
      response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to analyze email:', error.message);
      throw new Error(`AI email analysis failed: ${error.message}`);
    }
  }

  private buildGenerationPrompt(request: EmailGenerationRequest): string {
    return `Create a professional email for a logistics/fleet management platform with the following specifications:

Purpose: ${request.purpose}
Tone: ${request.tone}
Target Audience: ${request.targetAudience}

Key Points to Include:
${request.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

${request.additionalContext ? `Additional Context:\n${request.additionalContext}` : ''}

Requirements:
- Create an engaging subject line (under 60 characters)
- Write the email body in clean HTML format
- Include proper greeting and closing
- Add a clear call-to-action
- Use template variables: {{tenantName}}, {{email}} where appropriate
- Keep it concise but informative (300-500 words)
- Make it mobile-friendly

Return the response in this exact format:
SUBJECT: [subject line here]

BODY:
[HTML email body here]

REASONING:
[Brief explanation of your approach and why it will be effective]`;
  }

  private buildImprovementPrompt(request: EmailImprovementRequest): string {
    let prompt = `Improve the following email to make it more effective:\n\n`;

    if (request.currentSubject) {
      prompt += `Current Subject: ${request.currentSubject}\n\n`;
    }

    if (request.currentBody) {
      prompt += `Current Body:\n${request.currentBody}\n\n`;
    }

    prompt += `Improvement Focus: ${request.improvementType}\n`;
    
    if (request.tone) {
      prompt += `Desired Tone: ${request.tone}\n`;
    }

    prompt += `\nRequirements:
- Maintain the core message and intent
- Enhance clarity and engagement
- Improve call-to-action effectiveness
- Ensure mobile-friendliness
- Keep template variables intact: {{tenantName}}, {{email}}
- Make it more compelling and professional

Return the response in this exact format:
SUBJECT: [improved subject line]

BODY:
[improved HTML email body]

REASONING:
[Explanation of improvements made and why they're effective]`;

    return prompt;
  }

  private parseEmailResponse(response: string): EmailSuggestion {
    const subjectMatch = response.match(/SUBJECT:\s*(.+?)(?:\n|$)/i);
    const bodyMatch = response.match(/BODY:\s*([\s\S]+?)(?=REASONING:|$)/i);
    const reasoningMatch = response.match(/REASONING:\s*([\s\S]+?)$/i);

    return {
      subject: subjectMatch ? subjectMatch[1].trim() : 'Generated Email',
      body: bodyMatch ? bodyMatch[1].trim() : response,
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'AI-generated content',
    };
  }

  private parseSubjectLines(response: string): string[] {
    const lines = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 0);

    return lines;
  }
}
