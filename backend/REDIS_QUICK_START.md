# Redis Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start Redis
```bash
cd backend
npm run redis:start
```

This will:
- Start Redis server on port 6379
- Start Redis Commander GUI on port 8081
- Create persistent data volume

### Step 2: Verify Connection
```bash
npm run redis:health
```

Expected output:
```
✅ Connected successfully!
✅ PING response: PONG
✅ Redis health check completed successfully!
```

### Step 3: Start Application
```bash
npm run start:dev
```

The application will automatically use Redis for caching!

## 🎯 Quick Commands

```bash
# Start Redis
npm run redis:start

# Check Redis health
npm run redis:health

# View Redis logs
npm run redis:logs

# Stop Redis
npm run redis:stop

# View cache metrics
curl http://localhost:3000/governance/cache/metrics

# Open Redis GUI
open http://localhost:8081
```

## 📊 Monitor Cache Performance

### Via API
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

### Via Redis Commander
1. Open http://localhost:8081
2. Browse keys: `enforcement:*`
3. View values and TTLs
4. Monitor real-time operations

### Via Redis CLI
```bash
redis-cli

# List enforcement keys
KEYS enforcement:*

# Get a value
GET enforcement:user-123

# Check TTL
TTL enforcement:user-123

# Monitor commands
MONITOR
```

## 🔧 Configuration

Redis is configured via `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false
```

## 🐛 Troubleshooting

### Redis not starting?
```bash
# Check if port 6379 is in use
netstat -an | findstr 6379

# View Docker logs
docker logs urutix-redis

# Restart Redis
npm run redis:stop
npm run redis:start
```

### Connection refused?
```bash
# Verify Redis is running
redis-cli ping

# Check .env configuration
cat .env | grep REDIS

# Run health check
npm run redis:health
```

### Can't see cached data?
```bash
# Check if keys exist
redis-cli KEYS "enforcement:*"

# Trigger cache by making a request
curl http://localhost:3000/api/some-endpoint

# Check metrics
curl http://localhost:3000/governance/cache/metrics
```

## 📚 More Information

- **Full Setup Guide:** `REDIS_SETUP_GUIDE.md`
- **Integration Details:** `src/modules/governance/REDIS_INTEGRATION_COMPLETE.md`
- **Configuration:** `src/config/redis.config.ts`

## ✅ Verification Checklist

- [ ] Redis started: `npm run redis:start`
- [ ] Health check passed: `npm run redis:health`
- [ ] Application started: `npm run start:dev`
- [ ] Cache metrics accessible: `curl http://localhost:3000/governance/cache/metrics`
- [ ] Redis GUI accessible: http://localhost:8081

## 🎉 You're Ready!

Redis is now caching enforcement status with:
- ✅ Sub-millisecond performance
- ✅ Distributed caching
- ✅ Automatic expiration (60s TTL)
- ✅ Real-time monitoring

Happy caching! 🚀
