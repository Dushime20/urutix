const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkBrokerData() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get tenant and user IDs from the query parameters
    const tenantId = 'f31e73f2-2c65-4b6c-b6f1-f9d11550012d';
    const cargoOwnerId = '6da40598-4cf1-4e1c-bc61-186ee76f2f45';

    // Run the COUNT query
    console.log('📊 Running COUNT query...');
    const countResult = await client.query(`
      SELECT COUNT(DISTINCT("load"."id")) AS "cnt" 
      FROM "loads" "load" 
      LEFT JOIN "users" "cargoOwner" ON "cargoOwner"."id"="load"."cargoOwnerId" AND ("cargoOwner"."deleted_at" IS NULL)  
      LEFT JOIN "user_profiles" "cargoOwnerProfile" ON "cargoOwnerProfile"."user_id"="cargoOwner"."id" AND ("cargoOwnerProfile"."deleted_at" IS NULL)  
      LEFT JOIN "users" "broker" ON "broker"."id"="load"."brokerId" AND ("broker"."deleted_at" IS NULL)  
      LEFT JOIN "user_profiles" "brokerProfile" ON "brokerProfile"."user_id"="broker"."id" AND ("brokerProfile"."deleted_at" IS NULL)  
      WHERE ( "load"."tenantId" = $1 AND "load"."cargoOwnerId" = $2 ) AND ( "load"."deleted_at" IS NULL )
    `, [tenantId, cargoOwnerId]);
    
    console.log(`Total loads: ${countResult.rows[0].cnt}\n`);

    // Check loads with brokers
    console.log('🔍 Checking loads with brokers assigned...');
    const loadsWithBrokers = await client.query(`
      SELECT 
        "load"."id",
        "load"."title",
        "load"."brokerId",
        "load"."brokerCommissionRate",
        "load"."brokerCommissionAmount",
        "broker"."id" AS "broker_user_id",
        "broker"."email" AS "broker_email",
        "brokerProfile"."firstName" AS "broker_firstName",
        "brokerProfile"."lastName" AS "broker_lastName",
        "brokerProfile"."companyName" AS "broker_companyName"
      FROM "loads" "load"
      LEFT JOIN "users" "broker" ON "broker"."id"="load"."brokerId" AND ("broker"."deleted_at" IS NULL)
      LEFT JOIN "user_profiles" "brokerProfile" ON "brokerProfile"."user_id"="broker"."id" AND ("brokerProfile"."deleted_at" IS NULL)
      WHERE "load"."tenantId" = $1 
        AND "load"."cargoOwnerId" = $2 
        AND "load"."deleted_at" IS NULL
        AND "load"."brokerId" IS NOT NULL
      ORDER BY "load"."createdAt" DESC
      LIMIT 10
    `, [tenantId, cargoOwnerId]);

    console.log(`\n📦 Loads with brokers assigned: ${loadsWithBrokers.rows.length}`);
    
    if (loadsWithBrokers.rows.length > 0) {
      console.log('\n✅ Broker Data Found:');
      loadsWithBrokers.rows.forEach((load, index) => {
        console.log(`\n${index + 1}. Load: ${load.title}`);
        console.log(`   Load ID: ${load.id}`);
        console.log(`   Broker ID: ${load.brokerId}`);
        console.log(`   Broker User ID: ${load.broker_user_id || 'NULL'}`);
        console.log(`   Broker Email: ${load.broker_email || 'NULL'}`);
        console.log(`   Broker Name: ${load.broker_firstName || ''} ${load.broker_lastName || ''}`.trim() || 'NULL');
        console.log(`   Broker Company: ${load.broker_companyName || 'NULL'}`);
        console.log(`   Commission Rate: ${load.brokerCommissionRate || 'NULL'}%`);
        console.log(`   Commission Amount: ${load.brokerCommissionAmount || 'NULL'}`);
      });
    } else {
      console.log('\n⚠️  No loads found with brokers assigned!');
      console.log('   → You need to assign brokers to loads first');
      console.log('   → Use the "Assign Broker" button on cargo cards');
    }

    // Check all loads for this user
    console.log('\n\n📋 All loads for this cargo owner:');
    const allLoads = await client.query(`
      SELECT 
        "load"."id",
        "load"."title",
        "load"."brokerId",
        "load"."status"
      FROM "loads" "load"
      WHERE "load"."tenantId" = $1 
        AND "load"."cargoOwnerId" = $2 
        AND "load"."deleted_at" IS NULL
      ORDER BY "load"."createdAt" DESC
      LIMIT 10
    `, [tenantId, cargoOwnerId]);

    console.log(`Total loads: ${allLoads.rows.length}`);
    allLoads.rows.forEach((load, index) => {
      console.log(`${index + 1}. ${load.title} (${load.status}) - BrokerId: ${load.brokerId || 'NULL'}`);
    });

    // Check available brokers
    console.log('\n\n👥 Available brokers in tenant:');
    const brokers = await client.query(`
      SELECT 
        "user"."id",
        "user"."email",
        "user"."role",
        "profile"."firstName",
        "profile"."lastName",
        "profile"."companyName"
      FROM "users" "user"
      LEFT JOIN "user_profiles" "profile" ON "profile"."user_id" = "user"."id" AND ("profile"."deleted_at" IS NULL)
      WHERE "user"."tenantId" = $1
        AND "user"."role" = 'BROKER'
        AND "user"."deleted_at" IS NULL
      LIMIT 10
    `, [tenantId]);

    console.log(`Available brokers: ${brokers.rows.length}`);
    brokers.rows.forEach((broker, index) => {
      const name = broker.firstName && broker.lastName 
        ? `${broker.firstName} ${broker.lastName}` 
        : broker.companyName || broker.email;
      console.log(`${index + 1}. ${name} (${broker.email})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

checkBrokerData();

