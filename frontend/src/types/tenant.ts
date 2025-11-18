export interface Tenant {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  city: string | null;
  country: string | null;
}

export interface TenantSearchParams {
  q: string;
}
