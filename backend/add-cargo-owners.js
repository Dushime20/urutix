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
    console.log('\n=== CREATING CARGO OWNERS AND CARGO ===\n');

    try {
        // 1. Create Cargo Owners
        console.log('Creating cargo owners...\n');
        const cargoOwners = [
            { email: 'cargoowner1@demo.com', password: 'CargoOwner123!' },
            { email: 'cargoowner2@demo.com', password: 'CargoOwner123!' }
        ];

        const createdCargoOwners = [];
        for (const owner of cargoOwners) {
            const hashedPassword = await bcrypt.hash(owner.password, 10);
            try {
                const result = await d.query(`
                    INSERT INTO users (email, "passwordHash", role, "tenantId", status, "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                    RETURNING id, email
                `, [owner.email, hashedPassword, 'CARGO_OWNER', TENANT_ID, 'ACTIVE']);
                
                createdCargoOwners.push(result[0]);
                console.log(`✓ Cargo Owner: ${result[0].email}`);
            } catch (err) {
                if (err.code === '23505') {
                    console.log(`  ${owner.email} already exists, fetching...`);
                    const existing = await d.query(`SELECT id, email FROM users WHERE email = $1`, [owner.email]);
                    createdCargoOwners.push(existing[0]);
                } else {
                    throw err;
                }
            }
        }
        console.log('');

        // 2. Create Cargo for each cargo owner
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

        // 3. Summary
        console.log('=== SETUP COMPLETE ===\n');
        console.log('Summary:');
        console.log(`- ${createdCargoOwners.length} cargo owners created`);
        console.log(`- 5 cargo items created total\n`);
        
        console.log('Credentials:');
        console.log('Cargo Owner 1: cargoowner1@demo.com / CargoOwner123!');
        console.log('Cargo Owner 2: cargoowner2@demo.com / CargoOwner123!\n');
        
        console.log('Note: Trucks can be added through the UI by truck owners.');
        console.log('Existing truck owners: truckowner1-5@demo.com (password: TruckOwner123!)\n');

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
        throw error;
    } finally {
        await d.destroy();
    }
}

setup().catch(console.error);
