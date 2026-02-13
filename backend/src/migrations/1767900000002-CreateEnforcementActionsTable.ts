import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEnforcementActionsTable1767900000002 implements MigrationInterface {
    name = 'CreateEnforcementActionsTable1767900000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Creating enforcement_actions table...');

        // Create enforcement_actions table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS enforcement_actions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                
                -- Who, What, When
                admin_id UUID NOT NULL REFERENCES users(id),
                target_user_id UUID NOT NULL REFERENCES users(id),
                subscription_id UUID REFERENCES user_subscriptions(id),
                action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
                    'suspend', 'unsuspend', 'restrict', 'unrestrict', 
                    'terminate', 'reinstate', 'flag', 'unflag'
                )),
                
                -- Details
                reason TEXT NOT NULL,
                violation_category VARCHAR(50) CHECK (violation_category IN (
                    'fraud', 'platform_abuse', 'spam', 'illegal_listing', 
                    'policy_violation', 'payment_dispute', 'system_exploitation', 'other'
                )),
                severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
                
                -- Before/After state tracking
                previous_state JSONB,
                new_state JSONB,
                
                -- Restrictions applied (if action_type = 'restrict')
                restrictions_applied JSONB,
                
                -- Duration (for temporary actions)
                expires_at TIMESTAMP,
                
                -- Evidence and notes
                evidence JSONB,
                admin_notes TEXT,
                internal_notes TEXT,
                
                -- Appeal tracking
                is_appealed BOOLEAN DEFAULT FALSE,
                appeal_id UUID,
                
                -- Metadata
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                
                -- Immutability support (soft delete only)
                is_deleted BOOLEAN DEFAULT FALSE,
                deleted_at TIMESTAMP,
                deleted_by UUID REFERENCES users(id)
            );
        `);

        // Add comments for documentation
        await queryRunner.query(`
            COMMENT ON TABLE enforcement_actions IS 'Immutable audit log of all enforcement actions taken by admins';
            COMMENT ON COLUMN enforcement_actions.admin_id IS 'Admin user who performed the action';
            COMMENT ON COLUMN enforcement_actions.target_user_id IS 'User who is subject to the enforcement action';
            COMMENT ON COLUMN enforcement_actions.subscription_id IS 'Related subscription (if applicable)';
            COMMENT ON COLUMN enforcement_actions.action_type IS 'Type of enforcement action taken';
            COMMENT ON COLUMN enforcement_actions.reason IS 'Required reason for the action';
            COMMENT ON COLUMN enforcement_actions.violation_category IS 'Category of violation that triggered the action';
            COMMENT ON COLUMN enforcement_actions.severity IS 'Severity level of the violation';
            COMMENT ON COLUMN enforcement_actions.previous_state IS 'State before the action (JSONB)';
            COMMENT ON COLUMN enforcement_actions.new_state IS 'State after the action (JSONB)';
            COMMENT ON COLUMN enforcement_actions.restrictions_applied IS 'Specific restrictions applied (JSONB)';
            COMMENT ON COLUMN enforcement_actions.expires_at IS 'Expiration timestamp for temporary actions';
            COMMENT ON COLUMN enforcement_actions.evidence IS 'Evidence supporting the action (URLs, screenshots, etc.)';
            COMMENT ON COLUMN enforcement_actions.admin_notes IS 'Notes visible to other admins';
            COMMENT ON COLUMN enforcement_actions.internal_notes IS 'Internal notes not visible to users';
            COMMENT ON COLUMN enforcement_actions.is_appealed IS 'Whether this action has been appealed';
            COMMENT ON COLUMN enforcement_actions.appeal_id IS 'Reference to appeal record (if appealed)';
            COMMENT ON COLUMN enforcement_actions.ip_address IS 'IP address of admin when action was taken';
            COMMENT ON COLUMN enforcement_actions.user_agent IS 'User agent of admin when action was taken';
            COMMENT ON COLUMN enforcement_actions.is_deleted IS 'Soft delete flag (never hard delete for audit trail)';
            COMMENT ON COLUMN enforcement_actions.deleted_at IS 'Timestamp when soft deleted';
            COMMENT ON COLUMN enforcement_actions.deleted_by IS 'Admin who soft deleted the record';
        `);

        console.log('✅ enforcement_actions table created successfully');

        // Create indexes for performance
        console.log('🔄 Creating indexes for enforcement_actions table...');

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_admin 
            ON enforcement_actions(admin_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_target_user 
            ON enforcement_actions(target_user_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_subscription 
            ON enforcement_actions(subscription_id) 
            WHERE subscription_id IS NOT NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_type 
            ON enforcement_actions(action_type);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_created 
            ON enforcement_actions(created_at DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_violation 
            ON enforcement_actions(violation_category) 
            WHERE violation_category IS NOT NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_severity 
            ON enforcement_actions(severity) 
            WHERE severity IS NOT NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_appealed 
            ON enforcement_actions(is_appealed) 
            WHERE is_appealed = TRUE;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_not_deleted 
            ON enforcement_actions(is_deleted) 
            WHERE is_deleted = FALSE;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_expires 
            ON enforcement_actions(expires_at) 
            WHERE expires_at IS NOT NULL;
        `);

        // Composite indexes for common queries
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_target_created 
            ON enforcement_actions(target_user_id, created_at DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_admin_created 
            ON enforcement_actions(admin_id, created_at DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_enforcement_actions_type_created 
            ON enforcement_actions(action_type, created_at DESC);
        `);

        console.log('✅ Indexes created successfully');
        console.log('✅ Migration completed: CreateEnforcementActionsTable');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Rolling back enforcement_actions table...');

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_type_created;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_admin_created;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_target_created;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_expires;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_not_deleted;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_appealed;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_severity;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_violation;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_created;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_type;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_subscription;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_target_user;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_enforcement_actions_admin;`);

        // Drop table
        await queryRunner.query(`DROP TABLE IF EXISTS enforcement_actions;`);

        console.log('✅ Rollback completed: CreateEnforcementActionsTable');
    }
}
