// User role enumeration
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  CARGO_OWNER = 'CARGO_OWNER',
  TRUCK_OWNER = 'TRUCK_OWNER',
  DRIVER = 'DRIVER',
  AGENT = 'AGENT',
  LENDER = 'LENDER',
  BROKER = 'BROKER'
}

// User status enumeration
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

// User interface
export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  tenantId: string;
  phone?: string;
  emailVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile;
}

// User profile interface
export interface UserProfile {
  id: string;
  userId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO for creating a new user
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyName?: string;
  phoneNumber?: string;
  tenantId?: string; // Optional: allows admin to specify which tenant to create user in
}

// DTO for updating a user
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  companyName?: string;
  role?: UserRole;
  status?: UserStatus;
}

// User filters for querying
export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// User list response
export interface UserListResponse {
  success: boolean;
  message: string;
  data: User[];
  total: number;
  page: number;
  limit: number;
}

// Role display names
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.TENANT_ADMIN]: 'Tenant Admin',
  [UserRole.CARGO_OWNER]: 'Cargo Owner',
  [UserRole.TRUCK_OWNER]: 'Truck Owner',
  [UserRole.DRIVER]: 'Driver',
  [UserRole.AGENT]: 'Agent',
  [UserRole.LENDER]: 'Lender',
  [UserRole.BROKER]: 'Broker'
};

// Status display names
export const STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'Active',
  [UserStatus.INACTIVE]: 'Inactive',
  [UserStatus.SUSPENDED]: 'Suspended',
  [UserStatus.PENDING]: 'Pending'
};

// Roles that can be created by TENANT_ADMIN
export const TENANT_MANAGEABLE_ROLES: UserRole[] = [
  UserRole.CARGO_OWNER,
  UserRole.TRUCK_OWNER
];


