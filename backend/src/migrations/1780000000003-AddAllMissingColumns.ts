import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAllMissingColumns1780000000003 implements MigrationInterface {
    name = 'AddAllMissingColumns1780000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const columnsToAdd = [
            // Table, Column, Type
            ['credit_accounts', 'revenue_from_partner_sales', 'boolean'],
            ['subscription_payments', 'payment_id', 'character varying'],
            ['subscription_plans', 'display_order', 'integer'],
            ['subscription_plans', 'is_active', 'boolean'],
            ['subscription_plans', 'limits', 'jsonb'],
            ['subscription_plans', 'available_slots', 'integer'],
            ['subscription_plans', 'credit_cost_per_partner', 'numeric'],
            ['subscription_plans', 'credits_per_ton_truck_owner', 'numeric'],
            ['subscription_plans', 'credits_per_ton_tenant', 'numeric'],
            ['subscription_plans', 'total_credits', 'numeric'],
            ['subscription_plans', 'price_per_credit', 'numeric'],
            ['subscription_plans', 'parent_subscription_id', 'uuid'],
            ['roles', 'is_system', 'boolean'],
            ['user_sessions', 'user_agent', 'character varying'],
            ['user_sessions', 'session_id', 'character varying'],
            ['drivers', 'hoursOfService', 'jsonb'],
            ['drivers', 'driverNotes', 'text'],
            ['drivers', 'experience', 'integer'],
            ['tenants', 'onboardingStep', 'integer'],
            ['tenants', 'kycData', 'jsonb'],
            ['user_profiles', 'compliance_score', 'numeric'],
            ['user_profiles', 'background_check_completed', 'boolean'],
            ['user_profiles', 'business_verified', 'boolean'],
            ['user_profiles', 'financial_verified', 'boolean'],
            ['user_profiles', 'address_verified', 'boolean'],
            ['user_profiles', 'identity_verified', 'boolean']
        ];

        for (const [table, column, type] of columnsToAdd) {
            await queryRunner.query(`
                DO $$ 
                BEGIN 
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${table}') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${column}') THEN 
                            ALTER TABLE "${table}" ADD COLUMN "${column}" ${type};
                        END IF; 
                    END IF;
                END $$;
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Safe down migration (ignored for brevity, usually not needed for these patches)
    }
}
