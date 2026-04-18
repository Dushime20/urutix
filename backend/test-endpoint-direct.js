// Direct database test to see what's happening
const { Client } = require('pg');
require('dotenv').config();

const lenderId = '8419dc5a-7efd-49d6-af6a-6775e8f13d26';

async function testDirectQuery() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Test each query that the service would run
    console.log('1. Testing lender validation...');
    const lenderResult = await client.query(
      'SELECT id, name, status FROM lenders WHERE id = $1',
      [lenderId]
    );
    console.log('Lender found:', lenderResult.rows[0]);

    console.log('\n2. Testing interest rates query...');
    const irResult = await client.query(
      'SELECT * FROM lending_policy_interest_rates WHERE lender_id = $1 LIMIT 1',
      [lenderId]
    );
    console.log('Interest rates count:', irResult.rows.length);
    console.log('Columns:', irResult.fields.map(f => f.name).join(', '));

    console.log('\n3. Testing loan limits query...');
    const llResult = await client.query(
      'SELECT * FROM lending_policy_loan_limits WHERE lender_id = $1 LIMIT 1',
      [lenderId]
    );
    console.log('Loan limits count:', llResult.rows.length);

    console.log('\n4. Testing eligibility query...');
    const elResult = await client.query(
      'SELECT * FROM lending_policy_eligibility WHERE lender_id = $1 LIMIT 1',
      [lenderId]
    );
    console.log('Eligibility count:', elResult.rows.length);

    console.log('\n5. Testing risk assessment query...');
    const raResult = await client.query(
      'SELECT * FROM lending_policy_risk_assessment WHERE lender_id = $1 LIMIT 1',
      [lenderId]
    );
    console.log('Risk assessment count:', raResult.rows.length);

    console.log('\n6. Testing repayment query...');
    const rpResult = await client.query(
      'SELECT * FROM lending_policy_repayment WHERE lender_id = $1 LIMIT 1',
      [lenderId]
    );
    console.log('Repayment count:', rpResult.rows.length);

    console.log('\n7. Testing cargo types query...');
    const ctResult = await client.query(
      'SELECT * FROM lending_policy_cargo_types WHERE lender_id = $1 LIMIT 1',
      [lenderId]
    );
    console.log('Cargo types count:', ctResult.rows.length);

    console.log('\n8. Testing system config query...');
    const scResult = await client.query(
      'SELECT * FROM lending_policy_system_config WHERE lender_id = $1 LIMIT 1',
      [lenderId]
    );
    console.log('System config count:', scResult.rows.length);

    console.log('\n✅ All queries executed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detail:', error.detail);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

testDirectQuery();
