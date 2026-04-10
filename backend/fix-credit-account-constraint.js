require('dotenv').config();
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix_db',
});

async function fixConstraint() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected!');

    // Check for existing constraints
    const constraints = await AppDataSource.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'credit_accounts'
      AND constraint_type = 'UNIQUE';
    `);

    console.log('Existing unique constraints:', constraints);

    // Drop old tenant_id unique constraint if it exists
    for (const constraint of constraints) {
      if (constraint.constraint_name.includes('tenant_id') && !constraint.constraint_name.includes('user_id')) {
        console.log(`Dropping old constraint: ${constraint.constraint_name}`);
        await AppDataSource.query(`
          ALTER TABLE credit_accounts DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}";
        `);
        console.log(`Dropped constraint: ${constraint.constraint_name}`);
      }
    }

    // Ensure the correct unique constraint exists
    console.log('Creating/verifying unique constraint on (tenant_id, user_id)...');
    await AppDataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'UQ_credit_accounts_tenant_user'
        ) THEN
          ALTER TABLE credit_accounts 
          ADD CONSTRAINT UQ_credit_accounts_tenant_user 
          UNIQUE (tenant_id, user_id);
        END IF;
      END $$;
    `);

    console.log('Constraint fixed successfully!');

    // Verify final state
    const finalConstraints = await AppDataSource.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'credit_accounts'
      AND constraint_type = 'UNIQUE';
    `);

    console.log('Final unique constraints:', finalConstraints);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
}

fixConstraint();
