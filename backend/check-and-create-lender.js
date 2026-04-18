// Script to check if lender exists and create if needed
const { Client } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const lenderId = '8419dc5a-7efd-49d6-af6a-6775e8f13d26';

async function checkAndCreateLender() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if lender exists
    const checkResult = await client.query(
      'SELECT id, name, status, contact_email FROM lenders WHERE id = $1',
      [lenderId]
    );

    if (checkResult.rows.length > 0) {
      console.log('\n✅ Lender exists:');
      console.log(checkResult.rows[0]);
    } else {
      console.log('\n❌ Lender does not exist. Creating...');
      
      // Generate a simple API key hash (in production, use bcrypt)
      const apiKey = crypto.randomBytes(32).toString('hex');
      const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      // Create the lender
      const insertResult = await client.query(
        `INSERT INTO lenders (id, name, status, contact_email, api_key_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, name, status, contact_email`,
        [lenderId, 'Default Lender', 'active', 'lender@example.com', apiKeyHash]
      );

      console.log('\n✅ Lender created:');
      console.log(insertResult.rows[0]);
      console.log(`\n🔑 API Key (save this): ${apiKey}`);
    }

    // Check if there are any policies for this lender
    console.log('\n📊 Checking existing policies...');
    
    const tables = [
      'lending_policy_interest_rates',
      'lending_policy_loan_limits',
      'lending_policy_eligibility',
      'lending_policy_risk_assessment',
      'lending_policy_repayment',
      'lending_policy_cargo_types',
      'lending_policy_system_config'
    ];

    for (const table of tables) {
      const policyResult = await client.query(
        `SELECT COUNT(*) as count FROM ${table} WHERE lender_id = $1`,
        [lenderId]
      );
      console.log(`  ${table}: ${policyResult.rows[0].count} policies`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

checkAndCreateLender();
