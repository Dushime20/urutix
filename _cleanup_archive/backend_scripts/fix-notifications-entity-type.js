const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixNotificationsEntityType() {
  try {
    console.log('=== FIXING NOTIFICATIONS ENTITY TYPE CONSTRAINT ===');
    
    // Check the current schema of notifications table
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'entityType'
      ORDER BY ordinal_position
    `);
    
    console.log('Current entityType column schema:');
    schemaResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Make entityType nullable to fix the constraint issue
    console.log('\n🔧 Making entityType column nullable...');
    
    await pool.query(`
      ALTER TABLE notifications 
      ALTER COLUMN "entityType" DROP NOT NULL;
    `);
    
    console.log('✅ Successfully made entityType column nullable');
    
    // Check if there are any existing notifications with null entityType
    const nullEntityTypeCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE "entityType" IS NULL
    `);
    
    console.log(`\n📊 Notifications with null entityType: ${nullEntityTypeCount.rows[0].count}`);
    
    // Update any existing null entityType values to a default value
    if (nullEntityTypeCount.rows[0].count > 0) {
      console.log('🔧 Updating null entityType values to default...');
      
      const updateResult = await pool.query(`
        UPDATE notifications 
        SET "entityType" = 'SYSTEM'
        WHERE "entityType" IS NULL
      `);
      
      console.log(`✅ Updated ${updateResult.rowCount} notifications with default entityType`);
    }
    
    console.log('\n✅ Notifications table entityType constraint fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing notifications entityType:', error.message);
  } finally {
    await pool.end();
  }
}

fixNotificationsEntityType();