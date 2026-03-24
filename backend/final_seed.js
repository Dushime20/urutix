const { Client } = require('pg');
require('dotenv').config();

async function runSeed() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected');

    // 1. Get a Driver and their Tenant
    const driverRes = await client.query('SELECT u.id as "driverId", u."tenantId", p."firstName", p."lastName" FROM users u JOIN user_profiles p ON u.id = p."userId" WHERE u.role = \'DRIVER\' LIMIT 1');
    if (driverRes.rows.length === 0) {
        console.error('No drivers found');
        return;
    }
    const driver = driverRes.rows[0];
    const tenantId = driver.tenantId;
    const driverName = `${driver.firstName} ${driver.lastName}`;

    // 2. Get a Truck in that tenant
    const truckRes = await client.query('SELECT id, "plateNumber" FROM trucks WHERE "tenantId" = $1 LIMIT 1', [tenantId]);
    if (truckRes.rows.length === 0) {
        // Fallback to any truck
        const anyTruckRes = await client.query('SELECT id, "plateNumber", "tenantId" FROM trucks LIMIT 1');
        if (anyTruckRes.rows.length === 0) {
            console.error('No trucks found');
            return;
        }
        var truck = anyTruckRes.rows[0];
    } else {
        var truck = truckRes.rows[0];
    }

    // 3. Get a Load in that tenant
    const loadRes = await client.query('SELECT id FROM loads WHERE "tenantId" = $1 LIMIT 1', [tenantId]);
    const loadId = loadRes.rows.length > 0 ? loadRes.rows[0].id : null;

    console.log(`Seeding for Driver:${driverName}, Truck:${truck.plateNumber}, Tenant:${tenantId}`);

    // 4. Insert Safety Inspections
    await client.query(`
        INSERT INTO safety_inspections (
            id, "tenantId", type, inspector, "inspectionDate", 
            "truckId", "truckPlate", "driverId", "driverName", 
            status, score, "maxScore", notes, "createdAt", "updatedAt"
        ) VALUES (
            uuid_generate_v4(), '${tenantId}', 'pre_trip', '${driverName}', NOW() - INTERVAL '1 day', '${truck.id}', '${truck.plateNumber}', '${driver.driverId}', '${driverName}', 'passed', 100, 100, 'All systems functional (Seeded)', NOW(), NOW()
        ), (
            uuid_generate_v4(), '${tenantId}', 'post_trip', '${driverName}', NOW() - INTERVAL '2 days', '${truck.id}', '${truck.plateNumber}', '${driver.driverId}', '${driverName}', 'passed', 95, 100, 'Vehicle ready for next shift (Seeded)', NOW(), NOW()
        )
    `);

    // 5. Update Load with Cargo Metadata
    if (loadId) {
        await client.query(`
            UPDATE loads SET 
                "assignedTruckId" = '${truck.id}',
                "assignedCarrierId" = '${driver.driverId}',
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
                            'inspector', '${driverName}',
                            'notes', 'Cargo properly secured and weight distributed correctly (Seeded).',
                            'issues', '[]'::jsonb,
                            'photos', jsonb_build_array('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'),
                            'timestamp', NOW()
                        )
                    ) || jsonb_build_object('inspectionCompletedAt', NOW())
            WHERE id = '${loadId}'
        `);
        console.log('Seed successful for both safety and cargo!');
    } else {
        console.log('Seed successful for safety only (no load found)');
    }

    // 6. Insert Expenses
    await client.query(`
        INSERT INTO expenses (
            id, "tenantId", type, category, amount, date, description, "truckId", "driverId", status, "createdBy", "taxDeductible", "createdAt", "updatedAt"
        ) VALUES (
            uuid_generate_v4(), '${tenantId}', 'fuel', 'Operations', 450.00, NOW() - INTERVAL '1 day', 'Fuel Refill - Shell Station', '${truck.id}', '${driver.driverId}', 'paid', '${driver.driverId}', true, NOW(), NOW()
        ), (
            uuid_generate_v4(), '${tenantId}', 'maintenance', 'Fleet Maintenance', 1200.00, NOW() - INTERVAL '3 days', 'Annual Service & Tire Replacement', '${truck.id}', '${driver.driverId}', 'approved', '${driver.driverId}', true, NOW(), NOW()
        ), (
            uuid_generate_v4(), '${tenantId}', 'toll', 'Travel', 25.00, NOW() - INTERVAL '12 hours', 'Highway Toll - Expressway', '${truck.id}', '${driver.driverId}', 'paid', '${driver.driverId}', true, NOW(), NOW()
        ), (
            uuid_generate_v4(), '${tenantId}', 'other', 'Utility', 150.00, NOW() - INTERVAL '5 days', 'Sanitization & Cleaning', '${truck.id}', '${driver.driverId}', 'pending', '${driver.driverId}', true, NOW(), NOW()
        )
    `);
    console.log('Seed successful for expenses!');

    // 7. Insert a Completed Trip with POD
    if (loadId) {
        await client.query(`
            INSERT INTO trips (
                id, "tenantId", "tripNumber", "loadId", "truckId", "driverId", status, 
                "plannedStartTime", "plannedEndTime", "actualStartTime", "actualEndTime", 
                "agreedPrice", "createdAt", "updatedAt"
            ) VALUES (
                uuid_generate_v4(), '${tenantId}', 'TRIP-POD-DEMO', '${loadId}', '${truck.id}', '${driver.driverId}', 'COMPLETED',
                NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4.1 days',
                2850.00, NOW(), NOW()
            )
        `);

        // 8. Update Load status and POD metadata
        await client.query(`
            UPDATE loads SET 
                status = 'DELIVERED',
                metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                    'pod', jsonb_build_object(
                        'recipientName', 'James Anderson',
                        'signatureBase64', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAABkCAYAAACH8q9xAAAAAXNSR0IArs4c6QAAArNJREFUeF7t11EKSFEURdH9XzMMBvMgFpAYRNoBo6C597p777VOn9dfPlEBAvkCPq98M0YBAvkCXsAnICBAIBTwAoc0RAIBr4DPQECAQCjgBQ5piAQCPgGfgYAAgVDACxzSEAkEvAI+AwEBAqGAFzikIRII+AR8BgICBEIBL3BIQyQQ8An4DAQECIQCXuCQhkgisFvA/f/+An7hX+Dk+YhEAl7gkIZIIOAV8BkICBAIBbzAIQ2RQOAnX9q6Xf3uAb8AAAAASUVORK5CYII=', 
                        'completedAt', (NOW() - INTERVAL '4.1 days')::text,
                        'completedBy', '${driver.driverId}',
                        'photoUrl', 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?auto=format&fit=crop&q=80&w=800'
                    )
                )
            WHERE id = '${loadId}'
        `);
        console.log('Seed successful for POD demo!');
    }

  } catch (err) {
    console.error('Error during seeding:', err.message);
  } finally {
    await client.end();
  }
}

runSeed();
