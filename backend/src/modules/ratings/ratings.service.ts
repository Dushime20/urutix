import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserRating,
  RatingType,
  RatingCategory,
} from '../../entities/user-rating.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(UserRating)
    private readonly userRatingRepository: Repository<UserRating>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createRating(
    ratedUserId: string,
    raterUserId: string,
    ratingType: RatingType,
    category: RatingCategory,
    rating: number,
    comment?: string,
    metadata?: Record<string, any>,
  ): Promise<UserRating> {
    // Validate rating range
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Check if users exist
    const ratedUser = await this.userRepository.findOne({
      where: { id: ratedUserId },
    });
    const raterUser = await this.userRepository.findOne({
      where: { id: raterUserId },
    });

    if (!ratedUser || !raterUser) {
      throw new NotFoundException('User not found');
    }

    // Check if rating already exists for this combination
    const existingRating = await this.userRatingRepository.findOne({
      where: {
        ratedUserId,
        raterUserId,
        ratingType,
        category,
      },
    });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.comment = comment;
      existingRating.metadata = metadata;
      return await this.userRatingRepository.save(existingRating);
    }

    // Create new rating
    const newRating = this.userRatingRepository.create({
      ratedUserId,
      raterUserId,
      ratingType,
      category,
      rating,
      comment,
      metadata,
    });

    return await this.userRatingRepository.save(newRating);
  }

  async getUserRatings(
    userId: string,
    ratingType?: RatingType,
  ): Promise<UserRating[]> {
    const query = this.userRatingRepository
      .createQueryBuilder('rating')
      .leftJoinAndSelect('rating.raterUser', 'raterUser')
      .leftJoinAndSelect('raterUser.profile', 'raterProfile')
      .where('rating.ratedUserId = :userId', { userId });

    if (ratingType) {
      query.andWhere('rating.ratingType = :ratingType', { ratingType });
    }

    return await query.getMany();
  }

  async getAverageRating(
    userId: string,
    ratingType?: RatingType,
  ): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingBreakdown: Record<RatingCategory, { count: number; average: number }>;
  }> {
    const query = this.userRatingRepository
      .createQueryBuilder('rating')
      .where('rating.ratedUserId = :userId', { userId });

    if (ratingType) {
      query.andWhere('rating.ratingType = :ratingType', { ratingType });
    }

    const ratings = await query.getMany();

    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingBreakdown: {} as Record<
          RatingCategory,
          { count: number; average: number }
        >,
      };
    }

    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;

    // Calculate breakdown by category
    const breakdown: Record<
      RatingCategory,
      { count: number; average: number }
    > = {} as any;
    const categoryGroups = ratings.reduce(
      (groups, rating) => {
        if (!groups[rating.category]) {
          groups[rating.category] = [];
        }
        groups[rating.category].push(rating);
        return groups;
      },
      {} as Record<RatingCategory, UserRating[]>,
    );

    Object.keys(categoryGroups).forEach((category) => {
      const categoryRatings = categoryGroups[category as RatingCategory];
      const categoryTotal = categoryRatings.reduce(
        (sum, rating) => sum + rating.rating,
        0,
      );
      breakdown[category as RatingCategory] = {
        count: categoryRatings.length,
        average: categoryTotal / categoryRatings.length,
      };
    });

    return {
      averageRating,
      totalRatings: ratings.length,
      ratingBreakdown: breakdown,
    };
  }

  async getRatingStats(userId: string): Promise<{
    transporterRatings: { average: number; count: number };
    financingRatings: { average: number; count: number };
    platformRatings: { average: number; count: number };
  }> {
    const [transporterStats, financingStats, platformStats] = await Promise.all(
      [
        this.getAverageRating(userId, RatingType.TRANSPORTER),
        this.getAverageRating(userId, RatingType.FINANCING_COMMUNITY),
        this.getAverageRating(userId, RatingType.PLATFORM),
      ],
    );

    return {
      transporterRatings: {
        average: transporterStats.averageRating,
        count: transporterStats.totalRatings,
      },
      financingRatings: {
        average: financingStats.averageRating,
        count: financingStats.totalRatings,
      },
      platformRatings: {
        average: platformStats.averageRating,
        count: platformStats.totalRatings,
      },
    };
  }
}
