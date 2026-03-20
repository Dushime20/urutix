import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function addBackDates() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'urutix',
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Step 1: Add back the date columns
    console.log('\n🔧 Step 1: Adding back pickup and delivery date columns...');
    await dataSource.query(
      `ALTER TABLE "loads" ADD COLUMN IF NOT EXISTS "pickupDate" TIMESTAMP WITH TIME ZONE`,
    );
    await dataSource.query(
      `ALTER TABLE "loads" ADD COLUMN IF NOT EXISTS "deliveryDate" TIMESTAMP WITH TIME ZONE`,
    );
    console.log('✅ Date columns added');

    // Step 2: Populate dates from locations data
    console.log('\n🔧 Step 2: Populating dates from locations data...');
    await dataSource.query(`
      UPDATE "loads" 
      SET 
        "pickupDate" = ("locations"->0->>'scheduledDate')::TIMESTAMP WITH TIME ZONE,
        "deliveryDate" = ("locations"->1->>'scheduledDate')::TIMESTAMP WITH TIME ZONE
      WHERE 
        jsonb_array_length(locations) >= 2 
        AND ("locations"->0->>'type') = 'PICKUP'
        AND ("locations"->1->>'type') = 'DELIVERY'
    `);
    console.log('✅ Dates populated from locations');

    // Step 3: Create index on pickupDate for truck matching
    console.log(
      '\n🔧 Step 3: Creating index on pickupDate for truck matching...',
    );
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_loads_pickup_date" ON "loads" USING btree ("pickupDate")`,
    );
    console.log('✅ Index created on pickupDate');

    // Step 4: Verify the changes
    console.log('\n🔍 Verifying changes...');
    const tableInfo = await dataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'loads' AND column_name IN ('pickupDate', 'deliveryDate')
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Date columns in loads table:');
    tableInfo.forEach((col: any) => {
      console.log(
        `   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`,
      );
    });

    // Show sample data with dates
    const sampleData = await dataSource.query(`
      SELECT 
        id, 
        title, 
        "pickupDate",
        "deliveryDate",
        jsonb_array_length(locations) as location_count
      FROM loads 
      LIMIT 3
    `);

    console.log('\n📊 Sample data with dates:');
    sampleData.forEach((row: any) => {
      console.log(`   - ID: ${row.id}, Title: ${row.title}`);
      console.log(
        `     Pickup: ${row.pickupDate}, Delivery: ${row.deliveryDate}`,
      );
      console.log(`     Locations: ${row.location_count}`);
    });

    console.log('\n🎉 Date columns successfully added back!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await dataSource.destroy();
  }
}

addBackDates();
