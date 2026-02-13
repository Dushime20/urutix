import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GrantPermissionDto {
    @ApiProperty({ example: 'user-uuid' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ example: 'cargo:create' })
    @IsString()
    @IsNotEmpty()
    permission: string;

    @ApiProperty({ example: 'Business requirement' })
    @IsString()
    @IsOptional()
    reason?: string;

    @ApiProperty({ example: '2024-12-31T23:59:59Z' })
    @IsDateString()
    @IsOptional()
    expiresAt?: Date;
}

export class RevokePermissionDto {
    @ApiProperty({ example: 'user-uuid' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ example: 'cargo:create' })
    @IsString()
    @IsNotEmpty()
    permission: string;
}

export class DenyPermissionDto {
    @ApiProperty({ example: 'user-uuid' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ example: 'cargo:create' })
    @IsString()
    @IsNotEmpty()
    permission: string;

    @ApiProperty({ example: 'Violation of terms' })
    @IsString()
    @IsOptional()
    reason?: string;
}

export class GrantRolePermissionDto {
    @ApiProperty({ example: 'DRIVER' })
    @IsString()
    @IsNotEmpty()
    role: string;

    @ApiProperty({ example: 'cargo:create' })
    @IsString()
    @IsNotEmpty()
    permission: string;
}

export class RevokeRolePermissionDto {
    @ApiProperty({ example: 'DRIVER' })
    @IsString()
    @IsNotEmpty()
    role: string;

    @ApiProperty({ example: 'cargo:create' })
    @IsString()
    @IsNotEmpty()
    permission: string;
}

export class CreateRoleDto {
    @ApiProperty({ example: 'CONTENT_MANAGER' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Manages content and documentation' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: ['cargo:view', 'cargo:create'], type: [String] })
    @IsOptional()
    permissionIds?: string[];
}

export class UpdateRoleDto {
    @ApiProperty({ example: 'CONTENT_MANAGER' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'Manages content and documentation' })
    @IsString()
    @IsOptional()
    description?: string;
}

export class BulkAssignPermissionsDto {
    @ApiProperty({ example: ['cargo:view', 'cargo:create', 'truck:view'], type: [String] })
    @IsNotEmpty()
    permissionIds: string[];
}
