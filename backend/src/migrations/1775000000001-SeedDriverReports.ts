import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedDriverReports1775000000001 implements MigrationInterface {
    name = 'SeedDriverReports1775000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Find existing tenant (kts)
        const tenantResult = await queryRunner.query(
            `SELECT id FROM tenants WHERE subdomain = 'kts' LIMIT 1`
        );
        
        if (tenantResult.length === 0) return;
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

        // Find existing truck - use plateNumber instead of licensePlate
        const truckResult = await queryRunner.query(
            `SELECT id, "plateNumber" FROM trucks WHERE "tenantId" = '${tenantId}' LIMIT 1`
        );
        const truck = truckResult.length > 0 ? truckResult[0] : null;

        if (driver && truck) {
            // Check if safety_inspections table exists before seeding
            const safetyInspectionsExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'safety_inspections'
                )
            `);

            if (safetyInspectionsExists[0].exists) {
                // 1. Seed Safety Inspections
                await queryRunner.query(`
                    INSERT INTO safety_inspections (
                        id, "tenantId", type, inspector, "inspectionDate", 
                        "truckId", "truckPlate", "driverId", "driverName", 
                        status, score, "maxScore", notes, "createdAt", "updatedAt"
                    ) VALUES (
                        uuid_generate_v4(), '${tenantId}', 'pre_trip', '${driver.firstName} ${driver.lastName}', 
                        NOW() - INTERVAL '1 day', '${truck.id}', '${truck.plateNumber}', 
                        '${driver.id}', '${driver.firstName} ${driver.lastName}', 
                        'passed', 100, 100, 'All systems functional', NOW(), NOW()
                    ), (
                        uuid_generate_v4(), '${tenantId}', 'post_trip', '${driver.firstName} ${driver.lastName}', 
                        NOW() - INTERVAL '2 days', '${truck.id}', '${truck.plateNumber}', 
                        '${driver.id}', '${driver.firstName} ${driver.lastName}', 
                        'passed', 95, 100, 'Vehicle ready for next shift', NOW(), NOW()
                    )
                `);
            }
        }

            // 2. Find a load and add cargo inspection metadata
            const loadResult = await queryRunner.query(
                `SELECT id FROM loads WHERE "tenantId" = '${tenantId}' LIMIT 1`
            );

            if (loadResult.length > 0) {
                const loadId = loadResult[0].id;
                
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
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No-op for seed data
    }
}
