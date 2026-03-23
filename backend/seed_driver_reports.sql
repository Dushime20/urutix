-- Seed Safety Inspections and Cargo Loading Inspections for any available tenant and driver
DO $$
DECLARE
    v_tenant_id uuid;
    v_driver_id uuid;
    v_driver_name text;
    v_truck_id uuid;
    v_truck_plate text;
    v_load_id uuid;
BEGIN
    -- 1. Try first for kts tenant
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'kts' LIMIT 1;
    
    -- 2. Find any driver
    IF v_tenant_id IS NOT NULL THEN
        SELECT u.id, p."firstName" || ' ' || p."lastName" 
        INTO v_driver_id, v_driver_name
        FROM users u
        JOIN user_profiles p ON u.id = p."userId"
        WHERE u."tenantId" = v_tenant_id AND u.role = 'DRIVER'
        LIMIT 1;
    END IF;

    -- Fallback: any driver from ANY tenant
    IF v_driver_id IS NULL THEN
        SELECT u.id, p."firstName" || ' ' || p."lastName", u."tenantId"
        INTO v_driver_id, v_driver_name, v_tenant_id
        FROM users u
        JOIN user_profiles p ON u.id = p."userId"
        WHERE u.role = 'DRIVER'
        LIMIT 1;
    END IF;

    -- 3. If we found a driver and tenant, find a truck
    IF v_tenant_id IS NOT NULL AND v_driver_id IS NOT NULL THEN
        SELECT id, "licensePlate" INTO v_truck_id, v_truck_plate
        FROM trucks
        WHERE "tenantId" = v_tenant_id
        LIMIT 1;

        -- Fallback: any truck
        IF v_truck_id IS NULL THEN
            SELECT id, "licensePlate", "tenantId" 
            INTO v_truck_id, v_truck_plate, v_tenant_id
            FROM trucks
            LIMIT 1;
        END IF;

        -- 4. Find a load in that tenant
        SELECT id INTO v_load_id FROM loads WHERE "tenantId" = v_tenant_id LIMIT 1;
        
        -- Fallback: any load
        IF v_load_id IS NULL THEN
            SELECT id, "tenantId" INTO v_load_id, v_tenant_id FROM loads LIMIT 1;
        END IF;

        IF v_driver_id IS NOT NULL AND v_truck_id IS NOT NULL THEN
            -- INSERT Safety Inspections
            INSERT INTO safety_inspections (
                id, "tenantId", type, inspector, "inspectionDate", 
                "truckId", "truckPlate", "driverId", "driverName", 
                status, score, "maxScore", notes, "createdAt", "updatedAt"
            ) VALUES (
                uuid_generate_v4(), v_tenant_id, 'pre_trip', v_driver_name, 
                NOW() - INTERVAL '1 day', v_truck_id, v_truck_plate, 
                v_driver_id, v_driver_name, 
                'passed', 100, 100, 'All systems functional (Seeded)', NOW(), NOW()
            ), (
                uuid_generate_v4(), v_tenant_id, 'post_trip', v_driver_name, 
                NOW() - INTERVAL '2 days', v_truck_id, v_truck_plate, 
                v_driver_id, v_driver_name, 
                'passed', 95, 100, 'Vehicle ready for next shift (Seeded)', NOW(), NOW()
            );

            -- Seed Cargo Loading Inspection for the load
            IF v_load_id IS NOT NULL THEN
                UPDATE loads SET 
                    "assignedTruckId" = v_truck_id,
                    "assignedCarrierId" = v_driver_id,
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
                            'inspector', v_driver_name,
                            'notes', 'Cargo properly secured and weight distributed correctly (Seeded).',
                            'issues', '[]'::jsonb,
                            'photos', jsonb_build_array('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'),
                            'timestamp', NOW()
                        )
                    ) || jsonb_build_object('inspectionCompletedAt', NOW())
                WHERE id = v_load_id;
            END IF;
        END IF;
    END IF;
END $$;
