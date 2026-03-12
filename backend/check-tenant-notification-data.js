const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '123',
  database: 'urutix'
});

async function checkTenantData() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const tenantId = 'b7d244e3-9a1a-4686-a22f-3fe18468500e';
    const userId = '74841538-f58c-4670-a1a6-a53893677985';
    
    console.log('Checking data for:');
    console.log('  Tenant ID:', tenantId);
    console.log('  User ID:', userId);
    
    // Check if tenant exists
    const tenantExists = await client.query('SELECT id, name FROM tenants WHERE id = $1', [tenantId]);
    console.log('\nTenant exists:', tenantExists.rows.length > 0);
    if (tenantExists.rows.length > 0) {
      console.log('  Tenant name:', tenantExists.rows[0].name);
    }
    
    // Check if user exists
    const userExists = await client.query('SELECT id, email, role FROM users WHERE id = $1', [userId]);
    console.log('\nUser exists:', userExists.rows.length > 0);
    if (userExists.rows.length > 0) {
      console.log('  User email:', userExists.rows[0].email);
      console.log('  User role:', userExists.rows[0].role);
    }
    
    // Check notification preferences for this tenant
    console.log('\n📋 Notification preferences for tenant:');
    const tenantPrefs = await client.query(`
      SELECT id, tenant_id, user_id, notification_type, enabled_channels, is_enabled
      FROM notification_preferences 
      WHERE tenant_id = $1
      ORDER BY notification_type
    `, [tenantId]);
    
    console.log('  Count:', tenantPrefs.rows.length);
    tenantPrefs.rows.forEach(pref => {
      console.log(`    ${pref.notification_type}: enabled=${pref.is_enabled}, channels=${pref.enabled_channels}, user_id=${pref.user_id || 'NULL'}`);
    });
    
    // Check if there are any preferences for this specific user
    console.log('\n📋 Notification preferences for user:');
    const userPrefs = await client.query(`
      SELECT id, tenant_id, user_id, notification_type, enabled_channels, is_enabled
      FROM notification_preferences 
      WHERE tenant_id = $1 AND user_id = $2
      ORDER BY notification_type
    `, [tenantId, userId]);
    
    console.log('  Count:', userPrefs.rows.length);
    userPrefs.rows.forEach(pref => {
      console.log(`    ${pref.notification_type}: enabled=${pref.is_enabled}, channels=${pref.enabled_channels}`);
    });
    
    // Test the exact query that the controller would run
    console.log('\n🔍 Testing controller query (tenant-level for TENANT_ADMIN):');
    try {
      const controllerQuery = await client.query(`
        SELECT * FROM notification_preferences 
        WHERE tenant_id = $1 AND user_id IS NULL
        ORDER BY notification_type ASC
      `, [tenantId]);
      
      console.log('  Query successful, rows:', controllerQuery.rows.length);
      controllerQuery.rows.forEach(row => {
        console.log(`    ${row.notification_type}: ${row.enabled_channels}`);
      });
    } catch (error) {
      console.log('  Query failed:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTenantData();