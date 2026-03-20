# RBAC Migration - Phase 5: Backend Guards & Examples

## Overview

Phase 5 provides backend implementation patterns for permission-based access control. This includes guards, decorators, and service-level permission checks.

## Files Created

### 1. Permission Guard (`permission.guard.ts`)

**Status:** ✅ Complete

**Purpose:** NestJS guard for protecting routes with permission checks

**Features:**
- Single permission check
- Multiple permissions (OR logic)
- All permissions required (AND logic)
- SUPER_ADMIN bypass
- Decorator support
- Factory function for inline usage

**Usage Examples:**

#### Basic Usage (Factory Function)

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  
  @Get()
  @UseGuards(PermissionGuard('user:view'))
  async findAll() {
    // Only users with 'user:view' permission
    return [];
  }
  
  @Post()
  @UseGuards(PermissionGuard('user:create'))
  async create(@Body() dto: CreateUserDto) {
    // Only users with 'user:create' permission
    return {};
  }
}
```

#### Multiple Permissions (OR Logic)

```typescript
@Put(':id')
@UseGuards(PermissionGuard('user:update', 'user:manage'))
async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  // User needs 'user:update' OR 'user:manage'
  return {};
}
```

#### Using Decorators

```typescript
@Get()
@RequirePermissions('user:view')
async findAll() {
  // Cleaner syntax with decorator
  return [];
}

@Post()
@RequirePermissions('user:create', 'user:manage')
async create(@Body() dto: CreateUserDto) {
  // User needs 'user:create' OR 'user:manage'
  return {};
}
```

#### All Permissions Required (AND Logic)

```typescript
@Delete(':id')
@RequireAllPermissions('user:delete', 'user:manage')
async remove(@Param('id') id: string) {
  // User needs BOTH 'user:delete' AND 'user:manage'
  return {};
}
```

#### Controller-Level Guard

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard)
@RequirePermissions('admin:access')
export class AdminController {
  // All routes require 'admin:access' permission
  
  @Get('dashboard')
  async getDashboard() {
    // Inherits 'admin:access' requirement
    return {};
  }
  
  @Get('users')
  @RequirePermissions('user:manage')
  async getUsers() {
    // Requires 'admin:access' AND 'user:manage'
    return [];
  }
}
```

### 2. Controller Examples (`user-controller.example.ts`)

**Status:** ✅ Complete

**Purpose:** Demonstrate guard usage in controllers

**Examples Included:**
- UserController - User management endpoints
- RouteController - Route management endpoints
- CargoController - Cargo management endpoints
- AdminController - Admin panel endpoints

**Patterns Demonstrated:**
- Single permission guards
- Multiple permission guards (OR)
- All permissions required (AND)
- Controller-level guards
- Method-level guards
- Combining guards
- No guard (public authenticated routes)

### 3. Service Examples (`service-permission-check.example.ts`)

**Status:** ✅ Complete

**Purpose:** Demonstrate PermissionHelper usage in services

**Examples Included:**
- UserService - User management logic
- RouteService - Route management logic
- CargoService - Cargo management logic
- AdminService - Admin panel logic
- ComplexBusinessLogic - Advanced patterns

**Patterns Demonstrated:**
- Single permission checks
- Multiple permission checks (OR)
- All permissions required (AND)
- Get all role permissions
- Conditional logic based on permissions
- Custom error messages
- Dynamic permission checks

## Implementation Guide

### Step 1: Add Guard to Module

```typescript
// app.module.ts
import { PermissionGuard } from './guards/permission.guard';
import { PermissionHelper } from './utils/permission-helper';

@Module({
  providers: [
    PermissionHelper,
    PermissionGuard,
    // ... other providers
  ],
  exports: [PermissionHelper],
})
export class AppModule {}
```

### Step 2: Protect Controller Routes

```typescript
// users.controller.ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionGuard, RequirePermissions } from '../guards/permission.guard';

@Controller('users')
@UseGuards(JwtAuthGuard) // Require authentication
export class UsersController {
  
  @Get()
  @RequirePermissions('user:view')
  async findAll() {
    return [];
  }
  
  @Post()
  @RequirePermissions('user:create')
  async create(@Body() dto: CreateUserDto) {
    return {};
  }
}
```

### Step 3: Add Service-Level Checks

```typescript
// users.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PermissionHelper } from '../utils/permission-helper';

@Injectable()
export class UsersService {
  constructor(private permissionHelper: PermissionHelper) {}
  
  async updateUser(currentUser: User, userId: string, data: any) {
    // Check permission
    const canUpdate = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      'user:update',
    );
    
    if (!canUpdate) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    // Perform update
    return this.userRepository.update(userId, data);
  }
}
```

## Guard Behavior

### Permission Check Flow

```
1. Request arrives at controller
2. JwtAuthGuard validates JWT token
3. User object attached to request
4. PermissionGuard checks:
   a. Is user authenticated?
   b. Is user SUPER_ADMIN? (bypass)
   c. Does user's role have required permission(s)?
5. If yes: Allow access
6. If no: Throw ForbiddenException
```

### SUPER_ADMIN Bypass

```typescript
// SUPER_ADMIN always bypasses permission checks
if (user.role === 'SUPER_ADMIN') {
  return true; // Allow access
}
```

### Error Responses

**Unauthenticated:**
```json
{
  "statusCode": 401,
  "message": "User not authenticated",
  "error": "Unauthorized"
}
```

**Insufficient Permissions:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required: user:manage",
  "error": "Forbidden"
}
```

## Migration Strategy

### Phase 1: High-Priority Endpoints

Protect security-critical endpoints first:

1. **User Management**
   - `POST /users` - Requires `user:create`
   - `PUT /users/:id` - Requires `user:update`
   - `DELETE /users/:id` - Requires `user:delete`

2. **Permission Management**
   - `POST /admin/permissions/roles` - Requires `permission:manage`
   - `PUT /admin/permissions/roles/:id` - Requires `permission:manage`
   - `DELETE /admin/permissions/roles/:id` - Requires `permission:manage`

3. **Tenant Management**
   - `POST /admin/tenants` - Requires `tenant:manage`
   - `PUT /admin/tenants/:id` - Requires `tenant:manage`
   - `DELETE /admin/tenants/:id` - Requires `tenant:manage`

### Phase 2: Feature Endpoints

Protect feature-specific endpoints:

1. **Cargo Management**
   - `POST /cargo` - Requires `cargo:create`
   - `PUT /cargo/:id` - Requires `cargo:update`
   - `DELETE /cargo/:id` - Requires `cargo:delete`

2. **Route Management**
   - `POST /routes` - Requires `route:create`
   - `PUT /routes/:id` - Requires `route:update`
   - `DELETE /routes/:id` - Requires `route:delete`

3. **Fleet Management**
   - `POST /fleet/trucks` - Requires `truck:create`
   - `PUT /fleet/trucks/:id` - Requires `truck:update`
   - `DELETE /fleet/trucks/:id` - Requires `truck:delete`

### Phase 3: Read Endpoints

Protect view/read endpoints:

1. **View Operations**
   - `GET /users` - Requires `user:view`
   - `GET /cargo` - Requires `cargo:view`
   - `GET /routes` - Requires `route:view`

### Phase 4: Service-Level Checks

Add permission checks in services for business logic:

1. **Complex Operations**
   - Bulk updates
   - Status changes
   - Approval workflows

2. **Conditional Logic**
   - Different behavior based on permissions
   - Feature flags based on permissions

## Testing

### Unit Tests

```typescript
describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let permissionHelper: PermissionHelper;
  
  beforeEach(() => {
    permissionHelper = new PermissionHelper(/* deps */);
    guard = new PermissionGuard(new Reflector(), permissionHelper);
  });
  
  it('should allow SUPER_ADMIN', async () => {
    const context = createMockContext({ role: 'SUPER_ADMIN' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
  
  it('should allow user with permission', async () => {
    jest.spyOn(permissionHelper, 'roleHasPermission').mockResolvedValue(true);
    const context = createMockContext({ role: 'ADMIN' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
  
  it('should deny user without permission', async () => {
    jest.spyOn(permissionHelper, 'roleHasPermission').mockResolvedValue(false);
    const context = createMockContext({ role: 'USER' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
```

### Integration Tests

```typescript
describe('UsersController (e2e)', () => {
  it('should allow user with permission to create user', () => {
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'test@example.com' })
      .expect(201);
  });
  
  it('should deny user without permission', () => {
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: 'test@example.com' })
      .expect(403);
  });
});
```

## Performance Considerations

### Caching

The PermissionHelper uses caching:
- **Cache TTL:** 5 minutes
- **Cache Key:** `role:${roleName}`
- **Cache Hit Rate:** >95% expected

### Optimization Tips

1. **Use Controller-Level Guards**
   ```typescript
   // Good: One guard for entire controller
   @Controller('users')
   @RequirePermissions('user:manage')
   export class UsersController {}
   
   // Less optimal: Guard on every method
   @Controller('users')
   export class UsersController {
     @Get()
     @RequirePermissions('user:manage')
     async findAll() {}
     
     @Post()
     @RequirePermissions('user:manage')
     async create() {}
   }
   ```

2. **Avoid Redundant Checks**
   ```typescript
   // Good: Guard handles permission check
   @Post()
   @RequirePermissions('user:create')
   async create(@Body() dto: CreateUserDto) {
     return this.service.create(dto);
   }
   
   // Redundant: Don't check again in service
   async create(dto: CreateUserDto) {
     // No need to check permission again
     return this.repository.save(dto);
   }
   ```

3. **Use Service Checks for Complex Logic**
   ```typescript
   // Use service checks when business logic requires it
   async updateUser(currentUser: User, userId: string, data: any) {
     // Check if user can update this specific user
     if (userId !== currentUser.id) {
       const canUpdateOthers = await this.permissionHelper.roleHasPermission(
         currentUser.role,
         'user:update:others',
       );
       
       if (!canUpdateOthers) {
         throw new ForbiddenException('Can only update own profile');
       }
     }
     
     return this.repository.update(userId, data);
   }
   ```

## Best Practices

### 1. Always Require Authentication First

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard) // Always first
@RequirePermissions('user:manage') // Then permission
export class UsersController {}
```

### 2. Use Descriptive Permission Names

```typescript
// Good
@RequirePermissions('user:create')
@RequirePermissions('cargo:update')
@RequirePermissions('route:assign')

// Bad
@RequirePermissions('create')
@RequirePermissions('update')
@RequirePermissions('assign')
```

### 3. Provide Clear Error Messages

```typescript
if (!canUpdate) {
  throw new ForbiddenException(
    'You do not have permission to update users. Please contact your administrator.'
  );
}
```

### 4. Document Required Permissions

```typescript
/**
 * Create a new user
 * 
 * @requires user:create permission
 * @param dto User creation data
 * @returns Created user
 */
@Post()
@RequirePermissions('user:create')
async create(@Body() dto: CreateUserDto) {
  return this.service.create(dto);
}
```

### 5. Use Swagger Documentation

```typescript
@ApiOperation({ summary: 'Create user' })
@ApiSecurity('bearer')
@ApiResponse({ status: 201, description: 'User created' })
@ApiResponse({ status: 403, description: 'Insufficient permissions' })
@RequirePermissions('user:create')
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.service.create(dto);
}
```

## Common Patterns

### Pattern 1: View vs Manage

```typescript
// View: Read-only access
@Get()
@RequirePermissions('resource:view')
async findAll() {}

// Manage: Full CRUD access
@Post()
@RequirePermissions('resource:manage')
async create() {}

@Put(':id')
@RequirePermissions('resource:manage')
async update() {}

@Delete(':id')
@RequirePermissions('resource:manage')
async remove() {}
```

### Pattern 2: Hierarchical Permissions

```typescript
// Admin access required for all admin routes
@Controller('admin')
@RequirePermissions('admin:access')
export class AdminController {
  
  // Additional permission for specific actions
  @Get('users')
  @RequirePermissions('user:manage')
  async getUsers() {}
  
  @Get('tenants')
  @RequirePermissions('tenant:manage')
  async getTenants() {}
}
```

### Pattern 3: OR Logic for Flexibility

```typescript
// User needs ANY of these permissions
@Put(':id')
@RequirePermissions('resource:update', 'resource:manage')
async update() {}
```

### Pattern 4: AND Logic for Security

```typescript
// User needs ALL of these permissions
@Delete(':id')
@RequireAllPermissions('resource:delete', 'resource:manage')
async remove() {}
```

## Troubleshooting

### Issue: Guard Not Working

**Check:**
1. Is guard registered in module?
2. Is JwtAuthGuard applied first?
3. Is user object attached to request?
4. Are permissions in database?

### Issue: Always Getting 403

**Check:**
1. Does role have permission in database?
2. Is permission name spelled correctly?
3. Is cache stale? (restart backend)
4. Is user's role correct?

### Issue: SUPER_ADMIN Getting 403

**Check:**
1. Is role exactly 'SUPER_ADMIN'?
2. Is bypass logic in guard?
3. Check guard implementation

## Next Steps

### Immediate

1. **Add guards to existing controllers**
   - Start with admin controllers
   - Move to feature controllers
   - Add to read endpoints

2. **Add service-level checks**
   - Complex business logic
   - Conditional operations
   - Validation logic

### Future

3. **Add audit logging**
   - Log permission checks
   - Log access denials
   - Track permission usage

4. **Add permission analytics**
   - Most used permissions
   - Denied access patterns
   - Permission optimization

## Success Criteria

✅ **Phase 5 Complete:**
- [x] Permission guard created
- [x] Controller examples provided
- [x] Service examples provided
- [x] Documentation complete
- [x] Testing patterns documented
- [x] Best practices documented

## Status

✅ **PHASE 5 COMPLETE** - Backend guards ready for implementation

All utilities, examples, and documentation are in place. Controllers and services can now be protected with permission-based access control.

**Recommendation:** Start migrating high-priority endpoints (user management, permission management, tenant management) first.
