import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Tenant, TenantStatus, TenantType } from '../../entities/tenant.entity';
import { FindTenantsDto } from './dto/tenant.dto';
import { PaginatorResponse, Paginators } from 'src/utils/paginator';
import { mergeWhere } from 'src/utils/query';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
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

    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async activateTenant(id: string): Promise<Tenant> {
    const tenant = await this.findTenantById(id);
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

  async deleteTenant(id: string): Promise<void> {
    const tenant = await this.findTenantById(id);
    await this.tenantRepository.remove(tenant);
  }

  async getAllTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  async getSearchedTenants(query: FindTenantsDto) {
    const { q } = query;
    const { skip, limit, sorts } = Paginators(query);

    const searchWhere: FindOptionsWhere<Tenant>[] = q
      ? [{ name: ILike(`%${q}%`) }]
      : [];
    const normalWhere: FindOptionsWhere<Tenant> = {
      isActive: true,
      status: TenantStatus.ACTIVE,
    };

    const where = mergeWhere(searchWhere, normalWhere);

    const [tenants, total] = await this.tenantRepository.findAndCount({
      where,
      select: ['id', 'name', 'country', 'city', 'logoUrl', 'websiteUrl'],
      order: sorts,
      skip: skip,
      take: limit,
    });

    return PaginatorResponse(tenants, total, limit, skip);
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
