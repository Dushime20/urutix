import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LenderUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

export enum PermissionCategory {
  LOANS = 'loans',
  BORROWERS = 'borrowers',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  COMPLIANCE = 'compliance',
  FINANCIAL = 'financial',
}

export class LenderPermissionDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PermissionCategory)
  category: PermissionCategory;

  @IsEnum(PermissionLevel)
  level: PermissionLevel;
}

export class LenderRoleDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  level: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LenderPermissionDto)
  defaultPermissions: LenderPermissionDto[];

  @IsBoolean()
  @IsOptional()
  isCustom?: boolean;
}

export class CreateLenderUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUUID()
  roleId: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  additionalPermissions?: string[];

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class UpdateLenderUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsEnum(LenderUserStatus)
  @IsOptional()
  status?: LenderUserStatus;

  @IsString()
  @IsOptional()
  department?: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  additionalPermissions?: string[];

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class LenderUserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: LenderRoleDto;
  status: LenderUserStatus;
  permissions: LenderPermissionDto[];
  createdAt: Date;
  lastLogin?: Date;
  createdBy: string;
  department?: string;
  avatar?: string;
}

export class CreateLenderRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  level: number;

  @IsArray()
  @IsUUID(undefined, { each: true })
  defaultPermissions: string[];

  @IsBoolean()
  @IsOptional()
  isCustom?: boolean = true;
}

export class UpdateLenderRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  level?: number;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  defaultPermissions?: string[];

  @IsBoolean()
  @IsOptional()
  isCustom?: boolean;
}

export class LenderTeamStatsDto {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  roles: {
    id: string;
    name: string;
    count: number;
  }[];
  departments: {
    name: string;
    count: number;
  }[];
  recentActivity: {
    action: string;
    user: string;
    timestamp: Date;
  }[];
}
