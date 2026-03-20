require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration matching your existing seed scripts
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'urutix',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function runRBACMigration() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting RBAC Migration...\n');

        // Read the migration file
        const migrationPath = path.join(__dirname, '..', '..', 'migrations', '003_rbac_permissions_system.sql');
        console.log(`📄 Reading migration file: ${migrationPath}`);

        if (!fs.existsSync(migrationPath)) {
            throw new Error(`❌ Migration file not found at: ${migrationPath}`);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log('✅ Migration file loaded successfully\n');

        // Check if tables already exist
        const checkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
    `);

        if (checkTables.rows.length > 0) {
            console.log('⚠️  Some RBAC tables already exist:');
            checkTables.rows.forEach(row => console.log(`   - ${row.table_name}`));
            console.log('\n⚠️  Migration will continue (tables will be created with IF NOT EXISTS)\n');
        }

        // Execute migration
        console.log('⏳ Executing migration SQL...');
        await client.query(sql);
        console.log('✅ Migration executed successfully!\n');

        // Verify tables were created
        console.log('📊 Verifying RBAC tables...');
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
      ORDER BY table_name
    `);

        console.log(`✅ Found ${tablesResult.rows.length}/4 RBAC tables:`);
        tablesResult.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

        // Count permissions
        const permCount = await client.query('SELECT COUNT(*) as count FROM permissions');
        console.log(`\n📝 Permissions seeded: ${permCount.rows[0].count}`);

        // Count role mappings
        const roleMappingCount = await client.query('SELECT COUNT(*) as count FROM role_permissions');
        console.log(`🔗 Role-permission mappings: ${roleMappingCount.rows[0].count}`);

        // Show permissions by role
        const roleBreakdown = await client.query(`
      SELECT role, COUNT(*) as permission_count
      FROM role_permissions
      GROUP BY role
      ORDER BY role
    `);

        if (roleBreakdown.rows.length > 0) {
            console.log('\n📋 Permissions by role:');
            roleBreakdown.rows.forEach(row => {
                console.log(`   - ${row.role.padEnd(15)} : ${row.permission_count} permissions`);
            });
        }

        // Check if view was created
        const viewCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'user_all_permissions'
    `);

        if (viewCheck.rows.length > 0) {
            console.log('\n📊 View created: user_all_permissions');
        }

        console.log('\n✅ ✅ ✅  RBAC Migration completed successfully! ✅ ✅ ✅\n');
        console.log('Next steps:');
        console.log('  1. Integrate PermissionService in your backend routes');
        console.log('  2. Add PermissionProvider to your frontend App');
        console.log('  3. Start using ProtectedAction components\n');

    } catch (error) {
        console.error('\n❌ Migration failed!');
        console.error('Error:', error.message);

        if (error.code) {
            console.error('PostgreSQL Error Code:', error.code);
        }

        if (error.detail) {
            console.error('Detail:', error.detail);
        }

        if (error.hint) {
            console.error('Hint:', error.hint);
        }

        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
runRBACMigration()
    .then(() => {
        console.log('Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
