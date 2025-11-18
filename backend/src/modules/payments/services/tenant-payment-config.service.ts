import { Injectable } from '@nestjs/common';
import { Tenant } from '../../../entities/tenant.entity';

@Injectable()
export class TenantPaymentConfigService {
  async getConfig(tenant: Tenant): Promise<any> {
    // ...fetch and return tenant-specific config...
    throw new Error('Not implemented');
  }
}
