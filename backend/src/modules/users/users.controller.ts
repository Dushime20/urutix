import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService, CreateTenantUserDto, UpdateUserDto } from './users.service';
import { UserRole, UserStatus } from '../../entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() payload: any) {
    return this.usersService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Get users by role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  async getUsers(@Query('role') role?: string) {
    if (role) {
      const roleEnum = role.toUpperCase() as UserRole;
      const users = await this.usersService.findUsersByRole(roleEnum);
      return users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
      }));
    }
    
    const users = await this.usersService.findAll();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile,
    }));
  }

  @Get('check-tenant-role/:role')
  @ApiOperation({ summary: 'Check if tenant role exists' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role validation result',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean' },
        role: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async checkTenantRole(@Param('role') role: string) {
    try {
      const roleEnum = role.toUpperCase() as UserRole;
      const exists = await this.usersService.checkTenantRoleExists(roleEnum);

      return {
        exists,
        role: roleEnum,
        message: exists
          ? `Role ${roleEnum} is valid for tenant users`
          : `Role ${roleEnum} is not valid for tenant users`,
      };
    } catch (error) {
      return {
        exists: false,
        role,
        message: `Invalid role: ${role}`,
      };
    }
  }

  @Post('tenant/:tenantId/user')
  @ApiOperation({ summary: 'Create a user for a specific tenant' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exists or invalid role',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - not authorized to create users in this tenant',
  })
  async createTenantUser(
    @Param('tenantId') tenantId: string,
    @Body() createUserDto: CreateTenantUserDto,
    @Req() req,
  ) {
    // Use tenantId from body if provided, otherwise use URL parameter
    const targetTenantId = createUserDto.tenantId || tenantId;

    // Security check: Verify the requesting user belongs to this tenant
    if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== targetTenantId) {
      return {
        success: false,
        message: 'Access denied - you can only create users in your own tenant',
      };
    }

    const user = await this.usersService.createTenantUser({
      ...createUserDto,
      tenantId: targetTenantId,
    });

    return {
      success: true,
      message: 'Tenant user created successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        status: user.status,
      },
    };
  }

  @Post('tenant/:tenantId/admin')
  @ApiOperation({ summary: 'Create a tenant admin user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tenant admin created successfully',
  })
  async createTenantAdmin(
    @Param('tenantId') tenantId: string,
    @Body() adminData: Omit<CreateTenantUserDto, 'tenantId' | 'role'>,
  ) {
    const user = await this.usersService.createTenantAdminUser(
      tenantId,
      adminData,
    );

    return {
      success: true,
      message: 'Tenant admin created successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        status: user.status,
      },
    };
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get all users for a tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant users retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - not authorized to view this tenant',
  })
  async getTenantUsers(
    @Param('tenantId') tenantId: string,
    @Req() req,
  ) {
    // Security check: Verify the requesting user belongs to this tenant
    // Only SUPER_ADMIN can view any tenant, others can only view their own tenant
    if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== tenantId) {
      return {
        success: false,
        message: 'Access denied - you can only view users from your own tenant',
        data: [],
      };
    }

    const users = await this.usersService.findUsersByTenant(tenantId);

    return {
      success: true,
      message: 'Tenant users retrieved successfully',
      data: users.map((user) => ({
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
      })),
      total: users.length,
    };
  }

  @Get('tenant/:tenantId/role/:role')
  @ApiOperation({ summary: 'Get users by tenant and role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - not authorized to view this tenant',
  })
  async getTenantUsersByRole(
    @Param('tenantId') tenantId: string,
    @Param('role') role: string,
    @Req() req,
  ) {
    // Security check: Verify the requesting user belongs to this tenant
    if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== tenantId) {
      return {
        success: false,
        message: 'Access denied - you can only view users from your own tenant',
        data: [],
      };
    }

    const roleEnum = role.toUpperCase() as UserRole;
    const users = await this.usersService.findUsersByTenantAndRole(
      tenantId,
      roleEnum,
    );

    return {
      success: true,
      message: `Users with role ${roleEnum} retrieved successfully`,
      data: users.map((user) => ({
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
      })),
      total: users.length,
    };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserById(@Param('userId') userId: string) {
    const user = await this.usersService.findUserById(userId);

    return {
      success: true,
      message: 'User retrieved successfully',
      data: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.profile,
      },
    };
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - not authorized to update this user',
  })
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateUserDto,
    @Req() req,
  ) {
    // Get the user first to check tenant
    const existingUser = await this.usersService.findUserById(userId);

    // Security check: Verify the requesting user belongs to the same tenant
    if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== existingUser.tenantId) {
      return {
        success: false,
        message: 'Access denied - you can only update users in your own tenant',
      };
    }

    const user = await this.usersService.updateUser(userId, updateDto);

    return {
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
      },
    };
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - not authorized to delete this user',
  })
  async deleteUser(
    @Param('userId') userId: string,
    @Req() req,
  ) {
    // Get the user first to check tenant
    const existingUser = await this.usersService.findUserById(userId);

    // Security check: Verify the requesting user belongs to the same tenant
    if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== existingUser.tenantId) {
      return {
        success: false,
        message: 'Access denied - you can only delete users in your own tenant',
      };
    }

    await this.usersService.deleteUser(userId);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  @Patch(':userId/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - not authorized to update this user',
  })
  async updateUserStatus(
    @Param('userId') userId: string,
    @Body() statusDto: { status: UserStatus },
    @Req() req,
  ) {
    // Get the user first to check tenant
    const existingUser = await this.usersService.findUserById(userId);

    // Security check: Verify the requesting user belongs to the same tenant
    if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== existingUser.tenantId) {
      return {
        success: false,
        message: 'Access denied - you can only update users in your own tenant',
      };
    }

    const user = await this.usersService.updateUserStatus(
      userId,
      statusDto.status,
    );

    return {
      success: true,
      message: 'User status updated successfully',
      data: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        status: user.status,
      },
    };
  }

  @Patch(':userId/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role changed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid role',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - not authorized to update this user',
  })
  async changeUserRole(
    @Param('userId') userId: string,
    @Body() roleDto: { role: UserRole },
    @Req() req,
  ) {
    // Get the user first to check tenant
    const existingUser = await this.usersService.findUserById(userId);

    // Security check: Verify the requesting user belongs to the same tenant
    if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== existingUser.tenantId) {
      return {
        success: false,
        message: 'Access denied - you can only update users in your own tenant',
      };
    }

    const user = await this.usersService.changeUserRole(userId, roleDto.role);

    return {
      success: true,
      message: 'User role changed successfully',
      data: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Post(':userId/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - not authorized to reset password for this user',
  })
  async resetUserPassword(
    @Param('userId') userId: string,
    @Body() passwordDto: { newPassword: string },
    @Req() req,
  ) {
    // Get the user first to check tenant
    const existingUser = await this.usersService.findUserById(userId);

    // Security check: Verify the requesting user belongs to the same tenant
    if (req.user && req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== existingUser.tenantId) {
      return {
        success: false,
        message: 'Access denied - you can only reset passwords for users in your own tenant',
      };
    }

    await this.usersService.resetUserPassword(userId, passwordDto.newPassword);

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
}
