import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaRecovery1770000000004 implements MigrationInterface {
    name = 'SchemaRecovery1770000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- 1. IDEMPOTENT ENUM INITIALIZATION ---
        await queryRunner.query(`
            DO $$ BEGIN
                -- Auth & Messaging
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_sender_role_enum') THEN
                    CREATE TYPE "public"."message_sender_role_enum" AS ENUM('DRIVER', 'SHIPPER', 'CARGO_OWNER', 'TRUCK_OWNER', 'DISPATCH', 'SYSTEM');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messages_sender_role_enum') THEN
                    CREATE TYPE "public"."messages_sender_role_enum" AS ENUM('DRIVER', 'SHIPPER', 'CARGO_OWNER', 'TRUCK_OWNER', 'DISPATCH', 'SYSTEM');
                END IF;
                
                -- Health Monitoring
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_health_logs_service_enum') THEN
                    CREATE TYPE "public"."system_health_logs_service_enum" AS ENUM('DATABASE', 'API', 'CACHE', 'EMAIL', 'STORAGE', 'PAYMENT', 'SERVER');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_health_logs_status_enum') THEN
                    CREATE TYPE "public"."system_health_logs_status_enum" AS ENUM('HEALTHY', 'DEGRADED', 'DOWN', 'CRITICAL', 'UNHEALTHY');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_health_logs_severity_enum') THEN
                    CREATE TYPE "public"."system_health_logs_severity_enum" AS ENUM('critical', 'high', 'low', 'medium');
                END IF;
                
                -- KYC & Profiles
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profiles_kyc_requirement_level_enum') THEN
                    CREATE TYPE "public"."user_profiles_kyc_requirement_level_enum" AS ENUM('BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_role_requirements_requirement_level_enum') THEN
                    CREATE TYPE "public"."kyc_role_requirements_requirement_level_enum" AS ENUM('BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_kyc_documents_document_type_enum') THEN
                    CREATE TYPE "public"."user_kyc_documents_document_type_enum" AS ENUM('IDENTITY_DOCUMENT', 'PASSPORT', 'DRIVER_LICENSE', 'PROOF_OF_ADDRESS', 'UTILITY_BILL', 'BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'TRADE_LICENSE', 'BANK_STATEMENT', 'CREDIT_REPORT', 'FINANCIAL_STATEMENT', 'PROFESSIONAL_CERTIFICATE', 'BROKER_LICENSE', 'FINANCIAL_LICENSE', 'VEHICLE_REGISTRATION', 'INSURANCE_CERTIFICATE', 'SAFETY_CERTIFICATE', 'MEDICAL_CERTIFICATE', 'SAFETY_TRAINING_CERTIFICATE', 'REGULATORY_APPROVAL', 'COMPLIANCE_CERTIFICATE', 'BONDING_CERTIFICATE', 'EXPERIENCE_CERTIFICATE', 'PROFESSIONAL_REFERENCE', 'AUDIT_REPORT', 'OTHER');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_kyc_documents_document_category_enum') THEN
                    CREATE TYPE "public"."user_kyc_documents_document_category_enum" AS ENUM('IDENTITY', 'ADDRESS', 'FINANCIAL', 'BUSINESS', 'PROFESSIONAL', 'VEHICLE', 'MEDICAL', 'REGULATORY', 'OTHER');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_kyc_audit_log_action_enum') THEN
                    CREATE TYPE "public"."user_kyc_audit_log_action_enum" AS ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'UNDER_REVIEW', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'IDENTITY_VERIFIED', 'ADDRESS_VERIFIED', 'FINANCIAL_VERIFIED', 'BUSINESS_VERIFIED', 'BACKGROUND_CHECK_COMPLETED', 'COMPLIANCE_SCORE_UPDATED', 'NOTES_UPDATED');
                END IF;

                -- Maintenance
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_logs_type_enum') THEN
                    CREATE TYPE "public"."maintenance_logs_type_enum" AS ENUM('ROUTINE', 'REPAIR', 'EMERGENCY', 'INSPECTION', 'FAULT_REPORT');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_logs_status_enum') THEN
                    CREATE TYPE "public"."maintenance_logs_status_enum" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
                END IF;
            END $$;
        `);

        // --- 2. IDEMPOTENT TABLE RECOVERY ---
        
        // Auth & Identity Base
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL UNIQUE, "description" text, "is_system" boolean DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_roles_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "resource" character varying(100) NOT NULL, "action" character varying(50) NOT NULL, "description" text, "category" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "role_inheritance" ("role_id" uuid NOT NULL, "inherits_from_role_id" uuid NOT NULL, CONSTRAINT "PK_role_inheritance" PRIMARY KEY ("role_id", "inherits_from_role_id"))`);
        
        // Sessions & Core Monitoring
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user_sessions" ("session_id" character varying(255) NOT NULL, "user_id" uuid NOT NULL, "ip_address" inet, "user_agent" text, "device_info" jsonb, "location" jsonb, "last_activity" timestamp DEFAULT CURRENT_TIMESTAMP, "expires_at" timestamp NOT NULL, "started_at" timestamp DEFAULT CURRENT_TIMESTAMP, "tenant_id" uuid NOT NULL, CONSTRAINT "PK_user_sessions_id" PRIMARY KEY ("session_id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "activity_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "action" character varying(100) NOT NULL, "resource" character varying(100), "resource_id" character varying(255), "details" jsonb, "ip_address" inet, "user_agent" text, "location" jsonb, "is_suspicious" boolean DEFAULT false, "session_id" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_activity_logs_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "system_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "category" character varying(50) NOT NULL, "key" character varying(100) NOT NULL, "value" jsonb NOT NULL, "data_type" character varying(20) NOT NULL, "description" text, "is_public" boolean DEFAULT false, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_system_settings_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "system_health_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "service" "public"."system_health_logs_service_enum" NOT NULL, "status" "public"."system_health_logs_status_enum" NOT NULL, "metric_type" character varying, "metric_name" character varying, "metric_value" numeric, "threshold_value" numeric, "severity" "public"."system_health_logs_severity_enum", "response_time" integer, "error_message" text, "metadata" jsonb NOT NULL DEFAULT '{}', "timestamp" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_system_health_logs_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "security_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_type" character varying NOT NULL, "severity" character varying NOT NULL, "description" text, "metadata" jsonb DEFAULT '{}', "user_id" uuid, "tenant_id" uuid, "ip_address" inet, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_security_events_id" PRIMARY KEY ("id"))`);

        // Financial & Market
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "credit_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "balance" numeric(15,2) DEFAULT 0, "bonus_balance" numeric(15,2) DEFAULT 0, "currency" character varying(10) DEFAULT 'RWF', "revenue_from_partner_sales" numeric(15,2) DEFAULT 0, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_credit_accounts_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "credit_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "account_id" uuid NOT NULL, "type" character varying NOT NULL, "amount" numeric(15,2) NOT NULL, "description" text, "metadata" jsonb DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_credit_transactions_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "credit_packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "credits" numeric NOT NULL, "price" numeric NOT NULL, "is_active" boolean DEFAULT true, CONSTRAINT "PK_credit_packages_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "credit_pricing_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "rule_type" character varying NOT NULL, "value" numeric NOT NULL, "is_active" boolean DEFAULT true, "tenant_id" uuid, "plan_id" uuid, "min_value" numeric, "max_value" numeric, "credit_cost" numeric, CONSTRAINT "PK_credit_pricing_rules_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "credit_marketplace_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "is_enabled" boolean DEFAULT false, "settings_metadata" jsonb NOT NULL DEFAULT '{}', "tenant_admin_user_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_credit_marketplace_settings_id" PRIMARY KEY ("id"))`);

        // Subscriptions
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "subscription_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "price" numeric NOT NULL, "interval" character varying DEFAULT 'MONTHLY', "is_active" boolean DEFAULT true, "display_order" integer DEFAULT 0, "limits" jsonb DEFAULT '{}', "available_slots" integer, "credit_cost_per_partner" numeric, "credits_per_ton_truck_owner" numeric, "credits_per_ton_tenant" numeric, "total_credits" numeric, "price_per_credit" numeric, "parent_subscription_id" uuid, CONSTRAINT "PK_subscription_plans_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "subscription_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subscription_id" uuid NOT NULL, "amount" numeric NOT NULL, "status" character varying NOT NULL, "payment_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_subscription_payments_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tenant_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "plan_id" uuid NOT NULL, "status" character varying NOT NULL, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tenant_subscriptions_id" PRIMARY KEY ("id"))`);

        // KYC Comprehensive
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tenant_kyc_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "type" character varying NOT NULL, "url" text NOT NULL, "status" character varying DEFAULT 'PENDING', "verified_at" TIMESTAMP, "verified_by" uuid, "uploaded_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tenant_kyc_documents_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tenant_kyc_audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "action" character varying NOT NULL, "metadata" jsonb DEFAULT '{}', "performed_by" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tenant_kyc_audit_log_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user_kyc_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "user_profile_id" uuid NOT NULL, "document_type" "public"."user_kyc_documents_document_type_enum" NOT NULL, "document_category" "public"."user_kyc_documents_document_category_enum" NOT NULL, "document_name" character varying NOT NULL, "file_path" character varying NOT NULL, "file_size" integer, "mime_type" character varying, "verified" boolean DEFAULT false, "verified_by" uuid, "verified_at" TIMESTAMP, "expiry_date" date, "notes" text, "metadata" jsonb DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_user_kyc_documents_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user_kyc_audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "user_profile_id" uuid NOT NULL, "action" "public"."user_kyc_audit_log_action_enum" NOT NULL, "old_status" character varying, "new_status" character varying, "performed_by" uuid, "notes" text, "metadata" jsonb DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_user_kyc_audit_log_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "kyc_role_requirements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" character varying NOT NULL, "requirement_level" "public"."kyc_role_requirements_requirement_level_enum" NOT NULL, "required_documents" text[] NOT NULL, "optional_documents" text[] DEFAULT '{}', "verification_steps" text[] NOT NULL, "auto_approval_eligible" boolean DEFAULT false, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_kyc_role_requirements_id" PRIMARY KEY ("id"))`);

        // Logistics & Messaging
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "maintenance_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "truck_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "type" "public"."maintenance_logs_type_enum" NOT NULL DEFAULT 'ROUTINE', "status" "public"."maintenance_logs_status_enum" NOT NULL DEFAULT 'SCHEDULED', "description" text, "cost" numeric(15,2), "date" date NOT NULL, "next_due_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_maintenance_logs_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "fuel_wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "balance" numeric(15,2) DEFAULT 0, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fuel_wallets_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "fuel_wallet_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "wallet_id" uuid NOT NULL, "type" character varying NOT NULL, "amount" numeric(15,2) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fuel_wallet_transactions_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "thread_id" character varying(255) NOT NULL, "sender_id" uuid NOT NULL, "recipient_id" uuid NOT NULL, "content" text NOT NULL, "sender_role" "public"."messages_sender_role_enum" DEFAULT 'SYSTEM', "is_read" boolean DEFAULT false, "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"))`);

        // Policy & Governance
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "loan_terms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loan_request_id" uuid NOT NULL, "amount" numeric NOT NULL, "interest_rate" numeric NOT NULL, "duration_days" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_loan_terms_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "feature_credit_costs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "feature_name" character varying NOT NULL, "credit_cost" numeric NOT NULL, "is_active" boolean DEFAULT true, CONSTRAINT "PK_feature_credit_costs_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "lending_policy_system_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lender_id" uuid NOT NULL, "config" jsonb NOT NULL, CONSTRAINT "PK_lending_policy_system_config_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "lending_policy_loan_limits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lender_id" uuid NOT NULL, "limits" jsonb NOT NULL, CONSTRAINT "PK_lending_policy_loan_limits_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "lending_policy_risk_assessment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lender_id" uuid NOT NULL, "rules" jsonb NOT NULL, CONSTRAINT "PK_lending_policy_risk_assessment_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "lending_policy_repayment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lender_id" uuid NOT NULL, "rules" jsonb NOT NULL, CONSTRAINT "PK_lending_policy_repayment_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "lending_policy_interest_rates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lender_id" uuid NOT NULL, "rates" jsonb NOT NULL, CONSTRAINT "PK_lending_policy_interest_rates_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "lending_policy_eligibility_criteria" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lender_id" uuid NOT NULL, "criteria" jsonb NOT NULL, CONSTRAINT "PK_lending_policy_eligibility_criteria_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "lending_policy_cargo_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lender_id" uuid NOT NULL, "cargo_types" jsonb NOT NULL, CONSTRAINT "PK_lending_policy_cargo_types_id" PRIMARY KEY ("id"))`);

        // Templates & Emails
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "email_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "subject" text NOT NULL, "body" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, CONSTRAINT "PK_email_templates_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "bulk_email_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "template_id" uuid NOT NULL, "recipients_count" integer NOT NULL, "sent_count" integer NOT NULL DEFAULT 0, "status" character varying DEFAULT 'PENDING', "created_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bulk_email_logs_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
