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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService, CreateTenantUserDto } from './users.service';
import { UserRole } from '../../entities/user.entity';

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
  ) {
    const user = await this.usersService.createTenantUser({
      ...createUserDto,
      tenantId,
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
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
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
  @ApiOperation({ summary: 'Get all users for a tenant' })
  async getTenantUsers(@Param('tenantId') tenantId: string) {
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
      })),
    };
  }

  @Get('tenant/:tenantId/role/:role')
  @ApiOperation({ summary: 'Get users by tenant and role' })
  async getTenantUsersByRole(
    @Param('tenantId') tenantId: string,
    @Param('role') role: string,
  ) {
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
      })),
    };
  }
}
