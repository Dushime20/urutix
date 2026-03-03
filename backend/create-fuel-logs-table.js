const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix_database',
    user: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
});

async function createFuelLogsTable() {
    try {
        console.log('🚀 Creating fuel_logs table...');

        // Define the table creation query
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS fuel_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL,
                user_id UUID NOT NULL,
                truck_id UUID NOT NULL,
                driver_id UUID,
                trip_id UUID,
                created_by UUID NOT NULL,
                fuel_date TIMESTAMPTZ NOT NULL,
                fuel_amount DECIMAL(10,2) NOT NULL,
                gallons DECIMAL(10,2) NOT NULL,
                price_per_gallon DECIMAL(10,2) NOT NULL,
                total_cost DECIMAL(10,2) NOT NULL,
                location VARCHAR(255) NOT NULL,
                odometer DECIMAL(10,2),
                status VARCHAR(50) DEFAULT 'PENDING',
                receipt_number VARCHAR(100),
                payment_method VARCHAR(100),
                notes TEXT,
                metadata JSONB DEFAULT '{}',
                odometer_image_url VARCHAR(500),
                receipt_url VARCHAR(500),
                is_flagged BOOLEAN DEFAULT FALSE,
                flag_reason TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await pool.query(createTableQuery);
        console.log('✅ fuel_logs table created successfully.');

        // Add indexes
        console.log('🔍 Creating indexes...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant_truck ON fuel_logs(tenant_id, truck_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant_driver ON fuel_logs(tenant_id, driver_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant_status ON fuel_logs(tenant_id, status)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant_date ON fuel_logs(tenant_id, fuel_date)');
        console.log('✅ Indexes created successfully.');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

createFuelLogsTable();
