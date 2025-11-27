const { Client } = require('pg');
require('dotenv').config();

async function addColumns() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // List of columns to check and add
    const columnsToAdd = [
      { name: 'isArchived', type: 'BOOLEAN', default: 'false', nullable: 'NOT NULL' },
      { name: 'requiresAction', type: 'BOOLEAN', default: 'false', nullable: 'NOT NULL' },
      { name: 'isRead', type: 'BOOLEAN', default: 'false', nullable: 'NOT NULL' },
      { name: 'metadata', type: 'JSONB', default: "'{}'::jsonb", nullable: 'NOT NULL' },
    ];

    for (const column of columnsToAdd) {
      // Check if column exists
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = $1;
      `, [column.name]);

      if (checkResult.rows.length > 0) {
        console.log(`✅ ${column.name} column already exists`);
      } else {
        console.log(`🔧 Adding ${column.name} column to notifications table...`);
        await client.query(`
          ALTER TABLE notifications 
          ADD COLUMN "${column.name}" ${column.type} ${column.nullable} DEFAULT ${column.default};
        `);
        console.log(`✅ ${column.name} column added successfully!`);
      }
    }

    // Verify all columns
    const result = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name IN ('isArchived', 'requiresAction', 'isRead', 'metadata')
      ORDER BY column_name;
    `);

    console.log('\n✅ Column verification:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default}, nullable: ${row.is_nullable})`);
    });

    await client.end();
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    console.error('❌ Error details:', error);
    await client.end();
    process.exit(1);
  }
}

addColumns();

