import { DataSource } from 'typeorm';
import { LoadMatch, MatchStatus } from '../entities/load-match.entity';
import { Load, LoadStatus } from '../entities/load.entity';
import { Truck, VehicleStatus } from '../entities/truck.entity';

/**
 * Migration script to create trips for already-accepted matches
 * Run this to retroactively create trips for matches accepted before the auto-creation feature
 */
async function createTripsForAcceptedMatches() {
    // Initialize database connection
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'urutix',
        entities: ['src/entities/**/*.entity.ts'],
        synchronize: false,
    });

    await dataSource.initialize();
    console.log('✅ Database connected');

    const loadMatchRepo = dataSource.getRepository(LoadMatch);
    const loadRepo = dataSource.getRepository(Load);
    const truckRepo = dataSource.getRepository(Truck);
    const tripRepo = dataSource.getRepository('Trip');

    try {
        // Find all accepted matches
        const acceptedMatches = await loadMatchRepo.find({
            where: { status: MatchStatus.ACCEPTED },
            relations: ['load', 'truck'],
        });

        console.log(`📋 Found ${acceptedMatches.length} accepted matches`);

        let createdCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const match of acceptedMatches) {
            try {
                // Get load details (origin/destination are JSON fields, not relations)
                const load = await loadRepo.findOne({
                    where: { id: match.loadId }
                });

                if (!load) {
                    console.log(`⚠️  Load ${match.loadId} not found, skipping`);
                    skippedCount++;
                    continue;
                }

                // Check if trip already exists for this load
                const existingTrip = await tripRepo.findOne({
                    where: { loadId: load.id },
                });

                if (existingTrip) {
                    console.log(`⏭️  Trip already exists for load ${load.id}, skipping`);
                    skippedCount++;
                    continue;
                }

                // Get truck details
                const truck = await truckRepo.findOne({
                    where: { id: match.truckId },
                });

                if (!truck) {
                    console.log(`⚠️  Truck ${match.truckId} not found, skipping`);
                    skippedCount++;
                    continue;
                }

                // Create trip
                const tripNumber = `TRIP-${Date.now()}-${load.id.substring(0, 8)}`;
                const pickupDate = new Date(load.pickupDate);
                const deliveryDate = new Date(load.deliveryDate);

                const tripData = {
                    tenantId: load.tenantId,
                    loadId: load.id,
                    truckId: truck.id,
                    driverId: truck.currentDriverId,
                    tripNumber,
                    status: 'PLANNED',
                    plannedStartTime: pickupDate,
                    plannedEndTime: deliveryDate,
                    agreedPrice: load.offeredPrice || match.matchDetails?.estimatedCost || 0,
                    currencyCode: load.currencyCode || 'USD',
                    notes: `Retroactively created from accepted match (Match Score: ${match.score})`,
                };

                const trip = tripRepo.create(tripData);
                await tripRepo.save(trip);

                // Update load status if not already assigned
                if (load.status !== LoadStatus.ASSIGNED) {
                    load.status = LoadStatus.ASSIGNED;
                    load.assignedTruckId = truck.id;
                    await loadRepo.save(load);
                }

                // Update truck status if not already in transit
                if (truck.status !== VehicleStatus.IN_TRANSIT) {
                    truck.status = VehicleStatus.IN_TRANSIT;
                    await truckRepo.save(truck);
                }

                console.log(`✅ Created trip ${tripNumber} for load ${load.id}`);
                createdCount++;
            } catch (error) {
                console.error(`❌ Error processing match ${match.id}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Trips created: ${createdCount}`);
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
createTripsForAcceptedMatches()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
