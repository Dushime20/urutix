import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';

@Injectable()
export class TenantSubdomainMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.hostname || req.headers.host?.split(':')[0];
    
    if (!host) {
      return next();
    }

    // Extract subdomain
    const parts = host.split('.');
    
    // Skip if localhost or IP address (development)
    if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return next();
    }

    // For development: localhost:3000 or 127.0.0.1:3000
    if (parts.length < 2) {
      return next();
    }

    // Extract subdomain (first part before main domain)
    const subdomain = parts[0];

    // Reserved subdomains for system use
    const reservedSubdomains = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'cdn', 'static'];
    
    if (reservedSubdomains.includes(subdomain)) {
      // Allow admin subdomain for super admin access
      if (subdomain === 'admin') {
        req['isSuperAdmin'] = true;
      }
      return next();
    }

    // Look up tenant by subdomain
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { 
          subdomain,
          status: TenantStatus.ACTIVE,
        },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant not found for subdomain: ${subdomain}`);
      }

      // Attach tenant to request
      req['tenant'] = tenant;
      req['tenantId'] = tenant.id;
      req['subdomain'] = subdomain;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Invalid subdomain: ${subdomain}`);
    }

    next();
  }
}
