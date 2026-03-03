
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';
import { config } from 'dotenv';
config();

// CRITICAL: Disable synchronize for this script so we can connect without errors
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

        console.log('running drops...');
        // We use CASCADE to kill dependencies
        await queryRunner.query('DROP TABLE IF EXISTS "role_permissions" CASCADE');
        console.log('Dropped role_permissions');

        await queryRunner.query('DROP TABLE IF EXISTS "role_inheritance" CASCADE');
        console.log('Dropped role_inheritance');

        await queryRunner.query('DROP TABLE IF EXISTS "user_permission_overrides" CASCADE');
        console.log('Dropped user_permission_overrides');

        await queryRunner.query('DROP TABLE IF EXISTS "permissions" CASCADE');
        console.log('Dropped permissions');

        await queryRunner.query('DROP TABLE IF EXISTS "roles" CASCADE');
        console.log('Dropped roles');

        console.log('SUCCESS: All conflicting tables dropped.');
    } catch (err) {
        console.error('ERROR during cleanup:', err);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

fix();
