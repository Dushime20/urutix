import { Injectable } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import { UsersService } from '../users/users.service';
import { DisputesService } from '../disputes/disputes.service';
import { AuditService } from '../payments/services/audit.service';
import { NotificationService } from '../notifications/services/notification.service';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly usersService: UsersService,
    private readonly disputesService: DisputesService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async handleWorkflow(type: string, payload: any) {
    switch (type) {
      case 'create-user': {
        const user = await this.usersService.create(payload);
        await this.auditService.log('User created', { id: user.id } as any);
        return { status: 'User creation triggered', user };
      }
      case 'resolve-dispute': {
        const dispute = await this.disputesService.resolve(payload.disputeId);
        await this.auditService.log('Dispute resolved', {
          id: dispute.id,
        } as any);
        return { status: 'Dispute resolution triggered', dispute };
      }
      case 'trigger-payout': {
        if (payload.paymentId && payload.tenantId) {
          const result = await this.paymentsService.processPayment(
            payload.paymentId,
            payload.tenantId,
          );
          await this.auditService.log('Payout triggered', result);
          return { status: 'Payout triggered', result };
        }
        return { status: 'Missing paymentId or tenantId', payload };
      }
      case 'send-alert': {
        if (payload.sendDto) {
          const notifications = await this.notificationService.sendNotification(
            payload.sendDto,
          );
          await this.auditService.log('Alert sent', {
            id: notifications.map((n) => n.id).join(','),
          } as any);
          return { status: 'Alert sent', notifications };
        }
        return { status: 'Missing sendDto', payload };
      }
      case 'pricing-estimate': {
        await this.auditService.log('Pricing estimate', { payload } as any);
        return { status: 'Pricing estimate triggered', payload };
      }
      default:
        return { status: 'Unknown workflow', type, payload };
    }
  }
}
