import { Injectable, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Payment } from '../../../entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async checkAndSaveKey(key: string, paymentId: string): Promise<void> {
    // Use a unique constraint on (idempotencyKey, paymentId) in DB for production
    const existing = await this.paymentRepository.findOne({
      where: { idempotencyKey: key, id: paymentId },
    });
    if (existing) {
      throw new ConflictException(
        'Duplicate request: idempotency key already used',
      );
    }
    await this.paymentRepository.update(paymentId, { idempotencyKey: key });
  }
}
