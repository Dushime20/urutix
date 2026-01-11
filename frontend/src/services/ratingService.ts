import api from './api';

export enum RatingType {
    TRANSPORTER = 'transporter',
    FINANCING_COMMUNITY = 'financing_community',
    PLATFORM = 'platform',
}

export enum RatingCategory {
    RELIABILITY = 'reliability',
    PAYMENT_PUNCTUALITY = 'payment_punctuality',
    COMMUNICATION = 'communication',
    CARGO_CONDITION = 'cargo_condition',
    PROFESSIONALISM = 'professionalism',
    OVERALL = 'overall',
}

export interface CreateRatingDto {
    ratedUserId: string;
    ratingType: RatingType;
    category: RatingCategory;
    rating: number;
    comment?: string;
    metadata?: Record<string, any>;
}

export interface UserRating {
    id: string;
    ratedUserId: string;
    raterUserId: string;
    ratingType: RatingType;
    category: RatingCategory;
    rating: number;
    comment?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface RatingStats {
    averageRating: number;
    totalRatings: number;
    ratingBreakdown: Record<RatingCategory, { count: number; average: number }>;
}

class RatingService {
    private baseUrl = '/ratings';

    /**
     * Create a new rating or update existing one
     */
    async createRating(data: CreateRatingDto): Promise<UserRating> {
        const response = await api.post(this.baseUrl, data);
        return response.data;
    }

    /**
     * Rate a transporter with multiple categories
     */
    async rateTransporter(
        transporterId: string,
        ratings: {
            overall: number;
            punctuality?: number;
            communication?: number;
            cargoCondition?: number;
            professionalism?: number;
        },
        comment?: string,
        metadata?: Record<string, any>
    ): Promise<UserRating[]> {
        const ratingPromises: Promise<UserRating>[] = [];

        // Create overall rating
        ratingPromises.push(
            this.createRating({
                ratedUserId: transporterId,
                ratingType: RatingType.TRANSPORTER,
                category: RatingCategory.OVERALL,
                rating: ratings.overall,
                comment,
                metadata,
            })
        );

        // Create category ratings if provided
        if (ratings.punctuality) {
            ratingPromises.push(
                this.createRating({
                    ratedUserId: transporterId,
                    ratingType: RatingType.TRANSPORTER,
                    category: RatingCategory.PAYMENT_PUNCTUALITY,
                    rating: ratings.punctuality,
                    metadata,
                })
            );
        }

        if (ratings.communication) {
            ratingPromises.push(
                this.createRating({
                    ratedUserId: transporterId,
                    ratingType: RatingType.TRANSPORTER,
                    category: RatingCategory.COMMUNICATION,
                    rating: ratings.communication,
                    metadata,
                })
            );
        }

        if (ratings.cargoCondition) {
            ratingPromises.push(
                this.createRating({
                    ratedUserId: transporterId,
                    ratingType: RatingType.TRANSPORTER,
                    category: RatingCategory.CARGO_CONDITION,
                    rating: ratings.cargoCondition,
                    metadata,
                })
            );
        }

        if (ratings.professionalism) {
            ratingPromises.push(
                this.createRating({
                    ratedUserId: transporterId,
                    ratingType: RatingType.TRANSPORTER,
                    category: RatingCategory.PROFESSIONALISM,
                    rating: ratings.professionalism,
                    metadata,
                })
            );
        }

        return await Promise.all(ratingPromises);
    }

    /**
     * Get all ratings for a user
     */
    async getUserRatings(userId: string): Promise<UserRating[]> {
        const response = await api.get(`${this.baseUrl}/user/${userId}`);
        return response.data;
    }

    /**
     * Get rating statistics for a user
     */
    async getUserRatingStats(userId: string): Promise<{
        transporterRatings: { average: number; count: number };
        financingRatings: { average: number; count: number };
        platformRatings: { average: number; count: number };
    }> {
        const response = await api.get(`${this.baseUrl}/user/${userId}/stats`);
        return response.data;
    }

    /**
     * Get average rating for a user
     */
    async getUserAverageRating(userId: string): Promise<RatingStats> {
        const response = await api.get(`${this.baseUrl}/user/${userId}/average`);
        return response.data;
    }

    /**
     * Get transporter-specific ratings
     */
    async getTransporterRatings(userId: string): Promise<RatingStats> {
        const response = await api.get(`${this.baseUrl}/user/${userId}/transporter`);
        return response.data;
    }

    /**
     * Get financing-specific ratings
     */
    async getFinancingRatings(userId: string): Promise<RatingStats> {
        const response = await api.get(`${this.baseUrl}/user/${userId}/financing`);
        return response.data;
    }

    /**
     * Get platform-specific ratings
     */
    async getPlatformRatings(userId: string): Promise<RatingStats> {
        const response = await api.get(`${this.baseUrl}/user/${userId}/platform`);
        return response.data;
    }
}

export const ratingService = new RatingService();
export default ratingService;
