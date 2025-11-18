import { Injectable, Logger } from '@nestjs/common';
import { Payment } from '../../../entities/payment.entity';

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  /**
   * Advanced fraud check using external service or ML model.
   * @param payment Payment to check
   * @returns true if suspicious, false otherwise
   */
  async check(payment: Payment): Promise<boolean> {
    // Example: call external fraud API or ML model
    // const result = await externalFraudApi.analyze(payment);
    // if (result.suspicious) {
    //   this.logger.warn(`Fraud detected: ${payment.id}`);
    //   return true;
    // }
    // Simulate with random flag for demo
    const suspicious = Math.random() < 0.03; // 3% flagged
    if (suspicious) {
      this.logger.warn(`Fraud detected: ${payment.id}`);
    }
    return suspicious;
  }

  /**
   * Batch fraud analysis for reconciliation or audits.
   */
  async batchCheck(
    payments: Payment[],
  ): Promise<{ payment: Payment; suspicious: boolean }[]> {
    const results: any[] = [];
    for (const payment of payments) {
      const suspicious = await this.check(payment);
      results.push({ payment, suspicious });
    }
    return results;
  }
}
