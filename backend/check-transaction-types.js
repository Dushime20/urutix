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

async function check() {
  await AppDataSource.initialize();
  
  // Check constraint definition
  const constraint = await AppDataSource.query(`
    SELECT pg_get_constraintdef(oid) as def 
    FROM pg_constraint 
    WHERE conname = 'chk_transaction_type'
  `);
  
  console.log('Transaction type constraint:', constraint[0]?.def);
  
  // Check existing transaction types
  const types = await AppDataSource.query(`
    SELECT DISTINCT type FROM credit_transactions
  `);
  
  console.log('Existing transaction types:', types.map(t => t.type));
  
  await AppDataSource.destroy();
}

check();
