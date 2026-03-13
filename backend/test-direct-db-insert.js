const { Client } = require('pg');

async function testDirectDbInsert() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: '123',
    database: 'urutix'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    const tenantId = 'f31e73f2-2c65-4b6c-b6f1-f9d11550012d';
    const testEmail = 'direct.db.test@example.com';
    
    // First, check if user already exists and delete if so
    await client.query('DELETE FROM users WHERE email = $1', [testEmail]);
    console.log('🧹 Cleaned up any existing test user');
    
    // Try to insert a user directly into the database with null passwordHash
    console.log('📝 Inserting user with null passwordHash...');
    
    const insertResult = await client.query(`
      INSERT INTO users (
        "tenantId", 
        email, 
        "passwordHash", 
        role, 
        status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, role, status, "passwordHash"
    `, [
      tenantId,
      testEmail,
      null, // This should now work since we made it nullable
      'TRUCK_OWNER',
      'PENDING_VERIFICATION'
    ]);
    
    if (insertResult.rows.length > 0) {
      const user = insertResult.rows[0];
      console.log('✅ SUCCESS: User inserted successfully!');
      console.log('User details:', {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        passwordHash: user.passwordHash
      });
      
      // Now try to insert a user profile
      console.log('\n📝 Inserting user profile...');
      const profileResult = await client.query(`
        INSERT INTO user_profiles (
          "userId",
          "tenantId",
          "firstName",
          "lastName"
        ) VALUES ($1, $2, $3, $4)
        RETURNING id, "firstName", "lastName"
      `, [
        user.id,
        tenantId,
        'Direct',
        'Test'
      ]);
      
      if (profileResult.rows.length > 0) {
        console.log('✅ SUCCESS: User profile inserted successfully!');
        console.log('Profile details:', profileResult.rows[0]);
        
        console.log('\n🎉 Both user and profile creation work at database level!');
        console.log('💡 The issue is likely in the service logic or backend needs restart');
      }
    }
    
  } catch (error) {
    console.error('❌ Direct database insert failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await client.end();
  }
}

testDirectDbInsert();