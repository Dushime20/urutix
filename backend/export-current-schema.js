/**
 * Export Current Database Schema
 * 
 * This script exports the current database schema to a migration file.
 * It captures all tables, columns, indexes, and constraints.
 * 
 * Usage:
 *   node export-current-schema.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
};

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

async function exportSchema() {
  const client = new Client(dbConfig);
  
  try {
    log('\n' + '='.repeat(80), colors.cyan);
    log('DATABASE SCHEMA EXPORTER', colors.cyan);
    log('='.repeat(80) + '\n', colors.cyan);

    logInfo('Connecting to database...');
    await client.connect();
    logSuccess('Connected');

    let sql = `-- ============================================
-- COMPLETE DATABASE SCHEMA EXPORT
-- Generated: ${new Date().toISOString()}
-- Database: ${dbConfig.database}
-- ============================================
--
-- This migration contains the complete schema of the database.
-- It includes all tables, columns, indexes, constraints, and enums.
--
-- IMPORTANT: Run this on a fresh database.
--
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

`;

    // Get all enums
    logInfo('Exporting enums...');
    const enums = await client.query(`
      SELECT 
        t.typname as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `);

    if (enums.rows.length > 0) {
      sql += `\n-- ============================================\n`;
      sql += `-- ENUMS (${enums.rows.length})\n`;
      sql += `-- ============================================\n\n`;

      for (const enumRow of enums.rows) {
        const values = enumRow.enum_values.map(v => `'${v}'`).join(', ');
        sql += `CREATE TYPE "${enumRow.enum_name}" AS ENUM (${values});\n`;
      }
      
      logSuccess(`Exported ${enums.rows.length} enums`);
    }

    // Get all tables
    logInfo('Exporting tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('schema_migrations', 'typeorm_metadata')
      ORDER BY table_name
    `);

    sql += `\n-- ============================================\n`;
    sql += `-- TABLES (${tables.rows.length})\n`;
    sql += `-- ============================================\n\n`;

    for (const table of tables.rows) {
      const tableName = table.table_name;
      
      // Get columns
      const columns = await client.query(`
        SELECT 
          column_name,
          data_type,
          udt_name,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      sql += `-- Table: ${tableName}\n`;
      sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;

      const columnDefs = columns.rows.map(col => {
        let def = `  "${col.column_name}" `;
        
        // Handle data type
        if (col.data_type === 'USER-DEFINED') {
          def += `"${col.udt_name}"`;
        } else if (col.data_type === 'character varying') {
          def += col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'VARCHAR';
        } else if (col.data_type === 'numeric' && col.numeric_precision) {
          def += `NUMERIC(${col.numeric_precision},${col.numeric_scale || 0})`;
        } else {
          def += col.data_type.toUpperCase();
        }

        // Nullable
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }

        // Default
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }

        return def;
      });

      sql += columnDefs.join(',\n');
      sql += '\n);\n\n';
    }

    logSuccess(`Exported ${tables.rows.length} tables`);

    // Get primary keys
    logInfo('Exporting primary keys...');
    sql += `\n-- ============================================\n`;
    sql += `-- PRIMARY KEYS\n`;
    sql += `-- ============================================\n\n`;

    for (const table of tables.rows) {
      const pks = await client.query(`
        SELECT 
          tc.constraint_name,
          string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1
        GROUP BY tc.constraint_name
      `, [table.table_name]);

      if (pks.rows.length > 0) {
        for (const pk of pks.rows) {
          sql += `ALTER TABLE "${table.table_name}" ADD CONSTRAINT "${pk.constraint_name}" PRIMARY KEY (${pk.columns});\n`;
        }
      }
    }

    // Get indexes
    logInfo('Exporting indexes...');
    sql += `\n-- ============================================\n`;
    sql += `-- INDEXES\n`;
    sql += `-- ============================================\n\n`;

    const indexes = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename NOT IN ('schema_migrations', 'typeorm_metadata')
        AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    `);

    for (const index of indexes.rows) {
      sql += `${index.indexdef};\n`;
    }

    logSuccess(`Exported ${indexes.rows.length} indexes`);

    // Get foreign keys
    logInfo('Exporting foreign keys...');
    sql += `\n-- ============================================\n`;
    sql += `-- FOREIGN KEYS\n`;
    sql += `-- ============================================\n\n`;

    const foreignKeys = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name
    `);

    for (const fk of foreignKeys.rows) {
      sql += `ALTER TABLE "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" `;
      sql += `FOREIGN KEY ("${fk.column_name}") `;
      sql += `REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}")`;
      
      if (fk.delete_rule && fk.delete_rule !== 'NO ACTION') {
        sql += ` ON DELETE ${fk.delete_rule}`;
      }
      
      if (fk.update_rule && fk.update_rule !== 'NO ACTION') {
        sql += ` ON UPDATE ${fk.update_rule}`;
      }
      
      sql += ';\n';
    }

    logSuccess(`Exported ${foreignKeys.rows.length} foreign keys`);

    // Get unique constraints
    logInfo('Exporting unique constraints...');
    const uniqueConstraints = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name, tc.constraint_name
    `);

    if (uniqueConstraints.rows.length > 0) {
      sql += `\n-- ============================================\n`;
      sql += `-- UNIQUE CONSTRAINTS\n`;
      sql += `-- ============================================\n\n`;

      for (const uc of uniqueConstraints.rows) {
        sql += `ALTER TABLE "${uc.table_name}" ADD CONSTRAINT "${uc.constraint_name}" UNIQUE (${uc.columns});\n`;
      }

      logSuccess(`Exported ${uniqueConstraints.rows.length} unique constraints`);
    }

    // Add summary
    sql += `\n-- ============================================\n`;
    sql += `-- SCHEMA EXPORT SUMMARY\n`;
    sql += `-- ============================================\n`;
    sql += `-- Enums: ${enums.rows.length}\n`;
    sql += `-- Tables: ${tables.rows.length}\n`;
    sql += `-- Indexes: ${indexes.rows.length}\n`;
    sql += `-- Foreign Keys: ${foreignKeys.rows.length}\n`;
    sql += `-- Unique Constraints: ${uniqueConstraints.rows.length}\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- ============================================\n`;

    // Write to file
    const outputPath = path.join(__dirname, 'migrations', '000_complete_schema.sql');
    fs.writeFileSync(outputPath, sql, 'utf8');

    logSuccess(`Schema exported to: ${outputPath}`);

    // Create summary
    const summary = `# Complete Schema Export

**Generated:** ${new Date().toISOString()}  
**Database:** ${dbConfig.database}

## Summary

- **Enums:** ${enums.rows.length}
- **Tables:** ${tables.rows.length}
- **Indexes:** ${indexes.rows.length}
- **Foreign Keys:** ${foreignKeys.rows.length}
- **Unique Constraints:** ${uniqueConstraints.rows.length}

## Tables

${tables.rows.map((t, i) => `${i + 1}. ${t.table_name}`).join('\n')}

## Enums

${enums.rows.map(e => `- ${e.enum_name}: ${e.enum_values.join(', ')}`).join('\n')}

## Usage

\`\`\`bash
# Apply this schema to a fresh database
psql -d urutix -f migrations/000_complete_schema.sql

# Or use the migration runner
npm run migrations:run
\`\`\`

## Notes

- This is a complete export of the current database schema
- Run on a fresh database or after backup
- All tables, relationships, and constraints are included
- Enums are created before tables that use them
`;

    const summaryPath = path.join(__dirname, 'migrations', '000_complete_schema_summary.md');
    fs.writeFileSync(summaryPath, summary, 'utf8');

    logSuccess(`Summary created: ${summaryPath}`);

    log('\n' + '='.repeat(80), colors.cyan);
    log('EXPORT COMPLETE', colors.cyan);
    log('='.repeat(80) + '\n', colors.cyan);

    log(`📁 Schema file: migrations/000_complete_schema.sql`);
    log(`📄 Summary file: migrations/000_complete_schema_summary.md`);
    log('');
    log('Next steps:');
    log('1. Review the generated schema file');
    log('2. Test on a development database');
    log('3. Commit to git');
    log('4. Share with team');
    log('');

  } catch (error) {
    logError(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run
exportSchema();
