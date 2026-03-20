const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix'
});

const USER_ID = '21664d5c-3532-4e37-8d70-2510dbed7104';

async function checkTenant() {
  try {
    await client.connect();
    
    const userRes = await client.query('SELECT id, "tenantId", email FROM users WHERE id = $1', [USER_ID]);
    const user = userRes.rows[0];
    if (user) {
      console.log(`User TenantID: ${user.tenantId}`);
      
      const driverRes = await client.query('SELECT id, "tenantId", "userId", email FROM drivers WHERE email ILIKE $1 OR "userId" = $2', [user.email, USER_ID]);
      if (driverRes.rows.length > 0) {
        driverRes.rows.forEach(d => {
          console.log(`Driver ID: ${d.id}`);
          console.log(`Driver TenantID: ${d.tenantId}`);
          console.log(`Match? ${d.tenantId === user.tenantId}`);
        });
      } else {
        console.log('No driver found');
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkTenant();
