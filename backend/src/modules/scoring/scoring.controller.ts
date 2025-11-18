import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScoreCategory } from '../../entities/user-score.entity';

@Controller('scoring')
@UseGuards(JwtAuthGuard)
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Get('user/:userId/scores')
  async getUserScores(@Param('userId') userId: string, @Request() req) {
    return await this.scoringService.getUserScores(userId);
  }

  @Get('user/:userId/scores/active')
  async getActiveScores(@Param('userId') userId: string, @Request() req) {
    return await this.scoringService.getActiveScores(userId);
  }

  @Get('user/:userId/scores/:category')
  async getScoresByCategory(
    @Param('userId') userId: string,
    @Param('category') category: ScoreCategory,
    @Request() req,
  ) {
    return await this.scoringService.getUserScores(userId, category);
  }

  @Get('user/:userId/scores/:category/history')
  async getScoreHistory(
    @Param('userId') userId: string,
    @Param('category') category: ScoreCategory,
    @Request() req,
  ) {
    return await this.scoringService.getScoreHistory(userId, category);
  }

  @Post('user/:userId/calculate/financial-health')
  async calculateFinancialHealthScore(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return await this.scoringService.calculateFinancialHealthScore(userId);
  }

  @Post('user/:userId/calculate/transaction-history')
  async calculateTransactionHistoryScore(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return await this.scoringService.calculateTransactionHistoryScore(userId);
  }

  @Post('user/:userId/calculate/payment-behavior')
  async calculatePaymentBehaviorScore(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return await this.scoringService.calculatePaymentBehaviorScore(userId);
  }

  @Post('user/:userId/calculate/cargo-quality')
  async calculateCargoQualityScore(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return await this.scoringService.calculateCargoQualityScore(userId);
  }

  @Post('user/:userId/calculate/communication')
  async calculateCommunicationScore(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return await this.scoringService.calculateCommunicationScore(userId);
  }

  @Post('user/:userId/calculate/reliability')
  async calculateReliabilityScore(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return await this.scoringService.calculateReliabilityScore(userId);
  }

  @Post('user/:userId/calculate/overall')
  async calculateOverallCreditScore(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return await this.scoringService.calculateOverallCreditScore(userId);
  }

  @Post('user/:userId/calculate/all')
  async calculateAllScores(@Param('userId') userId: string, @Request() req) {
    const [
      financialScore,
      transactionScore,
      paymentScore,
      cargoScore,
      communicationScore,
      reliabilityScore,
      overallScore,
    ] = await Promise.all([
      this.scoringService.calculateFinancialHealthScore(userId),
      this.scoringService.calculateTransactionHistoryScore(userId),
      this.scoringService.calculatePaymentBehaviorScore(userId),
      this.scoringService.calculateCargoQualityScore(userId),
      this.scoringService.calculateCommunicationScore(userId),
      this.scoringService.calculateReliabilityScore(userId),
      this.scoringService.calculateOverallCreditScore(userId),
    ]);

    return {
      financialHealth: financialScore,
      transactionHistory: transactionScore,
      paymentBehavior: paymentScore,
      cargoQuality: cargoScore,
      communication: communicationScore,
      reliability: reliabilityScore,
      overall: overallScore,
    };
  }
}
