import { AppDataSource } from '../data-source';

async function addInspectionAlertsColumn() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Data Source has been initialized!');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('🔧 Adding inspectionAlerts column to trucks table...');

    // Add the column
    await queryRunner.query(`
      ALTER TABLE trucks 
      ADD COLUMN IF NOT EXISTS "inspectionAlerts" jsonb DEFAULT '[]'::jsonb;
    `);

    console.log('✅ inspectionAlerts column added successfully!');

    // Verify the column was added
    const result = await queryRunner.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' AND column_name = 'inspectionAlerts';
    `);

    if (result.length > 0) {
      console.log('✅ Column verification:', result[0]);
    } else {
      console.warn('⚠️  Column not found after creation');
    }

    await queryRunner.release();
    await AppDataSource.destroy();

    console.log('✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding inspectionAlerts column:', error);
    process.exit(1);
  }
}

addInspectionAlertsColumn();
