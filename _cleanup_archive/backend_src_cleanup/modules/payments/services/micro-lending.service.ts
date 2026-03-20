import { Injectable } from '@nestjs/common';
import { Payment } from '../../../entities/payment.entity';

@Injectable()
export class MicroLendingService {
  async offerLoan(payment: Payment): Promise<any> {
    // ...integrate with micro-lending provider...
    throw new Error('Not implemented');
  }
}
