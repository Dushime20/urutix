/**
 * Check Activity Logs
 * Verify if activity logs exist in the database
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkActivityLogs() {
  console.log('🔍 Checking Activity Logs...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if activity_logs table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'activity_logs'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ activity_logs table does not exist!');
      console.log('   The table needs to be created via migration.\n');
      return;
    }

    console.log('✅ activity_logs table exists\n');

    // Check for activity logs
    const logs = await client.query(`
      SELECT COUNT(*) as count FROM activity_logs
    `);

    console.log(`📊 Total activity logs: ${logs.rows[0].count}\n`);

    if (logs.rows[0].count === '0') {
      console.log('ℹ️  No activity logs found in database');
      console.log('   Activity logs are created when users perform actions.\n');
      console.log('💡 Activity logs are typically created for:');
      console.log('   - User login/logout');
      console.log('   - Page views');
      console.log('   - CRUD operations');
      console.log('   - Permission changes');
      console.log('   - System configuration changes\n');
      console.log('🔧 To populate activity logs:');
      console.log('   1. Perform some actions in the app (login, navigate pages)');
      console.log('   2. The system should automatically log these activities');
      console.log('   3. Check if ActivityLogService is being called\n');
    } else {
      // Show recent logs
      const recentLogs = await client.query(`
        SELECT 
          al.*,
          u.email as user_email
        FROM activity_logs al
        LEFT JOIN users u ON u.id = al.user_id
        ORDER BY al.created_at DESC
        LIMIT 10
      `);

      console.log('📋 Recent Activity Logs (last 10):\n');
      recentLogs.rows.forEach((log, index) => {
        console.log(`${index + 1}. ${log.action}`);
        console.log(`   User: ${log.user_email || 'Unknown'}`);
        console.log(`   IP: ${log.ip_address || 'N/A'}`);
        console.log(`   Time: ${new Date(log.created_at).toLocaleString()}`);
        console.log('');
      });

      // Check by action type
      const byAction = await client.query(`
        SELECT action, COUNT(*) as count
        FROM activity_logs
        GROUP BY action
        ORDER BY count DESC
        LIMIT 10
      `);

      console.log('📊 Activity Logs by Action:\n');
      byAction.rows.forEach(row => {
        console.log(`   ${row.action}: ${row.count}`);
      });
      console.log('');
    }

    // Check user_sessions table
    const sessionsExist = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_sessions'
      );
    `);

    if (sessionsExist.rows[0].exists) {
      const sessions = await client.query(`
        SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE expires_at > NOW()) as active
        FROM user_sessions
      `);

      console.log('👥 User Sessions:');
      console.log(`   Total: ${sessions.rows[0].total}`);
      console.log(`   Active: ${sessions.rows[0].active}`);
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Check failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Check complete\n');
  }
}

checkActivityLogs();
