import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageRole } from '../../entities/message.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class MessengerService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getThreads(userId: string, tenantId: string) {
    // Get all unique conversations for this user
    const sentMessages = await this.messageRepository
      .createQueryBuilder('message')
      .select('message.recipientId', 'participantId')
      .addSelect('MAX(message.createdAt)', 'lastMessageTime')
      .where('message.senderId = :userId', { userId })
      .andWhere('message.tenantId = :tenantId', { tenantId })
      .groupBy('message.recipientId')
      .getRawMany();

    const receivedMessages = await this.messageRepository
      .createQueryBuilder('message')
      .select('message.senderId', 'participantId')
      .addSelect('MAX(message.createdAt)', 'lastMessageTime')
      .where('message.recipientId = :userId', { userId })
      .andWhere('message.tenantId = :tenantId', { tenantId })
      .groupBy('message.senderId')
      .getRawMany();

    // Combine and deduplicate participants
    const participantMap = new Map();
    [...sentMessages, ...receivedMessages].forEach((msg) => {
      const participantId = msg.participantId;
      if (!participantMap.has(participantId)) {
        participantMap.set(participantId, msg.lastMessageTime);
      } else {
        const existingTime = participantMap.get(participantId);
        if (new Date(msg.lastMessageTime) > new Date(existingTime)) {
          participantMap.set(participantId, msg.lastMessageTime);
        }
      }
    });

    // Build threads with participant info
    const threads = await Promise.all(
      Array.from(participantMap.entries()).map(async ([participantId, _]) => {
        const threadId = this.generateThreadId(userId, participantId);

        // Get participant info
        const participant = await this.userRepository.findOne({
          where: { id: participantId },
        });

        // Get last message
        const lastMessage = await this.messageRepository.findOne({
          where: [
            { senderId: userId, recipientId: participantId, tenantId },
            { senderId: participantId, recipientId: userId, tenantId },
          ],
          order: { createdAt: 'DESC' },
          relations: ['sender'],
        });

        // Count unread messages
        const unreadCount = await this.messageRepository.count({
          where: {
            senderId: participantId,
            recipientId: userId,
            tenantId,
            isRead: false,
          },
        });

        return {
          id: threadId,
          participantId,
          participantName: participant?.email || 'Unknown User',
          participantRole: participant?.role || 'SYSTEM',
          unreadCount,
          tripId: lastMessage?.tripId,
          loadId: lastMessage?.loadId,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                senderId: lastMessage.senderId,
                senderName: lastMessage.sender?.email || 'Unknown',
                senderRole: lastMessage.senderRole,
                recipientId: lastMessage.recipientId,
                content: lastMessage.content,
                timestamp: lastMessage.createdAt.toISOString(),
                isRead: lastMessage.isRead,
                tripId: lastMessage.tripId,
                loadId: lastMessage.loadId,
              }
            : undefined,
        };
      }),
    );

    // Sort by last message time
    return threads.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || '';
      const timeB = b.lastMessage?.timestamp || '';
      return timeB.localeCompare(timeA);
    });
  }

  async getMessages(threadId: string, userId: string, tenantId: string) {
    // Extract participant IDs from thread ID
    const participantId = this.extractParticipantFromThreadId(threadId, userId);
    
    // If participantId is not a valid UUID, return empty array (for mock thread IDs)
    if (!this.isValidUUID(participantId)) {
      return [];
    }

    const messages = await this.messageRepository.find({
      where: [
        { senderId: userId, recipientId: participantId, tenantId },
        { senderId: participantId, recipientId: userId, tenantId },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });

    return messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender?.email || 'Unknown',
      senderRole: msg.senderRole,
      recipientId: msg.recipientId,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      isRead: msg.isRead,
      tripId: msg.tripId,
      loadId: msg.loadId,
    }));
  }

  async sendMessage(
    senderId: string,
    recipientId: string,
    content: string,
    tenantId: string,
    options: { tripId?: string; loadId?: string; senderRole?: MessageRole } = {},
  ) {
    const threadId = this.generateThreadId(senderId, recipientId);

    const message = this.messageRepository.create({
      threadId,
      senderId,
      recipientId,
      content,
      tenantId,
      senderRole: options.senderRole || MessageRole.SYSTEM,
      tripId: options.tripId,
      loadId: options.loadId,
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Load sender info
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });

    return {
      id: savedMessage.id,
      senderId: savedMessage.senderId,
      senderName: sender?.email || 'Unknown',
      senderRole: savedMessage.senderRole,
      recipientId: savedMessage.recipientId,
      content: savedMessage.content,
      timestamp: savedMessage.createdAt.toISOString(),
      isRead: savedMessage.isRead,
      tripId: savedMessage.tripId,
      loadId: savedMessage.loadId,
    };
  }

  async markAsRead(threadId: string, userId: string, tenantId: string) {
    const participantId = this.extractParticipantFromThreadId(threadId, userId);
    
    // If participantId is not a valid UUID, return success (for mock thread IDs)
    if (!this.isValidUUID(participantId)) {
      return { success: true };
    }

    await this.messageRepository.update(
      {
        senderId: participantId,
        recipientId: userId,
        tenantId,
        isRead: false,
      },
      { isRead: true },
    );

    return { success: true };
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private generateThreadId(userId1: string, userId2: string): string {
    // Always generate the same thread ID regardless of order
    const sorted = [userId1, userId2].sort();
    return `thread-${sorted[0]}-${sorted[1]}`;
  }

  private extractParticipantFromThreadId(threadId: string, currentUserId: string): string {
    // Handle mock thread IDs (e.g., "thread-1", "thread-2")
    if (!threadId.includes('-') || threadId.split('-').length === 2) {
      // Return the part after "thread-" for mock IDs
      return threadId.replace('thread-', '');
    }
    
    // Extract the other participant's ID from the thread ID (format: thread-{uuid1}-{uuid2})
    const parts = threadId.replace('thread-', '').split('-');
    
    // Reconstruct UUIDs (they contain hyphens)
    // Format: thread-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidPattern = /^thread-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
    const match = threadId.match(uuidPattern);
    
    if (match) {
      const uuid1 = match[1];
      const uuid2 = match[2];
      return uuid1 === currentUserId ? uuid2 : uuid1;
    }
    
    // Fallback: return the threadId without "thread-" prefix
    return threadId.replace('thread-', '');
  }
}
