import { AppDataSource } from './src/data-source';

async function runMigrations() {
  try {
    console.log('🔌 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    console.log('🔄 Running migrations...\n');
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('✅ All migrations are already up to date');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration.name}`);
      });
    }

    // Check tables after migrations
    console.log('\n📊 Verifying tables...');
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'migrations'
      ORDER BY table_name
    `);
    
    console.log(`✅ Found ${tables.length} tables:`);
    if (tables.length > 0) {
      tables.slice(0, 20).forEach((table: any, i: number) => {
        console.log(`  ${i + 1}. ${table.table_name}`);
      });
      if (tables.length > 20) {
        console.log(`  ... and ${tables.length - 20} more tables`);
      }
    }

    await AppDataSource.destroy();
    console.log('\n✅ Migration process completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error running migrations:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

runMigrations();

