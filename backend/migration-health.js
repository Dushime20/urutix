/**
 * Migration health checks — verify whether a "failed" migration's objectives
 * are already satisfied (by a later migration or partial apply).
 *
 * Used by: node migrate.js doctor | reconcile
 */

const SUCCESS_LIKE = new Set(['success', 'reconciled', 'superseded']);

async function columnExists(client, table, column) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return r.rows.length > 0;
}

async function tableExists(client, table) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  return r.rows.length > 0;
}

async function indexExists(client, indexName) {
  const r = await client.query(
    `SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = $1`,
    [indexName],
  );
  return r.rows.length > 0;
}

async function migrationSucceeded(client, migrationName) {
  const r = await client.query(
    `SELECT status FROM schema_migrations WHERE migration_name = $1`,
    [migrationName],
  );
  return r.rows.length > 0 && SUCCESS_LIKE.has(r.rows[0].status);
}

/**
 * Registry of known problematic migrations and how to verify their outcome.
 * `supersededBy`: if any listed migration succeeded, this failure can be closed.
 */
const MIGRATION_HEALTH = {
  '012_add_user_id_to_credit_accounts.sql': {
    description: 'credit_accounts.user_id column',
    supersededBy: [
      '030_add_user_id_to_credit_accounts.sql',
      '051_fix_credit_accounts_tenant_unique.sql',
    ],
    verify: async (client) => columnExists(client, 'credit_accounts', 'user_id'),
  },
  '020_user_kyc_system_enhancement.sql': {
    description: 'User KYC documents and role requirements',
    verify: async (client) =>
      (await tableExists(client, 'user_kyc_documents')) &&
      (await tableExists(client, 'kyc_role_requirements')) &&
      (await columnExists(client, 'user_profiles', 'kyc_data')),
  },
  '021_cargo_owner_analytics_foundation.sql': {
    description: 'cargo_owner_analytics table',
    verify: async (client) => tableExists(client, 'cargo_owner_analytics'),
  },
  '023_operational_analytics.sql': {
    description: 'carrier_performance_metrics table',
    verify: async (client) => tableExists(client, 'carrier_performance_metrics'),
  },
  '025_ai_insights.sql': {
    description: 'predictive_insights table',
    verify: async (client) => tableExists(client, 'predictive_insights'),
  },
  '026_advanced_analytics_phase4.sql': {
    description: 'ml_models table',
    verify: async (client) => tableExists(client, 'ml_models'),
  },
  '037_fix_notification_entity_type.sql': {
    description: 'notifications.entityType NOT NULL',
    verify: async (client) => {
      if (!(await columnExists(client, 'notifications', 'entityType'))) return false;
      const r = await client.query(
        `SELECT COUNT(*)::int AS n FROM notifications WHERE "entityType" IS NULL`,
      );
      return r.rows[0].n === 0;
    },
  },
  '041_epod_international_standard_fields.sql': {
    description: 'epods international delivery fields',
    verify: async (client) => {
      if (!(await tableExists(client, 'epods'))) return true;
      return columnExists(client, 'epods', 'recipientIdNumber');
    },
  },
  '050_support_ticket_enhancements.sql': {
    description: 'Support ticket columns and assignment tables',
    supersededBy: [
      '061_align_disputes_v2_entity_schema.sql',
      '062_fix_disputes_v2_category_enum.sql',
    ],
    verify: async (client) => {
      if (!(await tableExists(client, 'disputes_v2'))) return false;
      const hasTicket =
        (await columnExists(client, 'disputes_v2', 'ticketNumber')) ||
        (await columnExists(client, 'disputes_v2', 'ticket_number'));
      return hasTicket && (await tableExists(client, 'dispute_assignments'));
    },
  },
  'add-professional-auction-types.sql': {
    description: 'Auction type indexes and constraints',
    verify: async (client) => {
      if (!(await tableExists(client, 'auctions'))) return true;
      return indexExists(client, 'idx_auctions_type_status');
    },
  },
  '058_create_cargo_inspections.sql': {
    description: 'cargo_inspections table for delivery and pre-trip inspections',
    verify: async (client) => {
      if (!(await tableExists(client, 'cargo_inspections'))) return false;
      return columnExists(client, 'cargo_inspections', 'driverId');
    },
  },
};

async function assessMigration(client, migrationName, executedRow) {
  const profile = MIGRATION_HEALTH[migrationName];
  const status = executedRow?.status ?? (executedRow ? 'failed' : undefined);

  if (!executedRow) {
    return { migrationName, state: 'pending', healthy: false };
  }

  if (SUCCESS_LIKE.has(status)) {
    return { migrationName, state: status, healthy: true };
  }

  if (status !== 'failed') {
    return { migrationName, state: status, healthy: false };
  }

  let objectiveMet = false;
  let reason = '';

  if (profile) {
    if (profile.supersededBy?.length) {
      for (const sup of profile.supersededBy) {
        if (await migrationSucceeded(client, sup)) {
          objectiveMet = true;
          reason = `superseded by ${sup}`;
          break;
        }
      }
    }
    if (!objectiveMet && profile.verify) {
      objectiveMet = await profile.verify(client);
      if (objectiveMet) reason = 'database objective verified';
    }
  }

  return {
    migrationName,
    state: 'failed',
    healthy: objectiveMet,
    reason,
    description: profile?.description,
    errorMessage: executedRow.error_message,
  };
}

module.exports = {
  SUCCESS_LIKE,
  MIGRATION_HEALTH,
  columnExists,
  tableExists,
  indexExists,
  migrationSucceeded,
  assessMigration,
};
