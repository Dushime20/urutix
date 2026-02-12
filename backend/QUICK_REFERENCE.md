# 🚀 UrutiX Quick Reference Guide

## 🔐 Login Credentials

### Admin Accounts
```
Super Admin:      urutixv@gmail.com / Admin123@
Tenant Admin:     tenant.admin@test.com / Admin123@
```

### Business Users (Password: test123)
```
Cargo Owner 1:    cargo.owner@test.com
Cargo Owner 2:    cargo.owner2@test.com
Truck Owner 1:    truck.owner@test.com
Truck Owner 2:    truck.owner2@test.com
Driver 1:         driver1@test.com
Driver 2:         driver2@test.com
```

---

## 🌐 API Endpoints

### Base URL
```
Development: http://localhost:3005
Production:  https://api.urutix.com
```

### Authentication
```
POST   /auth/login
POST   /auth/register
POST   /auth/logout
POST   /auth/refresh-token
POST   /auth/forgot-password
POST   /auth/reset-password
```

### Users
```
GET    /users/profile
PUT    /users/profile
GET    /users/:id
POST   /users
PUT    /users/:id
DELETE /users/:id
```

### Loads (Cargo)
```
GET    /loads
POST   /loads
GET    /loads/:id
PUT    /loads/:id
DELETE /loads/:id
POST   /loads/:id/publish
```

### Bids
```
GET    /bids
POST   /bids
GET    /bids/:id
PUT    /bids/:id
DELETE /bids/:id
POST   /bids/:id/accept
```

### Trucks
```
GET    /trucks
POST   /trucks
GET    /trucks/:id
PUT    /trucks/:id
DELETE /trucks/:id
```

### Trips
```
GET    /trips
POST   /trips
GET    /trips/:id
PUT    /trips/:id
PATCH  /trips/:id/status
```

---

## 💾 Database Commands

### Migrations
```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Generate new migration
npm run migration:generate -- src/migrations/MigrationName
```

### Seeding
```bash
# Seed complete system
node src/database/seeds/seed-complete-system.js

# Seed admin user
node src/database/seeds/seed-admin-user.js

# Seed tenant admin
node seed-tenant-admin.js

# Check seeded data
node check-seeded-data.js
```

### Database Utilities
```bash
# Check tables
node check-tables.js

# Check database state
node check-db-state.js

# Check migration status
node check-migration-status.js
```

---

## 🚀 Development Commands

### Backend
```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Run linter
npm run lint
```

### Frontend
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication module
│   ├── users/             # User management
│   ├── loads/             # Cargo/load management
│   ├── bids/              # Bidding system
│   ├── trucks/            # Fleet management
│   ├── trips/             # Trip tracking
│   ├── payments/          # Payment processing
│   ├── notifications/     # Notification system
│   ├── database/
│   │   ├── migrations/    # Database migrations
│   │   └── seeds/         # Seed scripts
│   ├── entities/          # TypeORM entities
│   └── config/            # Configuration files
├── .env                   # Environment variables
└── package.json

frontend/
├── src/
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── store/             # State management
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript types
├── .env                   # Environment variables
└── package.json
```

---

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=1234
DB_NAME=urutix

# Server
NODE_ENV=development
PORT=3005

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=true

# Payment
MOBILE_MONEY_API_URL=https://api.payment.ishema.rw
MOBILE_MONEY_API_KEY=your-api-key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3005
VITE_APP_NAME=UrutiX
VITE_ENABLE_ANALYTICS=false
```

---

## 📊 Database Schema

### Key Tables
```
users              - User accounts
user_profiles      - User profile information
tenants            - Organization/company data
loads              - Cargo shipment requests
bids               - Bids on loads
trucks             - Fleet vehicles
drivers            - Driver information
trips              - Trip/delivery records
payments           - Payment transactions
notifications      - User notifications
auctions           - Auction management
locations          - Pickup/delivery locations
```

### Relationships
```
users → user_profiles (1:1)
users → tenants (N:1)
loads → users (N:1) [cargoOwnerId]
bids → loads (N:1)
bids → users (N:1) [truckOwnerId]
trucks → users (N:1) [ownerId]
trips → loads (N:1)
trips → trucks (N:1)
trips → drivers (N:1)
payments → trips (N:1)
```

---

## 🎯 Common Tasks

### Create New User
```typescript
POST /auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "phone": "+254712345678",
  "role": "CARGO_OWNER",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "ABC Company"
}
```

### Create Load
```typescript
POST /loads
{
  "title": "Electronics Shipment",
  "description": "Fragile items",
  "weight": 5000,
  "volume": 25,
  "pickupDate": "2026-02-15T08:00:00Z",
  "deliveryDate": "2026-02-18T17:00:00Z",
  "locations": [
    {
      "type": "PICKUP",
      "address": "Nairobi Warehouse",
      "coordinates": { "lat": -1.2921, "lng": 36.8219 }
    },
    {
      "type": "DELIVERY",
      "address": "Mombasa Port",
      "coordinates": { "lat": -4.0435, "lng": 39.6682 }
    }
  ]
}
```

### Place Bid
```typescript
POST /bids
{
  "loadId": "uuid",
  "bidAmount": 50000,
  "bidCurrency": "USD",
  "proposedPickupDate": "2026-02-15T08:00:00Z",
  "proposedDeliveryDate": "2026-02-18T17:00:00Z",
  "bidNotes": "Experienced driver, GPS tracking included"
}
```

---

## 🐛 Debugging Tips

### Check Backend Logs
```bash
# View real-time logs
npm run start:dev

# Check specific module
DEBUG=loads:* npm run start:dev
```

### Database Queries
```sql
-- Check user count
SELECT COUNT(*) FROM users;

-- View all roles
SELECT DISTINCT role FROM users;

-- Check tenant data
SELECT * FROM tenants WHERE "isActive" = true;

-- View recent loads
SELECT * FROM loads ORDER BY "createdAt" DESC LIMIT 10;
```

### Common Issues

**Issue: Migration fails**
```bash
# Check current state
node check-db-state.js

# Reset migrations (CAUTION: Development only)
npm run migration:revert
npm run migration:run
```

**Issue: Authentication fails**
```bash
# Check user exists
SELECT * FROM users WHERE email = 'user@example.com';

# Reset password
node src/database/seeds/fix-password.js
```

**Issue: CORS errors**
```bash
# Check ALLOWED_ORIGINS in .env
# Ensure frontend URL is included
```

---

## 📱 Mobile App Integration

### API Headers
```javascript
{
  "Authorization": "Bearer <token>",
  "X-Tenant-ID": "<tenant-id>",
  "Content-Type": "application/json",
  "X-Device-ID": "<device-id>",
  "X-App-Version": "1.0.0"
}
```

### Real-time Updates (WebSocket)
```javascript
const socket = io('http://localhost:3005', {
  auth: { token: 'jwt-token' }
});

socket.on('trip:update', (data) => {
  console.log('Trip updated:', data);
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

---

## 🔒 Security Checklist

- [ ] Use HTTPS in production
- [ ] Enable JWT token expiration
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Sanitize user data
- [ ] Use prepared statements
- [ ] Enable CORS properly
- [ ] Hash passwords with bcrypt
- [ ] Implement 2FA
- [ ] Regular security audits

---

## 📚 Additional Resources

- [Full Documentation](./TENANT_SYSTEM_GUIDE.md)
- [User Credentials](./USER_CREDENTIALS.md)
- [API Documentation](./API_DOCS.md)
- [Migration Guide](./MIGRATION_SUMMARY.md)

---

**Quick Help:**
- Backend Issues: Check logs in terminal
- Database Issues: Run `node check-db-state.js`
- Auth Issues: Verify credentials in USER_CREDENTIALS.md
- API Issues: Check CORS and headers

**Support:** dev@urutix.com
