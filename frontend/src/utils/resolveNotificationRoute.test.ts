import { describe, expect, it } from 'vitest';
import { resolveNotificationRoute } from './resolveNotificationRoute';

describe('resolveNotificationRoute', () => {
  it('rewrites legacy lending paths for lenders', () => {
    const result = resolveNotificationRoute('/lending/loan-requests/abc-123', 'LENDER');
    expect(result.path).toBe('/lender/requests?loan=abc-123');
    expect(result.status).toBe('remapped');
  });

  it('rewrites /loans/:id for cargo owners', () => {
    const result = resolveNotificationRoute('/loans/abc-123', 'CARGO_OWNER');
    expect(result.path).toBe('/dashboard/loan-requests?loan=abc-123');
  });

  it('maps truck-owner bidding links to fleet my-bids', () => {
    const result = resolveNotificationRoute('/dashboard/bidding?view=bids', 'TRUCK_OWNER');
    expect(result.path).toBe('/dashboard/fleet/my-bids?view=bids');
  });

  it('fixes missing dashboard prefix for driver trips', () => {
    const result = resolveNotificationRoute('/driver/trips', 'DRIVER');
    expect(result.path).toBe('/dashboard/driver/trips');
  });

  it('sends invalid params to unavailable page', () => {
    const result = resolveNotificationRoute('/dashboard/trips/undefined', 'TRUCK_OWNER');
    expect(result.status).toBe('invalid_params');
    expect(result.path).toContain('/resource-unavailable');
  });

  it('blocks cargo owners from lender paths', () => {
    const result = resolveNotificationRoute('/lender/requests', 'CARGO_OWNER');
    expect(result.status).toBe('unavailable');
    expect(result.path).toContain('/resource-unavailable');
  });

  it('rewrites bare /notifications to role hub', () => {
    const result = resolveNotificationRoute('/notifications', 'BROKER');
    expect(result.path).toBe('/dashboard/broker/notifications');
  });
});
