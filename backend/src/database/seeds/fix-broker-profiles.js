const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function fixBrokerProfiles() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all brokers without profiles
    console.log('🔍 Finding brokers without profiles...');
    const brokersWithoutProfiles = await client.query(`
      SELECT 
        "user"."id",
        "user"."email",
        "user"."tenantId"
      FROM "users" "user"
      LEFT JOIN "user_profiles" "profile" ON "profile"."user_id" = "user"."id" AND ("profile"."deleted_at" IS NULL)
      WHERE "user"."role" = 'BROKER'
        AND "user"."deleted_at" IS NULL
        AND "profile"."id" IS NULL
    `);

    console.log(`Found ${brokersWithoutProfiles.rows.length} brokers without profiles\n`);

    if (brokersWithoutProfiles.rows.length === 0) {
      console.log('✅ All brokers already have profiles!');
      await client.end();
      return;
    }

    // Create profiles for each broker
    for (const broker of brokersWithoutProfiles.rows) {
      const emailParts = broker.email.split('@');
      const brokerNumber = emailParts[0].replace('broker', '');
      const firstName = `Broker${brokerNumber}`;
      const lastName = 'User';
      const companyName = `Broker ${brokerNumber} Company`;

      console.log(`Creating profile for ${broker.email}...`);

      try {
        await client.query(`
          INSERT INTO "user_profiles" (
            "id",
            "userId",
            "tenantId",
            "firstName",
            "lastName",
            "companyName",
            "createdAt",
            "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            $5,
            NOW(),
            NOW()
          )
        `, [
          broker.id,
          broker.tenantId,
          firstName,
          lastName,
          companyName,
        ]);

        console.log(`  ✅ Created profile: ${firstName} ${lastName} (${companyName})`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`  ⚠️  Profile already exists for ${broker.email}`);
        } else {
          console.error(`  ❌ Error creating profile for ${broker.email}:`, error.message);
        }
      }
    }

    // Verify profiles were created
    console.log('\n🔍 Verifying profiles...');
    const brokersWithProfiles = await client.query(`
      SELECT 
        "user"."id",
        "user"."email",
        "profile"."firstName",
        "profile"."lastName",
        "profile"."companyName"
      FROM "users" "user"
      INNER JOIN "user_profiles" "profile" ON "profile"."user_id" = "user"."id" AND ("profile"."deleted_at" IS NULL)
      WHERE "user"."role" = 'BROKER'
        AND "user"."deleted_at" IS NULL
    `);

    console.log(`\n✅ Total brokers with profiles: ${brokersWithProfiles.rows.length}`);
    brokersWithProfiles.rows.forEach((broker, index) => {
      const name = broker.firstName && broker.lastName 
        ? `${broker.firstName} ${broker.lastName}` 
        : broker.companyName || broker.email;
      console.log(`${index + 1}. ${name} (${broker.email})`);
    });

    console.log('\n✅ Broker profiles fixed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

fixBrokerProfiles();

