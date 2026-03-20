import { Injectable, Logger } from '@nestjs/common';
import { Payment } from '../../../entities/payment.entity';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  /**
   * Reconcile internal payment records with provider statement.
   * @param providerPayments List of payments from provider
   * @param internalPayments List of internal payments
   * @returns List of mismatches or unresolved payments
   */
  async reconcile(
    providerPayments: any[],
    internalPayments: Payment[],
  ): Promise<any[]> {
    // Compare by transactionId, amount, status, etc.
    const mismatches: any[] = [];
    const providerMap = new Map(
      providerPayments.map((p) => [p.transactionId, p]),
    );
    for (const payment of internalPayments) {
      const provider = providerMap.get(payment.transactionId);
      if (
        !provider ||
        provider.amount !== payment.amount ||
        provider.status !== payment.status
      ) {
        mismatches.push({ payment, provider });
      }
    }
    return mismatches;
  }

  async logReconciliationResult(result: any[]): Promise<void> {
    for (const mismatch of result) {
      this.logger.warn(`Reconciliation mismatch: ${JSON.stringify(mismatch)}`);
    }
  }
}
