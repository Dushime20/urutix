const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

const pool = new Pool(dbConfig);

async function alignTenants() {
  try {
    // 1. Get Cargo Owner Tenant
    const coRes = await pool.query("SELECT id, \"tenantId\" FROM users WHERE email = 'uruticargo@gmail.com'");
    if (coRes.rows.length === 0) {
        console.log("Cargo owner not found");
        return;
    }
    const cargoOwner = coRes.rows[0];
    console.log(`Cargo Owner Tenant: ${cargoOwner.tenantId}`);

    // 2. Get Broker
    const brokerRes = await pool.query("SELECT id, \"tenantId\" FROM users WHERE email = 'broker1@test.com'");
    if (brokerRes.rows.length === 0) {
        console.log("Broker not found");
        return;
    }
    const broker = brokerRes.rows[0];
    console.log(`Broker Tenant (Before): ${broker.tenantId}`);

    // 3. Update Broker to match Cargo Owner Tenant
    if (broker.tenantId !== cargoOwner.tenantId) {
        await pool.query('UPDATE users SET "tenantId" = $1 WHERE id = $2', [cargoOwner.tenantId, broker.id]);
        await pool.query('UPDATE user_profiles SET "tenantId" = $1 WHERE "userId" = $2', [cargoOwner.tenantId, broker.id]);
        console.log(`Updated Broker to Tenant: ${cargoOwner.tenantId}`);
    } else {
        console.log("Tenants already match.");
    }

    // 4. Update Broker's Loads to match Cargo Owner Tenant
    // This ensures consistency for the loads we seeded/moved earlier
    const loadUpdate = await pool.query('UPDATE loads SET "tenantId" = $1 WHERE "brokerId" = $2', [cargoOwner.tenantId, broker.id]);
    console.log(`Updated ${loadUpdate.rowCount} broker loads to new Tenant.`);

    // 5. Update Trucks too (for the matching demo)
    // We seeded "transporter1@test.com" and trucks in the *old* broker tenant (from check-trucks/seed-matching-trucks).
    // Use a subquery to find trucks created by our seed script logic (or just update based on the owner we made)
    
    // Find the transporter we created in the previous step (transporter1@test.com)
    const transRes = await pool.query("SELECT id FROM users WHERE email = 'transporter1@test.com'");
    if (transRes.rows.length > 0) {
         const transId = transRes.rows[0].id;
         await pool.query('UPDATE users SET "tenantId" = $1 WHERE id = $2', [cargoOwner.tenantId, transId]);
         await pool.query('UPDATE user_profiles SET "tenantId" = $1 WHERE "userId" = $2', [cargoOwner.tenantId, transId]);
         await pool.query('UPDATE trucks SET "tenantId" = $1 WHERE "ownerId" = $2', [cargoOwner.tenantId, transId]);
         console.log("Updated Transporter and Trucks to new Tenant.");
    }


  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

alignTenants();
