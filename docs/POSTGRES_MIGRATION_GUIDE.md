# 🗄️ SQLite to PostgreSQL Migration Guide

## 📋 Overview

This guide will help you migrate your Cargo AI Matching application from SQLite to PostgreSQL for better performance, scalability, and enterprise features.

## 🎯 Why PostgreSQL?

- **Performance**: Better for large datasets and complex queries
- **Scalability**: Handles concurrent users and high traffic
- **Enterprise Features**: ACID compliance, advanced indexing, partitioning
- **Production Ready**: Industry standard for production applications
- **Advanced Features**: JSON support, full-text search, geospatial data

## 🚀 Migration Steps

### Step 1: Install PostgreSQL

#### Windows:
1. **Download**: https://www.postgresql.org/download/windows/
2. **Install**: Run the installer with default settings
3. **Set Password**: Remember the postgres user password
4. **Start Service**: PostgreSQL service should start automatically

#### macOS:
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Install PostgreSQL Node.js Driver

```bash
cd backend
npm install pg @types/pg
```

### Step 3: Set Up PostgreSQL Database

```bash
cd backend
node setup-postgres.js
```

This will:
- Create the database `cargo_ai_matching`
- Create user (if needed)
- Grant necessary privileges

### Step 4: Configure Environment Variables

Create or update your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
DB_DATABASE=cargo_ai_matching

# Application Configuration
NODE_ENV=development
PORT=3000
```

### Step 5: Migrate Data from SQLite to PostgreSQL

```bash
cd backend
node migrate-to-postgres.js
```

This will:
- Connect to both SQLite and PostgreSQL
- Create all tables in PostgreSQL
- Transfer all data from SQLite to PostgreSQL
- Preserve data types and relationships

### Step 6: Update Data Source Configuration

Update `backend/src/data-source.ts`:

```typescript
import { DataSource } from "typeorm";
import { config } from "dotenv";

config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_DATABASE || "cargo_ai_matching",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [
    "src/entities/**/*.entity.ts",
    "src/modules/**/entities/*.entity.ts"
  ],
  migrations: ["src/database/migrations/*.ts"],
  subscribers: [],
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});
```

### Step 7: Test the Application

```bash
cd backend
npm run start:dev
```

Test the endpoints to ensure everything works:
```bash
curl http://localhost:3000/api
curl http://localhost:3000/test-financial
```

## 🔧 Troubleshooting

### Common Issues:

#### 1. Connection Refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS
```

#### 2. Authentication Failed
- Check your password in `.env` file
- Try connecting manually: `psql -U postgres -h localhost`

#### 3. Database Not Found
- Run the setup script: `node setup-postgres.js`
- Check database name in `.env` file

#### 4. Permission Denied
- Ensure user has proper privileges
- Check PostgreSQL configuration in `pg_hba.conf`

## 📊 Verification

### Check Database Tables:
```sql
-- Connect to PostgreSQL
psql -U postgres -d cargo_ai_matching

-- List all tables
\dt

-- Check table structure
\d invoice
\d expense
\d payment
```

### Verify Data Migration:
```sql
-- Check row counts
SELECT 'invoice' as table_name, COUNT(*) as count FROM invoice
UNION ALL
SELECT 'expense', COUNT(*) FROM expense
UNION ALL
SELECT 'payment', COUNT(*) FROM payment;
```

## 🎯 Benefits After Migration

### Performance Improvements:
- **Faster Queries**: PostgreSQL optimizer is more sophisticated
- **Better Indexing**: Advanced indexing options
- **Concurrent Access**: Handles multiple users efficiently

### Enterprise Features:
- **ACID Compliance**: Data integrity guarantees
- **Advanced Data Types**: JSON, arrays, custom types
- **Full-Text Search**: Built-in search capabilities
- **Geospatial**: PostGIS extension for location data

### Scalability:
- **Horizontal Scaling**: Read replicas, sharding
- **Vertical Scaling**: Better resource utilization
- **Connection Pooling**: Efficient connection management

## 🚀 Production Deployment

### Environment Variables for Production:
```env
DB_HOST=your-production-host
DB_PORT=5432
DB_USERNAME=your-production-user
DB_PASSWORD=your-secure-password
DB_DATABASE=cargo_ai_matching
NODE_ENV=production
```

### Security Best Practices:
1. **Use Strong Passwords**: Generate secure passwords
2. **Network Security**: Restrict database access
3. **SSL Connection**: Enable SSL in production
4. **Regular Backups**: Set up automated backups
5. **Monitoring**: Use tools like pgAdmin or Grafana

## 📈 Performance Monitoring

### Useful PostgreSQL Queries:
```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public';

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes;
```

## 🎉 Migration Complete!

After completing these steps, your application will be running on PostgreSQL with:
- ✅ All data migrated from SQLite
- ✅ Better performance and scalability
- ✅ Enterprise-grade features
- ✅ Production-ready configuration

**Your Cargo AI Matching application is now ready for enterprise deployment!** 🚀 