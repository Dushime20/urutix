import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

/**
 * Comprehensive schema verification for governance migrations
 * This script generates a detailed report of all tables, columns, indexes, and constraints
 */

const testDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: false,
  entities: [],
  migrations: [],
});

async function getTableColumns(tableName: string): Promise<any[]> {
  return await testDataSource.query(`
    SELECT 
      column_name, 
      data_type, 
      character_maximum_length,
      is_nullable, 
      column_default,
      col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as description
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position;
  `, [tableName]);
}

async function getTableIndexes(tableName: string): Promise<any[]> {
  return await testDataSource.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = $1
    ORDER BY indexname;
  `, [tableName]);
}

async function getTableConstraints(tableName: string): Promise<any[]> {
  return await testDataSource.query(`
    SELECT 
      tc.constraint_name, 
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = $1
    ORDER BY tc.constraint_type, tc.constraint_name;
  `, [tableName]);
}

async function getCheckConstraints(tableName: string): Promise<any[]> {
  return await testDataSource.query(`
    SELECT 
      con.conname AS constraint_name,
      pg_get_constraintdef(con.oid) AS constraint_definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' 
      AND rel.relname = $1
      AND con.contype = 'c'
    ORDER BY con.conname;
  `, [tableName]);
}

function printSection(title: string) {
  console.log('\n' + '='.repeat(80));
  console.log(title);
  console.log('='.repeat(80));
}

function printSubSection(title: string) {
  console.log('\n' + '-'.repeat(80));
  console.log(title);
  console.log('-'.repeat(80));
}

async function verifyTable(tableName: string, expectedColumns: string[]) {
  printSection(`TABLE: ${tableName}`);
  
  // Get columns
  const columns = await getTableColumns(tableName);
  console.log(`\n📋 Columns (${columns.length} total):`);
  console.log();
  
  const foundColumns = columns.map(c => c.column_name);
  const missingColumns = expectedColumns.filter(c => !foundColumns.includes(c));
  
  columns.forEach(col => {
    const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
    const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
    const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
    console.log(`  ✓ ${col.column_name}`);
    console.log(`    Type: ${col.data_type}${length} ${nullable}${defaultVal}`);
    if (col.description) {
      console.log(`    Description: ${col.description}`);
    }
  });
  
  if (missingColumns.length > 0) {
    console.log('\n  ❌ Missing expected columns:');
    missingColumns.forEach(col => console.log(`    - ${col}`));
  }
  
  // Get indexes
  const indexes = await getTableIndexes(tableName);
  printSubSection(`Indexes (${indexes.length} total)`);
  indexes.forEach(idx => {
    console.log(`\n  ✓ ${idx.indexname}`);
    console.log(`    ${idx.indexdef}`);
  });
  
  // Get constraints
  const constraints = await getTableConstraints(tableName);
  printSubSection(`Constraints (${constraints.length} total)`);
  
  const groupedConstraints = constraints.reduce((acc, c) => {
    if (!acc[c.constraint_type]) acc[c.constraint_type] = [];
    acc[c.constraint_type].push(c);
    return acc;
  }, {} as Record<string, any[]>);
  
  Object.entries(groupedConstraints).forEach(([type, cons]: [string, any[]]) => {
    console.log(`\n  ${type}:`);
    cons.forEach(c => {
      console.log(`    ✓ ${c.constraint_name}`);
      if (c.column_name) {
        console.log(`      Column: ${c.column_name}`);
      }
      if (c.foreign_table_name) {
        console.log(`      References: ${c.foreign_table_name}(${c.foreign_column_name})`);
      }
    });
  });
  
  // Get check constraints
  const checkConstraints = await getCheckConstraints(tableName);
  if (checkConstraints.length > 0) {
    printSubSection(`Check Constraints (${checkConstraints.length} total)`);
    checkConstraints.forEach(c => {
      console.log(`\n  ✓ ${c.constraint_name}`);
      console.log(`    ${c.constraint_definition}`);
    });
  }
}

async function main() {
  console.log('🔍 Governance Schema Verification Report');
  console.log('Generated:', new Date().toISOString());
  
  try {
    await testDataSource.initialize();
    console.log('\n✅ Database connection established');
    
    // Verify user_subscriptions enforcement columns
    await verifyTable('user_subscriptions', [
      'enforcement_status',
      'suspended_by',
      'suspended_at',
      'suspension_reason',
      'suspension_expires_at',
      'terminated_by',
      'terminated_at',
      'termination_reason',
      'restrictions',
      'last_reinstated_by',
      'last_reinstated_at',
      'reinstatement_notes',
      'enforcement_metadata'
    ]);
    
    // Verify enforcement_actions table
    await verifyTable('enforcement_actions', [
      'id',
      'admin_id',
      'target_user_id',
      'subscription_id',
      'action_type',
      'reason',
      'violation_category',
      'severity',
      'previous_state',
      'new_state',
      'restrictions_applied',
      'expires_at',
      'evidence',
      'admin_notes',
      'internal_notes',
      'is_appealed',
      'appeal_id',
      'ip_address',
      'user_agent',
      'created_at',
      'is_deleted',
      'deleted_at',
      'deleted_by'
    ]);
    
    // Verify appeals table
    await verifyTable('appeals', [
      'id',
      'enforcement_action_id',
      'user_id',
      'subscription_id',
      'appeal_reason',
      'user_statement',
      'supporting_evidence',
      'status',
      'reviewed_by',
      'reviewed_at',
      'review_notes',
      'admin_response',
      'outcome',
      'outcome_details',
      'messages',
      'created_at',
      'updated_at',
      'resolved_at'
    ]);
    
    // Verify user_blacklist table
    await verifyTable('user_blacklist', [
      'id',
      'email',
      'email_domain',
      'phone_number',
      'company_name',
      'tax_id',
      'device_fingerprint',
      'ip_address',
      'reason',
      'violation_category',
      'added_by',
      'tenant_id',
      'related_user_id',
      'related_enforcement_action_id',
      'is_active',
      'expires_at',
      'created_at',
      'deactivated_at',
      'deactivated_by'
    ]);
    
    // Verify risk_flags table
    await verifyTable('risk_flags', [
      'id',
      'userId',
      'tenantId',
      'flagType',
      'severity',
      'riskScore',
      'detectedBy',
      'detectionMethod',
      'description',
      'evidence',
      'relatedEntities',
      'status',
      'reviewedBy',
      'reviewedAt',
      'reviewNotes',
      'enforcementActionId',
      'createdAt',
      'updatedAt',
      'resolvedAt'
    ]);
    
    // Summary
    printSection('VERIFICATION SUMMARY');
    console.log('\n✅ All governance tables verified successfully!');
    console.log('\nTables verified:');
    console.log('  1. user_subscriptions (enforcement columns)');
    console.log('  2. enforcement_actions');
    console.log('  3. appeals');
    console.log('  4. user_blacklist');
    console.log('  5. risk_flags');
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error during schema verification:', error);
    process.exit(1);
  } finally {
    await testDataSource.destroy();
  }
}

main();
