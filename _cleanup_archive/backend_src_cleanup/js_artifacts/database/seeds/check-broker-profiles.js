const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkBrokerProfiles() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check all user_profiles for brokers
    console.log('🔍 Checking all user_profiles for brokers...');
    const allProfiles = await client.query(`
      SELECT 
        "profile"."id",
        "profile"."userId",
        "profile"."firstName",
        "profile"."lastName",
        "profile"."companyName",
        "profile"."deleted_at",
        "user"."email",
        "user"."role"
      FROM "user_profiles" "profile"
      INNER JOIN "users" "user" ON "user"."id" = "profile"."userId"
      WHERE "user"."role" = 'BROKER'
      ORDER BY "user"."email"
    `);

    console.log(`Total profiles found: ${allProfiles.rows.length}\n`);

    if (allProfiles.rows.length > 0) {
      allProfiles.rows.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.email}`);
        console.log(`   Profile ID: ${profile.id}`);
        console.log(`   User ID: ${profile.userId}`);
        console.log(`   First Name: ${profile.firstName || 'NULL'}`);
        console.log(`   Last Name: ${profile.lastName || 'NULL'}`);
        console.log(`   Company: ${profile.companyName || 'NULL'}`);
        console.log(`   Deleted: ${profile.deleted_at ? 'YES' : 'NO'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No profiles found for brokers!\n');
    }

    // Check brokers and their profiles with LEFT JOIN
    console.log('🔍 Checking brokers with LEFT JOIN to profiles...');
    const brokersWithProfiles = await client.query(`
      SELECT 
        "user"."id" AS "user_id",
        "user"."email",
        "profile"."id" AS "profile_id",
        "profile"."firstName",
        "profile"."lastName",
        "profile"."companyName",
        "profile"."deleted_at" AS "profile_deleted"
      FROM "users" "user"
      LEFT JOIN "user_profiles" "profile" ON "profile"."userId" = "user"."id"
      WHERE "user"."role" = 'BROKER'
        AND "user"."deleted_at" IS NULL
      ORDER BY "user"."email"
    `);

    console.log(`\nBrokers found: ${brokersWithProfiles.rows.length}`);
    brokersWithProfiles.rows.forEach((broker, index) => {
      console.log(`\n${index + 1}. ${broker.email}`);
      console.log(`   User ID: ${broker.user_id}`);
      console.log(`   Profile ID: ${broker.profile_id || 'NULL'}`);
      if (broker.profile_id) {
        console.log(`   First Name: ${broker.firstName || 'NULL'}`);
        console.log(`   Last Name: ${broker.lastName || 'NULL'}`);
        console.log(`   Company: ${broker.companyName || 'NULL'}`);
        console.log(`   Profile Deleted: ${broker.profile_deleted ? 'YES' : 'NO'}`);
      } else {
        console.log(`   ⚠️  NO PROFILE EXISTS`);
      }
    });

    // Check the join column name
    console.log('\n\n🔍 Checking user_profiles table structure...');
    const tableInfo = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_profiles'
        AND column_name IN ('userId', 'user_id', 'id')
      ORDER BY column_name
    `);

    console.log('Relevant columns:');
    tableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

checkBrokerProfiles();

