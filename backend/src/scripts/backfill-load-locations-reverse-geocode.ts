import { DataSource } from 'typeorm';
import { Load } from '../entities/load.entity';
import axios from 'axios';

/**
 * Migration script to backfill location names from coordinates using Nominatim Reverse Geocoding
 */
async function backfillReverseGeocoding() {
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
        const loads = await loadRepo.find();
        console.log(`📋 Found ${loads.length} loads to check`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const load of loads) {
            let loadUpdated = false;

            // Helper to get address from Nominatim
            const getAddressFromCoords = async (lat: number, lon: number) => {
                try {
                    // Respect Nominatim Usage Policy (max 1 request/sec)
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
                    console.log(`   🌍 Geocoding: ${lat}, ${lon}`);

                    const response = await axios.get(url, {
                        headers: {
                            'User-Agent': 'UrutixBackfillScript/1.0',
                            'Accept-Language': 'en',
                        },
                        timeout: 10000
                    });

                    if (response.data && response.data.address) {
                        const addr = response.data.address;
                        const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || 'Unknown City';
                        const country = addr.country || 'Unknown Country';
                        const address = response.data.display_name;
                        return { city, country, address };
                    }
                } catch (e) {
                    console.error(`   ⚠️ Geocoding failed: ${e.message}`);
                }
                return null;
            };

            // Process locations array
            if (load.locations && Array.isArray(load.locations)) {
                for (const loc of load.locations) {
                    // Only process if has coordinates but missing city/country or generic values
                    const coords = loc.locationData?.coordinates;
                    const data = loc.locationData;

                    if (coords && coords.latitude && coords.longitude) {
                        const isGeneric = !data.city || data.city === 'Unknown City' || !data.country || data.country === 'Unknown Country';
                        // Check if coordinates are not 0,0
                        const validCoords = Math.abs(coords.latitude) > 0.001 || Math.abs(coords.longitude) > 0.001;

                        if (isGeneric && validCoords) {
                            const result = await getAddressFromCoords(coords.latitude, coords.longitude);
                            if (result) {
                                loc.locationData.city = result.city;
                                loc.locationData.country = result.country;
                                loc.locationData.address = result.address; // Update full address too
                                loadUpdated = true;
                                console.log(`   ✅ Updated location ${loc.type}: ${result.city}, ${result.country}`);
                            }
                        }
                    }
                }
            }

            // Sync back to top-level origin/destination
            if (loadUpdated) {
                const mapLocationToAddress = (loc: any) => ({
                    address: loc.locationData.address,
                    city: loc.locationData.city,
                    state: loc.locationData.state,
                    postalCode: loc.locationData.postalCode,
                    country: loc.locationData.country,
                    lat: loc.locationData.coordinates?.latitude,
                    lng: loc.locationData.coordinates?.longitude,
                });

                const pickup = load.locations.find((l: any) => l.type === 'PICKUP');
                if (pickup) load.origin = mapLocationToAddress(pickup);

                const delivery = load.locations.find((l: any) => l.type === 'DELIVERY');
                if (delivery) load.destination = mapLocationToAddress(delivery);

                await loadRepo.save(load);
                updatedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Geocoded loads: ${updatedCount}`);
        console.log(`   ⏭️  Skipped (already valid/no coords): ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);

    } catch (error) {
        console.error('❌ Script failed:', error);
    } finally {
        await dataSource.destroy();
        console.log('🔌 Database connection closed');
    }
}

backfillReverseGeocoding();
