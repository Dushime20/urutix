# Feature Permission / Capability Management

Enterprise capability layer for Urutix. Extends existing RBAC (`permissions`, `roles`, `role_permissions`) with **global feature kill-switches** and authoritative backend enforcement.

## Architecture

```text
Authentication (JWT)
    ↓
Tenant isolation
    ↓
Global feature control (feature_controls)     ← NEW
    ↓
Tenant feature override (optional TENANT scope)
    ↓
Role / user permission (existing RBAC)
    ↓
Business rules (ownership, bid conflicts, etc.)
```

Backend is authoritative. Frontend `can()` / `hasPermission()` are UX only.

## Permission naming

Use existing codes: `resource:action`

Examples:

| Capability | Code |
|------------|------|
| Create bid | `bids:create` |
| Accept / manage bid | `bids:manage` |
| Create auction | `auctions:create` |
| Smart matching request | `matching:request` |
| Smart matching respond | `matching:respond` |
| Cargo create | `cargo:create` |
| Trip start | `trips:start` |
| Broker assign | `brokers:assign` |

Do **not** invent parallel codes like `CARGO_BID_CREATE` unless you also seed them into `permissions`.

## Evaluation order

1. Authenticated?
2. Tenant valid?
3. Platform `feature_controls.enabled`? (missing row = ENABLED)
4. Tenant override? (cannot enable if platform is OFF)
5. Role / user permission granted?
6. Existing business authorization / validation

**Fail closed** on evaluation errors for protected capability checks.

## Global feature controls

Table: `feature_controls`

- `scope = PLATFORM` → kills capability for everyone
- `scope = TENANT` → optional per-tenant OFF (cannot override global OFF)
- Protected codes (e.g. `users:permissions.manage`) cannot be disabled

Admin APIs (Super Admin mutations):

```text
GET    /api/admin/feature-controls
GET    /api/admin/feature-controls/disabled
GET    /api/admin/feature-controls/audit
PATCH  /api/admin/feature-controls
```

Super Admin UI: **Admin → Permissions → Feature Controls** (`/admin/feature-controls`)

Role matrix remains at `/admin/permissions`.

## Backend enforcement

Two layers — **existing API behavior is unchanged** unless permissions apply:

### 1. Normal users (no admin overrides)

JWT + `@Roles` / service logic work exactly as before. No capability check on most endpoints.

### 2. Users with admin grant/deny (`user_permissions` rows)

`UserPermissionOverrideGuard` (global) blocks only when a **denied** capability matches the route (e.g. deny `auctions:view` → `GET /bidding/auctions` returns 403).

### 3. Endpoints with `@RequirePermissions` (opt-in)

`PermissionsGuard` on those handlers only. Checks capability **with role fallback** so role-based access still works if the permission DB is incomplete.

Permission resolution on opt-in endpoints:

1. Explicit user **DENY** → block  
2. Feature kill-switch → block  
3. Effective permission → allow  
4. Else matching **role** (@Roles or catalog default) → allow  

Per-user **deny** always wins over role fallback.

403 body shape:

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "code": "FEATURE_DISABLED",
  "permission": "bids:create",
  "message": "Cargo bidding is currently unavailable. Please contact your administrator for more information.",
  "scope": "PLATFORM"
}
```

## Frontend enforcement

`PermissionContext` loads `GET /api/auth/capabilities` and exposes:

```ts
can('bids:create')
cannot('bids:create')
hasPermission('bids:create')
isFeatureEnabled('bids:create')
```

Capabilities refresh periodically so kill-switches apply without logout. Backend still denies direct API calls immediately.

## Cache invalidation

`CapabilityService` keeps a short in-memory TTL (~30s) and clears cache on feature updates. Permissions are not embedded in JWT.

## Audit

Feature toggles append to `permission_audit_log` with `entity_type = 'feature_control'`.

## Per-user permission control (`/admin/users`)

Open **Manage** on any user (Truck Owner, Cargo Owner, Driver, Lender, …).

You can Grant / Deny / Restore capabilities such as:

| Category | Examples |
|----------|----------|
| Cargo | `cargo:create`, `cargo:publish`, `cargo:edit` |
| Truck | `fleet:create`, `fleet:edit` |
| Bidding | `bids:create`, `bids:manage`, `auctions:create` |
| Smart Matching | `matching:request`, `matching:respond` |
| Trips | `trips:start`, `trips:complete` |
| Lending | `lending:create_request`, `lending:approve` |

If the drawer only shows Analytics, click **Sync catalog**, then **redeploy/restart the backend** so it loads the latest catalog.  
`POST /api/admin/permissions/sync-catalog` upserts from the JSON catalog into the DB.

API:

```text
POST /api/admin/permissions/sync-catalog
GET  /api/admin/permissions/users/:userId/detail
PUT  /api/admin/permissions/users/:userId   { grants, denies, revokes, reason }
```

Only `SUPER_ADMIN` can mutate user overrides.

## Where to define permissions (professional approach)

**Do both — JSON is the source of truth; DB is the runtime store.**

| Layer | Role |
|-------|------|
| `backend/src/config/permission-catalog.json` | Version-controlled catalog (add new permissions here) |
| `permissions` table | Runtime rows used by RBAC, grants/denies, UI |
| Boot + `node seed-permissions.js` + `POST …/sync-catalog` | Upserts JSON → DB (idempotent, schema-aware) |

### Production schema note

Live DB (`000_base_schema`) requires:

```text
permissions.name  VARCHAR UNIQUE NOT NULL   -- value = "resource:action" e.g. cargo:create
permissions."createdAt" / "updatedAt"
```

Seeders **must** set `name`. Do not insert only `resource` + `action`.

Why not DB-only? Manual SQL drifts across environments and is hard to review in PRs.  
Why not JSON-only? Role/user overrides and FKs need DB rows.

To add a capability (e.g. `cargo:archive`):

1. Add an entry to `permission-catalog.json`
2. Optionally add it under `roleDefaults` for roles that should inherit it
3. Redeploy backend (or run `docker compose exec backend node seed-permissions.js`)
4. Protect the API with `@RequirePermissions('cargo:archive')`

## How to protect a new feature

1. **Register permission** in `permission-catalog.json` (then sync to DB).
2. **Assign to roles** via Super Admin Role Permissions (or `roleDefaults` in the JSON).
3. **Protect backend endpoint**:

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('module:action')
```

4. **Frontend**: wrap actions with `can('module:action')` / `ProtectedAction`.
5. **Tests**: enable/disable feature control + direct API 403 + regression when enabled.
6. **Optional**: add a user-facing message in `CapabilityService.userFacingDisabledMessage`.

## Super Admin workflow

1. Open **Feature Controls** to globally disable a capability (e.g. `bids:create`).
2. Or open **Role Permissions** to remove a capability from one role only.
3. Review **Permission Audit** / activity logs for who changed what.

Tenant admins cannot modify platform feature controls.
