import { formatCurrency } from './formatNumber';

export interface AuctionBidRules {
  auctionType?: string;
  currentHighestBid?: number | string | null;
  currentBid?: number | string | null;
  minimumBidDecrement?: number | string | null;
  minimumBidIncrement?: number | string | null;
  reservePrice?: number | string | null;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
}

/** Current leading bid (lowest for reverse, highest for forward). */
export function getCurrentLeadingBid(auction: AuctionBidRules): number | null {
  return toNumber(auction.currentHighestBid ?? auction.currentBid);
}

/** Minimum step enforced between bids, mirroring backend rules. */
export function getMinimumBidStep(auction: AuctionBidRules): number {
  const type = (auction.auctionType || 'REVERSE').toUpperCase();

  if (type === 'REVERSE') {
    const decrement = toNumber(auction.minimumBidDecrement ?? auction.minimumBidIncrement);
    return decrement != null && decrement > 0 ? decrement : 0;
  }

  if (type === 'FORWARD') {
    const increment = toNumber(auction.minimumBidIncrement);
    return increment != null && increment > 0 ? increment : 0;
  }

  return 0;
}

/** Suggested bid amount when opening a bid modal. */
export function getSuggestedBidAmount(auction: AuctionBidRules): number | null {
  const type = (auction.auctionType || 'REVERSE').toUpperCase();
  const current = getCurrentLeadingBid(auction);
  const step = getMinimumBidStep(auction);
  const reserve = toNumber(auction.reservePrice);

  if (type === 'REVERSE') {
    if (current != null) {
      const drop = step > 0 ? step : 1;
      return Math.max(0, current - drop);
    }
    if (reserve != null && reserve > 0) return Math.max(0, reserve - 1);
    return null;
  }

  if (type === 'FORWARD') {
    if (current != null) {
      const rise = step > 0 ? step : 1;
      return current + rise;
    }
    return reserve;
  }

  return null;
}

/** Max allowed bid for reverse auctions with a decrement rule. */
export function getMaxAllowedBid(auction: AuctionBidRules): number | null {
  const type = (auction.auctionType || 'REVERSE').toUpperCase();
  const current = getCurrentLeadingBid(auction);
  const step = getMinimumBidStep(auction);

  if (type === 'REVERSE' && current != null && step > 0) {
    return current - step;
  }

  return null;
}

/** Human-readable constraint shown under the bid amount field. */
export function getBidConstraintHint(
  auction: AuctionBidRules,
  currency = 'USD',
): string | null {
  const type = (auction.auctionType || 'REVERSE').toUpperCase();
  const current = getCurrentLeadingBid(auction);
  const step = getMinimumBidStep(auction);

  if (type === 'REVERSE' && current != null && step > 0) {
    const maxAllowed = current - step;
    return `Maximum allowed: ${formatCurrency(maxAllowed, currency)} (must be at least ${formatCurrency(step, currency)} below the current lowest bid of ${formatCurrency(current, currency)})`;
  }

  if (type === 'FORWARD' && current != null && step > 0) {
    return `Minimum bid: ${formatCurrency(current + step, currency)}`;
  }

  return null;
}

/** Returns an error message if invalid, or null if the bid amount is acceptable. */
export function validateBidAmount(
  bidAmount: number,
  auction: AuctionBidRules,
  currency = 'USD',
): string | null {
  if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
    return 'Bid amount must be greater than zero.';
  }

  const type = (auction.auctionType || 'REVERSE').toUpperCase();
  const current = getCurrentLeadingBid(auction);
  const step = getMinimumBidStep(auction);

  if (type === 'REVERSE' && current != null && step > 0) {
    const maxAllowed = current - step;
    if (bidAmount > maxAllowed) {
      return `Your bid must be at least ${formatCurrency(step, currency)} lower than the current lowest bid of ${formatCurrency(current, currency)}. Maximum allowed: ${formatCurrency(maxAllowed, currency)}.`;
    }
  }

  if (type === 'FORWARD' && current != null && step > 0) {
    const minAllowed = current + step;
    if (bidAmount < minAllowed) {
      return `Minimum bid amount is ${formatCurrency(minAllowed, currency)}.`;
    }
  }

  return null;
}
