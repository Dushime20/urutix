import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('📦 Connected to database');

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        // Find existing tenant (kts)
        const tenantResult = await queryRunner.query(
            `SELECT id FROM tenants WHERE subdomain = 'kts' LIMIT 1`
        );
        
        if (tenantResult.length === 0) {
            console.error('❌ Tenant kts not found');
            await AppDataSource.destroy();
            return;
        }
        const tenantId = tenantResult[0].id;

        // Find existing driver
        const driverResult = await queryRunner.query(
            `SELECT u.id, p."firstName", p."lastName" 
             FROM users u 
             JOIN user_profiles p ON u.id = p."userId" 
             WHERE u."tenantId" = '${tenantId}' AND u.role = 'DRIVER' 
             LIMIT 1`
        );

        const driver = driverResult.length > 0 ? driverResult[0] : null;

        // Find existing truck
        const truckResult = await queryRunner.query(
            `SELECT id, "licensePlate" FROM trucks WHERE "tenantId" = '${tenantId}' LIMIT 1`
        );
        const truck = truckResult.length > 0 ? truckResult[0] : null;

        if (driver && truck) {
            console.log(`🚛 Seeding data for Driver: ${driver.firstName} and Truck: ${truck.licensePlate}`);
            
            // 1. Seed Safety Inspections
            await queryRunner.query(`
                INSERT INTO safety_inspections (
                    id, "tenantId", type, inspector, "inspectionDate", 
                    "truckId", "truckPlate", "driverId", "driverName", 
                    status, score, "maxScore", notes, "createdAt", "updatedAt"
                ) VALUES (
                    '${uuidv4()}', '${tenantId}', 'pre_trip', '${driver.firstName} ${driver.lastName}', 
                    NOW() - INTERVAL '1 day', '${truck.id}', '${truck.licensePlate}', 
                    '${driver.id}', '${driver.firstName} ${driver.lastName}', 
                    'passed', 100, 100, 'All systems functional', NOW(), NOW()
                ), (
                    '${uuidv4()}', '${tenantId}', 'post_trip', '${driver.firstName} ${driver.lastName}', 
                    NOW() - INTERVAL '2 days', '${truck.id}', '${truck.licensePlate}', 
                    '${driver.id}', '${driver.firstName} ${driver.lastName}', 
                    'passed', 95, 100, 'Vehicle ready for next shift', NOW(), NOW()
                )
            `);

            // 2. Find a load and add cargo inspection metadata
            const loadResult = await queryRunner.query(
                `SELECT id FROM loads WHERE "tenantId" = '${tenantId}' LIMIT 1`
            );

            if (loadResult.length > 0) {
                const loadId = loadResult[0].id;
                console.log(`📦 Updating load ${loadId} with cargo inspection results`);
                
                // Update load with assignment and metadata
                await queryRunner.query(`
                    UPDATE loads SET 
                        "assignedTruckId" = '${truck.id}',
                        "assignedCarrierId" = '${driver.id}',
                        status = 'LOADED',
                        metadata = jsonb_set(
                            COALESCE(metadata, '{}'::jsonb),
                            '{inspectionStatus}',
                            '"COMPLETED"'
                        ) || jsonb_set(
                            '{}'::jsonb,
                            '{inspectionResult}',
                            jsonb_build_object(
                                'status', 'PASSED',
                                'inspector', '${driver.firstName} ${driver.lastName}',
                                'notes', 'Cargo properly secured. No damage observed.',
                                'issues', '[]'::jsonb,
                                'photos', jsonb_build_array('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'),
                                'timestamp', NOW()
                            )
                        ) || jsonb_build_object('inspectionCompletedAt', NOW())
                    WHERE id = '${loadId}'
                `);
            }
            console.log('✅ Seed successful!');
        } else {
            console.error('❌ Could not find suitable driver or truck for seeding');
        }

        await queryRunner.release();
        await AppDataSource.destroy();
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

seed();
