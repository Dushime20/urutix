import { Injectable, BadRequestException } from '@nestjs/common';

export enum AuctionType {
  REVERSE = 'REVERSE',
  FORWARD = 'FORWARD',
  DUTCH = 'DUTCH',
  SEALED = 'SEALED'
}

export interface ValidationResult {
  valid: boolean;
  competitive?: boolean;
  warning?: string;
  message?: string;
  competitiveLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  suggestedBid?: number;
}

@Injectable()
export class BidValidationService {
  /**
   * Validate bid based on auction type
   */
  validateBid(bidAmount: number, auction: any): ValidationResult {
    const auctionType = auction.auctionType as AuctionType;

    switch (auctionType) {
      case AuctionType.REVERSE:
        return this.validateReverseBid(bidAmount, auction);
      case AuctionType.FORWARD:
        return this.validateForwardBid(bidAmount, auction);
      case AuctionType.DUTCH:
        return this.validateDutchBid(bidAmount, auction);
      case AuctionType.SEALED:
        return this.validateSealedBid(bidAmount, auction);
      default:
        throw new BadRequestException(`Invalid auction type: ${auctionType}`);
    }
  }

  /**
   * REVERSE AUCTION: Carriers bid DOWN from target price.
   * The reserve price is the MAXIMUM the cargo owner will pay (ceiling).
   * Winner: LOWEST bid — lower bids are more competitive.
   */
  private validateReverseBid(bidAmount: number, auction: any): ValidationResult {
    const reservePrice = parseFloat(auction.reservePrice || '0');
    const minimumDecrement = auction.minimumBidDecrement ? parseFloat(auction.minimumBidDecrement) : 0;

    // Rule 1: Must be a positive amount
    if (bidAmount <= 0) {
      throw new BadRequestException('Bid amount must be greater than zero.');
    }

    // Rule 2: Must beat current lowest bid by minimum decrement (if set)
    if (auction.currentHighestBid && minimumDecrement > 0) {
      const currentLowest = parseFloat(auction.currentHighestBid);
      const maxAllowedBid = currentLowest - minimumDecrement;

      if (bidAmount > maxAllowedBid) {
        return {
          valid: false,
          message: `Your bid must be at least ${this.formatCurrency(minimumDecrement)} lower than the current lowest bid of ${this.formatCurrency(currentLowest)}. Maximum allowed: ${this.formatCurrency(maxAllowedBid)}.`,
          suggestedBid: maxAllowedBid,
        } as any;
      }
    }

    // Rule 3: Above reserve price ceiling — cargo owner may not accept, but bid is still valid
    if (reservePrice > 0 && bidAmount > reservePrice) {
      return {
        valid: true,
        competitive: false,
        warning: 'Above cargo owner budget',
        message: `Your bid is above the cargo owner's maximum budget. Lower your price to improve chances of winning.`,
        competitiveLevel: 'LOW',
      };
    }

    // Rule 4: At or below reserve — competitive
    const currentLowest = auction.currentHighestBid ? parseFloat(auction.currentHighestBid) : null;
    if (currentLowest && bidAmount < currentLowest) {
      return {
        valid: true,
        competitive: true,
        message: `You are now the lowest bidder at ${this.formatCurrency(bidAmount)}.`,
        competitiveLevel: 'HIGH',
      };
    }

    return {
      valid: true,
      competitive: true,
      message: `Bid placed at ${this.formatCurrency(bidAmount)}. Lower bids have a better chance of winning.`,
      competitiveLevel: currentLowest && bidAmount === currentLowest ? 'MEDIUM' : 'HIGH',
    };
  }

  /**
   * FORWARD AUCTION (freight): Truck owners compete on price — lowest bid wins.
   * No floor, no increment enforcement. Any positive amount is valid.
   */
  private validateForwardBid(bidAmount: number, auction: any): ValidationResult {
    if (bidAmount <= 0) {
      throw new BadRequestException('Bid amount must be greater than zero.');
    }

    const currentLowest = auction.currentHighestBid ? parseFloat(auction.currentHighestBid) : null;
    const isLeading = currentLowest !== null && bidAmount < currentLowest;

    return {
      valid: true,
      competitive: true,
      message: isLeading
        ? `You are now the lowest bidder at ${this.formatCurrency(bidAmount)}.`
        : `Bid placed at ${this.formatCurrency(bidAmount)}.`,
      competitiveLevel: isLeading ? 'HIGH' : 'MEDIUM',
    };
  }

  /**
   * DUTCH AUCTION: Price drops automatically until someone accepts
   * Pricing: Starting > Current > Reserve
   * Winner: FIRST to accept current price
   */
  private validateDutchBid(bidAmount: number, auction: any): ValidationResult {
    const currentPrice = this.calculateDutchPrice(auction);
    const reservePrice = parseFloat(auction.reservePrice || '0');

    // Rule 1: Must accept current price (no custom bids)
    if (Math.abs(bidAmount - currentPrice) > 0.01) {
      throw new BadRequestException(
        `In Dutch auction, you must accept the current price of ${this.formatCurrency(currentPrice)}. ` +
        `You cannot submit a custom bid amount.`
      );
    }

    // Rule 2: Check if auction has reached reserve
    if (currentPrice <= reservePrice) {
      return {
        valid: true,
        competitive: true,
        message: `Auction has reached reserve price (${this.formatCurrency(reservePrice)}). This is the final price.`,
        competitiveLevel: 'HIGH'
      };
    }

    // Rule 3: Price is still dropping
    const nextDropTime = this.getNextDropTime(auction);
    const nextPrice = this.getNextDropPrice(auction);
    
    return {
      valid: true,
      competitive: true,
      message: `Current price: ${this.formatCurrency(currentPrice)}. Next drop to ${this.formatCurrency(nextPrice)} in ${nextDropTime} seconds. Accept now or wait for lower price (risk: someone else accepts first).`,
      competitiveLevel: 'MEDIUM'
    };
  }

  /**
   * SEALED BID: Blind bidding, bids hidden until deadline.
   * Freight sealed bids are reverse-style — lowest valid bid wins.
   * No floor enforced; reserve price is the ceiling (cargo owner's max budget).
   */
  private validateSealedBid(bidAmount: number, auction: any): ValidationResult {
    // Rule 1: Must be a positive amount
    if (bidAmount <= 0) {
      throw new BadRequestException('Bid amount must be greater than zero.');
    }

    // Rule 2: Check if revision is allowed
    if (!auction.allowBidRevision) {
      return {
        valid: true,
        competitive: true,
        warning: 'Bid cannot be revised',
        message: `Sealed bid submitted at ${this.formatCurrency(bidAmount)}. You cannot revise this bid. All bids will be revealed after the deadline.`,
        competitiveLevel: 'UNKNOWN',
      };
    }

    return {
      valid: true,
      competitive: true,
      message: `Sealed bid submitted at ${this.formatCurrency(bidAmount)}. You can revise before the deadline. All bids will be revealed after the deadline.`,
      competitiveLevel: 'UNKNOWN',
    };
  }

  /**
   * Calculate current price for Dutch auction
   */
  private calculateDutchPrice(auction: any): number {
    const now = new Date();
    const start = new Date(auction.auctionStart);
    const elapsedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
    const intervals = Math.floor(elapsedSeconds / (auction.dropInterval || 60));
    
    const startPrice = parseFloat(auction.startingPrice || '0');
    const dropAmt = parseFloat(auction.dropAmount || '0');
    const reservePrice = parseFloat(auction.reservePrice || '0');
    
    const currentPrice = startPrice - (intervals * dropAmt);
    
    return Math.max(currentPrice, reservePrice);
  }

  /**
   * Get time until next price drop (Dutch auction)
   */
  private getNextDropTime(auction: any): number {
    const now = new Date();
    const start = new Date(auction.auctionStart);
    const elapsedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
    const dropInterval = auction.dropInterval || 60;
    const secondsSinceLastDrop = elapsedSeconds % dropInterval;
    
    return dropInterval - secondsSinceLastDrop;
  }

  /**
   * Get next drop price (Dutch auction)
   */
  private getNextDropPrice(auction: any): number {
    const currentPrice = this.calculateDutchPrice(auction);
    const dropAmt = parseFloat(auction.dropAmount || '0');
    const reservePrice = parseFloat(auction.reservePrice || '0');
    
    return Math.max(currentPrice - dropAmt, reservePrice);
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Get competitive analysis for a bid
   */
  getCompetitiveAnalysis(bidAmount: number, auction: any): {
    isCompetitive: boolean;
    savingsOrPremium: number;
    recommendation: string;
  } {
    const validation = this.validateBid(bidAmount, auction);
    const targetPrice = parseFloat(auction.targetPrice || auction.reservePrice || '0');
    const savingsOrPremium = targetPrice - bidAmount;

    return {
      isCompetitive: validation.competitive || false,
      savingsOrPremium,
      recommendation: validation.message || 'No recommendation available'
    };
  }
}
