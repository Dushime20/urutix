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

async function setup() {
    await d.initialize();
    console.log('\n=== ADDING TRUCKS AND CARGO ===\n');

    try {
        // 1. Get existing truck owners
        const truckOwners = await d.query(`
            SELECT id, email FROM users 
            WHERE "tenantId" = $1 AND role = 'TRUCK_OWNER'
            ORDER BY email
        `, [TENANT_ID]);

        console.log(`Found ${truckOwners.length} truck owners\n`);

        // 2. Add trucks to each truck owner
        console.log('Adding trucks to truck owners...\n');
        const trucksData = [
            { make: 'Volvo', model: 'FH16', year: 2022, capacity: 25000 },
            { make: 'Mercedes', model: 'Actros', year: 2021, capacity: 28000 },
            { make: 'Scania', model: 'R500', year: 2023, capacity: 26000 }
        ];

        for (let i = 0; i < truckOwners.length; i++) {
            const owner = truckOwners[i];
            const truck = trucksData[i % trucksData.length];
            const plate = `TRK-${String(i + 1).padStart(3, '0')}`;
            const vin = `VIN${Date.now()}${i}`.substring(0, 17);
            const regNumber = `REG-${String(i + 1).padStart(5, '0')}`;

            try {
                await d.query(`
                    INSERT INTO trucks (
                        "tenantId", "ownerId", "plateNumber", vin, "registrationNumber", make, model, year,
                        status, "capacityWeight", "capacityVolume", "truckType", "fuelType",
                        "isActive", "createdAt", "updatedAt"
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
                `, [TENANT_ID, owner.id, plate, vin, regNumber, truck.make, truck.model, truck.year, 'AVAILABLE', truck.capacity, 50, 'FLATBED', 'DIESEL', true]);
                
                console.log(`✓ ${plate} (${truck.make} ${truck.model}) → ${owner.email}`);
            } catch (err) {
                if (err.code === '23505') {
                    console.log(`  ${plate} already exists, skipping...`);
                } else {
                    throw err;
                }
            }
        }
        console.log('');

        // 3. Create Cargo Owners
        console.log('Creating cargo owners...\n');
        const cargoOwners = [
            { email: 'cargoowner1@demo.com', password: 'CargoOwner123!' },
            { email: 'cargoowner2@demo.com', password: 'CargoOwner123!' }
        ];

        const createdCargoOwners = [];
        for (const owner of cargoOwners) {
            const hashedPassword = await bcrypt.hash(owner.password, 10);
            const result = await d.query(`
                INSERT INTO users (email, password, role, "tenantId", status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE'
                RETURNING id, email
            `, [owner.email, hashedPassword, 'CARGO_OWNER', TENANT_ID, 'ACTIVE']);
            
            createdCargoOwners.push(result[0]);
            console.log(`✓ Cargo Owner: ${result[0].email}`);
        }
        console.log('');

        // 4. Create Cargo for each cargo owner
        console.log('Creating cargo...\n');
        const cargoData = [
            { type: 'Electronics', origin: 'Kigali', destination: 'Nairobi', weight: 5000 },
            { type: 'Textiles', origin: 'Kampala', destination: 'Dar es Salaam', weight: 8000 },
            { type: 'Food Products', origin: 'Mombasa', destination: 'Kigali', weight: 12000 },
            { type: 'Machinery', origin: 'Nairobi', destination: 'Kampala', weight: 15000 },
            { type: 'Construction Materials', origin: 'Dar es Salaam', destination: 'Kigali', weight: 20000 }
        ];

        for (let i = 0; i < createdCargoOwners.length; i++) {
            const owner = createdCargoOwners[i];
            // Each cargo owner gets 2-3 cargo items
            const numCargo = i === 0 ? 3 : 2;
            
            for (let j = 0; j < numCargo; j++) {
                const cargo = cargoData[(i * 3 + j) % cargoData.length];
                await d.query(`
                    INSERT INTO cargo (
                        "tenantId", "ownerId", "cargoType", origin, destination,
                        "weightKg", status, "createdAt", "updatedAt"
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                `, [TENANT_ID, owner.id, cargo.type, cargo.origin, cargo.destination, cargo.weight, 'PENDING']);
                
                console.log(`✓ ${cargo.type} (${cargo.origin} → ${cargo.destination}) → ${owner.email}`);
            }
        }
        console.log('');

        // 5. Summary
        console.log('=== SETUP COMPLETE ===\n');
        console.log('Summary:');
        console.log(`- ${truckOwners.length} truck owners with ${truckOwners.length} trucks`);
        console.log(`- ${createdCargoOwners.length} cargo owners with 5 cargo items total\n`);
        
        console.log('Credentials:');
        console.log('Cargo Owner 1: cargoowner1@demo.com / CargoOwner123!');
        console.log('Cargo Owner 2: cargoowner2@demo.com / CargoOwner123!\n');

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
        throw error;
    } finally {
        await d.destroy();
    }
}

setup().catch(console.error);
