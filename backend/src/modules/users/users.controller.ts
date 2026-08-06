import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService, CreateTenantUserDto } from './users.service';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a user for a specific tenant' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully and password setup email sent',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exists or invalid role',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found',
  })
  async createTenantUser(
    @Param('tenantId') tenantId: string,
    @Body() createUserDto: Omit<CreateTenantUserDto, 'tenantId'>,
    @Request() req: any,
  ) {
    const caller = req.user;

    // Restriction Logic: TRUCK_OWNER can only create fleet management roles and drivers
    if (caller.role === UserRole.TRUCK_OWNER) {
      const allowedRoles = [
        UserRole.FLEET_MANAGER,
        UserRole.FLEET_DISPATCHER,
        UserRole.FLEET_ACCOUNTANT,
        UserRole.FLEET_SAFETY_OFFICER,
        UserRole.DRIVER,
      ];
      
      if (!allowedRoles.includes(createUserDto.role as UserRole)) {
        throw new ForbiddenException(
          'Truck Owners can only create team members with fleet management or driver roles.',
        );
      }
    }

    // Only SUPER_ADMIN may create SUPER_ADMIN accounts
    const isPlatformAdmin = caller.role === UserRole.ADMIN || caller.role === UserRole.SUPER_ADMIN;

    if (createUserDto.role === UserRole.SUPER_ADMIN && caller.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN users can create SUPER_ADMIN accounts.');
    }
    
    if (caller.role !== UserRole.TENANT_ADMIN && !isPlatformAdmin) {
      const restrictedRoles = [UserRole.TENANT_ADMIN, UserRole.CARGO_RECEIVER, UserRole.CARGO_OWNER, UserRole.BROKER, UserRole.LENDER];
      if (restrictedRoles.includes(createUserDto.role as UserRole)) {
        throw new ForbiddenException(`Your role (${caller.role}) is not authorized to create ${createUserDto.role} accounts.`);
      }
    }

    const user = await this.usersService.createTenantUser({
      ...createUserDto,
      tenantId,
    });

    this.eventEmitter.emit('system.admin.tenant_user_created', {
      tenantId,
      actorId: caller.userId || caller.id,
      actorRole: caller.role,
      newUserId: user.id,
      newUserRole: user.role,
      newUserEmail: user.email,
    });

    return {
      success: true,
      message: 'Tenant user created successfully. Password setup email has been sent.',
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

    this.eventEmitter.emit('system.admin.tenant_user_created', {
      tenantId,
      actorId: 'system',
      actorRole: 'SYSTEM',
      newUserId: user.id,
      newUserRole: user.role,
      newUserEmail: user.email,
    });

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

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        data: null,
      };
    }

    return {
      success: true,
      message: 'User retrieved successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
        tenantId: user.tenantId,
      },
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user by ID (tenant-scoped for TENANT_ADMIN)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req: any,
  ) {
    const caller = req.user;
    const isPlatformAdmin =
      caller.role === UserRole.SUPER_ADMIN || caller.role === UserRole.ADMIN;

    const existing = await this.usersService.findById(id);
    if (!existing) {
      return {
        success: false,
        message: 'User not found',
        data: null,
      };
    }

    // TENANT_ADMIN may only update users in their own tenant
    if (!isPlatformAdmin) {
      if (caller.role !== UserRole.TENANT_ADMIN) {
        throw new ForbiddenException('Access denied.');
      }
      if (caller.tenantId !== existing.tenantId) {
        throw new ForbiddenException(
          'You can only update users within your own tenant.',
        );
      }
      if (
        caller.id === id &&
        updateData.status &&
        updateData.status !== 'ACTIVE'
      ) {
        throw new ForbiddenException('You cannot disable your own account.');
      }
      if (existing.role === UserRole.TENANT_ADMIN && caller.id !== id) {
        throw new ForbiddenException(
          'You cannot modify another tenant admin.',
        );
      }
    }

    const user = await this.usersService.updateUser(id, updateData);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        data: null,
      };
    }

    return {
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
        tenantId: user.tenantId,
      },
    };
  }

  @Get('tenant/:tenantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users for a tenant (scoped to caller\'s tenant for TENANT_ADMIN)' })
  async getTenantUsers(
    @Param('tenantId') tenantId: string,
    @Request() req: any,
  ) {
    const caller = req.user;
    const isPlatformAdmin =
      caller.role === UserRole.SUPER_ADMIN || caller.role === UserRole.ADMIN;

    // TENANT_ADMIN can only read their own tenant
    if (!isPlatformAdmin) {
      if (caller.role !== UserRole.TENANT_ADMIN) {
        throw new ForbiddenException('Access denied.');
      }
      if (caller.tenantId !== tenantId) {
        throw new ForbiddenException(
          'You can only view users within your own tenant.',
        );
      }
    }

    const users = await this.usersService.findUsersByTenant(tenantId);

    return {
      success: true,
      message: 'Tenant users retrieved successfully',
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
        phone: user.phone,
      })),
    };
  }

  @Get('tenant/:tenantId/role/:role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users by tenant and role' })
  async getTenantUsersByRole(
    @Param('tenantId') tenantId: string,
    @Param('role') role: string,
    @Request() req: any,
  ) {
    const caller = req.user;
    const isPlatformAdmin =
      caller.role === UserRole.SUPER_ADMIN || caller.role === UserRole.ADMIN;

    if (!isPlatformAdmin) {
      if (caller.role !== UserRole.TENANT_ADMIN) {
        throw new ForbiddenException('Access denied.');
      }
      if (caller.tenantId !== tenantId) {
        throw new ForbiddenException(
          'You can only view users within your own tenant.',
        );
      }
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
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
        phone: user.phone,
      })),
    };
  }
}
