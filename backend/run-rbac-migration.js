const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration using environment variables with fallbacks
const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'urutix',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10), // Ensure port is an integer
};

async function runMigration() {
    const client = new Client(config);
    let migrationSql = ''; // To store the SQL content for potential error logging

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', '003_rbac_permissions_system.sql');
        console.log(`📄 Reading migration file: ${migrationPath}`);

        try {
            migrationSql = fs.readFileSync(migrationPath, 'utf8');
        } catch (fileError) {
            console.error(`❌ Failed to read migration file at ${migrationPath}:`, fileError.message);
            throw new Error(`File read error: ${fileError.message}`);
        }

        console.log('🚀 Running RBAC migration...');
        console.log('   - Creating tables: permissions, role_permissions, user_permissions, permission_audit_log');
        console.log('   - Seeding 52 core permissions');
        console.log('   - Mapping permissions to 8 roles');

        await client.query(migrationSql);

        console.log('✅ Migration completed successfully!');

        // Verify tables were created
        console.log('\n📊 Verifying tables...');
        const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
      ORDER BY table_name;
    `;

        const tablesResult = await client.query(tablesQuery);
        console.log('✅ Tables created:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Count permissions
        const permCountResult = await client.query('SELECT COUNT(*) FROM permissions');
        console.log(`\n✅ Permissions seeded: ${permCountResult.rows[0].count}`);

        // Count role mappings
        const roleMappingResult = await client.query('SELECT COUNT(*) FROM role_permissions');
        console.log(`✅ Role-permission mappings: ${roleMappingResult.rows[0].count}`);

        // Show role breakdown
        const roleBreakdownResult = await client.query(`
      SELECT role, COUNT(*) as permission_count
      FROM role_permissions
      GROUP BY role
      ORDER BY role;
    `);

        console.log('\n📋 Permissions by role:');
        roleBreakdownResult.rows.forEach(row => {
            console.log(`   - ${row.role}: ${row.permission_count} permissions`);
        });

    } catch (error) {
        console.error('❌ Migration failed!');
        console.error(`Error details: ${error.message}`);
        if (error.code) { // PostgreSQL error code
            console.error(`PostgreSQL Error Code: ${error.code}`);
        }
        if (error.position) { // Position in query where error occurred
            console.error(`Error position in query: ${error.position}`);
            // Optionally log the problematic part of the SQL if migrationSql is available
            // console.error(`Problematic SQL snippet: ${migrationSql.substring(Math.max(0, error.position - 50), error.position + 50)}`);
        }
        if (error.stack) {
            console.error('\nStack trace:', error.stack);
        }
        process.exit(1);
    } finally {
        if (client._connected) { // Check if client was successfully connected
            await client.end();
            console.log('\n🔌 Database connection closed');
        } else {
            console.log('\n⚠️ Database connection was not established or already closed.');
        }
    }
}

runMigration();
