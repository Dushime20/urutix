#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    database: process.env.DB_DATABASE || 'urutix',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
  });

  try {
    console.log('Columns:');
    const cols = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name='documents'
       ORDER BY ordinal_position`
    );
    console.table(cols.rows);

    console.log('\nConstraints (by relname join):');
    const cons = await pool.query(
      `SELECT conname, pg_get_constraintdef(c.oid) AS def
       FROM pg_constraint c
       JOIN pg_class t ON c.conrelid = t.oid
       WHERE t.relname = 'documents'
       ORDER BY conname`
    );
    console.table(cons.rows);

    console.log('\nConstraints (by regclass):');
    const cons2 = await pool.query(
      `SELECT conname, pg_get_constraintdef(oid) AS def
       FROM pg_constraint
       WHERE conrelid = 'public.documents'::regclass
       ORDER BY conname`
    );
    console.log(JSON.stringify(cons2.rows, null, 2));

    console.log('\nEnum domains:');
    const enums = await pool.query(
      `SELECT t.typname AS enum_type, e.enumlabel AS enum_value
       FROM pg_type t
       JOIN pg_enum e ON t.oid = e.enumtypid
       JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'public'
       ORDER BY t.typname, e.enumsortorder`
    );
    console.table(enums.rows);

    console.log('\nNotifications Columns:');
    const notifCols = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name='notifications'
       ORDER BY ordinal_position`
    );
    console.table(notifCols.rows);

    console.log('\nNotifications Constraints:');
    const notifCons = await pool.query(
      `SELECT conname, pg_get_constraintdef(c.oid) AS def
       FROM pg_constraint c
       WHERE conrelid = 'public.notifications'::regclass
       ORDER BY conname`
    );
    console.table(notifCons.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}


