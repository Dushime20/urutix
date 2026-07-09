/**
 * run-migration.js
 *
 * Thin wrapper kept for backward compatibility.
 * Delegates to the main migrate.js runner which picks up all SQL files
 * from the migrations/ folder (including 041_epod_international_standard_fields.sql).
 *
 * Usage (manual / one-off):  node run-migration.js
 * Automatic:  runs via docker-entrypoint.sh when AUTO_MIGRATE=true
 */
const { runMigrations } = require('./migrate.js');

runMigrations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
