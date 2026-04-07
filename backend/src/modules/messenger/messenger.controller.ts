import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessengerService } from './messenger.service';
import { MessageRole } from '../../entities/message.entity';

@ApiTags('Messenger')
@ApiBearerAuth()
@Controller('messenger')
@UseGuards(JwtAuthGuard)
export class MessengerController {
  constructor(private readonly messengerService: MessengerService) {}

  @Get('threads')
  @ApiOperation({ summary: 'Get all message threads for current user' })
  @ApiResponse({ status: 200, description: 'Threads retrieved successfully' })
  async getThreads(@Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.messengerService.getThreads(userId, tenantId);
  }

  @Get('threads/:threadId/messages')
  @ApiOperation({ summary: 'Get all messages in a thread' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getMessages(@Param('threadId') threadId: string, @Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.messengerService.getMessages(threadId, userId, tenantId);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @Body()
    body: {
      recipientId: string;
      content: string;
      tripId?: string;
      loadId?: string;
    },
    @Request() req,
  ) {
    const senderId = req.user.userId;
    const tenantId = req.user.tenantId;
    const senderRole = this.mapRoleToMessageRole(req.user.role);

    return this.messengerService.sendMessage(
      senderId,
      body.recipientId,
      body.content,
      tenantId,
      {
        tripId: body.tripId,
        loadId: body.loadId,
        senderRole,
      },
    );
  }

  @Post('threads/:threadId/read')
  @ApiOperation({ summary: 'Mark all messages in thread as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsRead(@Param('threadId') threadId: string, @Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.messengerService.markAsRead(threadId, userId, tenantId);
  }

  private mapRoleToMessageRole(userRole: string): MessageRole {
    const roleMap: Record<string, MessageRole> = {
      DRIVER: MessageRole.DRIVER,
      CARGO_OWNER: MessageRole.CARGO_OWNER,
      SHIPPER: MessageRole.SHIPPER,
      TRUCK_OWNER: MessageRole.TRUCK_OWNER,
      DISPATCH: MessageRole.DISPATCH,
    };
    return roleMap[userRole] || MessageRole.SYSTEM;
  }
}
