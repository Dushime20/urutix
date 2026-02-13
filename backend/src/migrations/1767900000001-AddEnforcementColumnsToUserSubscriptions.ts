import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEnforcementColumnsToUserSubscriptions1767900000001 implements MigrationInterface {
    name = 'AddEnforcementColumnsToUserSubscriptions1767900000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if user_subscriptions table exists
        const tableExists = await queryRunner.hasTable('user_subscriptions');
        
        if (!tableExists) {
            console.log('⚠️  user_subscriptions table does not exist, skipping enforcement columns migration...');
            return;
        }

        console.log('🔄 Adding enforcement columns to user_subscriptions table...');

        // Add enforcement_status column with CHECK constraint
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'enforcement_status'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN enforcement_status VARCHAR(50) DEFAULT 'normal' 
                    CHECK (enforcement_status IN ('normal', 'suspended', 'restricted', 'terminated'));
                    
                    COMMENT ON COLUMN user_subscriptions.enforcement_status IS 'Administrative enforcement status separate from financial status';
                END IF;
            END $$;
        `);

        // Add suspension-related columns
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'suspended_by'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN suspended_by UUID REFERENCES users(id);
                    
                    COMMENT ON COLUMN user_subscriptions.suspended_by IS 'Admin user who suspended the subscription';
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'suspended_at'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN suspended_at TIMESTAMP;
                    
                    COMMENT ON COLUMN user_subscriptions.suspended_at IS 'Timestamp when suspension was applied';
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'suspension_reason'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN suspension_reason TEXT;
                    
                    COMMENT ON COLUMN user_subscriptions.suspension_reason IS 'Reason for suspension';
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'suspension_expires_at'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN suspension_expires_at TIMESTAMP;
                    
                    COMMENT ON COLUMN user_subscriptions.suspension_expires_at IS 'When temporary suspension expires (NULL for indefinite)';
                END IF;
            END $$;
        `);

        // Add termination-related columns
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'terminated_by'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN terminated_by UUID REFERENCES users(id);
                    
                    COMMENT ON COLUMN user_subscriptions.terminated_by IS 'Admin user who terminated the subscription';
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'terminated_at'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN terminated_at TIMESTAMP;
                    
                    COMMENT ON COLUMN user_subscriptions.terminated_at IS 'Timestamp when termination was applied';
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'termination_reason'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN termination_reason TEXT;
                    
                    COMMENT ON COLUMN user_subscriptions.termination_reason IS 'Reason for termination';
                END IF;
            END $$;
        `);

        // Add restrictions column (JSONB for flexible feature restrictions)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'restrictions'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN restrictions JSONB DEFAULT '{}';
                    
                    COMMENT ON COLUMN user_subscriptions.restrictions IS 'Feature restrictions as JSON (e.g., {"canPostCargo": false, "canAddTrucks": false})';
                END IF;
            END $$;
        `);

        // Add reinstatement tracking columns
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'last_reinstated_by'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN last_reinstated_by UUID REFERENCES users(id);
                    
                    COMMENT ON COLUMN user_subscriptions.last_reinstated_by IS 'Admin user who last reinstated the subscription';
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'last_reinstated_at'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN last_reinstated_at TIMESTAMP;
                    
                    COMMENT ON COLUMN user_subscriptions.last_reinstated_at IS 'Timestamp when subscription was last reinstated';
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'reinstatement_notes'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN reinstatement_notes TEXT;
                    
                    COMMENT ON COLUMN user_subscriptions.reinstatement_notes IS 'Notes about reinstatement conditions or resolution';
                END IF;
            END $$;
        `);

        // Add enforcement metadata column
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'user_subscriptions' AND column_name = 'enforcement_metadata'
                ) THEN
                    ALTER TABLE user_subscriptions 
                    ADD COLUMN enforcement_metadata JSONB DEFAULT '{}';
                    
                    COMMENT ON COLUMN user_subscriptions.enforcement_metadata IS 'Additional enforcement metadata (e.g., risk scores, violation types)';
                END IF;
            END $$;
        `);

        console.log('✅ Enforcement columns added successfully');

        // Create indexes for performance
        console.log('🔄 Creating indexes for enforcement columns...');

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_user_subscriptions_enforcement_status 
            ON user_subscriptions(enforcement_status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_user_subscriptions_suspended_by 
            ON user_subscriptions(suspended_by);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_user_subscriptions_suspension_expires 
            ON user_subscriptions(suspension_expires_at) 
            WHERE suspension_expires_at IS NOT NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_user_subscriptions_terminated_by 
            ON user_subscriptions(terminated_by);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_user_subscriptions_enforcement_status_tenant 
            ON user_subscriptions(enforcement_status, "tenantId");
        `);

        console.log('✅ Indexes created successfully');
        console.log('✅ Migration completed: AddEnforcementColumnsToUserSubscriptions');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Rolling back enforcement columns from user_subscriptions table...');

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_subscriptions_enforcement_status_tenant;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_subscriptions_terminated_by;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_subscriptions_suspension_expires;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_subscriptions_suspended_by;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_subscriptions_enforcement_status;`);

        // Drop columns
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS enforcement_metadata;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS reinstatement_notes;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS last_reinstated_at;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS last_reinstated_by;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS restrictions;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS termination_reason;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS terminated_at;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS terminated_by;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS suspension_expires_at;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS suspension_reason;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS suspended_at;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS suspended_by;`);
        await queryRunner.query(`ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS enforcement_status;`);

        console.log('✅ Rollback completed: AddEnforcementColumnsToUserSubscriptions');
    }
}
