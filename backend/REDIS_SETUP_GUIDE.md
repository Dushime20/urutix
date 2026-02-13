# Redis Setup Guide for Governance Module

## Overview
The Governance/Abuse Control System uses Redis for distributed caching of enforcement status. This provides high-performance caching across multiple application instances with automatic expiration and invalidation.

## Why Redis?

### Benefits
- **Distributed Caching**: Shared cache across multiple app instances
- **High Performance**: Sub-millisecond response times
- **Automatic Expiration**: Built-in TTL support
- **Persistence**: Optional data persistence (AOF/RDB)
- **Scalability**: Supports clustering for high availability
- **Rich Data Types**: Supports strings, hashes, lists, sets, sorted sets
- **Pub/Sub**: Real-time cache invalidation across instances

### Use Cases in Governance Module
- Enforcement status caching (60s TTL)
- Rate limiting for API endpoints
- Temporary locks for concurrent operations
- Session management
- Blacklist checking

## Installation Options

### Option 1: Docker Compose (Recommended for Development)

1. **Start Redis with Docker Compose:**
```bash
cd backend
docker-compose -f docker-compose.redis.yml up -d
```

2. **Verify Redis is running:**
```bash
docker ps | grep redis
```

3. **Access Redis Commander (GUI):**
Open http://localhost:8081 in your browser

4. **Stop Redis:**
```bash
docker-compose -f docker-compose.redis.yml down
```

### Option 2: Local Installation

#### Windows
1. Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Default port: 6379

#### macOS
```bash
brew install redis
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Option 3: Cloud Redis Services

#### AWS ElastiCache
1. Create ElastiCache Redis cluster
2. Note the endpoint URL
3. Configure security groups
4. Update .env with connection details

#### Redis Cloud (Upstash)
1. Sign up at https://upstash.com
2. Create a Redis database
3. Copy connection details
4. Update .env with credentials

#### Azure Cache for Redis
1. Create Azure Cache for Redis instance
2. Note the hostname and access keys
3. Update .env with connection details

## Configuration

### 1. Environment Variables

Copy the example configuration:
```bash
cp .env.redis.example .env
```

Update `.env` with your Redis configuration:
```env
# Local Development
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# Production (Example)
REDIS_HOST=your-redis-instance.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_TLS=true
```

### 2. Redis Configuration File

The Redis configuration is located at:
```
backend/src/config/redis.config.ts
```

Key settings:
- **TTL**: 60 seconds (default)
- **Max entries**: 10,000
- **Retry strategy**: Automatic reconnection
- **TLS**: Configurable for production

### 3. Module Integration

Redis is automatically configured in the GovernanceModule:
```typescript
// backend/src/modules/governance/governance.module.ts
CacheModule.register(redisConfig)
```

## Verification

### 1. Check Redis Connection

Run the health check:
```bash
npm run redis:health
```

Or manually test:
```bash
redis-cli ping
# Should return: PONG
```

### 2. Monitor Cache Operations

Access the cache metrics endpoint:
```bash
curl http://localhost:3000/governance/cache/metrics
```

Response:
```json
{
  "invalidations": 42,
  "warmings": 15,
  "hits": 1250,
  "misses": 58,
  "hitRate": 95.56
}
```

### 3. View Cached Data

Using Redis CLI:
```bash
redis-cli
> KEYS enforcement:*
> GET enforcement:user-123
> TTL enforcement:user-123
```

Using Redis Commander:
- Open http://localhost:8081
- Browse keys by pattern
- View key values and TTL

## Cache Key Patterns

The system uses standardized cache key patterns:

```typescript
// Enforcement status
enforcement:{userId}

// User session
session:{sessionId}

// Rate limiting
ratelimit:{userId}:{endpoint}

// Temporary locks
lock:{resource}:{id}

// Blacklist check
blacklist:{email|phone}
```

## Cache Operations

### Invalidation
Cache is automatically invalidated when:
- User is suspended
- User is unsuspended
- Features are restricted
- Restrictions are lifted
- User is terminated
- User is reinstated

### Warming
Cache is automatically warmed when:
- Enforcement status is fetched from database
- Frequently accessed users are identified

### Monitoring
Track cache performance:
- Hit rate (target: > 95%)
- Miss rate (target: < 5%)
- Invalidations count
- Warmings count

## Production Considerations

### 1. High Availability

Use Redis Cluster or Redis Sentinel:
```yaml
# Redis Cluster Configuration
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
```

### 2. Security

Enable authentication:
```bash
# redis.conf
requirepass your-secure-password
```

Enable TLS:
```env
REDIS_TLS=true
```

### 3. Memory Management

Set memory limits:
```bash
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### 4. Persistence

Enable AOF (Append-Only File):
```bash
# redis.conf
appendonly yes
appendfsync everysec
```

Or RDB snapshots:
```bash
# redis.conf
save 900 1
save 300 10
save 60 10000
```

### 5. Monitoring

Use Redis monitoring tools:
- Redis Commander (GUI)
- RedisInsight (Official GUI)
- Prometheus + Grafana
- CloudWatch (AWS)
- Azure Monitor (Azure)

Monitor key metrics:
- Memory usage
- CPU usage
- Connected clients
- Commands per second
- Hit rate
- Evicted keys

## Troubleshooting

### Connection Refused
```
Error: Redis connection refused
```

**Solution:**
1. Check if Redis is running: `redis-cli ping`
2. Verify REDIS_HOST and REDIS_PORT in .env
3. Check firewall rules
4. Verify Redis is listening on correct interface

### Authentication Failed
```
Error: NOAUTH Authentication required
```

**Solution:**
1. Set REDIS_PASSWORD in .env
2. Verify password in Redis configuration
3. Restart application

### Memory Issues
```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solution:**
1. Increase maxmemory in redis.conf
2. Set eviction policy: `maxmemory-policy allkeys-lru`
3. Clear old keys: `redis-cli FLUSHDB`

### Slow Performance
```
Cache operations taking > 100ms
```

**Solution:**
1. Check Redis memory usage
2. Monitor slow queries: `redis-cli SLOWLOG GET 10`
3. Optimize key patterns
4. Consider Redis Cluster for scaling

## Testing

### Unit Tests
Tests use in-memory cache by default:
```bash
npm test
```

### Integration Tests with Redis
```bash
# Start Redis
docker-compose -f docker-compose.redis.yml up -d

# Run tests
npm test -- --runInBand

# Stop Redis
docker-compose -f docker-compose.redis.yml down
```

### Load Testing
```bash
# Install redis-benchmark
redis-benchmark -h localhost -p 6379 -n 100000 -c 50

# Test specific operations
redis-benchmark -h localhost -p 6379 -t get,set -n 100000 -q
```

## Maintenance

### Clear Cache
```bash
# Clear all enforcement caches
redis-cli KEYS "enforcement:*" | xargs redis-cli DEL

# Clear all caches (use with caution)
redis-cli FLUSHDB
```

### Backup Data
```bash
# Manual backup
redis-cli SAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb /backup/dump.rdb
```

### Monitor Memory
```bash
# Check memory usage
redis-cli INFO memory

# Check key count
redis-cli DBSIZE

# Check largest keys
redis-cli --bigkeys
```

## Migration from In-Memory Cache

If migrating from in-memory cache:

1. **Install Redis** (see Installation Options above)
2. **Update .env** with Redis configuration
3. **Restart application** - Redis will be used automatically
4. **Monitor metrics** - Verify cache is working
5. **No code changes needed** - Cache interface remains the same

## Best Practices

1. **Use Consistent Key Patterns**: Follow REDIS_KEY_PATTERNS in redis.config.ts
2. **Set Appropriate TTLs**: Balance freshness vs. performance
3. **Monitor Hit Rate**: Target > 95% for optimal performance
4. **Implement Retry Logic**: Handle temporary connection failures
5. **Use Pipelining**: Batch multiple operations for efficiency
6. **Enable Persistence**: Prevent data loss on restart
7. **Set Memory Limits**: Prevent Redis from consuming all memory
8. **Use TLS in Production**: Encrypt data in transit
9. **Regular Backups**: Schedule automated backups
10. **Monitor Performance**: Track metrics and set alerts

## Resources

- [Redis Documentation](https://redis.io/documentation)
- [Redis Best Practices](https://redis.io/topics/best-practices)
- [Redis Security](https://redis.io/topics/security)
- [Redis Persistence](https://redis.io/topics/persistence)
- [Redis Cluster](https://redis.io/topics/cluster-tutorial)

## Support

For issues or questions:
1. Check Redis logs: `docker logs urutix-redis`
2. Check application logs for cache errors
3. Verify Redis connection: `redis-cli ping`
4. Review cache metrics: `GET /governance/cache/metrics`
5. Consult Redis documentation

## Summary

Redis provides enterprise-grade caching for the Governance module with:
- ✅ Distributed caching across instances
- ✅ Sub-millisecond performance
- ✅ Automatic expiration (60s TTL)
- ✅ Real-time metrics tracking
- ✅ High availability support
- ✅ Production-ready configuration

Start Redis with Docker Compose and the system will automatically use it for caching enforcement status.
