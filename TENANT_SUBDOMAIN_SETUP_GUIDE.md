# Tenant Subdomain Setup Guide

## Overview

Enable multi-tenant subdomain routing so each tenant can access the application via their own subdomain:
- `gasa.urutix.com` → Gasa tenant
- `acme.urutix.com` → Acme tenant
- `admin.urutix.com` → Super admin panel

## Architecture

```
Request Flow:
1. User visits: tenant1.urutix.com
2. DNS resolves to your server
3. Backend extracts subdomain from hostname
4. Backend identifies tenant from subdomain
5. Backend returns tenant-specific data
6. Frontend displays tenant-branded UI
```

## Implementation Steps

### 1. Backend: Subdomain Extraction Middleware

Create a middleware to extract and validate tenant from subdomain.

**File**: `backend/src/middleware/tenant-subdomain.middleware.ts`

```typescript
import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';

@Injectable()
export class TenantSubdomainMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.hostname || req.headers.host?.split(':')[0];
    
    if (!host) {
      return next();
    }

    // Extract subdomain
    const parts = host.split('.');
    
    // Skip if localhost or IP address
    if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return next();
    }

    // For development: localhost:3000 or 127.0.0.1:3000
    if (parts.length < 2) {
      return next();
    }

    // Extract subdomain (first part before main domain)
    const subdomain = parts[0];

    // Reserved subdomains for system use
    const reservedSubdomains = ['www', 'api', 'admin', 'app', 'mail', 'ftp'];
    
    if (reservedSubdomains.includes(subdomain)) {
      // Allow admin subdomain for super admin access
      if (subdomain === 'admin') {
        req['isSuperAdmin'] = true;
      }
      return next();
    }

    // Look up tenant by subdomain
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { 
          subdomain,
          status: 'ACTIVE',
          deleted_at: null 
        },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant not found for subdomain: ${subdomain}`);
      }

      // Attach tenant to request
      req['tenant'] = tenant;
      req['tenantId'] = tenant.id;
      req['subdomain'] = subdomain;

    } catch (error) {
      throw new NotFoundException(`Invalid subdomain: ${subdomain}`);
    }

    next();
  }
}
```

### 2. Register Middleware in App Module

**File**: `backend/src/app.module.ts`

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TenantSubdomainMiddleware } from './middleware/tenant-subdomain.middleware';
import { Tenant } from './entities/tenant.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    // ... existing imports
    TypeOrmModule.forFeature([Tenant]),
  ],
  // ... rest of module
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantSubdomainMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
```

### 3. Update Auth Service to Use Subdomain

**File**: `backend/src/modules/auth/enhanced-auth.service.ts`

Add method to get tenant from request:

```typescript
async loginWithSubdomain(email: string, password: string, subdomain?: string) {
  // Find user
  const user = await this.userRepository.findOne({
    where: { email },
    relations: ['tenant'],
  });

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // If subdomain provided, verify user belongs to that tenant
  if (subdomain && user.tenant.subdomain !== subdomain) {
    throw new UnauthorizedException('User does not belong to this tenant');
  }

  // Check tenant status
  if (user.tenant.status !== 'ACTIVE') {
    throw new UnauthorizedException('Tenant is not active');
  }

  // Generate tokens
  return this.generateTokens(user);
}
```

### 4. Frontend: Subdomain Detection

**File**: `frontend/src/utils/subdomain.ts`

```typescript
export function getSubdomain(): string | null {
  const hostname = window.location.hostname;
  
  // Skip for localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  const parts = hostname.split('.');
  
  // Need at least subdomain.domain.tld
  if (parts.length < 3) {
    return null;
  }

  const subdomain = parts[0];
  
  // Reserved subdomains
  const reserved = ['www', 'api', 'admin', 'app'];
  if (reserved.includes(subdomain)) {
    return null;
  }

  return subdomain;
}

export function isAdminSubdomain(): boolean {
  const hostname = window.location.hostname;
  return hostname.startsWith('admin.');
}

export function getTenantFromSubdomain(): string | null {
  return getSubdomain();
}
```

### 5. Update Frontend API Client

**File**: `frontend/src/services/api.ts`

```typescript
import axios from 'axios';
import { getSubdomain } from '../utils/subdomain';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add subdomain to requests
api.interceptors.request.use((config) => {
  const subdomain = getSubdomain();
  if (subdomain) {
    config.headers['X-Tenant-Subdomain'] = subdomain;
  }
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;
```

### 6. DNS Configuration

#### Development (Local Testing)

Edit your hosts file to test subdomains locally:

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux**: `/etc/hosts`

Add:
```
127.0.0.1 gasa.localhost
127.0.0.1 acme.localhost
127.0.0.1 admin.localhost
```

Then access:
- `http://gasa.localhost:5173` (frontend)
- `http://gasa.localhost:3000` (backend)

#### Production (Real Domain)

Configure DNS with wildcard subdomain:

**DNS Records**:
```
Type    Name    Value               TTL
A       @       your.server.ip      300
A       *       your.server.ip      300
CNAME   www     urutix.com          300
```

This allows:
- `urutix.com` → Main site
- `*.urutix.com` → All subdomains point to your server
- `tenant1.urutix.com`, `tenant2.urutix.com`, etc.

### 7. Nginx Configuration (Production)

**File**: `/etc/nginx/sites-available/urutix`

```nginx
# Wildcard subdomain configuration
server {
    listen 80;
    server_name *.urutix.com urutix.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# SSL configuration (after getting certificates)
server {
    listen 443 ssl http2;
    server_name *.urutix.com urutix.com;

    ssl_certificate /etc/letsencrypt/live/urutix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/urutix.com/privkey.pem;

    # Same location blocks as above
}
```

### 8. SSL Certificates (Let's Encrypt)

Get wildcard SSL certificate:

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get wildcard certificate
sudo certbot certonly --manual --preferred-challenges dns \
  -d urutix.com -d *.urutix.com

# Follow instructions to add DNS TXT record
# Certificate will be saved to /etc/letsencrypt/live/urutix.com/
```

### 9. Environment Variables

**Backend** `.env`:
```env
# Domain configuration
MAIN_DOMAIN=urutix.com
ALLOWED_SUBDOMAINS=*

# CORS - allow all subdomains
ALLOWED_ORIGINS=https://*.urutix.com,https://urutix.com,http://localhost:5173
```

**Frontend** `.env`:
```env
VITE_API_URL=https://api.urutix.com
VITE_MAIN_DOMAIN=urutix.com
```

### 10. Update CORS Configuration

**File**: `backend/src/main.ts`

```typescript
app.enableCors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedDomains = [
      'urutix.com',
      'localhost',
      '127.0.0.1',
    ];

    // Check if origin matches main domain or any subdomain
    const isAllowed = allowedDomains.some(domain => 
      origin.includes(domain)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});
```

## Testing

### 1. Check Tenant Subdomains in Database

```sql
SELECT id, name, subdomain, status 
FROM tenants 
WHERE deleted_at IS NULL;
```

### 2. Test Subdomain Resolution

```bash
# Test locally
curl -H "Host: gasa.localhost" http://localhost:3000/api/health

# Test production
curl https://gasa.urutix.com/api/health
```

### 3. Test Login with Subdomain

```bash
curl -X POST https://gasa.urutix.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@gasa.com","password":"password"}'
```

## Tenant Branding

### Dynamic Theming Based on Subdomain

**File**: `frontend/src/hooks/useTenantTheme.ts`

```typescript
import { useEffect, useState } from 'react';
import { getSubdomain } from '../utils/subdomain';
import api from '../services/api';

export function useTenantTheme() {
  const [theme, setTheme] = useState(null);
  const subdomain = getSubdomain();

  useEffect(() => {
    if (subdomain) {
      api.get(`/tenants/theme/${subdomain}`)
        .then(res => setTheme(res.data))
        .catch(err => console.error('Failed to load tenant theme', err));
    }
  }, [subdomain]);

  return theme;
}
```

## Troubleshooting

### Issue: Subdomain not resolving
- Check DNS propagation: `nslookup tenant.urutix.com`
- Verify wildcard DNS record exists
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### Issue: CORS errors
- Verify ALLOWED_ORIGINS includes subdomain pattern
- Check browser console for exact origin being blocked
- Ensure credentials: true in CORS config

### Issue: Tenant not found
- Verify tenant has subdomain set in database
- Check tenant status is ACTIVE
- Ensure middleware is registered correctly

## Security Considerations

1. **Subdomain Validation**: Always validate subdomain against database
2. **Tenant Isolation**: Ensure users can only access their tenant's data
3. **Reserved Subdomains**: Block system subdomains (admin, api, www)
4. **SSL Required**: Always use HTTPS in production
5. **Rate Limiting**: Apply per-subdomain rate limits

## Next Steps

1. Implement tenant-specific branding (logo, colors)
2. Add tenant-specific email domains
3. Set up tenant-specific file storage
4. Implement tenant usage analytics
5. Add tenant-specific feature flags

---

This setup provides a complete multi-tenant subdomain system with proper isolation and security.
