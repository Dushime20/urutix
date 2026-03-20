const { Client } = require('pg');
require('dotenv').config();

async function addCategoryColumn() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'urutix',
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Add category column
        console.log('\n📝 Adding category column to permissions table...');
        await client.query(`
            ALTER TABLE permissions 
            ADD COLUMN IF NOT EXISTS category VARCHAR(100)
        `);
        console.log('✅ Category column added');

        // Update existing permissions with categories
        console.log('\n📝 Updating existing permissions with categories...');
        const result = await client.query(`
            UPDATE permissions 
            SET category = CASE 
                WHEN resource LIKE 'user%' THEN 'User Management'
                WHEN resource LIKE 'truck%' OR resource LIKE 'fleet%' THEN 'Fleet Management'
                WHEN resource LIKE 'load%' OR resource LIKE 'cargo%' THEN 'Cargo Management'
                WHEN resource LIKE 'trip%' THEN 'Trip Management'
                WHEN resource LIKE 'driver%' THEN 'Driver Management'
                WHEN resource LIKE 'payment%' OR resource LIKE 'financial%' THEN 'Financial'
                WHEN resource LIKE 'tenant%' THEN 'Tenant Management'
                WHEN resource LIKE 'permission%' OR resource LIKE 'role%' THEN 'Permissions'
                WHEN resource LIKE 'report%' OR resource LIKE 'analytics%' THEN 'Reports & Analytics'
                WHEN resource LIKE 'system%' OR resource LIKE 'admin%' THEN 'System'
                ELSE 'General'
            END
            WHERE category IS NULL
            RETURNING id, name, category
        `);
        
        console.log(`✅ Updated ${result.rowCount} permissions with categories`);
        
        if (result.rows.length > 0) {
            console.log('\n📋 Sample updated permissions:');
            result.rows.slice(0, 5).forEach(row => {
                console.log(`  - ${row.name}: ${row.category}`);
            });
        }

        // Verify the update
        const countResult = await client.query(`
            SELECT category, COUNT(*) as count
            FROM permissions
            GROUP BY category
            ORDER BY category
        `);
        
        console.log('\n📊 Permissions by category:');
        countResult.rows.forEach(row => {
            console.log(`  ${row.category}: ${row.count} permissions`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n✅ Database connection closed');
    }
}

addCategoryColumn();
