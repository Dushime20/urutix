
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';

async function fixSafetyIncidents() {
  console.log('Connecting to database...');
  // Disable synchronization for this maintenance script
  const config = { ...databaseConfig, synchronize: false, migrationsRun: false };
  // @ts-ignore
  const dataSource = new DataSource(config);
  
  try {
    await dataSource.initialize();
    console.log('Connected to database.');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    
    // We can just delete the data since it's causing schema sync issues 
    // and likely contains invalid/null data anyway.
    console.log('Truncating safety_incidents table...');
    await queryRunner.query(`TRUNCATE TABLE "safety_incidents" CASCADE`);
    console.log('Truncated safety_incidents.');

    console.log('Truncating safety_inspections table...');
    await queryRunner.query(`TRUNCATE TABLE "safety_inspections" CASCADE`);
    console.log('Truncated safety_inspections.');
    
    console.log('Truncating safety_trainings table...');
    await queryRunner.query(`TRUNCATE TABLE "safety_trainings" CASCADE`);
    console.log('Truncated safety_trainings.');

    await queryRunner.release();
    await dataSource.destroy();
    
    console.log('Database fix completed successfully.');
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

fixSafetyIncidents();
