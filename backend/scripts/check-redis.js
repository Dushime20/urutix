/**
 * Redis Health Check Script
 * 
 * Verifies Redis connection and displays configuration.
 * Run with: node scripts/check-redis.js
 */

const redis = require('redis');
require('dotenv').config();

async function checkRedis() {
  console.log('🔍 Checking Redis connection...\n');

  // Display configuration
  console.log('📋 Configuration:');
  console.log(`   Host: ${process.env.REDIS_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.REDIS_PORT || '6379'}`);
  console.log(`   Password: ${process.env.REDIS_PASSWORD ? '***' : '(none)'}`);
  console.log(`   Database: ${process.env.REDIS_DB || '0'}`);
  console.log(`   TLS: ${process.env.REDIS_TLS || 'false'}\n`);

  try {
    // Create Redis client
    const client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB || '0', 10),
    });

    // Handle errors
    client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
    });

    // Connect
    console.log('🔌 Connecting to Redis...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test PING
    console.log('📡 Testing PING command...');
    const pong = await client.ping();
    console.log(`✅ PING response: ${pong}\n`);

    // Get server info
    console.log('📊 Server Information:');
    const info = await client.info('server');
    const lines = info.split('\r\n');
    const serverInfo = {};
    
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          serverInfo[key] = value;
        }
      }
    });

    console.log(`   Redis Version: ${serverInfo.redis_version || 'N/A'}`);
    console.log(`   OS: ${serverInfo.os || 'N/A'}`);
    console.log(`   Uptime: ${serverInfo.uptime_in_seconds ? Math.floor(serverInfo.uptime_in_seconds / 60) + ' minutes' : 'N/A'}\n`);

    // Get memory info
    console.log('💾 Memory Information:');
    const memInfo = await client.info('memory');
    const memLines = memInfo.split('\r\n');
    const memoryInfo = {};
    
    memLines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          memoryInfo[key] = value;
        }
      }
    });

    const usedMemory = memoryInfo.used_memory_human || 'N/A';
    const maxMemory = memoryInfo.maxmemory_human || 'unlimited';
    console.log(`   Used Memory: ${usedMemory}`);
    console.log(`   Max Memory: ${maxMemory}\n`);

    // Get stats
    console.log('📈 Statistics:');
    const statsInfo = await client.info('stats');
    const statsLines = statsInfo.split('\r\n');
    const stats = {};
    
    statsLines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }
    });

    console.log(`   Total Connections: ${stats.total_connections_received || 'N/A'}`);
    console.log(`   Total Commands: ${stats.total_commands_processed || 'N/A'}`);
    console.log(`   Keyspace Hits: ${stats.keyspace_hits || '0'}`);
    console.log(`   Keyspace Misses: ${stats.keyspace_misses || '0'}`);
    
    const hits = parseInt(stats.keyspace_hits || '0');
    const misses = parseInt(stats.keyspace_misses || '0');
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : '0.00';
    console.log(`   Hit Rate: ${hitRate}%\n`);

    // Check for governance keys
    console.log('🔑 Governance Cache Keys:');
    const keys = await client.keys('enforcement:*');
    console.log(`   Enforcement keys: ${keys.length}`);
    
    if (keys.length > 0) {
      console.log(`   Sample keys: ${keys.slice(0, 5).join(', ')}`);
      
      // Check TTL of first key
      if (keys[0]) {
        const ttl = await client.ttl(keys[0]);
        console.log(`   Sample TTL: ${ttl} seconds`);
      }
    }
    console.log();

    // Test SET/GET
    console.log('🧪 Testing SET/GET operations...');
    const testKey = 'test:health-check';
    const testValue = JSON.stringify({ timestamp: Date.now(), test: true });
    
    await client.set(testKey, testValue, { EX: 10 });
    console.log('✅ SET operation successful');
    
    const retrieved = await client.get(testKey);
    console.log('✅ GET operation successful');
    
    await client.del(testKey);
    console.log('✅ DEL operation successful\n');

    // Disconnect
    await client.quit();
    console.log('✅ Redis health check completed successfully!\n');
    console.log('🎉 Redis is ready for use with the Governance module.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Redis health check failed!');
    console.error(`   Error: ${error.message}\n`);
    
    console.log('💡 Troubleshooting:');
    console.log('   1. Check if Redis is running: redis-cli ping');
    console.log('   2. Verify REDIS_HOST and REDIS_PORT in .env');
    console.log('   3. Check firewall rules');
    console.log('   4. Start Redis with Docker: docker-compose -f docker-compose.redis.yml up -d\n');
    
    process.exit(1);
  }
}

// Run health check
checkRedis();
