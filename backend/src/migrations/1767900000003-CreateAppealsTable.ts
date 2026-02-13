import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAppealsTable1767900000003 implements MigrationInterface {
    name = 'CreateAppealsTable1767900000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Creating appeals table...');

        // Create appeals table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS appeals (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                
                -- Reference to enforcement action and user
                enforcement_action_id UUID NOT NULL REFERENCES enforcement_actions(id),
                user_id UUID NOT NULL REFERENCES users(id),
                subscription_id UUID REFERENCES user_subscriptions(id),
                
                -- Appeal details
                appeal_reason TEXT NOT NULL,
                user_statement TEXT,
                supporting_evidence JSONB,
                
                -- Status tracking
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
                    'pending', 'under_review', 'approved', 'denied', 'withdrawn'
                )),
                
                -- Review fields
                reviewed_by UUID REFERENCES users(id),
                reviewed_at TIMESTAMP,
                review_notes TEXT,
                admin_response TEXT,
                
                -- Outcome tracking
                outcome VARCHAR(50) CHECK (outcome IN (
                    'enforcement_lifted', 'enforcement_modified', 'enforcement_upheld', 'no_action'
                )),
                outcome_details JSONB,
                
                -- Communication thread
                messages JSONB DEFAULT '[]',
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                resolved_at TIMESTAMP
            );
        `);

        // Add comments for documentation
        await queryRunner.query(`
            COMMENT ON TABLE appeals IS 'User appeals against enforcement actions';
            COMMENT ON COLUMN appeals.enforcement_action_id IS 'Reference to the enforcement action being appealed';
            COMMENT ON COLUMN appeals.user_id IS 'User who submitted the appeal';
            COMMENT ON COLUMN appeals.subscription_id IS 'Related subscription (if applicable)';
            COMMENT ON COLUMN appeals.appeal_reason IS 'Primary reason for the appeal';
            COMMENT ON COLUMN appeals.user_statement IS 'Detailed statement from the user';
            COMMENT ON COLUMN appeals.supporting_evidence IS 'Documents, links, or other evidence (JSONB)';
            COMMENT ON COLUMN appeals.status IS 'Current status of the appeal';
            COMMENT ON COLUMN appeals.reviewed_by IS 'Admin who reviewed the appeal';
            COMMENT ON COLUMN appeals.reviewed_at IS 'Timestamp when appeal was reviewed';
            COMMENT ON COLUMN appeals.review_notes IS 'Internal notes from the review';
            COMMENT ON COLUMN appeals.admin_response IS 'Response message to the user';
            COMMENT ON COLUMN appeals.outcome IS 'Final outcome of the appeal';
            COMMENT ON COLUMN appeals.outcome_details IS 'Additional details about the outcome (JSONB)';
            COMMENT ON COLUMN appeals.messages IS 'Communication thread between user and admin (JSONB array)';
            COMMENT ON COLUMN appeals.created_at IS 'When the appeal was created';
            COMMENT ON COLUMN appeals.updated_at IS 'When the appeal was last updated';
            COMMENT ON COLUMN appeals.resolved_at IS 'When the appeal was resolved';
        `);

        console.log('✅ appeals table created successfully');

        // Create indexes for performance
        console.log('🔄 Creating indexes for appeals table...');

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_appeals_user 
            ON appeals(user_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_appeals_status 
            ON appeals(status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_appeals_enforcement_action 
            ON appeals(enforcement_action_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_appeals_created 
            ON appeals(created_at DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_appeals_reviewed_by 
            ON appeals(reviewed_by) 
            WHERE reviewed_by IS NOT NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_appeals_subscription 
            ON appeals(subscription_id) 
            WHERE subscription_id IS NOT NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_appeals_outcome 
            ON appeals(outcome) 
            WHERE outcome IS NOT NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_appeals_resolved 
            ON appeals(resolved_at) 
            WHERE resolved_at IS NOT NULL;
        `);

        // Composite indexes for common queries
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_appeals_status_created 
            ON appeals(status, created_at DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_appeals_user_status 
            ON appeals(user_id, status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_appeals_user_created 
            ON appeals(user_id, created_at DESC);
        `);

        console.log('✅ Indexes created successfully');

        // Add foreign key constraint to enforcement_actions.appeal_id
        console.log('🔄 Adding foreign key constraint to enforcement_actions...');
        
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'fk_enforcement_actions_appeal_id'
                ) THEN
                    ALTER TABLE enforcement_actions 
                    ADD CONSTRAINT fk_enforcement_actions_appeal_id 
                    FOREIGN KEY (appeal_id) REFERENCES appeals(id);
                END IF;
            END $$;
        `);

        console.log('✅ Foreign key constraint added successfully');
        console.log('✅ Migration completed: CreateAppealsTable');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Rolling back appeals table...');

        // Drop foreign key constraint from enforcement_actions
        await queryRunner.query(`
            ALTER TABLE enforcement_actions 
            DROP CONSTRAINT IF EXISTS fk_enforcement_actions_appeal_id;
        `);

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_appeals_user_created;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_appeals_user_status;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_appeals_status_created;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_appeals_resolved;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_appeals_outcome;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_appeals_subscription;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_appeals_reviewed_by;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_appeals_created;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_appeals_enforcement_action;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_appeals_status;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_appeals_user;`);

        // Drop table
        await queryRunner.query(`DROP TABLE IF EXISTS appeals;`);

        console.log('✅ Rollback completed: CreateAppealsTable');
    }
}
