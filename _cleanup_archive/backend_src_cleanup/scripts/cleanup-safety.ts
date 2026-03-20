
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';
import { config } from 'dotenv';
config();

// CRITICAL: Disable synchronize for this script
const cleanupConfig = {
    ...databaseConfig,
    synchronize: false,
    migrationsRun: false,
    logging: true
};

const dataSource = new DataSource(cleanupConfig as any);

async function fix() {
    try {
        console.log('Connecting to database with sync=FALSE...');
        await dataSource.initialize();
        console.log('Connected!');

        const queryRunner = dataSource.createQueryRunner();

        console.log('Dropping safety tables...');

        // Safety Incidents
        await queryRunner.query('DROP TABLE IF EXISTS "safety_incidents" CASCADE');
        console.log('Dropped safety_incidents');

        // Safety Inspections (might as well clean them up too to ensure consistency)
        await queryRunner.query('DROP TABLE IF EXISTS "safety_inspections" CASCADE');
        console.log('Dropped safety_inspections');

        // Safety Trainings
        await queryRunner.query('DROP TABLE IF EXISTS "safety_trainings" CASCADE');
        console.log('Dropped safety_trainings');

        // Also drop the ENUM types if they exist, to ensure clean recreation
        try {
            await queryRunner.query('DROP TYPE IF EXISTS "safety_incidents_type_enum" CASCADE');
            await queryRunner.query('DROP TYPE IF EXISTS "safety_incidents_severity_enum" CASCADE');
            await queryRunner.query('DROP TYPE IF EXISTS "safety_incidents_status_enum" CASCADE');
            await queryRunner.query('DROP TYPE IF EXISTS "safety_inspections_type_enum" CASCADE');
            await queryRunner.query('DROP TYPE IF EXISTS "safety_inspections_status_enum" CASCADE');
            await queryRunner.query('DROP TYPE IF EXISTS "safety_trainings_type_enum" CASCADE');
            await queryRunner.query('DROP TYPE IF EXISTS "safety_trainings_frequency_enum" CASCADE');
            console.log('Dropped safety enums');
        } catch (e) {
            console.log('Enums might not exist or failed to drop, continuing...');
        }

        console.log('SUCCESS: Safety tables dropped.');
    } catch (err) {
        console.error('ERROR during cleanup:', err);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

fix();
