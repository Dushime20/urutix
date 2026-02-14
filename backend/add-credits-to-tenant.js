const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix_db',
});

async function addCredits() {
  await AppDataSource.initialize();
  await AppDataSource.query(`
    UPDATE credit_accounts 
    SET current_balance = 1000, 
        purchased_credits = 1000,
        lifetime_spent = 0
    WHERE tenant_id = '4a49a3c2-e0f7-47ad-aec5-1c7f62455fb4'
  `);
  console.log('✅ Added 1000 credits to Demo Tenant B');
  await AppDataSource.destroy();
}

addCredits();
