export interface Tenant {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  city: string | null;
  country: string | null;
  status?: string; // ACTIVE, PENDING_ACTIVATION, SUSPENDED, DEACTIVATED
  isActive?: boolean;
}

export interface TenantSearchParams {
  q?: string;
}
