import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserReward,
  RewardType,
  RewardStatus,
} from '../../entities/user-reward.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(UserReward)
    private readonly userRewardRepository: Repository<UserReward>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createReward(
    userId: string,
    type: RewardType,
    amount: number,
    description: string,
    criteria?: Record<string, any>,
    metadata?: Record<string, any>,
    validFrom?: Date,
    validUntil?: Date,
  ): Promise<UserReward> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const reward = this.userRewardRepository.create({
      userId,
      type,
      amount,
      description,
      criteria,
      metadata,
      validFrom,
      validUntil,
      status: RewardStatus.PENDING,
    });

    return await this.userRewardRepository.save(reward);
  }

  async getUserRewards(
    userId: string,
    status?: RewardStatus,
  ): Promise<UserReward[]> {
    const query = this.userRewardRepository
      .createQueryBuilder('reward')
      .where('reward.userId = :userId', { userId });

    if (status) {
      query.andWhere('reward.status = :status', { status });
    }

    return await query.orderBy('reward.createdAt', 'DESC').getMany();
  }

  async activateReward(rewardId: string): Promise<UserReward> {
    const reward = await this.userRewardRepository.findOne({
      where: { id: rewardId },
    });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    if (reward.status !== RewardStatus.PENDING) {
      throw new BadRequestException('Reward cannot be activated');
    }

    reward.status = RewardStatus.ACTIVE;
    return await this.userRewardRepository.save(reward);
  }

  async redeemReward(rewardId: string): Promise<UserReward> {
    const reward = await this.userRewardRepository.findOne({
      where: { id: rewardId },
    });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    if (reward.status !== RewardStatus.ACTIVE) {
      throw new BadRequestException('Reward is not active');
    }

    // Check if reward is still valid
    const now = new Date();
    if (reward.validUntil && now > reward.validUntil) {
      reward.status = RewardStatus.EXPIRED;
      await this.userRewardRepository.save(reward);
      throw new BadRequestException('Reward has expired');
    }

    reward.status = RewardStatus.REDEEMED;
    reward.redeemedAt = now;
    return await this.userRewardRepository.save(reward);
  }

  async getRewardStats(userId: string): Promise<{
    totalRewards: number;
    activeRewards: number;
    redeemedRewards: number;
    totalValue: number;
    pendingValue: number;
    activeValue: number;
  }> {
    const rewards = await this.getUserRewards(userId);

    const stats = {
      totalRewards: rewards.length,
      activeRewards: rewards.filter((r) => r.status === RewardStatus.ACTIVE)
        .length,
      redeemedRewards: rewards.filter((r) => r.status === RewardStatus.REDEEMED)
        .length,
      totalValue: rewards.reduce((sum, r) => sum + r.amount, 0),
      pendingValue: rewards
        .filter((r) => r.status === RewardStatus.PENDING)
        .reduce((sum, r) => sum + r.amount, 0),
      activeValue: rewards
        .filter((r) => r.status === RewardStatus.ACTIVE)
        .reduce((sum, r) => sum + r.amount, 0),
    };

    return stats;
  }

  async processTransactionReward(
    userId: string,
    transactionAmount: number,
    transactionType: string,
  ): Promise<UserReward | null> {
    // Calculate reward based on transaction
    let rewardAmount = 0;
    let rewardType: RewardType;
    let description = '';

    // Example reward logic
    if (transactionAmount >= 100000) {
      rewardAmount = transactionAmount * 0.02; // 2% cashback for large transactions
      rewardType = RewardType.CASHBACK;
      description = `2% cashback on transaction of ${transactionAmount.toLocaleString()} KES`;
    } else if (transactionAmount >= 50000) {
      rewardAmount = transactionAmount * 0.01; // 1% cashback for medium transactions
      rewardType = RewardType.CASHBACK;
      description = `1% cashback on transaction of ${transactionAmount.toLocaleString()} KES`;
    } else {
      rewardAmount = 100; // Fixed reward for small transactions
      rewardType = RewardType.LOYALTY_POINTS;
      description = 'Loyalty points for transaction';
    }

    if (rewardAmount > 0) {
      return await this.createReward(
        userId,
        rewardType,
        rewardAmount,
        description,
        {
          transactionAmount,
          transactionType,
          triggerType: 'transaction',
        },
      );
    }

    return null;
  }

  async processVolumeReward(
    userId: string,
    monthlyVolume: number,
  ): Promise<UserReward | null> {
    let rewardAmount = 0;
    let description = '';

    // Volume-based rewards
    if (monthlyVolume >= 1000000) {
      rewardAmount = 5000; // Premium reward for high volume
      description = 'Premium volume bonus for 1M+ monthly transactions';
    } else if (monthlyVolume >= 500000) {
      rewardAmount = 2500; // Standard reward for medium volume
      description = 'Volume bonus for 500K+ monthly transactions';
    } else if (monthlyVolume >= 100000) {
      rewardAmount = 1000; // Basic reward for low volume
      description = 'Volume bonus for 100K+ monthly transactions';
    }

    if (rewardAmount > 0) {
      return await this.createReward(
        userId,
        RewardType.VOLUME_BONUS,
        rewardAmount,
        description,
        {
          monthlyVolume,
          triggerType: 'volume',
        },
      );
    }

    return null;
  }
}
