const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
});

const config = {
  host: env.DB_HOST || '127.0.0.1',
  port: parseInt(env.DB_PORT || '5433', 10),
  user: env.DB_USERNAME || 'postgres',
  password: env.DB_PASSWORD || '123',
  database: env.DB_NAME || 'urutix',
};

async function checkKycTables() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    const tables = [
      'user_profiles',
      'user_kyc_documents',
      'kyc_role_requirements',
      'user_kyc_audit_log'
    ];
    
    const missing = [];
    for (const table of tables) {
      const res = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1);`, [table]);
      if (!res.rows[0].exists) missing.push(table);
    }
    if (missing.length > 0) console.log('MISSING TABLES:', missing.join(', '));
    else console.log('ALL KYC TABLES EXIST');
    
    // Also check for columns in user_profiles
    if (true) {
      const res = await client.query(`
        SELECT enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'users_role_enum' AND enumlabel IN ('BROKER', 'LENDER')
      `);
      console.log('Roles found:', res.rows.map(r => r.enumlabel).join(', '));
    }

    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkKycTables();
