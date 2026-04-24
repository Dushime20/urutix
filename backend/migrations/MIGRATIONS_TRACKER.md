# Database Migrations Tracker

This file tracks all database migrations and their status. Update this file when adding new migrations.

## Migration Naming Convention

Migrations should follow this format:
```
XXX_descriptive_name.sql
```

Where:
- `XXX` = Sequential number (001, 002, 003, etc.)
- `descriptive_name` = Brief description of what the migration does
- `.sql` = SQL file extension

## How to Add a New Migration

1. Create a new SQL file in the `migrations/` directory
2. Use the next available number in sequence
3. Add an entry to this tracker file
4. Test the migration locally
5. Commit both the migration file and this tracker
6. Run `node run-all-migrations.js` to apply

## Migration List

| # | File Name | Description | Date Added | Status |
|---|-----------|-------------|------------|--------|
| 001 | 001_add_lending_tables.sql | Add lending system tables | - | ✅ |
| 002 | 002_enhance_lending_schema.sql | Enhance lending schema | - | ✅ |
| 003 | 003_rbac_permissions_system.sql | Add RBAC permissions system | - | ✅ |
| 004 | 004_broker_critical_features.sql | Add broker critical features | - | ✅ |
| 005 | 005_broker_intelligence_features.sql | Add broker intelligence features | - | ✅ |
| 006 | 006_subscription_credit_system.sql | Add subscription credit system | - | ✅ |
| 007 | 007_credit_pricing_rules.sql | Add credit pricing rules | - | ✅ |
| 008 | 008_email_templates.sql | Add email templates | - | ✅ |
| 009 | 009_bulk_email_logs.sql | Add bulk email logs | - | ✅ |
| 010 | 010_system_health_logs.sql | Add system health logs | - | ✅ |
| 011 | 011_enhanced_system_health.sql | Enhanced system health monitoring | - | ✅ |
| 012 | 012_add_user_id_to_credit_accounts.sql | Add user_id to credit accounts | - | ✅ |
| 013 | 013_super_admin_phase1_tables.sql | Add super admin phase 1 tables | - | ✅ |
| 014 | 014_add_load_constraints.sql | Add load constraints | - | ✅ |
| 015 | 015_fuel_wallet_budget_advance.sql | Add fuel wallet budget advance | - | ✅ |
| 016 | 016_add_owner_id_to_fuel_wallets.sql | Add owner_id to fuel wallets | - | ✅ |
| 017 | 017_add_unique_constraint_tenant_email.sql | Add unique constraint for tenant email | - | ✅ |
| 018 | 018_notification_system.sql | Add notification system | - | ✅ |
| 019 | 019_make_password_hash_nullable.sql | Make password hash nullable | - | ✅ |
| 020 | 020_user_kyc_system_enhancement.sql | Enhance user KYC system | - | ✅ |
| 021 | 021_cargo_owner_analytics_foundation.sql | Add cargo owner analytics foundation | - | ✅ |
| 022 | 022_tenant_kyc_system.sql | Add tenant KYC system | - | ✅ |
| 023 | 023_operational_analytics.sql | Add operational analytics | - | ✅ |
| 025 | 025_ai_insights.sql | Add AI insights | - | ✅ |
| 026 | 026_advanced_analytics_phase4.sql | Add advanced analytics phase 4 | - | ✅ |
| 027 | 027_add_onboarding_step_column.sql | Add onboarding step column | - | ✅ |
| 028 | 028_update_subscription_plans_credit_based.sql | Update subscription plans to credit-based | - | ✅ |
| 029 | 029_add_user_id_to_tenant_subscriptions.sql | Add user_id to tenant subscriptions | - | ✅ |
| 030 | 030_add_user_id_to_credit_accounts.sql | Add user_id to credit accounts (duplicate?) | - | ✅ |
| 032 | 032_add_parent_subscription_id_to_plans.sql | Add parent subscription ID to plans | - | ✅ |
| 033 | 033_add_partner_plan_slots.sql | Add partner plan slots | - | ✅ |
| 034 | 034_add_revenue_tracking_to_credit_accounts.sql | Add revenue tracking to credit accounts | - | ✅ |
| 035 | 035_add_user_id_to_credit_transactions.sql | Add user_id to credit transactions | - | ✅ |
| 036 | 036_create_credit_marketplace_settings.sql | Create credit marketplace settings | - | ✅ |

| 037 | 037_new_feature.sql | new feature | 2026-04-13 | ⏳ |
## Notes

### Missing Numbers
- 024, 031 - Skipped or removed

### Previously Resolved
- 022 was a gap, now filled by `022_tenant_kyc_system.sql` (renumbered from duplicate 019)
- `006_subscription_credit_system_simple.sql` removed (was a redundant duplicate of 006)

## Migration Status Tracking

The `run-all-migrations.js` script automatically tracks migration execution in the `schema_migrations` table.

### Check Migration Status
```bash
node run-all-migrations.js --status
```

### Run All Pending Migrations
```bash
node run-all-migrations.js
```

### Force Re-run All Migrations
```bash
node run-all-migrations.js --force
```

### Rollback Last Migration
```bash
node run-all-migrations.js --rollback
```

## Collaboration Guidelines

### Before Pulling Changes
1. Check this tracker file for new migrations
2. Run `node run-all-migrations.js --status` to see pending migrations
3. Run `node run-all-migrations.js` to apply new migrations

### Before Pushing Changes
1. Test your migration locally
2. Update this tracker file
3. Commit both migration file and tracker
4. Document any breaking changes

### Resolving Migration Conflicts
If you encounter migration conflicts:

1. **Check Migration Status**
   ```bash
   node run-all-migrations.js --status
   ```

2. **Identify Conflicts**
   - Look for migrations with same number
   - Check for duplicate migrations

3. **Resolve Conflicts**
   - Renumber conflicting migrations
   - Update tracker file
   - Communicate with team

4. **Re-run Migrations**
   ```bash
   node run-all-migrations.js
   ```

## Best Practices

### DO ✅
- Always test migrations locally first
- Update this tracker when adding migrations
- Use descriptive migration names
- Add comments in SQL files
- Create rollback files when possible
- Run migrations before starting development
- Communicate breaking changes to team

### DON'T ❌
- Don't modify existing migrations that have been deployed
- Don't skip migration numbers
- Don't commit without testing
- Don't use `synchronize: true` in production
- Don't forget to update this tracker

## Troubleshooting

### Migration Failed
1. Check error message in console
2. Review migration SQL file
3. Check database logs
4. Rollback if needed: `node run-all-migrations.js --rollback`
5. Fix migration and re-run

### Database Out of Sync
1. Check migration status: `node run-all-migrations.js --status`
2. Run pending migrations: `node run-all-migrations.js`
3. If issues persist, check `schema_migrations` table directly

### Merge Conflicts
1. Pull latest changes
2. Check for new migrations in tracker
3. Renumber your migration if conflict exists
4. Update tracker file
5. Test locally
6. Push changes

## Support

For migration issues:
1. Check this tracker file
2. Review migration logs
3. Contact database administrator
4. Check team documentation

---

**Last Updated:** April 13, 2026  
**Maintained By:** Development Team
