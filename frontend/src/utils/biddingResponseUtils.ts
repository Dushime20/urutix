import { biddingAPI } from '../services/biddingApi';

/** Normalize varying auction list API response shapes. */
export function parseAuctionsResponse(response: unknown): any[] {
  const r = response as any;
  if (Array.isArray(r?.data)) return r.data;
  if (Array.isArray(r?.data?.auctions)) return r.data.auctions;
  if (Array.isArray(r?.data?.data)) return r.data.data;
  if (Array.isArray(r)) return r;
  return [];
}

/** Extract watched auction IDs from API response. */
export function parseWatchedAuctionIds(response: unknown): Set<string> {
  const r = response as any;
  let ids: string[] = [];
  if (Array.isArray(r?.data?.auctions)) {
    ids = r.data.auctions.map((a: { id: string }) => a.id);
  } else if (Array.isArray(r?.data)) {
    ids = r.data.map((a: { id: string }) => a.id);
  }
  return new Set(ids);
}

/** Record auction views without blocking the UI. */
export function recordAuctionViews(auctions: { id: string }[]): void {
  auctions.slice(0, 10).forEach((a) => {
    biddingAPI.recordAuctionView(a.id).catch(() => undefined);
  });
}
