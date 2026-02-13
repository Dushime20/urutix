import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserBlacklistTable1767900000004 implements MigrationInterface {
    name = 'CreateUserBlacklistTable1767900000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Creating user_blacklist table...');

        // Create user_blacklist table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS user_blacklist (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                
                -- Identifiers to block
                email VARCHAR(255),
                email_domain VARCHAR(255),
                phone_number VARCHAR(50),
                company_name VARCHAR(255),
                tax_id VARCHAR(100),
                device_fingerprint TEXT,
                ip_address INET,
                
                -- Reason for blacklisting
                reason TEXT NOT NULL,
                violation_category VARCHAR(50) CHECK (violation_category IN (
                    'fraud', 'platform_abuse', 'spam', 'illegal_listing', 
                    'policy_violation', 'payment_dispute', 'system_exploitation', 'other'
                )),
                
                -- Who added this entry
                added_by UUID NOT NULL REFERENCES users(id),
                tenant_id UUID NOT NULL REFERENCES tenants(id),
                
                -- Related enforcement tracking
                related_user_id UUID REFERENCES users(id),
                related_enforcement_action_id UUID REFERENCES enforcement_actions(id),
                
                -- Status and expiration
                is_active BOOLEAN DEFAULT TRUE,
                expires_at TIMESTAMP,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT NOW(),
                deactivated_at TIMESTAMP,
                deactivated_by UUID REFERENCES users(id)
            );
        `);

        // Add comments for documentation
        await queryRunner.query(`
            COMMENT ON TABLE user_blacklist IS 'Permanent ban list preventing account recreation by blocked identifiers';
            COMMENT ON COLUMN user_blacklist.email IS 'Specific email address to block';
            COMMENT ON COLUMN user_blacklist.email_domain IS 'Entire email domain to block (e.g., @spam.com)';
            COMMENT ON COLUMN user_blacklist.phone_number IS 'Phone number to block';
            COMMENT ON COLUMN user_blacklist.company_name IS 'Company name to block';
            COMMENT ON COLUMN user_blacklist.tax_id IS 'Tax ID or business registration number to block';
            COMMENT ON COLUMN user_blacklist.device_fingerprint IS 'Device fingerprint to block';
            COMMENT ON COLUMN user_blacklist.ip_address IS 'IP address to block';
            COMMENT ON COLUMN user_blacklist.reason IS 'Required reason for blacklisting';
            COMMENT ON COLUMN user_blacklist.violation_category IS 'Category of violation that led to blacklisting';
            COMMENT ON COLUMN user_blacklist.added_by IS 'Admin who added this blacklist entry';
            COMMENT ON COLUMN user_blacklist.tenant_id IS 'Tenant this blacklist entry belongs to';
            COMMENT ON COLUMN user_blacklist.related_user_id IS 'User who was blacklisted (if applicable)';
            COMMENT ON COLUMN user_blacklist.related_enforcement_action_id IS 'Enforcement action that led to blacklisting';
            COMMENT ON COLUMN user_blacklist.is_active IS 'Whether this blacklist entry is currently active';
            COMMENT ON COLUMN user_blacklist.expires_at IS 'Expiration timestamp (NULL = permanent)';
            COMMENT ON COLUMN user_blacklist.created_at IS 'When this entry was created';
            COMMENT ON COLUMN user_blacklist.deactivated_at IS 'When this entry was deactivated';
            COMMENT ON COLUMN user_blacklist.deactivated_by IS 'Admin who deactivated this entry';
        `);

        console.log('✅ user_blacklist table created successfully');

        // Create indexes for performance
        console.log('🔄 Creating indexes for user_blacklist table...');

        // Primary lookup indexes (only for active entries)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_email 
            ON user_blacklist(email) 
            WHERE is_active = TRUE;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_domain 
            ON user_blacklist(email_domain) 
            WHERE is_active = TRUE;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_phone 
            ON user_blacklist(phone_number) 
            WHERE is_active = TRUE;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_company 
            ON user_blacklist(company_name) 
            WHERE is_active = TRUE;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_tax_id 
            ON user_blacklist(tax_id) 
            WHERE is_active = TRUE;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_device 
            ON user_blacklist(device_fingerprint) 
            WHERE is_active = TRUE;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_ip 
            ON user_blacklist(ip_address) 
            WHERE is_active = TRUE;
        `);

        // Tenant isolation index
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_tenant 
            ON user_blacklist(tenant_id);
        `);

        // Admin tracking indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_added_by 
            ON user_blacklist(added_by);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_deactivated_by 
            ON user_blacklist(deactivated_by) 
            WHERE deactivated_by IS NOT NULL;
        `);

        // Related entity indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_related_user 
            ON user_blacklist(related_user_id) 
            WHERE related_user_id IS NOT NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_related_enforcement 
            ON user_blacklist(related_enforcement_action_id) 
            WHERE related_enforcement_action_id IS NOT NULL;
        `);

        // Status and expiration indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_active 
            ON user_blacklist(is_active);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_expires 
            ON user_blacklist(expires_at) 
            WHERE expires_at IS NOT NULL;
        `);

        // Timestamp indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_created 
            ON user_blacklist(created_at DESC);
        `);

        // Composite indexes for common queries
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_tenant_active 
            ON user_blacklist(tenant_id, is_active);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_blacklist_tenant_created 
            ON user_blacklist(tenant_id, created_at DESC);
        `);

        console.log('✅ Indexes created successfully');
        console.log('✅ Migration completed: CreateUserBlacklistTable');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Rolling back user_blacklist table...');

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_tenant_created;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_tenant_active;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_created;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_expires;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_active;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_related_enforcement;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_related_user;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_deactivated_by;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_added_by;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_tenant;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_ip;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_device;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_tax_id;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_company;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_phone;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_domain;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_blacklist_email;`);

        // Drop table
        await queryRunner.query(`DROP TABLE IF EXISTS user_blacklist;`);

        console.log('✅ Rollback completed: CreateUserBlacklistTable');
    }
}
