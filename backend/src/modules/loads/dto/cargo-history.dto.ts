export type CargoHistoryActivityType =
  | 'created'
  | 'published'
  | 'updated'
  | 'status_change'
  | 'broker_assigned'
  | 'broker_unassigned'
  | 'bid_submitted'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'bid_withdrawn'
  | 'carrier_assigned'
  | 'inspection_started'
  | 'inspection_submitted'
  | 'inspection_approved'
  | 'inspection_failed'
  | 'loading_started'
  | 'loaded'
  | 'trip_started'
  | 'pickup_arrived'
  | 'pickup_completed'
  | 'in_transit'
  | 'delivery_arrived'
  | 'unloading_started'
  | 'unloading_completed'
  | 'delivered'
  | 'cancelled'
  | 'reposted'
  | 'document_uploaded'
  | 'document_deleted'
  | 'receiver_assigned'
  | 'tracking_update'
  | 'alert'
  | 'other';

export interface CargoHistoryItemDto {
  id: string;
  activityType: CargoHistoryActivityType;
  action: string;
  title: string;
  description: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  createdAt: string;
  source: 'audit' | 'bid' | 'trip' | 'trip_event' | 'inspection' | 'commission' | 'load' | 'tracking';
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export interface CargoHistoryResponseDto {
  items: CargoHistoryItemDto[];
  total: number;
  page: number;
  limit: number;
}
