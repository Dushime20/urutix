import { Injectable } from '@nestjs/common';
import { Payment } from '../../../entities/payment.entity';
import { TransactionState } from '../types/payment.types';

@Injectable()
export class TransactionStateService {
  async updateState(
    payment: Payment,
    state: TransactionState,
  ): Promise<Payment> {
    // ...update payment state, log audit trail...
    throw new Error('Not implemented');
  }
}
