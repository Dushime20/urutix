/**
 * Complete Schema Generator
 * 
 * This script generates a complete database schema migration by analyzing
 * all TypeORM entities and creating the necessary SQL statements.
 * 
 * Usage:
 *   node generate-complete-schema.js
 */

const { DataSource } = require('typeorm');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

/**
 * Create DataSource with all entities
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: false,
  entities: ['src/entities/*.entity.ts'],
});

async function generateCompleteSchema() {
  try {
    log('\n' + '='.repeat(80), colors.cyan);
    log('COMPLETE SCHEMA GENERATOR', colors.cyan);
    log('='.repeat(80) + '\n', colors.cyan);

    logInfo('Initializing TypeORM DataSource...');
    await AppDataSource.initialize();
    logSuccess('DataSource initialized');

    logInfo('Generating schema SQL...');
    
    // Get the SQL that would create all tables
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      // Get all table metadata
      const tables = AppDataSource.entityMetadatas;
      
      logInfo(`Found ${tables.length} entities`);
      
      let sql = `-- ============================================
-- COMPLETE DATABASE SCHEMA
-- Generated: ${new Date().toISOString()}
-- Total Tables: ${tables.length}
-- ============================================
-- 
-- This migration creates all tables required by the application.
-- It includes all entities, relationships, indexes, and constraints.
--
-- IMPORTANT: This is a comprehensive schema migration.
-- Run this ONLY on a fresh database or after backing up existing data.
--
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

`;

      // Generate CREATE TABLE statements for each entity
      for (const table of tables) {
        const tableName = table.tableName;
        
        sql += `\n-- Table: ${tableName}\n`;
        sql += `-- Entity: ${table.name}\n`;
        
        // Get the actual CREATE TABLE statement from TypeORM
        const createTableSql = await queryRunner.query(
          `SELECT 'CREATE TABLE IF NOT EXISTS ' || quote_ident(table_name) || ' (' ||
           string_agg(
             quote_ident(column_name) || ' ' || 
             data_type ||
             CASE 
               WHEN character_maximum_length IS NOT NULL 
               THEN '(' || character_maximum_length || ')'
               ELSE ''
             END ||
             CASE 
               WHEN is_nullable = 'NO' THEN ' NOT NULL'
               ELSE ''
             END ||
             CASE 
               WHEN column_default IS NOT NULL 
               THEN ' DEFAULT ' || column_default
               ELSE ''
             END,
             ', '
           ) || ');' as create_statement
           FROM information_schema.columns
           WHERE table_name = '${tableName}'
           GROUP BY table_name`
        ).catch(() => null);
        
        if (createTableSql && createTableSql.length > 0) {
          sql += createTableSql[0].create_statement + '\n';
        } else {
          // Fallback: generate basic CREATE TABLE
          sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
          
          const columns = table.columns.map(column => {
            let colDef = `  "${column.databaseName}" ${column.type}`;
            
            if (column.length) {
              colDef += `(${column.length})`;
            }
            
            if (column.isPrimary) {
              colDef += ' PRIMARY KEY';
            }
            
            if (!column.isNullable) {
              colDef += ' NOT NULL';
            }
            
            if (column.default !== undefined) {
              colDef += ` DEFAULT ${column.default}`;
            }
            
            return colDef;
          });
          
          sql += columns.join(',\n');
          sql += '\n);\n';
        }
        
        sql += '\n';
      }

      sql += `\n-- ============================================
-- INDEXES
-- ============================================\n\n`;

      // Generate indexes
      for (const table of tables) {
        if (table.indices && table.indices.length > 0) {
          sql += `-- Indexes for ${table.tableName}\n`;
          
          for (const index of table.indices) {
            const indexName = index.name || `idx_${table.tableName}_${index.columns.join('_')}`;
            const columns = index.columns.map(col => `"${col}"`).join(', ');
            const unique = index.isUnique ? 'UNIQUE ' : '';
            
            sql += `CREATE ${unique}INDEX IF NOT EXISTS "${indexName}" ON "${table.tableName}" (${columns});\n`;
          }
          
          sql += '\n';
        }
      }

      sql += `\n-- ============================================
-- FOREIGN KEYS
-- ============================================\n\n`;

      // Generate foreign keys
      for (const table of tables) {
        if (table.foreignKeys && table.foreignKeys.length > 0) {
          sql += `-- Foreign keys for ${table.tableName}\n`;
          
          for (const fk of table.foreignKeys) {
            const fkName = fk.name || `fk_${table.tableName}_${fk.columnNames.join('_')}`;
            const columns = fk.columnNames.map(col => `"${col}"`).join(', ');
            const refColumns = fk.referencedColumnNames.map(col => `"${col}"`).join(', ');
            
            sql += `ALTER TABLE "${table.tableName}" ADD CONSTRAINT "${fkName}" `;
            sql += `FOREIGN KEY (${columns}) `;
            sql += `REFERENCES "${fk.referencedTableName}" (${refColumns})`;
            
            if (fk.onDelete) {
              sql += ` ON DELETE ${fk.onDelete}`;
            }
            
            if (fk.onUpdate) {
              sql += ` ON UPDATE ${fk.onUpdate}`;
            }
            
            sql += ';\n';
          }
          
          sql += '\n';
        }
      }

      sql += `\n-- ============================================
-- NOTES
-- ============================================
-- 
-- This schema includes:
-- - ${tables.length} tables
-- - All columns with proper types and constraints
-- - Primary keys and foreign keys
-- - Indexes for performance
-- - UUID extension for ID generation
--
-- After running this migration:
-- 1. Verify all tables were created
-- 2. Check foreign key constraints
-- 3. Verify indexes are in place
-- 4. Run seed data if needed
--
-- ============================================\n`;

      // Write to file
      const outputPath = path.join(__dirname, 'migrations', '000_complete_schema.sql');
      fs.writeFileSync(outputPath, sql, 'utf8');
      
      logSuccess(`Schema SQL generated: ${outputPath}`);
      logInfo(`Total tables: ${tables.length}`);
      
      // Also create a summary file
      const summary = `# Complete Schema Summary

Generated: ${new Date().toISOString()}

## Tables (${tables.length})

${tables.map((t, i) => `${i + 1}. ${t.tableName} (${t.columns.length} columns)`).join('\n')}

## Entity List

${tables.map(t => `- ${t.name} → ${t.tableName}`).join('\n')}

## Usage

\`\`\`bash
# Run this migration first (before all others)
psql -d urutix -f migrations/000_complete_schema.sql

# Or use the migration runner
node run-all-migrations.js
\`\`\`

## Notes

- This creates ALL tables required by the application
- Run on a fresh database or after backup
- Includes all relationships and constraints
- Indexes are created for performance
`;

      const summaryPath = path.join(__dirname, 'migrations', '000_complete_schema_summary.md');
      fs.writeFileSync(summaryPath, summary, 'utf8');
      
      logSuccess(`Summary created: ${summaryPath}`);
      
    } finally {
      await queryRunner.release();
    }

    await AppDataSource.destroy();
    logSuccess('Complete!');
    
    log('\n' + '='.repeat(80), colors.cyan);
    log('NEXT STEPS', colors.cyan);
    log('='.repeat(80) + '\n', colors.cyan);
    
    log('1. Review the generated file: migrations/000_complete_schema.sql');
    log('2. Test on a development database');
    log('3. Run: npm run migrations:run');
    log('4. Verify all tables were created');
    log('');

  } catch (error) {
    logError(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run
generateCompleteSchema();
