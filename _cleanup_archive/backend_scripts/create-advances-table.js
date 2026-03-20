const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix_database',
    user: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
});

async function createAdvancesTable() {
    try {
        console.log('🚀 Creating driver_fuel_advances table...');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS driver_fuel_advances (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                driver_id UUID NOT NULL,
                trip_id UUID,
                amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'PENDING',
                requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                approved_at TIMESTAMPTZ,
                approved_by UUID,
                rejection_reason TEXT,
                notes TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await pool.query(createTableQuery);
        console.log('✅ driver_fuel_advances table created successfully.');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

createAdvancesTable();
