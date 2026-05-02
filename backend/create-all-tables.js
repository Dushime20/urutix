/**
 * One-time script to create all tables from TypeORM entities
 * This should only be run once during initial deployment
 */

const { DataSource } = require('typeorm');
require('dotenv').config();

// Import all entities from the compiled dist
const entities = require('./dist/main.js');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function createAllTables() {
  log('\n' + '='.repeat(80), colors.cyan);
  log('CREATE ALL TABLES FROM ENTITIES', colors.cyan);
  log('='.repeat(80) + '\n', colors.cyan);
  
  const dbConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'urutix',
    synchronize: true, // ENABLE SYNCHRONIZE TO CREATE TABLES
    logging: false,
    entities: ['dist/**/*.entity.js'], // Load all entity files
  };
  
  log(`📊 Database: ${dbConfig.database}`, colors.cyan);
  log(`🖥️  Host: ${dbConfig.host}:${dbConfig.port}`, colors.cyan);
  log(`👤 User: ${dbConfig.username}\n`, colors.cyan);
  
  log('⚠️  This will create all tables from TypeORM entities', colors.yellow);
  log('⚠️  Synchronize is temporarily enabled\n', colors.yellow);
  
  const dataSource = new DataSource(dbConfig);
  
  try {
    log('🔌 Connecting to database...', colors.cyan);
    await dataSource.initialize();
    log('✅ Connected to database\n', colors.green);
    
    log('📋 Creating tables from entities...', colors.cyan);
    log('   (This may take a minute...)\n', colors.cyan);
    
    // TypeORM will automatically create all tables because synchronize=true
    // Just need to wait a moment for it to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check how many tables were created
    const result = await dataSource.query(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
    );
    
    const tableCount = result[0].count;
    
    log('='.repeat(80), colors.cyan);
    log('✅ TABLES CREATED SUCCESSFULLY!', colors.green);
    log('='.repeat(80) + '\n', colors.cyan);
    
    log(`📊 Total tables: ${tableCount}`, colors.green);
    log('');
    
    if (tableCount < 100) {
      log('⚠️  Warning: Expected ~108 tables, but only found ' + tableCount, colors.yellow);
      log('   Some entities may not have been loaded correctly\n', colors.yellow);
    }
    
    await dataSource.destroy();
    log('✅ Database connection closed\n', colors.green);
    
    log('Next steps:', colors.cyan);
    log('1. Run: npm run db:migrate:status', colors.cyan);
    log('2. All migrations should already be marked as executed', colors.cyan);
    log('3. Run: npm run seed:admin', colors.cyan);
    log('');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

createAllTables();
