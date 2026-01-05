import { AppDataSource } from './src/data-source';
import { InitMigration1000000000000 } from './src/database/migrations/1000000000000-InitMigration';
import { config } from 'dotenv';

config();

async function runInitMigration() {
  try {
    console.log('🚀 Running InitMigration1000000000000...\n');
    console.log('='.repeat(70));
    
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Check if already executed
    const executed = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM migrations WHERE name = $1
    `, ['InitMigration1000000000000']).catch(() => [{ count: '0' }]);

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
      const migration = new InitMigration1000000000000();
      await migration.up(queryRunner);
      
      // Record in migrations table
      await queryRunner.query(`
        INSERT INTO migrations (timestamp, name) 
        VALUES ($1, $2)
      `, ['1000000000000', 'InitMigration1000000000000']);

      await queryRunner.commitTransaction();
      console.log('\n✅ InitMigration executed successfully!\n');

      // Check tables created
      const tables = await AppDataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name != 'migrations'
        ORDER BY table_name
      `);

      console.log(`📊 Created ${tables.length} tables:\n`);
      tables.forEach((table: any, i: number) => {
        console.log(`  ${(i + 1).toString().padStart(3)}. ${table.table_name}`);
      });

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

runInitMigration();

