import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, FindOptionsOrder, ILike, In, Repository } from 'typeorm';
import { Tenant, TenantStatus, TenantType } from '../../entities/tenant.entity';
import { User, UserRole } from '../../entities/user.entity';
import { FindTenantsDto } from './dto/tenant.dto';
import { PaginatorResponse, Paginators } from '../../utils/paginator';
import { mergeWhere } from '../../utils/query';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createTenant(createTenantDto: any): Promise<Tenant> {
    // Check if subdomain already exists
    if (createTenantDto.subdomain) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { subdomain: createTenantDto.subdomain },
      });

      if (existingTenant) {
        throw new ConflictException('Subdomain already exists');
      }
    }

    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      status: TenantStatus.PENDING_ACTIVATION,
    });

    const savedTenant = await this.tenantRepository.save(tenant);
    return Array.isArray(savedTenant) ? savedTenant[0] : savedTenant;
  }

  async findTenantById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findTenantBySubdomain(subdomain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { subdomain },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findTenantByDomain(domain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { domain },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateTenant(id: string, updateTenantDto: any): Promise<Tenant> {
    const tenant = await this.findTenantById(id);

    // Check if subdomain is being changed and if it conflicts
    if (
      updateTenantDto.subdomain &&
      updateTenantDto.subdomain !== tenant.subdomain
    ) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { subdomain: updateTenantDto.subdomain },
      });

      if (existingTenant) {
        throw new ConflictException('Subdomain already exists');
      }
    }

    // Prevent updating status to DEACTIVATED through update endpoint
    // Use delete endpoint for deactivation
    if (updateTenantDto.status === TenantStatus.DEACTIVATED) {
      delete updateTenantDto.status;
    }

    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async activateTenant(id: string): Promise<Tenant> {
    const tenant = await this.findTenantById(id);

    // Validation: Check if tenant can be activated
    const validationErrors: string[] = [];

    // 1. Check required fields
    if (!tenant.name || tenant.name.trim().length === 0) {
      validationErrors.push('Tenant name is required');
    }

    if (!tenant.subdomain || tenant.subdomain.trim().length === 0) {
      validationErrors.push('Tenant subdomain is required');
    }

    if (!tenant.contactEmail || tenant.contactEmail.trim().length === 0) {
      validationErrors.push('Contact email is required');
    }

    // 2. Check if tenant has at least one admin user
    const adminUsers = await this.userRepository.find({
      where: {
        tenantId: tenant.id,
        role: UserRole.TENANT_ADMIN,
      } as any,
    });

    if (adminUsers.length === 0) {
      validationErrors.push('Tenant must have at least one admin user before activation');
    }
    
    // 3. Check if tenant is not already deactivated
    if (tenant.status === TenantStatus.DEACTIVATED) {
      validationErrors.push('Cannot activate a deactivated tenant. Please restore it first.');
    }

    // 4. Check if domain exists (should be set during creation)
    if (!tenant.domain || tenant.domain.trim().length === 0) {
      validationErrors.push('Tenant domain is required. Please ensure domain is set.');
    }

    if (validationErrors.length > 0) {
      throw new BadRequestException(
        `Cannot activate tenant. Missing requirements: ${validationErrors.join(', ')}`,
      );
    }

    // All validations passed - activate tenant
    tenant.status = TenantStatus.ACTIVE;
    tenant.activatedAt = new Date();
    tenant.isActive = true;
    return this.tenantRepository.save(tenant);
  }

  async suspendTenant(id: string, reason?: string): Promise<Tenant> {
    const tenant = await this.findTenantById(id);
    tenant.status = TenantStatus.SUSPENDED;
    tenant.suspendedAt = new Date();
    tenant.suspendedReason = reason;
    tenant.isActive = false;
    return this.tenantRepository.save(tenant);
  }

  async deleteTenant(id: string): Promise<Tenant> {
    const tenant = await this.findTenantById(id);
    // Soft delete: change status to DEACTIVATED and set isActive to false
    tenant.status = TenantStatus.DEACTIVATED;
    tenant.isActive = false;
    return this.tenantRepository.save(tenant);
  }

  async getAllTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  async getSearchedTenants(query: FindTenantsDto) {
    console.log('🔍 [SERVICE] getSearchedTenants called with query:', query);
    const { q } = query;
    const { skip, limit, sorts } = Paginators(query);

    // For signup flow, return ONLY ACTIVE tenants
    // Users should only be able to sign up for companies that are active
    // IMPORTANT: This query must return ALL active tenants for the company selection dropdown
    // Using enum value ensures case-sensitive match with database enum type
    // Note: We only filter by status, not isActive, to include all ACTIVE tenants
    // (some tenants may have isActive=false if manually updated, but status=ACTIVE is the primary indicator)
    let where: FindOptionsWhere<Tenant>[] | FindOptionsWhere<Tenant> = {
      status: TenantStatus.ACTIVE, // This matches 'ACTIVE' in the database enum
      // Note: Not filtering by isActive to ensure all ACTIVE status tenants are included
    };

    // If there's a search query, add name filter
    if (q) {
      where = {
        ...where,
        name: ILike(`%${q}%`),
      };
    }

    console.log('🔍 [SERVICE] Where clause (ACTIVE tenants only):', JSON.stringify(where));
    console.log('🔍 [SERVICE] Query string:', q || 'empty (showing all active tenants)');

    // For public signup, return ALL active tenants (up to 1000 to ensure we get all)
    // This ensures all active companies appear in the signup dropdown
    const maxLimit = limit && limit > 0 ? Math.min(limit, 1000) : 1000;
    console.log('🔍 [SERVICE] Max limit:', maxLimit, '(ensuring all active tenants are included)');

    // Convert sorts from Record<string, number> to TypeORM format { field: 'ASC' | 'DESC' }
    // Paginators returns { name: 1 } or { name: -1 }, but TypeORM needs { name: 'ASC' } or { name: 'DESC' }
    let orderBy: FindOptionsOrder<Tenant> = { name: 'ASC' };
    if (sorts && typeof sorts === 'object' && !Array.isArray(sorts)) {
      // Convert numeric values (1 = ASC, -1 = DESC) to TypeORM format
      orderBy = Object.entries(sorts).reduce((acc, [key, value]) => {
        acc[key as keyof Tenant] = (value === 1 ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
        return acc;
      }, {} as FindOptionsOrder<Tenant>);
    }

    const [tenants, total] = await this.tenantRepository.findAndCount({
      where,
      select: ['id', 'name', 'country', 'city', 'logoUrl', 'websiteUrl', 'status', 'isActive'],
      order: orderBy,
      skip: skip || 0,
      take: maxLimit,
    });

    console.log('✅ [SERVICE] Found tenants:', tenants.length, 'out of', total);
    console.log('✅ [SERVICE] All tenants from DB (no filters):', JSON.stringify(tenants, null, 2));
    console.log('✅ [SERVICE] Tenant names:', tenants.map(t => t.name));
    console.log('✅ [SERVICE] Tenant statuses:', tenants.map(t => ({ 
      name: t.name, 
      status: (t as any).status,
      isActive: (t as any).isActive 
    })));

    const response = PaginatorResponse(tenants, total, maxLimit, skip || 0);
    console.log('✅ [SERVICE] Paginated response:', JSON.stringify(response, null, 2));
    return response;
  }

  async getActiveTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { status: TenantStatus.ACTIVE, isActive: true },
    });
  }

  async getTenantStats(id: string) {
    const tenant = await this.findTenantById(id);

    // TODO: Implement tenant statistics
    // This could include user count, load count, revenue, etc.

    return {
      tenantId: tenant.id,
      name: tenant.name,
      status: tenant.status,
      // Add more stats as needed
    };
  }
}
