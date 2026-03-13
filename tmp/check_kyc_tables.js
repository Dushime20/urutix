const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read backend/.env manually
const envPath = path.join(__dirname, 'backend', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
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
    
    for (const table of tables) {
      const res = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      console.log(`Table ${table}: ${res.rows[0].exists ? 'EXISTS' : 'MISSING'}`);
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkKycTables();
