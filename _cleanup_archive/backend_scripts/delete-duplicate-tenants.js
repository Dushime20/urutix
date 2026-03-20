const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function deleteDuplicates() {
  console.log('🗑️  Deleting Duplicate Tenants\n');
  console.log('⚠️  WARNING: This will permanently delete tenants marked as duplicates!');
  console.log('⚠️  Make sure you have a backup before proceeding.\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // First, show what will be deleted
    const duplicatesQuery = `
      SELECT id, name, "contactEmail", status, "createdAt"
      FROM tenants
      WHERE "contactEmail" LIKE '%_duplicate_%'
      ORDER BY "contactEmail";
    `;

    const duplicates = await client.query(duplicatesQuery);

    if (duplicates.rows.length === 0) {
      console.log('✅ No duplicate tenants found to delete');
      await client.query('ROLLBACK');
      return;
    }

    console.log(`📋 Found ${duplicates.rows.length} duplicate tenants to delete:\n`);
    duplicates.rows.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}`);
      console.log(`   Email: ${tenant.contactEmail}`);
      console.log(`   Status: ${tenant.status}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Created: ${new Date(tenant.createdAt).toLocaleDateString()}`);
      console.log('');
    });

    // Delete related data first (to avoid foreign key constraints)
    console.log('🔄 Deleting related data...\n');

    // Delete audit logs first (they reference users)
    const deleteAuditLogsQuery = `
      DELETE FROM audit_logs
      WHERE "userId" IN (
        SELECT id FROM users WHERE "tenantId" IN (
          SELECT id FROM tenants WHERE "contactEmail" LIKE '%_duplicate_%'
        )
      );
    `;
    const auditLogsResult = await client.query(deleteAuditLogsQuery);
    console.log(`✅ Deleted ${auditLogsResult.rowCount} audit logs`);

    // Delete users associated with these tenants
    const deleteUsersQuery = `
      DELETE FROM users
      WHERE "tenantId" IN (
        SELECT id FROM tenants WHERE "contactEmail" LIKE '%_duplicate_%'
      );
    `;
    const usersResult = await client.query(deleteUsersQuery);
    console.log(`✅ Deleted ${usersResult.rowCount} users`);

    // Delete credit accounts
    const deleteCreditAccountsQuery = `
      DELETE FROM credit_accounts
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE "contactEmail" LIKE '%_duplicate_%'
      );
    `;
    const creditAccountsResult = await client.query(deleteCreditAccountsQuery);
    console.log(`✅ Deleted ${creditAccountsResult.rowCount} credit accounts`);

    // Delete tenant subscriptions
    const deleteSubscriptionsQuery = `
      DELETE FROM tenant_subscriptions
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE "contactEmail" LIKE '%_duplicate_%'
      );
    `;
    const subscriptionsResult = await client.query(deleteSubscriptionsQuery);
    console.log(`✅ Deleted ${subscriptionsResult.rowCount} tenant subscriptions`);

    // Delete trucks
    const deleteTrucksQuery = `
      DELETE FROM trucks
      WHERE "tenantId" IN (
        SELECT id FROM tenants WHERE "contactEmail" LIKE '%_duplicate_%'
      );
    `;
    const trucksResult = await client.query(deleteTrucksQuery);
    console.log(`✅ Deleted ${trucksResult.rowCount} trucks`);

    // Delete loads
    const deleteLoadsQuery = `
      DELETE FROM loads
      WHERE "tenantId" IN (
        SELECT id FROM tenants WHERE "contactEmail" LIKE '%_duplicate_%'
      );
    `;
    const loadsResult = await client.query(deleteLoadsQuery);
    console.log(`✅ Deleted ${loadsResult.rowCount} loads`);

    // Finally, delete the duplicate tenants
    console.log('\n🗑️  Deleting duplicate tenants...');
    const deleteTenantsQuery = `
      DELETE FROM tenants
      WHERE "contactEmail" LIKE '%_duplicate_%'
      RETURNING id, name, "contactEmail";
    `;
    const tenantsResult = await client.query(deleteTenantsQuery);

    console.log(`\n✅ Successfully deleted ${tenantsResult.rowCount} duplicate tenants:`);
    tenantsResult.rows.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.contactEmail})`);
    });

    // Commit the transaction
    await client.query('COMMIT');

    // Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const verifyQuery = `
      SELECT COUNT(*) as count
      FROM tenants
      WHERE "contactEmail" LIKE '%_duplicate_%';
    `;
    const verifyResult = await client.query(verifyQuery);

    if (verifyResult.rows[0].count === '0') {
      console.log('✅ All duplicate tenants have been successfully deleted');
    } else {
      console.log(`⚠️  Warning: ${verifyResult.rows[0].count} duplicate tenants still remain`);
    }

    // Show remaining tenants
    const remainingQuery = `
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active
      FROM tenants;
    `;
    const remainingResult = await client.query(remainingQuery);
    console.log(`\n📊 Remaining tenants: ${remainingResult.rows[0].total} (${remainingResult.rows[0].active} active)`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error deleting duplicates:', error.message);
    console.error('Transaction rolled back - no changes were made');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the deletion
deleteDuplicates()
  .then(() => {
    console.log('\n✅ Deletion complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deletion failed:', error);
    process.exit(1);
  });
