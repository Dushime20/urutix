const { Pool } = require('pg');
const pool = new Pool({ 
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: '1234',
  database: 'urutix'
});

(async () => {
  try {
    // Get tenant-level account (userId IS NULL)
    const result = await pool.query(`
      SELECT * FROM credit_accounts 
      WHERE tenant_id = '3174d68f-cb7d-4428-b578-e931d1a3f464' 
      AND user_id IS NULL
    `);
    
    console.log('Tenant-level account:', JSON.stringify(result.rows, null, 2));
    
    // Get user-level account
    const userResult = await pool.query(`
      SELECT * FROM credit_accounts 
      WHERE tenant_id = '3174d68f-cb7d-4428-b578-e931d1a3f464' 
      AND user_id = '007eb9d5-a71b-42be-8c9e-1c968dd97c71'
    `);
    
    console.log('\nTenant Admin user account:', JSON.stringify(userResult.rows, null, 2));
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
