require('dotenv').config();
const { DataSource } = require('typeorm');
const fs = require('fs');
const path = require('path');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix_db',
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected!');

    const migrationPath = path.join(__dirname, 'migrations', '032_add_parent_subscription_id_to_plans.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 032_add_parent_subscription_id_to_plans.sql');
    await AppDataSource.query(sql);
    console.log('Migration completed successfully!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
