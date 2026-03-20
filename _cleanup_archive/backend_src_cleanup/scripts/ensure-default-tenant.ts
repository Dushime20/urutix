import { DataSource } from 'typeorm';
import { Tenant, TenantStatus, TenantType } from '../entities/tenant.entity';
import { User } from '../entities/user.entity';

// Database configuration
const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'urutix',
  entities: [Tenant, User],
  synchronize: false,
  logging: true,
});

async function ensureDefaultTenant() {
  try {
    console.log('🏢 Ensuring default tenant exists...');

    await dataSource.initialize();
    console.log('✅ Database connected!');

    const tenantRepository = dataSource.getRepository(Tenant);

    const defaultTenantId = '00000000-0000-0000-0000-000000000001';

    // Check if default tenant exists
    let defaultTenant = await tenantRepository.findOne({
      where: { id: defaultTenantId },
    });

    if (!defaultTenant) {
      console.log('🏢 Creating default tenant...');
      defaultTenant = tenantRepository.create({
        id: defaultTenantId,
        name: 'Default Organization',
        subdomain: 'default',
        type: TenantType.ENTERPRISE,
        status: TenantStatus.ACTIVE,
        settings: {
          timezone: 'UTC',
          currency: 'USD',
          language: 'en',
        },
        isActive: true,
      });
      defaultTenant = await tenantRepository.save(defaultTenant);
      console.log('✅ Default tenant created successfully!');
    } else {
      console.log('✅ Default tenant already exists!');

      // Update name if it's empty or not set properly
      if (!defaultTenant.name || defaultTenant.name === defaultTenantId) {
        console.log('🔄 Updating default tenant name...');
        defaultTenant.name = 'Default Organization';
        await tenantRepository.save(defaultTenant);
        console.log('✅ Default tenant name updated!');
      }
    }

    console.log('📋 Default Tenant Details:');
    console.log('==========================');
    console.log('ID:', defaultTenant.id);
    console.log('Name:', defaultTenant.name);
    console.log('Subdomain:', defaultTenant.subdomain);
    console.log('Status:', defaultTenant.status);
    console.log('Type:', defaultTenant.type);

    await dataSource.destroy();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
ensureDefaultTenant();
