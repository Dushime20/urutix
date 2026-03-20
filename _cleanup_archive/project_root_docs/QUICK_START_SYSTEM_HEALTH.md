# Quick Start: System Health Dashboard

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Backend running on port 3000
- Frontend running on port 5173
- PostgreSQL database configured
- Super Admin account created

### Step 1: Run Migration (1 minute)
```bash
cd urutix/backend
node run-enhanced-system-health-migration.js
```

Expected output:
```
✅ Migration completed successfully!
✅ system_health_summary view created successfully
✅ All verifications passed!
```

### Step 2: Register Services (2 minutes)

Open `urutix/backend/src/modules/admin/admin.module.ts` and add:

```typescript
import { EnhancedSystemHealthService } from '../../services/enhanced-system-health.service';
import { EnhancedSystemHealthController } from './enhanced-system-health.controller';
import { SystemHealthLog } from '../../entities/system-health.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemHealthLog]),
    // ... other imports
  ],
  controllers: [
    // ... other controllers
    EnhancedSystemHealthController,
  ],
  providers: [
    // ... other providers
    EnhancedSystemHealthService,
  ],
})
export class AdminModule {}
```

### Step 3: Add Frontend Route (1 minute)

Open your frontend router file and add:

```typescript
import SystemHealthDashboard from './pages/admin/SystemHealthDashboard';

// In your routes array
{
  path: '/admin/system-health',
  element: <SystemHealthDashboard />,
}
```

### Step 4: Restart Services (1 minute)

```bash
# Terminal 1 - Backend
cd urutix/backend
npm run start:dev

# Terminal 2 - Frontend
cd urutix/frontend
npm run dev
```

### Step 5: Access Dashboard

1. Login as Super Admin
2. Navigate to: `http://localhost:5173/admin/system-health`
3. You should see:
   - Real-time metrics (CPU, Memory, Database, API)
   - Threshold violation alerts (if any)
   - Historical trend charts
   - Auto-refresh every 30 seconds

## 🧪 Quick Test

Run the test script to verify everything works:

```bash
cd urutix/backend
node test-enhanced-system-health.js
```

Expected output:
```
✅ currentMetrics
✅ historicalMetrics
✅ metricsByCategory
✅ thresholdViolations
✅ exportMetrics

Total: 5/5 tests passed
🎉 All tests passed!
```

## 📊 What You'll See

### Dashboard Sections

1. **Header**
   - Last update timestamp
   - Refresh button
   - Export CSV button

2. **Threshold Violations Alert** (if any)
   - Number of violations
   - Severity indicators
   - Affected metrics

3. **Server Metrics Cards**
   - CPU Usage (%)
   - Memory Usage (%)
   - Disk Usage
   - Network I/O

4. **Database Metrics Cards**
   - Active Connections
   - Active Queries
   - Average Query Time
   - Slow Queries Count

5. **API Metrics Cards**
   - Requests per Minute
   - Average Response Time
   - Error Rate
   - P95 Response Time

6. **Historical Trend Charts**
   - CPU Usage Over Time
   - Memory Usage Over Time
   - Database Query Time
   - API Response Time

## 🎨 Color Indicators

- 🟢 **Green**: Healthy (within normal range)
- 🟡 **Yellow**: Warning (approaching threshold)
- 🔴 **Red**: Critical (exceeded threshold)

## 🔧 Troubleshooting

### Migration Fails
```bash
# Check database connection
node urutix/backend/check-postgres-database.js

# Verify table exists
psql -d urutix -c "SELECT * FROM system_health_logs LIMIT 1;"
```

### No Metrics Showing
1. Check backend logs for errors
2. Verify cron job is running (check logs every 30 seconds)
3. Ensure Super Admin permissions are set correctly

### Frontend Not Loading
1. Check browser console for errors
2. Verify API URL in frontend .env file
3. Check authentication token is valid

### API Returns 401 Unauthorized
1. Verify you're logged in as Super Admin
2. Check token in localStorage
3. Verify RBAC permissions include 'super_admin'

## 📖 API Endpoints

### Get Current Metrics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/system-health/enhanced/current
```

### Get Historical Data
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/system-health/enhanced/historical?startDate=2024-02-01T00:00:00Z&endDate=2024-02-15T23:59:59Z"
```

### Check Threshold Violations
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/system-health/enhanced/thresholds
```

### Export CSV
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/system-health/enhanced/export?startDate=2024-02-01T00:00:00Z&endDate=2024-02-15T23:59:59Z" \
  -o metrics.csv
```

## ⚙️ Configuration

### Adjust Collection Frequency

Edit `enhanced-system-health.service.ts`:

```typescript
// Change from 30 seconds to 1 minute
@Cron(CronExpression.EVERY_MINUTE)
async collectAndStoreMetrics(): Promise<void> {
  // ...
}
```

### Adjust Cache TTL

Edit `enhanced-system-health.service.ts`:

```typescript
// Change from 30 seconds to 60 seconds
private readonly CACHE_TTL_MS = 60000; // 60 seconds
```

### Customize Thresholds

Edit the `THRESHOLDS` constant in `enhanced-system-health.service.ts`:

```typescript
const THRESHOLDS = {
  database: {
    avgQueryTime: { warning: 150, critical: 750 }, // Adjust values
  },
  // ... other thresholds
};
```

## 📚 Next Steps

1. **Explore the Dashboard**: Click around, refresh, export data
2. **Monitor Violations**: Watch for threshold alerts
3. **Review Historical Trends**: Check 24-hour patterns
4. **Export Data**: Download CSV for external analysis
5. **Customize**: Adjust thresholds based on your needs

## 🎉 Success!

You now have a fully functional System Health Dashboard monitoring your entire infrastructure in real-time!

For detailed documentation, see:
- `SYSTEM_HEALTH_DASHBOARD_COMPLETE.md` - Full implementation details
- `SYSTEM_HEALTH_DASHBOARD_IMPLEMENTATION.md` - Technical documentation
- `.kiro/specs/super-admin-enhancement/` - Original specification

## 💡 Tips

- Dashboard auto-refreshes every 30 seconds - no need to manually refresh
- Export CSV regularly for historical analysis
- Set up alerts for critical violations (future enhancement)
- Monitor trends to identify patterns and optimize performance
- Use category filters to focus on specific metrics

## 🆘 Need Help?

Check the logs:
```bash
# Backend logs
cd urutix/backend
npm run start:dev

# Look for:
# - "Metrics collected and stored successfully" (every 30s)
# - "Threshold violation: ..." (when violations occur)
```

Happy monitoring! 📊✨
