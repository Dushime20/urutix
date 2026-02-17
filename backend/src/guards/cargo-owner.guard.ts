import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load } from '../entities/load.entity';

/**
 * Guard to verify cargo owner has permission to access/modify a load
 * Ensures:
 * 1. User belongs to the same tenant as the load
 * 2. User is the cargo owner of the load (unless admin/super_admin)
 */
@Injectable()
export class CargoOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Extract loadId from params or body
    const loadId = request.params.id || request.params.loadId || request.body.loadId;

    if (!loadId) {
      // If no loadId, let the controller handle it
      return true;
    }

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Fetch load with minimal fields for performance
    const load = await this.loadRepository.findOne({
      where: { id: loadId },
      select: ['id', 'cargoOwnerId', 'tenantId'],
    });

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    // Verify tenant isolation
    if (load.tenantId !== user.tenantId) {
      throw new ForbiddenException('Access denied: tenant mismatch');
    }

    // Allow admins and super admins to access any load in their tenant
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (allowedRoles.includes(user.role)) {
      return true;
    }

    // Verify ownership for regular users
    if (load.cargoOwnerId !== user.id && load.cargoOwnerId !== user.userId) {
      throw new ForbiddenException('Access denied: not the cargo owner');
    }

    return true;
  }
}
