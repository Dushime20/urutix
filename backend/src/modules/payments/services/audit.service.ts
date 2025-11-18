import { Injectable, Logger } from '@nestjs/common';
import { Payment } from '../../../entities/payment.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async log(action: string, payment: Payment, meta?: any): Promise<void> {
    // ...log to DB, file, or external system...
    this.logger.log(
      `[${action}] PaymentID: ${payment.id} Meta: ${JSON.stringify(meta)}`,
    );
  }
}
