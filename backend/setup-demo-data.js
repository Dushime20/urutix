require('dotenv').config();
const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

const d = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const TENANT_ID = '3174d68f-cb7d-4428-b578-e931d1a3f464';
const TENANT_ADMIN_ID = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

async function setup() {
    await d.initialize();
    console.log('\n=== SETTING UP DEMO DATA ===\n');

    try {
        // 1. Create Truck Owner
        console.log('1. Creating Truck Owner...');
        const hashedPassword = await bcrypt.hash('TruckOwner123!', 10);
        
        const truckOwnerResult = await d.query(`
            INSERT INTO users (email, password, role, tenant_id, is_active, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET is_active = true
            RETURNING id, email, role
        `, ['truckowner@demo.com', hashedPassword, 'TRUCK_OWNER', TENANT_ID, true, 'ACTIVE']);
        
        const truckOwnerId = truckOwnerResult[0].id;
        console.log(`✓ Truck Owner created: ${truckOwnerResult[0].email} (${truckOwnerId})\n`);

        // 2. Create Trucks for Truck Owner
        console.log('2. Creating Trucks...');
        const trucks = [
            { plate: 'TRK-001', make: 'Volvo', model: 'FH16', year: 2022 },
            { plate: 'TRK-002', make: 'Mercedes', model: 'Actros', year: 2021 },
            { plate: 'TRK-003', make: 'Scania', model: 'R500', year: 2023 }
        ];

        for (const truck of trucks) {
            await d.query(`
                INSERT INTO trucks (
                    tenant_id, owner_id, license_plate, make, model, year, 
                    status, capacity_kg, is_active, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                ON CONFLICT (license_plate, tenant_id) DO UPDATE 
                SET owner_id = $2, is_active = true
            `, [TENANT_ID, truckOwnerId, truck.plate, truck.make, truck.model, truck.year, 'AVAILABLE', 25000, true]);
            console.log(`✓ Truck created: ${truck.plate} (${truck.make} ${truck.model})`);
        }
        console.log('');

        // 3. Create Cargo Owner
        console.log('3. Creating Cargo Owner...');
        const cargoOwnerPassword = await bcrypt.hash('CargoOwner123!', 10);
        
        const cargoOwnerResult = await d.query(`
            INSERT INTO users (email, password, role, tenant_id, is_active, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET is_active = true
            RETURNING id, email, role
        `, ['cargoowner@demo.com', cargoOwnerPassword, 'CARGO_OWNER', TENANT_ID, true, 'ACTIVE']);
        
        const cargoOwnerId = cargoOwnerResult[0].id;
        console.log(`✓ Cargo Owner created: ${cargoOwnerResult[0].email} (${cargoOwnerId})\n`);

        // 4. Create Cargo for Cargo Owner
        console.log('4. Creating Cargo...');
        const cargoItems = [
            { type: 'Electronics', origin: 'Kigali', destination: 'Nairobi', weight: 5000 },
            { type: 'Textiles', origin: 'Kampala', destination: 'Dar es Salaam', weight: 8000 },
            { type: 'Food Products', origin: 'Mombasa', destination: 'Kigali', weight: 12000 }
        ];

        for (const cargo of cargoItems) {
            await d.query(`
                INSERT INTO cargo (
                    tenant_id, owner_id, cargo_type, origin, destination, 
                    weight_kg, status, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `, [TENANT_ID, cargoOwnerId, cargo.type, cargo.origin, cargo.destination, cargo.weight, 'PENDING']);
            console.log(`✓ Cargo created: ${cargo.type} (${cargo.origin} → ${cargo.destination})`);
        }
        console.log('');

        // 5. Summary
        console.log('=== SETUP COMPLETE ===\n');
        console.log('Credentials:');
        console.log('Tenant Admin: tenantadmin@demo.com / TenantAdmin123!');
        console.log('Truck Owner:  truckowner@demo.com / TruckOwner123!');
        console.log('Cargo Owner:  cargoowner@demo.com / CargoOwner123!\n');

        console.log('Summary:');
        console.log(`- 1 Truck Owner with 3 trucks`);
        console.log(`- 1 Cargo Owner with 3 cargo items`);
        console.log(`- All users belong to Demo Tenant\n`);

    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    } finally {
        await d.destroy();
    }
}

setup().catch(console.error);
