import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BulkEmailService } from '../../services/bulk-email.service';
import { AIEmailAssistantService } from '../../services/ai-email-assistant.service';

@Controller('admin/bulk-email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class BulkEmailController {
  constructor(
    private readonly bulkEmailService: BulkEmailService,
    private readonly aiEmailAssistant: AIEmailAssistantService,
  ) {}

  // Email Templates
  @Get('templates')
  async getAllTemplates() {
    try {
      const templates = await this.bulkEmailService.getAllTemplates();
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch email templates',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates/active')
  async getActiveTemplates() {
    try {
      const templates = await this.bulkEmailService.getActiveTemplates();
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch active templates',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    try {
      const template = await this.bulkEmailService.getTemplate(id);
      if (!template) {
        throw new HttpException(
          {
            success: false,
            message: 'Template not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: template,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch template',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('templates')
  async createTemplate(@Request() req, @Body() body: any) {
    try {
      const template = await this.bulkEmailService.createTemplate({
        ...body,
        createdBy: req.user.userId,
      });
      return {
        success: true,
        message: 'Email template created successfully',
        data: template,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create email template',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('templates/:id')
  async updateTemplate(
    @Request() req,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    try {
      const template = await this.bulkEmailService.updateTemplate(id, {
        ...body,
        updatedBy: req.user.userId,
      });
      return {
        success: true,
        message: 'Email template updated successfully',
        data: template,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update email template',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    try {
      await this.bulkEmailService.deleteTemplate(id);
      return {
        success: true,
        message: 'Email template deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete email template',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Bulk Email Sending
  @Post('send-template')
  async sendBulkEmailWithTemplate(@Request() req, @Body() body: any) {
    try {
      const { templateId, filters } = body;

      if (!templateId) {
        throw new HttpException(
          {
            success: false,
            message: 'Template ID is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const log = await this.bulkEmailService.sendBulkEmailToTenants(
        req.user.userId,
        req.user.email,
        templateId,
        filters,
      );

      return {
        success: true,
        message: 'Bulk email sending initiated',
        data: log,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send bulk email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send-custom')
  async sendCustomBulkEmail(@Request() req, @Body() body: any) {
    try {
      const { subject, htmlBody, textBody, filters } = body;

      if (!subject || !htmlBody) {
        throw new HttpException(
          {
            success: false,
            message: 'Subject and HTML body are required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const log = await this.bulkEmailService.sendCustomBulkEmail(
        req.user.userId,
        req.user.email,
        subject,
        htmlBody,
        textBody,
        filters,
      );

      return {
        success: true,
        message: 'Custom bulk email sending initiated',
        data: log,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send custom bulk email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Bulk Email Logs
  @Get('logs')
  async getBulkEmailLogs() {
    try {
      const logs = await this.bulkEmailService.getBulkEmailLogs();
      return {
        success: true,
        data: logs,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch bulk email logs',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('logs/:id')
  async getBulkEmailLog(@Param('id') id: string) {
    try {
      const log = await this.bulkEmailService.getBulkEmailLog(id);
      if (!log) {
        throw new HttpException(
          {
            success: false,
            message: 'Log not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: log,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch bulk email log',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // AI Assistant Endpoints
  @Get('ai/status')
  async getAIStatus() {
    return {
      success: true,
      data: {
        available: this.aiEmailAssistant.isAvailable(),
        message: this.aiEmailAssistant.isAvailable()
          ? 'AI Email Assistant is ready'
          : 'AI Email Assistant is not configured. Add ANTHROPIC_API_KEY to enable.',
      },
    };
  }

  @Post('ai/generate')
  async generateEmail(@Body() body: any) {
    try {
      if (!this.aiEmailAssistant.isAvailable()) {
        throw new HttpException(
          {
            success: false,
            message: 'AI Email Assistant is not configured',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const suggestion = await this.aiEmailAssistant.generateEmail({
        purpose: body.purpose,
        tone: body.tone,
        keyPoints: body.keyPoints,
        targetAudience: body.targetAudience || 'logistics companies',
        additionalContext: body.additionalContext,
      });

      return {
        success: true,
        data: suggestion,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to generate email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('ai/improve')
  async improveEmail(@Body() body: any) {
    try {
      if (!this.aiEmailAssistant.isAvailable()) {
        throw new HttpException(
          {
            success: false,
            message: 'AI Email Assistant is not configured',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const suggestion = await this.aiEmailAssistant.improveEmail({
        currentSubject: body.currentSubject,
        currentBody: body.currentBody,
        improvementType: body.improvementType,
        tone: body.tone,
      });

      return {
        success: true,
        data: suggestion,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to improve email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('ai/subject-lines')
  async generateSubjectLines(@Body() body: any) {
    try {
      if (!this.aiEmailAssistant.isAvailable()) {
        throw new HttpException(
          {
            success: false,
            message: 'AI Email Assistant is not configured',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const subjectLines = await this.aiEmailAssistant.generateSubjectLines(
        body.context,
        body.count || 5,
      );

      return {
        success: true,
        data: subjectLines,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to generate subject lines',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('ai/analyze')
  async analyzeEmail(@Body() body: any) {
    try {
      if (!this.aiEmailAssistant.isAvailable()) {
        throw new HttpException(
          {
            success: false,
            message: 'AI Email Assistant is not configured',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const analysis = await this.aiEmailAssistant.analyzeEmailEffectiveness(
        body.subject,
        body.body,
      );

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to analyze email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
