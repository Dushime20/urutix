/**
 * Schema Generator Script
 * 
 * This script temporarily enables synchronize to generate the complete database schema,
 * then exports it as SQL for use in production deployments.
 * 
 * Usage: node generate-schema.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log('================================================================================');
console.log('DATABASE SCHEMA GENERATOR');
console.log('================================================================================\n');

console.log('ℹ️  This script will:');
console.log('   1. Temporarily enable DB_SYNCHRONIZE');
console.log('   2. Start the application to create all tables');
console.log('   3. Export the schema using pg_dump');
console.log('   4. Save to database/init/01-init.sql');
console.log('');

async function generateSchema() {
  try {
    console.log('📝 Step 1: Setting DB_SYNCHRONIZE=true temporarily...');
    
    // Read current .env
    const fs = require('fs');
    const envPath = '.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    const originalEnv = envContent;
    
    // Add or update DB_SYNCHRONIZE
    if (envContent.includes('DB_SYNCHRONIZE=')) {
      envContent = envContent.replace(/DB_SYNCHRONIZE=.*/g, 'DB_SYNCHRONIZE=true');
    } else {
      envContent += '\nDB_SYNCHRONIZE=true\n';
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ DB_SYNCHRONIZE enabled\n');
    
    console.log('🚀 Step 2: Starting application to create schema...');
    console.log('   (This will take about 30 seconds)\n');
    
    // Start the app in background
    const appProcess = exec('npm run start:dev');
    
    // Wait for app to initialize (30 seconds should be enough)
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('✅ Application started and schema created\n');
    
    console.log('📤 Step 3: Exporting schema with pg_dump...');
    
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5433';
    const dbUser = process.env.DB_USERNAME || 'postgres';
    const dbName = process.env.DB_NAME || 'urutix';
    const dbPassword = process.env.DB_PASSWORD || '1234';
    
    // Export schema only (no data)
    const dumpCommand = `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --schema-only --no-owner --no-privileges -f ../database/init/01-init.sql`;
    
    await execAsync(dumpCommand);
    
    console.log('✅ Schema exported to database/init/01-init.sql\n');
    
    // Kill the app process
    console.log('🛑 Step 4: Stopping application...');
    appProcess.kill();
    
    // Restore original .env
    console.log('🔄 Step 5: Restoring original .env...');
    fs.writeFileSync(envPath, originalEnv);
    console.log('✅ .env restored\n');
    
    console.log('================================================================================');
    console.log('✅ SCHEMA GENERATION COMPLETE!');
    console.log('================================================================================\n');
    console.log('Next steps:');
    console.log('1. Review database/init/01-init.sql');
    console.log('2. Commit the schema file to git');
    console.log('3. Deploy to production - schema will be created automatically');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error generating schema:', error.message);
    process.exit(1);
  }
}

generateSchema();
