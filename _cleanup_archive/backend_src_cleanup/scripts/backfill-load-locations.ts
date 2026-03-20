import { DataSource } from 'typeorm';
import { Load } from '../entities/load.entity';

/**
 * Migration script to backfill origin and destination columns from locations array
 */
async function backfillLoadLocations() {
    // Initialize database connection
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123',
        database: process.env.DB_NAME || 'uruti',
        entities: ['src/entities/**/*.entity.ts'],
        synchronize: false,
    });

    await dataSource.initialize();
    console.log('✅ Database connected');

    const loadRepo = dataSource.getRepository(Load);

    try {
        // Find all loads
        const loads = await loadRepo.find();
        console.log(`📋 Found ${loads.length} loads`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const load of loads) {
            try {
                // Check if origin or destination is missing
                const needsUpdate = !load.origin || !load.destination;

                if (!needsUpdate) {
                    skippedCount++;
                    continue;
                }

                if (!load.locations || !Array.isArray(load.locations) || load.locations.length === 0) {
                    console.log(`⚠️ Load ${load.id} has no locations data, skipping`);
                    skippedCount++;
                    continue;
                }

                let updated = false;

                // Helper to map location data to address
                const mapLocationToAddress = (loc: any) => ({
                    address: loc.locationData.address || loc.locationData.name || 'Unknown Address',
                    city: loc.locationData.city || 'Unknown City',
                    state: loc.locationData.state,
                    postalCode: loc.locationData.postalCode,
                    country: loc.locationData.country || '',
                    lat: loc.locationData.coordinates?.latitude,
                    lng: loc.locationData.coordinates?.longitude,
                });

                // Find pickup location
                const pickup = load.locations.find((l: any) => l.type === 'PICKUP');
                if (pickup && !load.origin) {
                    load.origin = mapLocationToAddress(pickup);
                    updated = true;
                }

                // Find delivery location
                const delivery = load.locations.find((l: any) => l.type === 'DELIVERY');
                if (delivery && !load.destination) {
                    load.destination = mapLocationToAddress(delivery);
                    updated = true;
                }

                if (updated) {
                    await loadRepo.save(load);
                    console.log(`✅ Updated load ${load.id} with locations`);
                    updatedCount++;
                } else {
                    skippedCount++;
                }

            } catch (error) {
                console.error(`❌ Error processing load ${load.id}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Updated loads: ${updatedCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
    } catch (error) {
        console.error('❌ Script failed:', error);
    } finally {
        await dataSource.destroy();
        console.log('🔌 Database connection closed');
    }
}

// Run the script
backfillLoadLocations()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
