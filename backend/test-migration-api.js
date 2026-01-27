/**
 * Quick script to test the migration API endpoint
 * Run with: node test-migration-api.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function checkMigrationStatus() {
    console.log('📊 Checking RBAC migration status...\n');

    try {
        const response = await axios.get(`${API_BASE_URL}/api/migrations/rbac-status`);

        if (response.data.success) {
            const { migrationComplete, existingTables, missingTables, stats } = response.data.data;

            console.log(`Migration Status: ${migrationComplete ? '✅ Complete' : '⏳ Pending'}`);
            console.log(`\nExisting Tables (${existingTables.length}/4):`);
            existingTables.forEach(table => console.log(`  ✓ ${table}`));

            if (missingTables.length > 0) {
                console.log(`\nMissing Tables (${missingTables.length}):`);
                missingTables.forEach(table => console.log(`  ✗ ${table}`));
            }

            if (stats) {
                console.log(`\nStatistics:`);
                console.log(`  - Permissions: ${stats.permissions}`);
                console.log(`  - Role Mappings: ${stats.roleMappings}`);
                console.log(`  - User Permissions: ${stats.userPermissions}`);
            }

            return migrationComplete;
        }
    } catch (error) {
        console.error('❌ Error checking status:', error.response?.data || error.message);
        return false;
    }
}

async function runMigration() {
    console.log('🚀 Running RBAC migration via API...\n');

    try {
        const response = await axios.post(`${API_BASE_URL}/api/migrations/run-rbac`);

        if (response.data.success) {
            const { tablesCreated, permissionsSeeded, roleMappings, roleBreakdown } = response.data.data;

            console.log('✅ Migration completed successfully!\n');
            console.log(`Tables Created (${tablesCreated.length}):`);
            tablesCreated.forEach(table => console.log(`  ✓ ${table}`));

            console.log(`\nPermissions Seeded: ${permissionsSeeded}`);
            console.log(`Role Mappings Created: ${roleMappings}`);

            console.log(`\nPermissions by Role:`);
            roleBreakdown.forEach(role => {
                console.log(`  - ${role.role.padEnd(15)} : ${role.permission_count} permissions`);
            });

            console.log('\n✅ RBAC system is ready to use!');
        }
    } catch (error) {
        if (error.response?.data) {
            console.error('❌ Migration failed:', error.response.data.message);
            if (error.response.data.detail) {
                console.error('Detail:', error.response.data.detail);
            }
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

async function main() {
    console.log('🔧 RBAC Migration Helper\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check current status
    const isComplete = await checkMigrationStatus();

    if (!isComplete) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        await runMigration();
    } else {
        console.log('\n✅ Migration already complete. No action needed.');
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
