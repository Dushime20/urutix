const { Client } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'),
        database: process.env.DB_NAME || 'urutix',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, 'migrations', '016_add_owner_id_to_fuel_wallets.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('🔄 Running migration: 016_add_owner_id_to_fuel_wallets.sql');
        
        await client.query(migrationSQL);
        
        console.log('✅ Migration completed successfully!');
        console.log('\n📊 Checking fuel_wallets table structure...');
        
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'fuel_wallets'
            ORDER BY ordinal_position;
        `);
        
        console.log('\nFuel Wallets Table Columns:');
        console.table(result.rows);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

runMigration()
    .then(() => {
        console.log('\n✅ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
