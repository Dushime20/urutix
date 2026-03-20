import { AppDataSource } from './src/data-source';
import { AddOdometerImagesToFuelLogs1768000000000 } from './src/migrations/1768000000000-AddOdometerImagesToFuelLogs';
import { config } from 'dotenv';

config();

async function runOdometerMigration() {
    try {
        console.log('🚀 Running AddOdometerImagesToFuelLogs1768000000000...\n');
        console.log('='.repeat(70));

        await AppDataSource.initialize();
        console.log('✅ Database connected\n');

        // Check if already executed
        const executed = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM migrations WHERE name LIKE $1
    `, ['%AddOdometerImagesToFuelLogs1768000000000%']).catch(() => [{ count: '0' }]);

        if (parseInt(executed[0].count) > 0) {
            console.log('⚠️  This migration has already been executed!\n');
            await AppDataSource.destroy();
            return;
        }

        console.log('🔄 Executing migration...\n');

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const migration = new AddOdometerImagesToFuelLogs1768000000000();
            await migration.up(queryRunner);

            // Record in migrations table
            await queryRunner.query(`
        INSERT INTO migrations (timestamp, name) 
        VALUES ($1, $2)
      `, [Date.now().toString(), 'AddOdometerImagesToFuelLogs1768000000000']);

            await queryRunner.commitTransaction();
            console.log('\n✅ Odometer migration executed successfully!\n');

        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        await AppDataSource.destroy();
        console.log('\n✅ Migration completed!\n');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.stack) {
            console.error('\nStack:', error.stack);
        }
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        process.exit(1);
    }
}

runOdometerMigration();
