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
   * REVERSE AUCTION: Carriers bid DOWN from target price
   * Pricing: Reserve < Target < MaxBudget
   * Winner: LOWEST bid above reserve
   */
  private validateReverseBid(bidAmount: number, auction: any): ValidationResult {
    const reservePrice = parseFloat(auction.reservePrice || '0');
    const targetPrice = parseFloat(auction.targetPrice || auction.reservePrice || '0');
    const maxBudget = auction.maxBudget ? parseFloat(auction.maxBudget) : Infinity;
    const minimumDecrement = auction.minimumBidDecrement ? parseFloat(auction.minimumBidDecrement) : 0;

    // Rule 1: Must be above reserve price (quality floor)
    if (bidAmount < reservePrice) {
      throw new BadRequestException(
        `Bid amount must be at least ${this.formatCurrency(reservePrice)} (reserve price). ` +
        `This ensures minimum quality standards.`
      );
    }

    // Rule 2: Check minimum decrement if there's a current bid
    if (auction.currentHighestBid && minimumDecrement > 0) {
      const currentBid = parseFloat(auction.currentHighestBid);
      const maxAllowedBid = currentBid - minimumDecrement;
      
      if (bidAmount > maxAllowedBid) {
        return {
          valid: false,
          message: `In reverse auction, your bid must be at least ${this.formatCurrency(minimumDecrement)} lower than current bid (${this.formatCurrency(currentBid)})`,
          suggestedBid: maxAllowedBid
        } as any;
      }
    }

    // Rule 3: Below target = HIGHLY competitive (shipper saves money)
    if (bidAmount <= targetPrice) {
      const savings = targetPrice - bidAmount;
      return {
        valid: true,
        competitive: true,
        message: `Excellent bid! You're ${this.formatCurrency(savings)} below target price. Highly likely to win.`,
        competitiveLevel: 'HIGH'
      };
    }

    // Rule 4: Above target but below max = ACCEPTABLE (needs justification)
    if (bidAmount > targetPrice && bidAmount <= maxBudget) {
      const premium = bidAmount - targetPrice;
      return {
        valid: true,
        competitive: false,
        warning: 'Above target price',
        message: `Your bid is ${this.formatCurrency(premium)} above target. Please justify your premium service (e.g., faster delivery, better equipment, insurance).`,
        competitiveLevel: 'MEDIUM'
      };
    }

    // Rule 5: Above max budget = UNLIKELY to win
    if (bidAmount > maxBudget) {
      const excess = bidAmount - maxBudget;
      return {
        valid: true,
        competitive: false,
        warning: 'Significantly above budget',
        message: `Your bid is ${this.formatCurrency(excess)} above shipper's maximum budget. Unlikely to be accepted unless you offer exceptional value.`,
        competitiveLevel: 'LOW'
      };
    }

    return { valid: true };
  }

  /**
   * FORWARD AUCTION: Carriers bid UP from starting price
   * Pricing: Starting < Reserve < Target
   * Winner: HIGHEST bid above reserve
   */
  private validateForwardBid(bidAmount: number, auction: any): ValidationResult {
    const startingPrice = parseFloat(auction.startingPrice || '0');
    const reservePrice = parseFloat(auction.reservePrice || '0');
    const currentHighest = auction.currentHighestBid ? parseFloat(auction.currentHighestBid) : 0;
    const minimumIncrement = auction.minimumBidIncrement ? parseFloat(auction.minimumBidIncrement) : 0;

    // Rule 1: Must be higher than current highest bid (or starting price)
    const minimumBid = currentHighest > 0 
      ? currentHighest + minimumIncrement 
      : Math.max(startingPrice, minimumIncrement);
    
    if (bidAmount < minimumBid) {
      throw new BadRequestException(
        `Bid must be at least ${this.formatCurrency(minimumBid)}. ` +
        (currentHighest > 0 
          ? `Current highest bid is ${this.formatCurrency(currentHighest)}.`
          : `Starting price is ${this.formatCurrency(startingPrice)}.`)
      );
    }

    // Rule 2: Below reserve = NOT YET WINNING
    if (bidAmount < reservePrice) {
      const shortfall = reservePrice - bidAmount;
      return {
        valid: true,
        competitive: false,
        warning: 'Below reserve price',
        message: `Your bid is ${this.formatCurrency(shortfall)} below reserve price. You need to bid at least ${this.formatCurrency(reservePrice)} to be eligible to win.`,
        competitiveLevel: 'LOW',
        suggestedBid: reservePrice
      };
    }

    // Rule 3: Above reserve = COMPETITIVE
    const premium = bidAmount - reservePrice;
    return {
      valid: true,
      competitive: true,
      message: `Strong bid! You're ${this.formatCurrency(premium)} above reserve price. Currently ${currentHighest > 0 && bidAmount > currentHighest ? 'winning' : 'competitive'}.`,
      competitiveLevel: 'HIGH'
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
   * SEALED BID: Blind bidding, bids hidden until deadline
   * Pricing: Reserve < Bids < Infinity
   * Winner: LOWEST bid (or best value based on criteria)
   */
  private validateSealedBid(bidAmount: number, auction: any): ValidationResult {
    const reservePrice = parseFloat(auction.reservePrice || '0');
    const targetPrice = auction.targetPrice ? parseFloat(auction.targetPrice) : null;

    // Rule 1: Must be above reserve price
    if (bidAmount < reservePrice) {
      throw new BadRequestException(
        `Bid amount must be at least ${this.formatCurrency(reservePrice)} (reserve price).`
      );
    }

    // Rule 2: Check if revision is allowed
    if (!auction.allowBidRevision) {
      return {
        valid: true,
        competitive: true,
        warning: 'Bid cannot be revised',
        message: `Sealed bid submitted at ${this.formatCurrency(bidAmount)}. You cannot revise this bid. All bids will be revealed after the deadline.`,
        competitiveLevel: 'UNKNOWN'
      };
    }

    // Rule 3: Provide guidance based on target price
    if (targetPrice && bidAmount <= targetPrice) {
      return {
        valid: true,
        competitive: true,
        message: `Sealed bid submitted at ${this.formatCurrency(bidAmount)} (at or below target). You can revise before deadline. All bids revealed after deadline.`,
        competitiveLevel: 'UNKNOWN'
      };
    }

    return {
      valid: true,
      competitive: true,
      message: `Sealed bid submitted at ${this.formatCurrency(bidAmount)}. You can revise before deadline. All bids will be revealed after the deadline.`,
      competitiveLevel: 'UNKNOWN'
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
