const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: false,
});

async function fixMigrationState() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();

    // The main migration that should be marked as completed
    const migrationName = 'CreateAllTables1762849950556';
    const timestamp = 1762849950556;

    console.log(`\nChecking if ${migrationName} is recorded...`);
    const existing = await dataSource.query(
      'SELECT * FROM migrations WHERE name = $1', 
      [migrationName]
    );

    if (existing.length > 0) {
      console.log('Migration is already recorded in database.');
    } else {
      console.log('Migration not found in database. Adding it...');
      
      await dataSource.query(
        'INSERT INTO migrations (timestamp, name) VALUES ($1, $2)',
        [timestamp, migrationName]
      );
      
      console.log('✓ Migration marked as completed in database.');
    }

    // Also check and add other missing migrations that should be there
    const otherMigrations = [
      { name: 'AutoMigration1767718165505', timestamp: 1767718165505 },
      { name: 'AddReferenceToLoads1767718165510', timestamp: 1767718165510 },
      { name: 'CreateBrokerTables1767764359221', timestamp: 1767764359221 },
      { name: 'CreateMissingTables1767829480000', timestamp: 1767829480000 },
      { name: 'SeedCompanyData1767829481000', timestamp: 1767829481000 },
      { name: 'AddMissingLoadColumns1767830000000', timestamp: 1767830000000 },
      { name: 'AddVisibilityColumn1767830100000', timestamp: 1767830100000 },
      { name: 'AddRemainingLoadColumns1767830200000', timestamp: 1767830200000 },
      { name: 'AddMetadataColumn1767830300000', timestamp: 1767830300000 },
      { name: 'AddOdometerImagesToFuelLogs1768000000000', timestamp: 1768000000000 },
      { name: 'CreateFuelSystemTables1772457000000', timestamp: 1772457000000 }
    ];

    console.log('\nChecking other migrations...');
    for (const migration of otherMigrations) {
      const exists = await dataSource.query(
        'SELECT * FROM migrations WHERE name = $1', 
        [migration.name]
      );
      
      if (exists.length === 0) {
        console.log(`Adding ${migration.name}...`);
        await dataSource.query(
          'INSERT INTO migrations (timestamp, name) VALUES ($1, $2)',
          [migration.timestamp, migration.name]
        );
      } else {
        console.log(`${migration.name} already exists`);
      }
    }

    await dataSource.destroy();
    console.log('\nMigration state fixed successfully!');
  } catch (error) {
    console.error('Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

fixMigrationState();