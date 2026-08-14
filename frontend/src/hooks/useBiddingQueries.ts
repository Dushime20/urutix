import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { biddingAPI } from '../services/biddingApi';
import { loadsAPI } from '../services/load';
import api from '../services/api';
import { queryKeys } from '../lib/queryKeys';
import {
  parseAuctionsResponse,
  parseWatchedAuctionIds,
  recordAuctionViews,
} from '../utils/biddingResponseUtils';

export type AuctionFilters = {
  status?: string;
  auctionType?: string;
  minValue?: string;
  maxValue?: string;
  showWatchedOnly?: boolean;
};

export type AuctionListParams = {
  page?: number;
  limit?: number;
  status?: string;
  filters?: AuctionFilters;
  watchedOnly?: boolean;
  enabled?: boolean;
};

export function useAuctionsQuery(params: AuctionListParams = {}) {
  const { page = 1, limit = 10, status = 'all', filters, watchedOnly = false, enabled = true } = params;
  const listFilters = filters ?? {};

  return useQuery({
    queryKey: watchedOnly || listFilters.showWatchedOnly
      ? [...queryKeys.bidding.auctions, 'watched']
      : [...queryKeys.bidding.auctions, { page, limit, status, ...listFilters }],
    enabled,
    queryFn: async () => {
      if (watchedOnly || listFilters.showWatchedOnly) {
        const response = await biddingAPI.getWatchedAuctions();
        return parseAuctionsResponse(response);
      }

      const apiFilters: Record<string, string | number> = { page, limit };
      if (status && status !== 'all') apiFilters.status = status;
      if (listFilters.status && listFilters.status !== 'all') apiFilters.status = listFilters.status;
      if (listFilters.auctionType && listFilters.auctionType !== 'all') {
        apiFilters.auctionType = listFilters.auctionType;
      }
      if (listFilters.minValue) apiFilters.minValue = listFilters.minValue;
      if (listFilters.maxValue) apiFilters.maxValue = listFilters.maxValue;

      const response = await biddingAPI.getAuctions(apiFilters);
      const list = parseAuctionsResponse(response);
      recordAuctionViews(list);
      return list;
    },
    refetchInterval: (query) => {
      const key = query.queryKey[2] as { status?: string } | undefined;
      const activeStatus = key?.status ?? status;
      return activeStatus === 'ACTIVE' ? 30_000 : false;
    },
  });
}

export function useWatchedAuctionIds() {
  return useQuery({
    queryKey: [...queryKeys.bidding.auctions, 'watched-ids'],
    queryFn: async () => {
      const response = await biddingAPI.getWatchedAuctions();
      return parseWatchedAuctionIds(response);
    },
  });
}

export function useToggleAuctionWatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auctionId, isWatched }: { auctionId: string; isWatched: boolean }) => {
      if (isWatched) {
        await biddingAPI.unwatchAuction(auctionId);
      } else {
        await biddingAPI.watchAuction(auctionId);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bidding.auctions });
    },
  });
}

export type BidHistoryFilters = {
  status?: string;
  dateRange?: string;
  minAmount?: string;
  maxAmount?: string;
};

export function useBidHistoryQuery(
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER' | 'BROKER' | 'ADMIN' | 'SUPER_ADMIN',
  filters: BidHistoryFilters = {},
) {
  return useQuery({
    queryKey: [...queryKeys.bidding.history, userRole, filters],
    queryFn: async () => {
      const response =
        userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
          ? await biddingAPI.getAllBidsForAdmin()
          : await biddingAPI.getMyBids();
      const bidsData = (response as any).data ?? response;
      let filteredBids = Array.isArray(bidsData) ? bidsData : [];
      if (filters.status && filters.status !== 'all') {
        filteredBids = filteredBids.filter((bid: { status: string }) => bid.status === filters.status);
      }
      return filteredBids;
    },
  });
}

export function useSubmitBidMutation() {
  return useMutation({
    mutationFn: (data: Parameters<typeof biddingAPI.submitBid>[0]) => biddingAPI.submitBid(data),
  });
}

export function useWithdrawBidMutation() {
  return useMutation({
    mutationFn: (bidId: string) => biddingAPI.withdrawBid(bidId),
  });
}

export function useAcceptBidMutation() {
  return useMutation({
    mutationFn: (bidId: string) => biddingAPI.acceptBid(bidId),
  });
}

export function useMyAuctionsQuery() {
  return useQuery({
    queryKey: [...queryKeys.bidding.auctions, 'my'],
    queryFn: async () => {
      const response = await biddingAPI.getAuctions();
      return parseAuctionsResponse(response);
    },
    refetchInterval: 30_000,
  });
}

export function useLoadBidsQuery(loadId?: string) {
  return useQuery({
    queryKey: [...queryKeys.bidding.bids, 'load', loadId],
    queryFn: async () => {
      const response = await biddingAPI.getBidsForLoad(loadId!);
      const raw = (response as { data?: unknown }).data ?? response;
      const bids =
        (raw as { bids?: unknown[] })?.bids ??
        (raw as { items?: unknown[] })?.items ??
        raw;
      return Array.isArray(bids) ? bids : [];
    },
    enabled: !!loadId,
  });
}

export function useInactiveAuctionsQuery() {
  return useQuery({
    queryKey: queryKeys.bidding.inactive,
    queryFn: async () => {
      const response = await biddingAPI.getInactiveAuctions();
      return (response as { data?: unknown[] }).data ?? [];
    },
  });
}

export function useBidAnalyticsQuery() {
  return useQuery({
    queryKey: queryKeys.bidding.analytics,
    queryFn: async () => {
      const [bidsRes, statsRes] = await Promise.all([
        api.get('/bidding/bids'),
        api.get('/bidding/dashboard/stats'),
      ]);

      const bids: any[] = bidsRes.data?.bids || bidsRes.data?.data || bidsRes.data || [];
      const stats = statsRes.data?.stats || statsRes.data?.data || statsRes.data || {};

      const wonStatuses = new Set(['ACCEPTED', 'WON', 'AWARDED']);
      const pendingStatuses = new Set(['PENDING', 'SUBMITTED', 'ACTIVE', 'OPEN']);
      const lostStatuses = new Set(['REJECTED', 'LOST', 'OUTBID', 'DECLINED', 'EXPIRED']);

      const successfulBids = bids.filter((b: any) => wonStatuses.has(String(b.status || '').toUpperCase()));
      const pendingBids = bids.filter((b: any) => pendingStatuses.has(String(b.status || '').toUpperCase()));
      const lostBids = bids.filter((b: any) => lostStatuses.has(String(b.status || '').toUpperCase()));
      const totalValue = bids.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
      const avgAmount = bids.length > 0 ? totalValue / bids.length : 0;
      const successRate = bids.length > 0 ? Math.round((successfulBids.length / bids.length) * 100) : 0;

      const loadMap: Record<string, any> = {};
      bids.forEach((b: any) => {
        const key = b.loadId || b.auctionId || 'unknown';
        const status = String(b.status || '').toUpperCase();
        if (!loadMap[key]) {
          loadMap[key] = {
            title: b.load?.title || b.auction?.load?.title || `Load ${String(key).slice(0, 6)}`,
            totalBids: 0,
            finalPrice: 0,
            status: b.status,
          };
        }
        loadMap[key].totalBids++;
        if (wonStatuses.has(status)) {
          loadMap[key].finalPrice = Number(b.amount);
          loadMap[key].status = b.status;
        }
      });

      const topPerformingLoads = Object.values(loadMap)
        .sort((a: any, b: any) => (b.finalPrice || 0) - (a.finalPrice || 0) || b.totalBids - a.totalBids)
        .slice(0, 5);

      return {
        totalBids: stats.totalBids ?? bids.length,
        successfulBids: stats.wonBids ?? successfulBids.length,
        pendingBids: stats.pendingBids ?? pendingBids.length,
        lostBids: stats.lostBids ?? lostBids.length,
        averageBidAmount: stats.averageBidAmount ?? avgAmount,
        totalValue: stats.totalValue ?? totalValue,
        successRate: stats.winRate ?? successRate,
        averageResponseTime: stats.averageResponseTime ?? 0,
        topPerformingLoads,
        bidTrends: stats.trends || [],
      };
    },
    refetchInterval: 60_000,
  });
}

interface AuctionableCargoUser {
  id?: string;
  role?: string;
}

function parseCargosList(response: unknown): any[] {
  const r = response as any;
  if (r?.data?.items) return r.data.items;
  if (r?.data?.cargos) return r.data.cargos;
  if (Array.isArray(r?.data)) return r.data;
  if (Array.isArray(r)) return r;
  return [];
}

export function useAuctionableCargosQuery(user: AuctionableCargoUser | null | undefined) {
  return useQuery({
    queryKey: queryKeys.bidding.auctionableCargos(user?.id, user?.role),
    queryFn: async () => {
      const response = await loadsAPI.getAll();
      const cargosList = parseCargosList(response);

      const activeAuctionLoadIds = new Set<string>();
      try {
        const auctionsResponse = await biddingAPI.getAuctions({ limit: 1000 });
        const auctions = parseAuctionsResponse(auctionsResponse);
        auctions.forEach((auction: { status?: string; loadId?: string }) => {
          if (['ACTIVE', 'SCHEDULED', 'PAUSED'].includes(auction.status ?? '')) {
            if (auction.loadId) activeAuctionLoadIds.add(auction.loadId);
          }
        });
      } catch {
        // proceed without auction filter
      }

      return cargosList.filter((cargo: any) => {
        if (activeAuctionLoadIds.has(cargo.id)) return false;
        const validStatus =
          cargo.status === 'CREATED' || cargo.status === 'PUBLISHED' || !cargo.status;
        if (!validStatus) return false;
        if (user?.role === 'BROKER') {
          return cargo.brokerId === user.id || cargo.broker?.id === user.id;
        }
        return !cargo.brokerId && !cargo.broker;
      });
    },
    enabled: !!user?.id,
  });
}

export function useCreateAuctionMutation() {
  return useMutation({
    mutationFn: (data: Parameters<typeof biddingAPI.createAuction>[0]) =>
      biddingAPI.createAuction(data),
  });
}

export function useUpdateAuctionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ auctionId, data }: { auctionId: string; data: Record<string, unknown> }) =>
      biddingAPI.updateAuction(auctionId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bidding.auctions });
    },
  });
}

export function useDeleteAuctionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: string) => biddingAPI.deleteAuction(auctionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bidding.auctions });
    },
  });
}

export function useReactivateAuctionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: string) => biddingAPI.reactivateAuction(auctionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bidding.auctions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bidding.inactive });
    },
  });
}

export function useReopenAuctionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ auctionId, auctionEnd }: { auctionId: string; auctionEnd: string }) =>
      biddingAPI.reopenAuction(auctionId, { auctionEnd }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bidding.auctions });
    },
  });
}
