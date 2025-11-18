import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RewardStatus } from '../../entities/user-reward.entity';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('user/:userId')
  async getUserRewards(@Param('userId') userId: string, @Request() req) {
    return await this.rewardsService.getUserRewards(userId);
  }

  @Get('user/:userId/active')
  async getActiveRewards(@Param('userId') userId: string, @Request() req) {
    return await this.rewardsService.getUserRewards(
      userId,
      RewardStatus.ACTIVE,
    );
  }

  @Get('user/:userId/stats')
  async getRewardStats(@Param('userId') userId: string, @Request() req) {
    return await this.rewardsService.getRewardStats(userId);
  }

  @Post('reward/:rewardId/activate')
  async activateReward(@Param('rewardId') rewardId: string, @Request() req) {
    return await this.rewardsService.activateReward(rewardId);
  }

  @Post('reward/:rewardId/redeem')
  async redeemReward(@Param('rewardId') rewardId: string, @Request() req) {
    return await this.rewardsService.redeemReward(rewardId);
  }

  @Post('process-transaction')
  async processTransactionReward(
    @Request() req,
    @Body()
    processRewardDto: {
      transactionAmount: number;
      transactionType: string;
    },
  ) {
    return await this.rewardsService.processTransactionReward(
      req.user.userId,
      processRewardDto.transactionAmount,
      processRewardDto.transactionType,
    );
  }

  @Post('process-volume')
  async processVolumeReward(
    @Request() req,
    @Body()
    processVolumeDto: {
      monthlyVolume: number;
    },
  ) {
    return await this.rewardsService.processVolumeReward(
      req.user.userId,
      processVolumeDto.monthlyVolume,
    );
  }
}
