require('dotenv').config();
const { DataSource } = require('typeorm');
const d = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
d.initialize().then(async () => {
    console.log('\n=== USERS IN DEMO TENANT ===\n');
    const users = await d.query(`
        SELECT id, email, role, status 
        FROM users 
        WHERE "tenantId" = '3174d68f-cb7d-4428-b578-e931d1a3f464'
        ORDER BY role, email
    `);
    users.forEach(u => {
        console.log(`${u.role.padEnd(15)} | ${u.email.padEnd(40)} | Status: ${u.status}`);
        console.log(`ID: ${u.id}\n`);
    });

    console.log('\n=== TRUCKS ===\n');
    const trucks = await d.query(`
        SELECT id, "licensePlate", "ownerId", status 
        FROM trucks 
        WHERE "tenantId" = '3174d68f-cb7d-4428-b578-e931d1a3f464' AND "deletedAt" IS NULL
    `);
    if (trucks.length === 0) console.log('No trucks found\n');
    else trucks.forEach(t => console.log(`${t.licensePlate} | Owner: ${t.ownerId || 'None'} | Status: ${t.status}\n`));

    console.log('\n=== CARGO ===\n');
    const cargo = await d.query(`
        SELECT id, "cargoType", origin, destination, "ownerId", status 
        FROM cargo 
        WHERE "tenantId" = '3174d68f-cb7d-4428-b578-e931d1a3f464' AND "deletedAt" IS NULL
        LIMIT 10
    `);
    if (cargo.length === 0) console.log('No cargo found\n');
    else cargo.forEach(c => console.log(`${c.cargoType} | ${c.origin} → ${c.destination} | Owner: ${c.ownerId || 'None'}\n`));
}).catch(console.error).finally(() => process.exit());

