import { SetMetadata } from '@nestjs/common';

/**
 * RequireFeature Decorator
 * 
 * Marks a route as requiring a specific feature.
 * Used in conjunction with FeatureRestrictionGuard.
 * 
 * Usage:
 * ```typescript
 * @Post('cargo')
 * @RequireFeature('canPostCargo')
 * @UseGuards(FeatureRestrictionGuard)
 * async createCargo() { ... }
 * ```
 * 
 * Common Features:
 * - canPostCargo: Ability to post cargo listings
 * - canAddTrucks: Ability to add trucks
 * - canBid: Ability to bid on loads
 * - canMessage: Ability to send messages
 * - canViewAnalytics: Ability to view analytics
 * - readOnly: Read-only access (all write operations blocked)
 * 
 * @param feature - The feature key to check
 */
export const RequireFeature = (feature: string) => SetMetadata('feature', feature);
