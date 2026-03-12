const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTruckOwnerAccounts() {
  try {
    console.log('=== CHECKING TRUCK OWNER CREDIT ACCOUNTS ===');
    
    // Get tenant ID for our admin
    const adminResult = await pool.query(`
      SELECT u."tenantId"
      FROM users u 
      WHERE u.email = 'deborahrutagengwa.admin@urutix.com'
    `);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const tenantId = adminResult.rows[0].tenantId;
    console.log('✅ Tenant ID:', tenantId);
    
    // Get truck owners for this tenant
    const truckOwnersResult = await pool.query(`
      SELECT u.id, u.email, u."tenantId", u.role, u.status,
             up."firstName", up."lastName", up."companyName"
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE u."tenantId" = $1 AND u.role = 'TRUCK_OWNER'
      ORDER BY u."createdAt" DESC
    `, [tenantId]);
    
    console.log('\n=== TRUCK OWNERS IN TENANT ===');
    console.log('Found', truckOwnersResult.rows.length, 'truck owners');
    
    truckOwnersResult.rows.forEach(owner => {
      console.log(`- ${owner.email} (${owner.firstName} ${owner.lastName})`);
      console.log(`  ID: ${owner.id}`);
      console.log(`  Status: ${owner.status}`);
      console.log(`  Company: ${owner.companyName}`);
      console.log('');
    });
    
    // Check credit accounts using correct column names
    console.log('=== CHECKING CREDIT ACCOUNTS (using snake_case) ===');
    
    for (const owner of truckOwnersResult.rows) {
      const creditResult = await pool.query(`
        SELECT ca.id, ca.tenant_id, ca.user_id, ca.current_balance,
               ca.purchased_credits, ca.bonus_credits, ca.subscription_credits,
               ca.lifetime_earned, ca.lifetime_spent
        FROM credit_accounts ca
        WHERE ca.tenant_id = $1 AND ca.user_id = $2
      `, [tenantId, owner.id]);
      
      console.log(`Credit account for ${owner.email}:`);
      if (creditResult.rows.length === 0) {
        console.log('  ❌ No credit account found');
        
        // Create a credit account for this user
        console.log('  🔧 Creating credit account...');
        try {
          const createResult = await pool.query(`
            INSERT INTO credit_accounts (
              id, tenant_id, user_id, current_balance, subscription_credits,
              purchased_credits, bonus_credits, lifetime_earned, lifetime_spent,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, 0, 0, 0, 0, 0, 0, NOW(), NOW()
            ) RETURNING id, current_balance
          `, [tenantId, owner.id]);
          
          console.log('  ✅ Credit account created:', createResult.rows[0].id);
          console.log('  ✅ Initial balance:', createResult.rows[0].current_balance);
        } catch (createError) {
          console.log('  ❌ Failed to create account:', createError.message);
        }
      } else {
        const account = creditResult.rows[0];
        console.log('  ✅ Account ID:', account.id);
        console.log('  ✅ Current Balance:', account.current_balance);
        console.log('  ✅ Purchased Credits:', account.purchased_credits);
        console.log('  ✅ Bonus Credits:', account.bonus_credits);
        console.log('  ✅ Subscription Credits:', account.subscription_credits);
        console.log('  ✅ Lifetime Earned:', account.lifetime_earned);
        console.log('  ✅ Lifetime Spent:', account.lifetime_spent);
      }
      console.log('');
    }
    
    // Now test what the API endpoint should return
    console.log('=== TESTING API ENDPOINT SIMULATION ===');
    
    // This simulates what the backend API should return
    const apiSimulation = await pool.query(`
      SELECT 
        ca.id,
        ca.tenant_id as "tenantId",
        ca.user_id as "userId", 
        ca.current_balance as "currentBalance",
        ca.purchased_credits as "purchasedCredits",
        ca.bonus_credits as "bonusCredits",
        ca.subscription_credits as "subscriptionCredits",
        u.id as "user_id",
        u.email as "user_email",
        u.phone as "user_phone",
        u.status as "user_status",
        u."createdAt" as "user_createdAt",
        u."lastLoginAt" as "user_lastLoginAt",
        up."firstName" as "profile_firstName",
        up."lastName" as "profile_lastName",
        up."companyName" as "profile_companyName"
      FROM credit_accounts ca
      JOIN users u ON ca.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE ca.tenant_id = $1 AND u.role = 'TRUCK_OWNER'
      ORDER BY u."createdAt" DESC
    `, [tenantId]);
    
    console.log('API would return', apiSimulation.rows.length, 'truck owner balances');
    
    if (apiSimulation.rows.length > 0) {
      console.log('\n✅ Expected frontend display:');
      console.log('- Total Truck Owners:', apiSimulation.rows.length);
      console.log('- Active Owners:', apiSimulation.rows.filter(u => u.user_status === 'ACTIVE').length);
      console.log('- Credits Distributed:', apiSimulation.rows.reduce((sum, u) => sum + u.currentBalance, 0));
      
      console.log('\nTruck owners that should appear:');
      apiSimulation.rows.forEach(owner => {
        console.log(`- ${owner.profile_firstName} ${owner.profile_lastName} (${owner.user_email})`);
        console.log(`  Balance: ${owner.currentBalance} credits`);
        console.log(`  Status: ${owner.user_status}`);
        console.log(`  Company: ${owner.profile_companyName}`);
        console.log('');
      });
    } else {
      console.log('❌ API will still return empty - there might be an issue with the backend service');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTruckOwnerAccounts();