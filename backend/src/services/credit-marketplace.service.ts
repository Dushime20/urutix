import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditMarketplaceSettings } from '../entities/credit-marketplace-settings.entity';
import { CreditService } from './credit.service';
import { User } from '../entities/user.entity';
import { CreditTransactionType } from '../entities/credit-transaction.entity';
import { Payment, PaymentMethod, PaymentStatus, PaymentType } from '../entities/payment.entity';

export interface ConfigureMarketplaceDto {
  tenantId: string;
  tenantAdminUserId: string;
  minPurchaseAmount: number;
  maxPurchaseAmount?: number;
  pricePerCredit: number;
  isEnabled: boolean;
}

export interface PurchaseCreditsDto {
  tenantId: string;
  truckOwnerUserId: string;
  creditAmount: number;
  paymentMethod: 'card' | 'mobile_money';
  paymentDetails: any;
}

export interface MarketplaceAvailability {
  isEnabled: boolean;
  availableCredits: number;
  minPurchaseAmount: number;
  maxPurchaseAmount: number | null;
  pricePerCredit: number;
  totalCost: (amount: number) => number;
}

@Injectable()
export class CreditMarketplaceService {
  constructor(
    @InjectRepository(CreditMarketplaceSettings)
    private marketplaceSettingsRepository: Repository<CreditMarketplaceSettings>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private creditService: CreditService,
  ) {}

  /**
   * Configure marketplace settings for a tenant admin
   */
  async configureMarketplace(dto: ConfigureMarketplaceDto): Promise<CreditMarketplaceSettings> {
    // Validate tenant admin
    const tenantAdmin = await this.userRepository.findOne({
      where: { id: dto.tenantAdminUserId, tenantId: dto.tenantId, role: 'TENANT_ADMIN' as any },
    });

    if (!tenantAdmin) {
      throw new NotFoundException('Tenant admin not found');
    }

    // Validate amounts
    if (dto.minPurchaseAmount <= 0) {
      throw new BadRequestException('Minimum purchase amount must be greater than 0');
    }

    if (dto.maxPurchaseAmount && dto.maxPurchaseAmount < dto.minPurchaseAmount) {
      throw new BadRequestException('Maximum purchase amount must be greater than or equal to minimum');
    }

    if (dto.pricePerCredit <= 0) {
      throw new BadRequestException('Price per credit must be greater than 0');
    }

    // Check if settings already exist
    let settings = await this.marketplaceSettingsRepository.findOne({
      where: { tenantId: dto.tenantId },
    });

    if (settings) {
      // Update existing settings
      settings.minPurchaseAmount = dto.minPurchaseAmount;
      settings.maxPurchaseAmount = dto.maxPurchaseAmount || null;
      settings.pricePerCredit = dto.pricePerCredit;
      settings.isEnabled = dto.isEnabled;
    } else {
      // Create new settings
      settings = this.marketplaceSettingsRepository.create({
        tenantId: dto.tenantId,
        tenantAdminUserId: dto.tenantAdminUserId,
        minPurchaseAmount: dto.minPurchaseAmount,
        maxPurchaseAmount: dto.maxPurchaseAmount || null,
        pricePerCredit: dto.pricePerCredit,
        isEnabled: dto.isEnabled,
      });
    }

    return this.marketplaceSettingsRepository.save(settings);
  }

  /**
   * Get marketplace settings for a tenant
   */
  async getMarketplaceSettings(tenantId: string): Promise<CreditMarketplaceSettings | null> {
    return this.marketplaceSettingsRepository.findOne({
      where: { tenantId },
    });
  }

  /**
   * Get marketplace availability (for truck owners)
   */
  async getMarketplaceAvailability(tenantId: string): Promise<MarketplaceAvailability> {
    const settings = await this.getMarketplaceSettings(tenantId);

    if (!settings) {
      throw new NotFoundException('Credit marketplace is not configured for this tenant');
    }

    // Get tenant admin's available credits
    const tenantAdmin = await this.userRepository.findOne({
      where: { id: settings.tenantAdminUserId },
    });

    if (!tenantAdmin) {
      throw new NotFoundException('Tenant admin not found');
    }

    const creditAccount = await this.creditService.getOrCreateCreditAccount(
      tenantId,
      settings.tenantAdminUserId,
    );

    return {
      isEnabled: settings.isEnabled,
      availableCredits: creditAccount.currentBalance,
      minPurchaseAmount: settings.minPurchaseAmount,
      maxPurchaseAmount: settings.maxPurchaseAmount,
      pricePerCredit: Number(settings.pricePerCredit),
      totalCost: (amount: number) => amount * Number(settings.pricePerCredit),
    };
  }

  /**
   * Purchase credits from marketplace
   */
  async purchaseCredits(dto: PurchaseCreditsDto): Promise<any> {
    const settings = await this.getMarketplaceSettings(dto.tenantId);

    if (!settings) {
      throw new NotFoundException('Credit marketplace is not configured for this tenant');
    }

    if (!settings.isEnabled) {
      throw new BadRequestException('Credit marketplace is currently disabled');
    }

    // Validate purchase amount
    if (dto.creditAmount < settings.minPurchaseAmount) {
      throw new BadRequestException(
        `Minimum purchase amount is ${settings.minPurchaseAmount} credits`,
      );
    }

    if (settings.maxPurchaseAmount && dto.creditAmount > settings.maxPurchaseAmount) {
      throw new BadRequestException(
        `Maximum purchase amount is ${settings.maxPurchaseAmount} credits`,
      );
    }

    // Check tenant admin's available balance
    const tenantAdminAccount = await this.creditService.getOrCreateCreditAccount(
      dto.tenantId,
      settings.tenantAdminUserId,
    );

    if (tenantAdminAccount.currentBalance < dto.creditAmount) {
      throw new BadRequestException(
        `Insufficient credits available. Only ${tenantAdminAccount.currentBalance} credits available.`,
      );
    }

    // Calculate total cost
    const totalAmount = dto.creditAmount * Number(settings.pricePerCredit);

    // TODO: Process payment with payment gateway
    // For now, simulate successful payment
    const paymentResult = {
      success: true,
      transactionId: `MKT-${Date.now()}`,
      amount: totalAmount,
      paymentMethod: dto.paymentMethod,
    };

    if (!paymentResult.success) {
      throw new BadRequestException('Payment processing failed');
    }

    // Transfer credits from tenant admin to truck owner
    await this.transferCredits({
      tenantId: dto.tenantId,
      fromUserId: settings.tenantAdminUserId,
      toUserId: dto.truckOwnerUserId,
      creditAmount: dto.creditAmount,
      totalAmount,
      paymentTransactionId: paymentResult.transactionId,
    });

    // ── Record payment in payments table ──────────────────────────────────
    if (totalAmount > 0) {
      try {
        const methodMap: Record<string, PaymentMethod> = {
          card: PaymentMethod.CREDIT_CARD,
          mobile_money: PaymentMethod.DIGITAL_WALLET,
        };
        const payment = this.paymentRepository.create({
          tenantId: dto.tenantId,
          payerId: dto.truckOwnerUserId,
          amount: totalAmount,
          currency: 'USD',
          paymentMethod: methodMap[dto.paymentMethod] ?? PaymentMethod.DIGITAL_WALLET,
          paymentType: PaymentType.SERVICE_FEE,
          status: PaymentStatus.COMPLETED,
          transactionId: paymentResult.transactionId,
          description: `Credit marketplace purchase: ${dto.creditAmount} credits`,
          processedAt: new Date(),
          metadata: {
            creditAmount: dto.creditAmount,
            pricePerCredit: Number(settings.pricePerCredit),
            sellerId: settings.tenantAdminUserId,
            buyerId: dto.truckOwnerUserId,
          },
        });
        await this.paymentRepository.save(payment);
      } catch (e) {
        console.error('[CreditMarketplaceService] Failed to save payment record:', e.message);
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    return {
      success: true,
      message: 'Credits purchased successfully!',
      data: {
        creditsAdded: dto.creditAmount,
        totalCost: totalAmount,
        pricePerCredit: Number(settings.pricePerCredit),
        paymentTransactionId: paymentResult.transactionId,
      },
    };
  }

  /**
   * Transfer credits from tenant admin to truck owner
   */
  private async transferCredits(params: {
    tenantId: string;
    fromUserId: string;
    toUserId: string;
    creditAmount: number;
    totalAmount: number;
    paymentTransactionId: string;
  }): Promise<void> {
    const { tenantId, fromUserId, toUserId, creditAmount, totalAmount, paymentTransactionId } = params;

    // Deduct credits from tenant admin
    await this.creditService.deductCredits({
      tenantId,
      userId: fromUserId,
      amount: creditAmount,
      description: `Marketplace sale: ${creditAmount} credits sold to truck owner`,
      referenceType: 'MARKETPLACE_SALE',
      referenceId: null, // Marketplace transactions don't have UUID reference
      calculationDetails: {
        creditAmount,
        totalAmount,
        pricePerCredit: totalAmount / creditAmount,
        buyerUserId: toUserId,
        paymentTransactionId, // Store in metadata instead
      },
    });

    // Grant credits to truck owner
    await this.creditService.grantBonusCredits(
      tenantId,
      creditAmount,
      `Marketplace purchase: ${creditAmount} credits`,
      null, // No expiry
      toUserId,
    );

    // Update marketplace revenue tracking
    await this.updateMarketplaceRevenue(tenantId, fromUserId, totalAmount, creditAmount);
  }

  /**
   * Update marketplace revenue tracking
   */
  private async updateMarketplaceRevenue(
    tenantId: string,
    tenantAdminUserId: string,
    revenue: number,
    creditsSold: number,
  ): Promise<void> {
    const account = await this.creditService.getOrCreateCreditAccount(tenantId, tenantAdminUserId);

    // Update revenue tracking fields
    await this.creditService['creditAccountRepository'].update(account.id, {
      revenueFromMarketplaceSales: Number(account.revenueFromMarketplaceSales || 0) + revenue,
      totalCreditsSoldMarketplace: (account.totalCreditsSoldMarketplace || 0) + creditsSold,
      totalMarketplaceTransactions: (account.totalMarketplaceTransactions || 0) + 1,
    });
  }

  /**
   * Get marketplace sales statistics
   */
  async getMarketplaceStats(tenantId: string, tenantAdminUserId: string): Promise<any> {
    const account = await this.creditService.getOrCreateCreditAccount(tenantId, tenantAdminUserId);

    return {
      totalRevenue: Number(account.revenueFromMarketplaceSales || 0),
      totalCreditsSold: account.totalCreditsSoldMarketplace || 0,
      totalTransactions: account.totalMarketplaceTransactions || 0,
      averageTransactionSize:
        account.totalMarketplaceTransactions > 0
          ? Math.round((account.totalCreditsSoldMarketplace || 0) / account.totalMarketplaceTransactions)
          : 0,
      currentBalance: account.currentBalance,
    };
  }

  /**
   * Get marketplace purchase history for truck owner
   */
  async getPurchaseHistory(tenantId: string, truckOwnerUserId: string): Promise<any[]> {
    // Get all PURCHASE transactions from marketplace
    const transactions = await this.creditService['creditTransactionRepository'].find({
      where: {
        tenantId,
        userId: truckOwnerUserId,
        type: CreditTransactionType.PURCHASE,
        referenceType: 'MARKETPLACE_PURCHASE',
      },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return transactions.map(tx => ({
      id: tx.id,
      creditAmount: tx.amount,
      description: tx.description,
      balanceAfter: tx.balanceAfter,
      purchaseDate: tx.createdAt,
      metadata: tx.metadata,
    }));
  }
}
