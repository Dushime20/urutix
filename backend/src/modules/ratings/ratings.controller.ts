import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RatingType, RatingCategory } from '../../entities/user-rating.entity';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  async createRating(
    @Request() req,
    @Body()
    createRatingDto: {
      ratedUserId: string;
      ratingType: RatingType;
      category: RatingCategory;
      rating: number;
      comment?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return await this.ratingsService.createRating(
      createRatingDto.ratedUserId,
      req.user.userId,
      createRatingDto.ratingType,
      createRatingDto.category,
      createRatingDto.rating,
      createRatingDto.comment,
      createRatingDto.metadata,
    );
  }

  @Get('user/:userId')
  async getUserRatings(@Param('userId') userId: string, @Request() req) {
    return await this.ratingsService.getUserRatings(userId);
  }

  @Get('user/:userId/stats')
  async getUserRatingStats(@Param('userId') userId: string, @Request() req) {
    return await this.ratingsService.getRatingStats(userId);
  }

  @Get('user/:userId/average')
  async getUserAverageRating(@Param('userId') userId: string, @Request() req) {
    return await this.ratingsService.getAverageRating(userId);
  }

  @Get('user/:userId/transporter')
  async getTransporterRatings(@Param('userId') userId: string, @Request() req) {
    return await this.ratingsService.getAverageRating(
      userId,
      RatingType.TRANSPORTER,
    );
  }

  @Get('user/:userId/financing')
  async getFinancingRatings(@Param('userId') userId: string, @Request() req) {
    return await this.ratingsService.getAverageRating(
      userId,
      RatingType.FINANCING_COMMUNITY,
    );
  }

  @Get('user/:userId/platform')
  async getPlatformRatings(@Param('userId') userId: string, @Request() req) {
    return await this.ratingsService.getAverageRating(
      userId,
      RatingType.PLATFORM,
    );
  }
}
