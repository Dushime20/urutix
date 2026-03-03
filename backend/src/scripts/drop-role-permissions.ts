import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';
import { config } from 'dotenv';
config();

const dataSource = new DataSource(databaseConfig as any);

async function fix() {
    try {
        console.log('Connecting to database...');
        await dataSource.initialize();
        console.log('Connected!');

        const queryRunner = dataSource.createQueryRunner();

        console.log('Dropping table role_permissions...');
        await queryRunner.query('DROP TABLE IF EXISTS "role_permissions" CASCADE');
        console.log('Dropped role_permissions.');

        console.log('Dropping table role_inheritance...');
        await queryRunner.query('DROP TABLE IF EXISTS "role_inheritance" CASCADE');
        console.log('Dropped role_inheritance.');

        console.log('Done. You can now restart the server.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

fix();
