
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';
import { config } from 'dotenv';
config();

const dataSource = new DataSource(databaseConfig as any);

async function fix() {
    try {
        console.log('Connecting to database...', databaseConfig.database);
        await dataSource.initialize();
        console.log('Connected!');

        const queryRunner = dataSource.createQueryRunner();

        // Drop in correct order to avoid FK constraints
        console.log('Dropping table role_permissions...');
        await queryRunner.query('DROP TABLE IF EXISTS "role_permissions" CASCADE');

        console.log('Dropping table role_inheritance...');
        await queryRunner.query('DROP TABLE IF EXISTS "role_inheritance" CASCADE');

        console.log('Dropping table user_permission_overrides...');
        await queryRunner.query('DROP TABLE IF EXISTS "user_permission_overrides" CASCADE');

        console.log('Dropping table permissions...');
        await queryRunner.query('DROP TABLE IF EXISTS "permissions" CASCADE');

        console.log('Dropping table roles...');
        await queryRunner.query('DROP TABLE IF EXISTS "roles" CASCADE');

        console.log('All conflicting tables dropped. You can now restart the server.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

fix();
