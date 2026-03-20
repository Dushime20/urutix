/**
 * Direct Test of Tenant Management Service
 * Test the service directly to see the exact error
 */

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function testTenantManagementDirect() {
    console.log('🧪 Testing tenant management service directly...\n');

    try {
        // Create NestJS application
        const app = await NestFactory.createApplicationContext(AppModule);
        
        // Get the tenant management service
        const { TenantManagementService } = require('./dist/services/tenant-management.service');
        const tenantManagementService = app.get(TenantManagementService);

        console.log('✅ Service loaded successfully');

        // Test getAllTenants method directly
        console.log('\n🔍 Testing getAllTenants method...');
        const tenants = await tenantManagementService.getAllTenants();
        
        console.log(`✅ Success! Found ${tenants.length} tenants`);
        
        if (tenants.length > 0) {
            console.log('\n📋 Sample tenant:');
            const sample = tenants[0];
            console.log(`   Name: ${sample.name}`);
            console.log(`   Status: ${sample.status}`);
            console.log(`   Users: ${sample.users?.total || 'N/A'}`);
            console.log(`   Credits: ${sample.credits?.balance || 'N/A'}`);
        }

        await app.close();
        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testTenantManagementDirect();