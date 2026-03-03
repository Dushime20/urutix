const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Successfully connected to the database');

        // 1. Check if the columns exist first
        const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' AND column_name IN ('current_address', 'currentLocation', 'locationUpdatedAt');
    `;
        const res = await client.query(checkColumnsQuery);
        const existingColumns = res.rows.map(row => row.column_name);

        console.log('Existing columns:', existingColumns);

        // 2. Add currentLocation if it doesn't exist
        if (!existingColumns.includes('currentLocation')) {
            console.log('Adding column currentLocation...');
            // TypeORM entity uses name 'currentLocation' (camelCase) by default if not specified otherwise in @Column
            // But wait, the error said "Truck.current_address". Truck is the entity name.
            // In the entity file:
            // @Column('geometry', { spatialFeatureType: 'Point', srid: 4326, nullable: true })
            // currentLocation?: object;
            //
            // By default TypeORM with snake_case naming strategy would name it 'current_location'.
            // However, looking at registration_expiry etc, it seems it's using snake_case mostly.
            // In migrations files if they exist, I can see the pattern.

            // Let's look at the error again: "column Truck.current_address does not exist"
            // Wait, "current_address" is snake_case.
            // My entity has @Column({ name: 'current_address', nullable: true })

            // Let's check 'current_location' too.
            await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
            await client.query('ALTER TABLE trucks ADD COLUMN IF NOT EXISTS "currentLocation" geometry(Point, 4326);');
            console.log('Added column currentLocation');
        }

        // 3. Add current_address if it doesn't exist
        if (!existingColumns.includes('current_address')) {
            console.log('Adding column current_address...');
            await client.query('ALTER TABLE trucks ADD COLUMN IF NOT EXISTS current_address TEXT;');
            console.log('Added column current_address');
        }

        // 4. Add location_updated_at if it doesn't exist
        if (!existingColumns.includes('location_updated_at')) {
            console.log('Adding column location_updated_at...');
            await client.query('ALTER TABLE trucks ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP;');
            console.log('Added column location_updated_at');
        }

        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
