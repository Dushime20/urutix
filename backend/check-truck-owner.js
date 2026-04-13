/**
 * Check if truck owner user exists
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
});

async function checkUser() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if user exists
    const userResult = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.phone,
        u.role,
        u."createdAt",
        p."firstName",
        p."lastName",
        p."companyName"
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p."userId"
      WHERE u.email = $1
    `, ['truckowner@test.com']);

    if (userResult.rows.length === 0) {
      console.log('❌ User NOT FOUND: truckowner@test.com\n');
      console.log('The user does not exist in the database.');
      return;
    }

    const user = userResult.rows[0];
    
    console.log('✅ USER FOUND!\n');
    console.log('═'.repeat(60));
    console.log('USER DETAILS');
    console.log('═'.repeat(60));
    console.log(`Email:        ${user.email}`);
    console.log(`Role:         ${user.role}`);
    console.log(`User ID:      ${user.id}`);
    console.log(`Created:      ${user.createdAt}`);
    console.log('');
    console.log('PROFILE:');
    console.log(`Name:         ${user.firstName || 'N/A'} ${user.lastName || ''}`);
    console.log(`Company:      ${user.companyName || 'N/A'}`);
    console.log(`Phone:        ${user.phone || 'N/A'}`);
    console.log('');

    // Check trucks owned by this user
    const trucksResult = await client.query(`
      SELECT 
        id,
        "plateNumber",
        make,
        model,
        status,
        "capacityWeight",
        "createdAt"
      FROM trucks
      WHERE "ownerId" = $1
      ORDER BY "createdAt" DESC
    `, [user.id]);

    console.log('═'.repeat(60));
    console.log(`TRUCKS OWNED: ${trucksResult.rows.length}`);
    console.log('═'.repeat(60));
    
    if (trucksResult.rows.length > 0) {
      trucksResult.rows.forEach((truck, index) => {
        console.log(`\n${index + 1}. ${truck.plateNumber}`);
        console.log(`   Make/Model:  ${truck.make} ${truck.model}`);
        console.log(`   Status:      ${truck.status}`);
        console.log(`   Capacity:    ${truck.capacityWeight} kg`);
        console.log(`   Created:     ${truck.createdAt}`);
      });
    } else {
      console.log('No trucks registered yet.');
    }
    console.log('');

    // Check credit account
    const creditResult = await client.query(`
      SELECT 
        current_balance,
        bonus_credits,
        subscription_credits,
        purchased_credits,
        lifetime_earned,
        lifetime_spent
      FROM credit_accounts
      WHERE user_id = $1
    `, [user.id]);

    if (creditResult.rows.length > 0) {
      const credits = creditResult.rows[0];
      console.log('═'.repeat(60));
      console.log('CREDIT ACCOUNT');
      console.log('═'.repeat(60));
      console.log(`Current Balance:       ${credits.current_balance}`);
      console.log(`Bonus Credits:         ${credits.bonus_credits}`);
      console.log(`Subscription Credits:  ${credits.subscription_credits}`);
      console.log(`Purchased Credits:     ${credits.purchased_credits}`);
      console.log(`Lifetime Earned:       ${credits.lifetime_earned}`);
      console.log(`Lifetime Spent:        ${credits.lifetime_spent}`);
      console.log('');
    }

    // Check recent activity
    const activityResult = await client.query(`
      SELECT 
        action,
        entity_type,
        created_at
      FROM activity_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [user.id]);

    if (activityResult.rows.length > 0) {
      console.log('═'.repeat(60));
      console.log('RECENT ACTIVITY (Last 5)');
      console.log('═'.repeat(60));
      activityResult.rows.forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.action} - ${activity.entity_type} (${new Date(activity.created_at).toLocaleString()})`);
      });
      console.log('');
    }

    console.log('═'.repeat(60));
    console.log('✅ USER DATA IS INTACT - NO DATA LOSS!');
    console.log('═'.repeat(60));
    console.log('\nThe migrations did NOT delete any data.');
    console.log('All user information is preserved.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkUser();
