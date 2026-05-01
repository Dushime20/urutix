import { MigrationInterface, QueryRunner } from "typeorm";

export class ConsolidatedBaseline1777673845128 implements MigrationInterface {
    name = 'ConsolidatedBaseline1777673845128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const drops = [
            `ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "FK_6ca9503d77ae39b4b5a6cc3ba88"`,
            `ALTER TABLE "tenants" DROP CONSTRAINT IF EXISTS "tenants_kyc_reviewed_by_fkey"`,
            `ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "fk_user_sessions_tenant"`,
            `ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "user_sessions_user_id_fkey"`,
            `ALTER TABLE "subscription_plans" DROP CONSTRAINT IF EXISTS "subscription_plans_parent_subscription_id_fkey"`,
            `ALTER TABLE "subscription_payments" DROP CONSTRAINT IF EXISTS "subscription_payments_subscription_id_fkey"`,
            `ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "credit_accounts_tenant_id_fkey"`,
            `ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "fk_credit_accounts_user"`,
            `ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "credit_transactions_tenant_id_fkey"`,
            `ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "credit_transactions_subscription_id_fkey"`,
            `ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "credit_transactions_credit_account_id_fkey"`,
            `ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "fk_credit_transactions_user_id"`,
            `ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT IF EXISTS "tenant_subscriptions_plan_id_fkey"`,
            `ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT IF EXISTS "tenant_subscriptions_tenant_id_fkey"`,
            `ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT IF EXISTS "fk_tenant_subscriptions_user"`,
            `ALTER TABLE "tenant_kyc_documents" DROP CONSTRAINT IF EXISTS "tenant_kyc_documents_verified_by_fkey"`,
            `ALTER TABLE "tenant_kyc_documents" DROP CONSTRAINT IF EXISTS "tenant_kyc_documents_uploaded_by_fkey"`,
            `ALTER TABLE "tenant_kyc_documents" DROP CONSTRAINT IF EXISTS "tenant_kyc_documents_tenant_id_fkey"`,
            `ALTER TABLE "tenant_kyc_audit_log" DROP CONSTRAINT IF EXISTS "tenant_kyc_audit_log_performed_by_fkey"`,
            `ALTER TABLE "tenant_kyc_audit_log" DROP CONSTRAINT IF EXISTS "tenant_kyc_audit_log_tenant_id_fkey"`,
            `ALTER TABLE "system_settings" DROP CONSTRAINT IF EXISTS "FK_system_settings_updated_by"`,
            `ALTER TABLE "security_events" DROP CONSTRAINT IF EXISTS "fk_security_events_tenant"`,
            `ALTER TABLE "security_events" DROP CONSTRAINT IF EXISTS "security_events_user_id_fkey"`,
            `ALTER TABLE "notification_preferences" DROP CONSTRAINT IF EXISTS "FK_b3403e8b519a383776f6c693cc9"`,
            `ALTER TABLE "notification_preferences" DROP CONSTRAINT IF EXISTS "FK_b70c44e8b00757584a393225593"`,
            `ALTER TABLE "loan_terms" DROP CONSTRAINT IF EXISTS "FK_loan_terms_loan_request"`,
            `ALTER TABLE "lending_policy_system_config" DROP CONSTRAINT IF EXISTS "lending_policy_system_config_lender_id_fkey"`,
            `ALTER TABLE "lending_policy_loan_limits" DROP CONSTRAINT IF EXISTS "lending_policy_loan_limits_lender_id_fkey"`,
            `ALTER TABLE "lending_policy_risk_assessment" DROP CONSTRAINT IF EXISTS "lending_policy_risk_assessment_lender_id_fkey"`,
            `ALTER TABLE "lending_policy_repayment" DROP CONSTRAINT IF EXISTS "lending_policy_repayment_lender_id_fkey"`,
            `ALTER TABLE "lending_policy_interest_rates" DROP CONSTRAINT IF EXISTS "lending_policy_interest_rates_lender_id_fkey"`,
            `ALTER TABLE "lending_policy_eligibility_criteria" DROP CONSTRAINT IF EXISTS "lending_policy_eligibility_criteria_lender_id_fkey"`,
            `ALTER TABLE "lending_policy_cargo_types" DROP CONSTRAINT IF EXISTS "lending_policy_cargo_types_lender_id_fkey"`,
            `ALTER TABLE "insurance_verifications" DROP CONSTRAINT IF EXISTS "FK_insurance_verifications_tenant"`,
            `ALTER TABLE "insurance_verifications" DROP CONSTRAINT IF EXISTS "FK_insurance_verifications_load"`,
            `ALTER TABLE "insurance_verifications" DROP CONSTRAINT IF EXISTS "FK_insurance_verifications_transporter"`,
            `ALTER TABLE "insurance_verifications" DROP CONSTRAINT IF EXISTS "FK_insurance_verifications_broker"`,
            `ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "FK_42c8e0e8ee2e6953e607e7c2daa"`,
            `ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "FK_d4e396c5a1c8de48961bdf349a2"`,
            `ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "FK_47ae4807b3ed676f608660b8dfa"`,
            `ALTER TABLE "insurance_policies" DROP CONSTRAINT IF EXISTS "FK_bf04611ec3fbf4d71b9f8515d43"`,
            `ALTER TABLE "insurance_policies" DROP CONSTRAINT IF EXISTS "FK_32881c13a51d3576a0222a6ebde"`,
            `ALTER TABLE "fuel_wallet_transactions" DROP CONSTRAINT IF EXISTS "fuel_wallet_transactions_wallet_id_fkey"`,
            `ALTER TABLE "escrow_accounts" DROP CONSTRAINT IF EXISTS "FK_escrow_accounts_tenant"`,
            `ALTER TABLE "escrow_accounts" DROP CONSTRAINT IF EXISTS "FK_escrow_accounts_trip"`,
            `ALTER TABLE "escrow_accounts" DROP CONSTRAINT IF EXISTS "FK_escrow_accounts_load"`,
            `ALTER TABLE "escrow_accounts" DROP CONSTRAINT IF EXISTS "FK_escrow_accounts_payee"`,
            `ALTER TABLE "escrow_accounts" DROP CONSTRAINT IF EXISTS "FK_escrow_accounts_payer"`,
            `ALTER TABLE "escrow_accounts" DROP CONSTRAINT IF EXISTS "FK_escrow_accounts_broker"`,
            `ALTER TABLE "email_templates" DROP CONSTRAINT IF EXISTS "email_templates_updated_by_fkey"`,
            `ALTER TABLE "email_templates" DROP CONSTRAINT IF EXISTS "email_templates_created_by_fkey"`,
            `ALTER TABLE "credit_pricing_rules" DROP CONSTRAINT IF EXISTS "credit_pricing_rules_tenant_id_fkey"`,
            `ALTER TABLE "credit_pricing_rules" DROP CONSTRAINT IF EXISTS "credit_pricing_rules_plan_id_fkey"`,
            `ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "credit_marketplace_settings_tenant_admin_user_id_fkey"`,
            `ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "credit_marketplace_settings_tenant_id_fkey"`,
            `ALTER TABLE "bulk_email_logs" DROP CONSTRAINT IF EXISTS "bulk_email_logs_created_by_fkey"`,
            `ALTER TABLE "bulk_email_logs" DROP CONSTRAINT IF EXISTS "bulk_email_logs_template_id_fkey"`,
            `ALTER TABLE "bulk_email_logs" DROP CONSTRAINT IF EXISTS "bulk_email_logs_tenant_id_fkey"`,
            `ALTER TABLE "broker_disputes" DROP CONSTRAINT IF EXISTS "FK_broker_disputes_tenant"`,
            `ALTER TABLE "broker_disputes" DROP CONSTRAINT IF EXISTS "FK_broker_disputes_trip"`,
            `ALTER TABLE "broker_disputes" DROP CONSTRAINT IF EXISTS "FK_broker_disputes_load"`,
            `ALTER TABLE "broker_disputes" DROP CONSTRAINT IF EXISTS "FK_broker_disputes_mediator"`,
            `ALTER TABLE "broker_disputes" DROP CONSTRAINT IF EXISTS "FK_broker_disputes_disputed_with"`,
            `ALTER TABLE "broker_disputes" DROP CONSTRAINT IF EXISTS "FK_broker_disputes_raised_by"`,
            `ALTER TABLE "broker_disputes" DROP CONSTRAINT IF EXISTS "FK_broker_disputes_broker"`,
            `ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "fk_activity_logs_user"`,
            `ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "FK_58b6d392b802763fda1b8cdd21d"`,
            `ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_permission_id_fkey"`,
            `ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_granted_by_fkey"`,
            `DROP INDEX IF EXISTS "public"."IDX_user_profiles_kyc_requirement_level"`,
            `DROP INDEX IF EXISTS "public"."idx_tenants_onboarding_step"`,
            `DROP INDEX IF EXISTS "public"."idx_tenants_health_score"`,
            `DROP INDEX IF EXISTS "public"."idx_tenants_last_health_check"`,
            `DROP INDEX IF EXISTS "public"."idx_tenants_kyc_status"`,
            `DROP INDEX IF EXISTS "public"."idx_tenants_kyc_submitted_at"`,
            `DROP INDEX IF EXISTS "public"."IDX_users_tenant_email_role"`,
            `DROP INDEX IF EXISTS "public"."idx_user_sessions_user_id"`,
            `DROP INDEX IF EXISTS "public"."idx_user_sessions_tenant_id"`,
            `DROP INDEX IF EXISTS "public"."idx_user_sessions_expires_at"`,
            `DROP INDEX IF EXISTS "public"."idx_user_sessions_last_activity"`,
            `DROP INDEX IF EXISTS "public"."idx_permissions_resource"`,
            `DROP INDEX IF EXISTS "public"."idx_permissions_action"`,
            `DROP INDEX IF EXISTS "public"."idx_permissions_name"`,
            `DROP INDEX IF EXISTS "public"."idx_subscription_plans_slug"`,
            `DROP INDEX IF EXISTS "public"."idx_subscription_plans_active"`,
            `DROP INDEX IF EXISTS "public"."idx_subscription_plans_price_per_credit"`,
            `DROP INDEX IF EXISTS "public"."idx_subscription_plans_credits_per_ton"`,
            `DROP INDEX IF EXISTS "public"."idx_subscription_plans_parent_subscription_id"`,
            `DROP INDEX IF EXISTS "public"."idx_subscription_payments_subscription"`,
            `DROP INDEX IF EXISTS "public"."idx_subscription_payments_payment"`,
            `DROP INDEX IF EXISTS "public"."idx_subscription_payments_invoice"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_accounts_tenant"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_accounts_balance"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_accounts_refresh"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_accounts_user_id"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_accounts_tenant_user"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_accounts_revenue"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_accounts_partners_sold"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_transactions_tenant"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_transactions_account"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_transactions_type"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_transactions_reference"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_transactions_user_id"`,
            `DROP INDEX IF EXISTS "public"."idx_tenant_subscriptions_tenant"`,
            `DROP INDEX IF EXISTS "public"."idx_tenant_subscriptions_status"`,
            `DROP INDEX IF EXISTS "public"."idx_tenant_subscriptions_period"`,
            `DROP INDEX IF EXISTS "public"."idx_tenant_subscriptions_user_id"`,
            `DROP INDEX IF EXISTS "public"."idx_tenant_kyc_documents_tenant_id"`,
            `DROP INDEX IF EXISTS "public"."idx_tenant_kyc_documents_type"`,
            `DROP INDEX IF EXISTS "public"."idx_tenant_kyc_documents_verified"`,
            `DROP INDEX IF EXISTS "public"."idx_tenant_kyc_audit_log_tenant_id"`,
            `DROP INDEX IF EXISTS "public"."idx_tenant_kyc_audit_log_created_at"`,
            `DROP INDEX IF EXISTS "public"."IDX_system_settings_category"`,
            `DROP INDEX IF EXISTS "public"."IDX_system_settings_is_public"`,
            `DROP INDEX IF EXISTS "public"."IDX_system_health_logs_service"`,
            `DROP INDEX IF EXISTS "public"."IDX_system_health_logs_timestamp"`,
            `DROP INDEX IF EXISTS "public"."IDX_system_health_logs_status"`,
            `DROP INDEX IF EXISTS "public"."IDX_system_health_logs_service_timestamp"`,
            `DROP INDEX IF EXISTS "public"."idx_system_health_timestamp"`,
            `DROP INDEX IF EXISTS "public"."idx_system_health_service_timestamp"`,
            `DROP INDEX IF EXISTS "public"."idx_security_events_severity"`,
            `DROP INDEX IF EXISTS "public"."idx_security_events_created_at"`,
            `DROP INDEX IF EXISTS "public"."idx_security_events_user_id"`,
            `DROP INDEX IF EXISTS "public"."idx_security_events_tenant_id"`,
            `DROP INDEX IF EXISTS "public"."idx_security_events_event_type"`,
            `DROP INDEX IF EXISTS "public"."idx_security_events_severity_created"`,
            `DROP INDEX IF EXISTS "public"."IDX_8facef03fbe2ee514e7fe7fe14"`,
            `DROP INDEX IF EXISTS "public"."IDX_90d452c90494da1080c16b52c1"`,
            `DROP INDEX IF EXISTS "public"."IDX_a2e2691f8172b07d81e0d1e347"`,
            `DROP INDEX IF EXISTS "public"."idx_messages_sender_recipient"`,
            `DROP INDEX IF EXISTS "public"."idx_messages_thread_id"`,
            `DROP INDEX IF EXISTS "public"."idx_messages_created_at"`,
            `DROP INDEX IF EXISTS "public"."idx_messages_is_read"`,
            `DROP INDEX IF EXISTS "public"."idx_messages_tenant_id"`,
            `DROP INDEX IF EXISTS "public"."IDX_messages_sender_recipient"`,
            `DROP INDEX IF EXISTS "public"."IDX_messages_thread_id"`,
            `DROP INDEX IF EXISTS "public"."IDX_messages_created_at"`,
            `DROP INDEX IF EXISTS "public"."IDX_messages_is_read"`,
            `DROP INDEX IF EXISTS "public"."idx_ml_tenant_truck"`,
            `DROP INDEX IF EXISTS "public"."idx_ml_truck_status"`,
            `DROP INDEX IF EXISTS "public"."IDX_loan_terms_lender_id_computed_at"`,
            `DROP INDEX IF EXISTS "public"."idx_system_config_lender"`,
            `DROP INDEX IF EXISTS "public"."idx_lpsc_lender_id"`,
            `DROP INDEX IF EXISTS "public"."idx_loan_limits_lender"`,
            `DROP INDEX IF EXISTS "public"."idx_loan_limits_business_type"`,
            `DROP INDEX IF EXISTS "public"."idx_lpll_lender_active"`,
            `DROP INDEX IF EXISTS "public"."idx_lpll_business_type_active"`,
            `DROP INDEX IF EXISTS "public"."idx_risk_assessment_lender"`,
            `DROP INDEX IF EXISTS "public"."idx_lpra_lender_active"`,
            `DROP INDEX IF EXISTS "public"."idx_lpra_factor_active"`,
            `DROP INDEX IF EXISTS "public"."idx_repayment_lender"`,
            `DROP INDEX IF EXISTS "public"."idx_lpr_lender_active"`,
            `DROP INDEX IF EXISTS "public"."idx_lpr_frequency_active"`,
            `DROP INDEX IF EXISTS "public"."idx_interest_rates_lender"`,
            `DROP INDEX IF EXISTS "public"."idx_interest_rates_active"`,
            `DROP INDEX IF EXISTS "public"."idx_lpir_lender_active"`,
            `DROP INDEX IF EXISTS "public"."idx_lpir_risk_active"`,
            `DROP INDEX IF EXISTS "public"."idx_lpec_lender_active"`,
            `DROP INDEX IF EXISTS "public"."idx_lpec_category_active"`,
            `DROP INDEX IF EXISTS "public"."idx_cargo_types_lender"`,
            `DROP INDEX IF EXISTS "public"."idx_cargo_types_cargo_type"`,
            `DROP INDEX IF EXISTS "public"."idx_lpct_lender_active"`,
            `DROP INDEX IF EXISTS "public"."idx_lpct_cargo_category_active"`,
            `DROP INDEX IF EXISTS "public"."IDX_insurance_verifications_transporter_status"`,
            `DROP INDEX IF EXISTS "public"."IDX_insurance_verifications_load_type"`,
            `DROP INDEX IF EXISTS "public"."IDX_insurance_verifications_tenant_created"`,
            `DROP INDEX IF EXISTS "public"."IDX_8e5c713517ab7a21ff3e863ca9"`,
            `DROP INDEX IF EXISTS "public"."IDX_85a9f10e2000f5b9346c385a98"`,
            `DROP INDEX IF EXISTS "public"."IDX_7c69728b0eee8df90aa28cb3aa"`,
            `DROP INDEX IF EXISTS "public"."IDX_390732a304351ba893fb459bbb"`,
            `DROP INDEX IF EXISTS "public"."IDX_8ba9f8f6f24babb4e5a4380198"`,
            `DROP INDEX IF EXISTS "public"."IDX_baa50eb26aac0be1b692c080fb"`,
            `DROP INDEX IF EXISTS "public"."idx_fw_tenant_owner"`,
            `DROP INDEX IF EXISTS "public"."idx_fw_tenant_driver"`,
            `DROP INDEX IF EXISTS "public"."idx_fwt_wallet"`,
            `DROP INDEX IF EXISTS "public"."idx_feature_credit_costs_code"`,
            `DROP INDEX IF EXISTS "public"."idx_feature_credit_costs_active"`,
            `DROP INDEX IF EXISTS "public"."IDX_escrow_accounts_load_status"`,
            `DROP INDEX IF EXISTS "public"."IDX_escrow_accounts_trip_status"`,
            `DROP INDEX IF EXISTS "public"."IDX_escrow_accounts_tenant_created"`,
            `DROP INDEX IF EXISTS "public"."idx_email_templates_category"`,
            `DROP INDEX IF EXISTS "public"."idx_email_templates_active"`,
            `DROP INDEX IF EXISTS "public"."idx_email_templates_name"`,
            `DROP INDEX IF EXISTS "public"."idx_dfa_tenant_driver"`,
            `DROP INDEX IF EXISTS "public"."idx_dfa_tenant_trip"`,
            `DROP INDEX IF EXISTS "public"."idx_dfa_tenant_status"`,
            `DROP INDEX IF EXISTS "public"."idx_pricing_rules_type"`,
            `DROP INDEX IF EXISTS "public"."idx_pricing_rules_plan"`,
            `DROP INDEX IF EXISTS "public"."idx_pricing_rules_tenant"`,
            `DROP INDEX IF EXISTS "public"."idx_pricing_rules_priority"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_packages_active"`,
            `DROP INDEX IF EXISTS "public"."idx_credit_packages_slug"`,
            `DROP INDEX IF EXISTS "public"."idx_marketplace_tenant"`,
            `DROP INDEX IF EXISTS "public"."idx_marketplace_enabled"`,
            `DROP INDEX IF EXISTS "public"."idx_bulk_email_logs_tenant"`,
            `DROP INDEX IF EXISTS "public"."idx_bulk_email_logs_template"`,
            `DROP INDEX IF EXISTS "public"."idx_bulk_email_logs_status"`,
            `DROP INDEX IF EXISTS "public"."idx_bulk_email_logs_created_at"`,
            `DROP INDEX IF EXISTS "public"."idx_bulk_email_logs_created_by"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_match_recommendations_broker_load"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_match_recommendations_broker_status"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_match_recommendations_transporter_status"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_market_intelligence_broker_route"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_market_intelligence_broker_created"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_market_intelligence_route_type"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_transporter_credit_broker_transporter"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_transporter_credit_transporter_status"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_multi_stop_loads_broker_load"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_transporter_performance_broker_transporter"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_transporter_performance_transporter_calculated"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_disputes_broker_status"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_disputes_load_status"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_disputes_trip_status"`,
            `DROP INDEX IF EXISTS "public"."IDX_broker_disputes_tenant_created"`,
            `DROP INDEX IF EXISTS "public"."idx_activity_logs_user_id"`,
            `DROP INDEX IF EXISTS "public"."idx_activity_logs_action"`,
            `DROP INDEX IF EXISTS "public"."idx_activity_logs_resource"`,
            `DROP INDEX IF EXISTS "public"."idx_activity_logs_created_at"`,
            `DROP INDEX IF EXISTS "public"."idx_activity_logs_suspicious"`,
            `DROP INDEX IF EXISTS "public"."idx_activity_logs_security_relevant"`,
            `DROP INDEX IF EXISTS "public"."idx_activity_logs_security_created"`,
            `DROP INDEX IF EXISTS "public"."IDX_rate_limits_tenant_endpoint_createdAt"`,
            `DROP INDEX IF EXISTS "public"."IDX_rate_limits_tenant_createdAt"`,
            `DROP INDEX IF EXISTS "public"."IDX_6a368689710b119486785bf8cc"`,
            `DROP INDEX IF EXISTS "public"."IDX_1592f9cf82406fbce791f0f19a"`,
            `DROP INDEX IF EXISTS "public"."idx_role_permissions_role"`,
            `DROP INDEX IF EXISTS "public"."idx_role_permissions_permission"`,
            `ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "chk_positive_balance"`,
            `ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "chk_positive_subscription_credits"`,
            `ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "chk_positive_purchased_credits"`,
            `ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "chk_positive_bonus_credits"`,
            `ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "chk_transaction_type"`,
            `ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT IF EXISTS "chk_subscription_status"`,
            `ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT IF EXISTS "chk_billing_cycle"`,
            `ALTER TABLE "feature_credit_costs" DROP CONSTRAINT IF EXISTS "chk_positive_cost"`,
            `ALTER TABLE "credit_pricing_rules" DROP CONSTRAINT IF EXISTS "chk_positive_cost"`,
            `ALTER TABLE "credit_pricing_rules" DROP CONSTRAINT IF EXISTS "chk_valid_rule_type"`,
            `ALTER TABLE "credit_packages" DROP CONSTRAINT IF EXISTS "chk_positive_credits"`,
            `ALTER TABLE "credit_packages" DROP CONSTRAINT IF EXISTS "chk_positive_price"`,
            `ALTER TABLE "credit_packages" DROP CONSTRAINT IF EXISTS "chk_valid_discount"`,
            `ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "positive_min_purchase"`,
            `ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "positive_max_purchase"`,
            `ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "max_greater_than_min"`,
            `ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "positive_price"`,
            `ALTER TABLE "permissions" DROP CONSTRAINT IF EXISTS "permissions_resource_action_key"`,
            `ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "uq_credit_accounts_tenant_user"`,
            `ALTER TABLE "system_settings" DROP CONSTRAINT IF EXISTS "UQ_system_settings_category_key"`,
            `ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_role_permission_id_key"`,
        ];

        for (const query of drops) {
            try {
                await queryRunner.query(query);
            } catch (error) {
                // Ignore "relation does not exist" errors (42P01)
                if (error.code !== '42P01') {
                    console.warn(`Warning during drop: ${query}. Error: ${error.message}`);
                }
            }
        }
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_profiles_kyc_requirement_level"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenants_onboarding_step"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenants_health_score"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenants_last_health_check"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenants_kyc_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenants_kyc_submitted_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_users_tenant_email_role"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_user_sessions_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_user_sessions_tenant_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_user_sessions_expires_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_user_sessions_last_activity"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_permissions_resource"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_permissions_action"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_permissions_name"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_subscription_plans_slug"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_subscription_plans_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_subscription_plans_price_per_credit"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_subscription_plans_credits_per_ton"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_subscription_plans_parent_subscription_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_subscription_payments_subscription"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_subscription_payments_payment"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_subscription_payments_invoice"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_accounts_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_accounts_balance"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_accounts_refresh"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_accounts_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_accounts_tenant_user"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_accounts_revenue"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_accounts_partners_sold"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_transactions_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_transactions_account"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_transactions_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_transactions_reference"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_transactions_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenant_subscriptions_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenant_subscriptions_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenant_subscriptions_period"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenant_subscriptions_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenant_kyc_documents_tenant_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenant_kyc_documents_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenant_kyc_documents_verified"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenant_kyc_audit_log_tenant_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_tenant_kyc_audit_log_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_system_settings_category"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_system_settings_is_public"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_system_health_logs_service"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_system_health_logs_timestamp"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_system_health_logs_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_system_health_logs_service_timestamp"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_system_health_timestamp"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_system_health_service_timestamp"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_security_events_severity"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_security_events_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_security_events_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_security_events_tenant_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_security_events_event_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_security_events_severity_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8facef03fbe2ee514e7fe7fe14"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_90d452c90494da1080c16b52c1"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a2e2691f8172b07d81e0d1e347"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_messages_sender_recipient"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_messages_thread_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_messages_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_messages_is_read"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_messages_tenant_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_messages_sender_recipient"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_messages_thread_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_messages_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_messages_is_read"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_ml_tenant_truck"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_ml_truck_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_loan_terms_lender_id_computed_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_system_config_lender"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpsc_lender_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_loan_limits_lender"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_loan_limits_business_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpll_lender_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpll_business_type_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_risk_assessment_lender"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpra_lender_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpra_factor_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_repayment_lender"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpr_lender_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpr_frequency_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_interest_rates_lender"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_interest_rates_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpir_lender_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpir_risk_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpec_lender_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpec_category_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_cargo_types_lender"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_cargo_types_cargo_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpct_lender_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_lpct_cargo_category_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_insurance_verifications_transporter_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_insurance_verifications_load_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_insurance_verifications_tenant_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8e5c713517ab7a21ff3e863ca9"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_85a9f10e2000f5b9346c385a98"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_7c69728b0eee8df90aa28cb3aa"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_390732a304351ba893fb459bbb"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8ba9f8f6f24babb4e5a4380198"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_baa50eb26aac0be1b692c080fb"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_fw_tenant_owner"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_fw_tenant_driver"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_fwt_wallet"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_feature_credit_costs_code"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_feature_credit_costs_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_escrow_accounts_load_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_escrow_accounts_trip_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_escrow_accounts_tenant_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_email_templates_category"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_email_templates_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_email_templates_name"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_dfa_tenant_driver"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_dfa_tenant_trip"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_dfa_tenant_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_pricing_rules_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_pricing_rules_plan"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_pricing_rules_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_pricing_rules_priority"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_packages_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_credit_packages_slug"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_marketplace_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_marketplace_enabled"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_bulk_email_logs_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_bulk_email_logs_template"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_bulk_email_logs_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_bulk_email_logs_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_bulk_email_logs_created_by"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_match_recommendations_broker_load"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_match_recommendations_broker_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_match_recommendations_transporter_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_market_intelligence_broker_route"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_market_intelligence_broker_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_market_intelligence_route_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_transporter_credit_broker_transporter"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_transporter_credit_transporter_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_multi_stop_loads_broker_load"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_transporter_performance_broker_transporter"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_transporter_performance_transporter_calculated"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_disputes_broker_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_disputes_load_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_disputes_trip_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_broker_disputes_tenant_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_activity_logs_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_activity_logs_action"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_activity_logs_resource"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_activity_logs_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_activity_logs_suspicious"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_activity_logs_security_relevant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_activity_logs_security_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_rate_limits_tenant_endpoint_createdAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_rate_limits_tenant_createdAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6a368689710b119486785bf8cc"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1592f9cf82406fbce791f0f19a"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_role_permissions_role"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_role_permissions_permission"`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "chk_positive_balance"`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "chk_positive_subscription_credits"`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "chk_positive_purchased_credits"`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "chk_positive_bonus_credits"`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "chk_transaction_type"`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT IF EXISTS "chk_subscription_status"`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT IF EXISTS "chk_billing_cycle"`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" DROP CONSTRAINT IF EXISTS "chk_positive_cost"`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" DROP CONSTRAINT IF EXISTS "chk_positive_cost"`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" DROP CONSTRAINT IF EXISTS "chk_valid_rule_type"`);
        await queryRunner.query(`ALTER TABLE "credit_packages" DROP CONSTRAINT IF EXISTS "chk_positive_credits"`);
        await queryRunner.query(`ALTER TABLE "credit_packages" DROP CONSTRAINT IF EXISTS "chk_positive_price"`);
        await queryRunner.query(`ALTER TABLE "credit_packages" DROP CONSTRAINT IF EXISTS "chk_valid_discount"`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "positive_min_purchase"`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "positive_max_purchase"`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "max_greater_than_min"`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "positive_price"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT IF EXISTS "permissions_resource_action_key"`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "uq_credit_accounts_tenant_user"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP CONSTRAINT IF EXISTS "UQ_system_settings_category_key"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_role_permission_id_key"`);
        await queryRunner.query(`COMMENT ON TABLE "user_sessions" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "permissions" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "tenant_kyc_documents" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "tenant_kyc_audit_log" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "system_health_logs" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "security_events" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "insurance_verifications" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "escrow_accounts" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "email_templates" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "credit_pricing_rules" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "credit_marketplace_settings" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "bulk_email_logs" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "broker_match_recommendations" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "broker_market_intelligence" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "broker_transporter_credit" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "broker_multi_stop_loads" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "broker_transporter_performance" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "broker_disputes" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "activity_logs" IS NULL`);
        await queryRunner.query(`COMMENT ON TABLE "role_permissions" IS NULL`);
        await queryRunner.query(`CREATE TABLE "user_permission_overrides" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "permission_id" uuid NOT NULL, "granted" boolean NOT NULL, "reason" text, "granted_by" uuid, "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8630d6e8e9664d946595eb6d86a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_85a618dede80136ba35a03b6a4" ON "user_permission_overrides" ("expires_at") WHERE expires_at IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_1d942b6fc3eeefb988291fb128" ON "user_permission_overrides" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."user_kyc_documents_document_type_enum" AS ENUM('IDENTITY_DOCUMENT', 'PASSPORT', 'DRIVER_LICENSE', 'PROOF_OF_ADDRESS', 'UTILITY_BILL', 'BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'TRADE_LICENSE', 'BANK_STATEMENT', 'CREDIT_REPORT', 'FINANCIAL_STATEMENT', 'PROFESSIONAL_CERTIFICATE', 'BROKER_LICENSE', 'FINANCIAL_LICENSE', 'VEHICLE_REGISTRATION', 'INSURANCE_CERTIFICATE', 'SAFETY_CERTIFICATE', 'MEDICAL_CERTIFICATE', 'SAFETY_TRAINING_CERTIFICATE', 'REGULATORY_APPROVAL', 'COMPLIANCE_CERTIFICATE', 'BONDING_CERTIFICATE', 'EXPERIENCE_CERTIFICATE', 'PROFESSIONAL_REFERENCE', 'AUDIT_REPORT', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."user_kyc_documents_document_category_enum" AS ENUM('IDENTITY', 'ADDRESS', 'FINANCIAL', 'BUSINESS', 'PROFESSIONAL', 'VEHICLE', 'MEDICAL', 'REGULATORY', 'OTHER')`);
        await queryRunner.query(`CREATE TABLE "user_kyc_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "user_profile_id" uuid NOT NULL, "document_type" "public"."user_kyc_documents_document_type_enum" NOT NULL, "document_category" "public"."user_kyc_documents_document_category_enum" NOT NULL, "document_name" character varying NOT NULL, "file_path" character varying NOT NULL, "file_size" integer, "mime_type" character varying, "verified" boolean NOT NULL DEFAULT false, "verified_by" uuid, "verified_at" TIMESTAMP, "expiry_date" date, "notes" character varying, "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a3c4cfe0b07e97017678da4446" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e929f0bed4987cb835b89e31b7" ON "user_kyc_documents" ("expiry_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_e4cdc64b38672f20cd6ed6a1d3" ON "user_kyc_documents" ("verified") `);
        await queryRunner.query(`CREATE INDEX "IDX_bdb69f93aceaa2c078ed604651" ON "user_kyc_documents" ("document_category") `);
        await queryRunner.query(`CREATE INDEX "IDX_d9fe14eea34dd7d7a8f2e16331" ON "user_kyc_documents" ("document_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_1b8ced93a14a57a3a8cf555344" ON "user_kyc_documents" ("user_profile_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f0d33db611c87e2bca1f9f7edf" ON "user_kyc_documents" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."user_kyc_audit_log_action_enum" AS ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'UNDER_REVIEW', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'IDENTITY_VERIFIED', 'ADDRESS_VERIFIED', 'FINANCIAL_VERIFIED', 'BUSINESS_VERIFIED', 'BACKGROUND_CHECK_COMPLETED', 'COMPLIANCE_SCORE_UPDATED', 'NOTES_UPDATED')`);
        await queryRunner.query(`CREATE TABLE "user_kyc_audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "user_profile_id" uuid NOT NULL, "action" "public"."user_kyc_audit_log_action_enum" NOT NULL, "old_status" character varying, "new_status" character varying, "performed_by" uuid, "notes" character varying, "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f6eb7318fa3c8647852fe146779" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ed69c699355cfd7536cab85e11" ON "user_kyc_audit_log" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_08e2c9330c96799fbbcc471190" ON "user_kyc_audit_log" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_d5b619ad0cef9a8dc2666d4cb6" ON "user_kyc_audit_log" ("user_profile_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e1d131cc51fb6cdb698da6daba" ON "user_kyc_audit_log" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_notification_type_enum" AS ENUM('LOW_BALANCE', 'SUBSCRIPTION_EXPIRING', 'TRIAL_EXPIRING', 'PAYMENT_FAILED', 'CREDITS_EXPIRED', 'USAGE_THRESHOLD', 'SYSTEM_MAINTENANCE')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_channel_enum" AS ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_status_enum" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'OPENED', 'CLICKED')`);
        await queryRunner.query(`CREATE TABLE "notification_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "user_id" uuid, "notification_type" "public"."notification_logs_notification_type_enum" NOT NULL, "channel" "public"."notification_logs_channel_enum" NOT NULL, "recipient_address" character varying NOT NULL, "subject" character varying, "message" text NOT NULL, "status" "public"."notification_logs_status_enum" NOT NULL DEFAULT 'PENDING', "priority" character varying NOT NULL DEFAULT 'MEDIUM', "metadata" jsonb, "sent_at" TIMESTAMP, "delivered_at" TIMESTAMP, "opened_at" TIMESTAMP, "clicked_at" TIMESTAMP, "failed_at" TIMESTAMP, "error_message" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_19c524e644cdeaebfcffc284871" PRIMARY KEY ("id")); COMMENT ON COLUMN "notification_logs"."metadata" IS 'Additional data like template variables, tracking info, etc.'`);
        await queryRunner.query(`CREATE INDEX "IDX_f803d5e1bd85942b24ee424870" ON "notification_logs" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5f4c893f2ee8263e346dfa1bf8" ON "notification_logs" ("notification_type", "sent_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_a95cd3c455317ef9fd18f95050" ON "notification_logs" ("status", "sent_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_7ca4ed34a4206249d7092751bc" ON "notification_logs" ("tenant_id", "sent_at") `);
        await queryRunner.query(`CREATE TYPE "public"."kyc_role_requirements_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'CARGO_OWNER', 'CARGO_RECEIVER', 'TRUCK_OWNER', 'DRIVER', 'AGENT', 'LENDER', 'BROKER', 'FLEET_MANAGER', 'FLEET_DISPATCHER', 'FLEET_ACCOUNTANT', 'FLEET_SAFETY_OFFICER')`);
        await queryRunner.query(`CREATE TYPE "public"."kyc_role_requirements_requirement_level_enum" AS ENUM('BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM')`);
        await queryRunner.query(`CREATE TABLE "kyc_role_requirements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."kyc_role_requirements_role_enum" NOT NULL, "requirement_level" "public"."kyc_role_requirements_requirement_level_enum" NOT NULL, "required_documents" text array NOT NULL, "optional_documents" text array NOT NULL DEFAULT '{}', "verification_steps" text array NOT NULL, "auto_approval_eligible" boolean NOT NULL DEFAULT false, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_86a4315a6d4cc4aa1979b416cb4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1af373960050ecb35914150112" ON "kyc_role_requirements" ("role") `);
        await queryRunner.query(`CREATE TYPE "public"."fuel_budgets_status_enum" AS ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'OVER_BUDGET', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "fuel_budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "trip_id" uuid NOT NULL, "truck_id" uuid NOT NULL, "budgeted_amount" numeric(15,2) NOT NULL, "actual_amount" numeric(15,2) NOT NULL DEFAULT '0', "variance" numeric(15,2) NOT NULL DEFAULT '0', "status" "public"."fuel_budgets_status_enum" NOT NULL DEFAULT 'PLANNED', "variance_percentage" numeric(5,2) NOT NULL DEFAULT '0', "alert_threshold" numeric(5,2) NOT NULL DEFAULT '10', "alert_triggered" boolean NOT NULL DEFAULT false, "notes" text, "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b422a775fb89efd0abb87009338" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_48e45ac17b4e397bc55d22c153" ON "fuel_budgets" ("tenant_id", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_5ce2b1aebad387c1afe3a41343" ON "fuel_budgets" ("tenant_id", "truck_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0d100cf8bbd893a0469deb488d" ON "fuel_budgets" ("tenant_id", "trip_id") `);
        await queryRunner.query(`CREATE TYPE "public"."epods_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'DISPUTED')`);
        await queryRunner.query(`CREATE TABLE "epods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "tripId" uuid NOT NULL, "driverId" uuid NOT NULL, "cargoOwnerId" uuid NOT NULL, "recipientName" character varying(200) NOT NULL, "recipientPhone" character varying, "signatureFileUrl" character varying, "photoUrls" jsonb NOT NULL DEFAULT '[]', "deliveryNotes" character varying, "odometerReading" character varying, "deliveryAddress" character varying, "deliveryCoordinates" jsonb, "status" "public"."epods_status_enum" NOT NULL DEFAULT 'PENDING', "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "confirmedAt" TIMESTAMP WITH TIME ZONE, "invoiceId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_21d1d33cf386c1d7c662fe38256" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f88a03adcc9e90f99ca260ebaa" ON "epods" ("cargoOwnerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8697e3af559e7fa64541e43e06" ON "epods" ("tenantId", "status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d91caab5b970b8866f63765d30" ON "epods" ("tripId") `);
        await queryRunner.query(`CREATE TABLE "cargo_owner_analytics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "cargo_owner_id" uuid NOT NULL, "load_id" uuid NOT NULL, "route_hash" character varying(64), "origin_city" character varying(100), "destination_city" character varying(100), "distance_km" numeric(10,2), "cargo_type" character varying(50), "cargo_weight_kg" numeric(10,2), "cargo_volume_m3" numeric(10,2), "cargo_value" numeric(12,2), "total_cost" numeric(12,2), "cost_per_km" numeric(8,2), "cost_per_kg" numeric(8,4), "profit_margin" numeric(5,2), "booking_date" TIMESTAMP WITH TIME ZONE, "pickup_date" TIMESTAMP WITH TIME ZONE, "delivery_date" TIMESTAMP WITH TIME ZONE, "planned_transit_hours" integer, "actual_transit_hours" integer, "delay_hours" integer, "on_time_delivery" boolean NOT NULL DEFAULT false, "damage_reported" boolean NOT NULL DEFAULT false, "carrier_id" uuid, "carrier_rating" numeric(3,2), "season" character varying(20), "market_conditions" jsonb NOT NULL DEFAULT '{}', "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0a6f361c27436bcee200fe490fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6e200f546c62dd34839d181598" ON "cargo_owner_analytics" ("load_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_195490440ff2eace58959bbe1c" ON "cargo_owner_analytics" ("booking_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_98b2a588d40bd09bbf3437b9b0" ON "cargo_owner_analytics" ("season") `);
        await queryRunner.query(`CREATE INDEX "IDX_38cc58643129eb7b03ea8cb6e5" ON "cargo_owner_analytics" ("carrier_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c7ea716d05f5325c4130a6867e" ON "cargo_owner_analytics" ("route_hash") `);
        await queryRunner.query(`CREATE INDEX "IDX_a3de91fac75e0f8c03a52af32a" ON "cargo_owner_analytics" ("tenant_id", "booking_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_af7d535aea2fc3ca1eb561ad30" ON "cargo_owner_analytics" ("tenant_id", "cargo_owner_id") `);
        await queryRunner.query(`CREATE TYPE "public"."analytics_insights_insight_type_enum" AS ENUM('cost_optimization', 'carrier_recommendation', 'route_analysis', 'demand_prediction', 'risk_alert', 'performance_improvement', 'market_opportunity')`);
        await queryRunner.query(`CREATE TYPE "public"."analytics_insights_status_enum" AS ENUM('active', 'dismissed', 'implemented', 'expired')`);
        await queryRunner.query(`CREATE TABLE "analytics_insights" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "cargo_owner_id" uuid NOT NULL, "insight_type" "public"."analytics_insights_insight_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "description" text, "confidence_score" numeric(3,2), "potential_impact" jsonb NOT NULL DEFAULT '{}', "data_sources" jsonb NOT NULL DEFAULT '{}', "recommendations" jsonb NOT NULL DEFAULT '{}', "status" "public"."analytics_insights_status_enum" NOT NULL DEFAULT 'active', "expires_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_21dcb9ee33801affa4b2e917ebd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_388821de26f6747a5e8170f8d8" ON "analytics_insights" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_2e736b729859342dec27976bc8" ON "analytics_insights" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_34c3d35482c852a5b1994720c8" ON "analytics_insights" ("tenant_id", "insight_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_d6988ec6a7ed344657de8b7e0e" ON "analytics_insights" ("tenant_id", "cargo_owner_id") `);
        await queryRunner.query(`CREATE TYPE "public"."multi_modal_shipments_status_enum" AS ENUM('PLANNING', 'BOOKED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'COMPLETED', 'DELAYED')`);
        await queryRunner.query(`CREATE TABLE "multi_modal_shipments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "loadId" uuid NOT NULL, "shipmentNumber" character varying NOT NULL, "status" "public"."multi_modal_shipments_status_enum" NOT NULL DEFAULT 'PLANNING', "estimatedArrival" TIMESTAMP WITH TIME ZONE, "actualArrival" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_22f1c34e227d5ccc37a6e22ce32" UNIQUE ("shipmentNumber"), CONSTRAINT "PK_3fc1e05953d8870674a48f68549" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."multi_modal_legs_mode_enum" AS ENUM('TRUCK', 'RAIL', 'SEA', 'AIR')`);
        await queryRunner.query(`CREATE TYPE "public"."multi_modal_legs_status_enum" AS ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'DELAYED')`);
        await queryRunner.query(`CREATE TABLE "multi_modal_legs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shipmentId" uuid NOT NULL, "mode" "public"."multi_modal_legs_mode_enum" NOT NULL, "status" "public"."multi_modal_legs_status_enum" NOT NULL DEFAULT 'PENDING', "carrierName" character varying, "vesselName" character varying, "voyageNumber" character varying, "trackingNumber" character varying, "originHub" character varying, "destinationHub" character varying, "scheduledDeparture" TIMESTAMP WITH TIME ZONE, "scheduledArrival" TIMESTAMP WITH TIME ZONE, "currentLat" numeric(10,6), "currentLng" numeric(10,6), "sequence" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_315fd399c35fdfb9491e99cdebe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_inheritance" ("role_id" uuid NOT NULL, "inherits_from_role_id" uuid NOT NULL, CONSTRAINT "PK_a4c177d22623715dc839659f365" PRIMARY KEY ("role_id", "inherits_from_role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1a5a1be0ff83033579522b0e4e" ON "role_inheritance" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c118ebf755f0edce9d609279d0" ON "role_inheritance" ("inherits_from_role_id") `);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "REL_6ca9503d77ae39b4b5a6cc3ba8"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "health_score"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "last_health_check"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "kyc_status"`);
        await queryRunner.query(`DROP TYPE "public"."kyc_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "kyc_data"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "kyc_submitted_at"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "kyc_verified_at"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "kyc_notes"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "kyc_reviewed_by"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "onboarding_step"`);
        await queryRunner.query(`DROP TYPE "public"."onboarding_step_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "onboarding_completed_at"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT IF EXISTS "permissions_name_key"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "is_popular"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" DROP COLUMN "is_marketplace_plan"`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" DROP COLUMN "calculation_details"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "document_type"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "document_name"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "file_path"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "file_size"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "mime_type"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "uploaded_by"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "uploaded_at"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "verified_by"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "verified_at"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "old_status"`);
        await queryRunner.query(`DROP TYPE "public"."kyc_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "new_status"`);
        await queryRunner.query(`DROP TYPE "public"."kyc_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "performed_by"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "category"`);
        await queryRunner.query(`DROP TYPE "public"."notification_preferences_category_enum"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "channel"`);
        await queryRunner.query(`DROP TYPE "public"."notification_preferences_channel_enum"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "isEnabled"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "emailEnabled"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "smsEnabled"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "pushEnabled"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "inAppEnabled"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "emailAddress"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "deviceToken"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "language"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "timezone"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "quietHours"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "frequency"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "priority"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "adjusterName"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "adjusterPhone"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "adjusterEmail"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "adjusterNotes"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "investigationNotes"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "denialReason"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "photos"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "policeReportNumber"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "witnessName"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "witnessPhone"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "witnessStatement"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "isFault"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "faultDescription"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "settlementDate"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "settlementNotes"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "createdBy"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "assignedTo"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "monthlyPremium"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "coverageDetails"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "exclusions"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "conditions"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "agentName"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "agentPhone"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "agentEmail"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "createdBy"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" DROP COLUMN "credit_cost"`);
        await queryRunner.query(`ALTER TABLE "credit_packages" DROP CONSTRAINT IF EXISTS "credit_packages_slug_key"`);
        await queryRunner.query(`ALTER TABLE "credit_packages" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "credit_packages" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "credit_packages" DROP COLUMN "is_popular"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP COLUMN "security_relevant"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "truckId"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "adjuster"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "witnesses"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "policeReport"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "repairEstimates"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "timeline"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "settlement"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "appeal"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "premium"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "coverageTypes"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "agent"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "paymentMethod"`);
        await queryRunner.query(`DROP TYPE "public"."insurance_policies_paymentmethod_enum"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "lastPaymentDate"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "nextPaymentDate"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "claimsCount"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "totalClaimsAmount"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_pkey"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP COLUMN "granted_at"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP COLUMN "granted_by"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "device_info" jsonb`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "location" jsonb`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."tenant_kyc_documents_documenttype_enum" AS ENUM('BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'IDENTITY_DOCUMENT', 'BANK_STATEMENT', 'PROOF_OF_ADDRESS', 'INSURANCE_CERTIFICATE', 'OTHER')`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "documentType" "public"."tenant_kyc_documents_documenttype_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "documentName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "filePath" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "fileSize" integer`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "mimeType" character varying`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "uploadedBy" uuid`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "verifiedBy" uuid`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "verifiedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."tenant_kyc_audit_log_oldstatus_enum" AS ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'INCOMPLETE')`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "oldStatus" "public"."tenant_kyc_audit_log_oldstatus_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."tenant_kyc_audit_log_newstatus_enum" AS ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'INCOMPLETE')`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "newStatus" "public"."tenant_kyc_audit_log_newstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "performedBy" uuid`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "tenant_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "user_id" uuid`);
        await queryRunner.query(`CREATE TYPE "public"."notification_preferences_notification_type_enum" AS ENUM('LOW_BALANCE', 'SUBSCRIPTION_EXPIRING', 'TRIAL_EXPIRING', 'PAYMENT_FAILED', 'CREDITS_EXPIRED', 'USAGE_THRESHOLD', 'SYSTEM_MAINTENANCE')`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "notification_type" "public"."notification_preferences_notification_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "enabled_channels" text array NOT NULL DEFAULT '{EMAIL,IN_APP}'`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "is_enabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "email_address" character varying`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "phone_number" character varying`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "settings" jsonb`);
        await queryRunner.query(`COMMENT ON COLUMN "notification_preferences"."settings" IS 'Additional settings like frequency, thresholds, etc.'`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "truckId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "adjuster" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "notes" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "witnesses" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "policeReport" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "repairEstimates" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "timeline" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "settlement" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "appeal" json`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "premium" numeric(15,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "coverageTypes" text`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "agent" json`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "paymentMethod" "public"."insurance_policies_paymentmethod_enum" NOT NULL DEFAULT 'monthly'`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "lastPaymentDate" date`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "nextPaymentDate" date`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "claimsCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "totalClaimsAmount" numeric(15,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" ADD "base_cost" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" ADD "plan_multipliers" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "category" "public"."notification_preferences_category_enum" NOT NULL DEFAULT 'system'`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "channel" "public"."notification_preferences_channel_enum" NOT NULL DEFAULT 'email'`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "isEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "emailEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "smsEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "pushEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "inAppEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "emailAddress" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "phoneNumber" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "deviceToken" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "language" character varying(10) NOT NULL DEFAULT 'en'`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "timezone" character varying(10) NOT NULL DEFAULT 'UTC'`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "quietHours" jsonb`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "frequency" jsonb`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "priority" jsonb`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "adjusterName" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "adjusterPhone" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "adjusterEmail" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "adjusterNotes" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "investigationNotes" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "denialReason" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "photos" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "policeReportNumber" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "witnessName" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "witnessPhone" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "witnessStatement" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "isFault" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "faultDescription" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "settlementDate" date`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "settlementNotes" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "createdBy" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "assignedTo" uuid`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "monthlyPremium" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "coverageDetails" json`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "exclusions" json`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "conditions" json`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "agentName" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "agentPhone" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "agentEmail" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "createdBy" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD "role_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "PK_178199805b901ccd220ab7740ec" PRIMARY KEY ("role_id")`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "PK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id")`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "UQ_8481388d6325e752cd4d7e26c6d" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TYPE "public"."user_profiles_kycrequirementlevel_enum" RENAME TO "user_profiles_kycrequirementlevel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_profiles_kyc_requirement_level_enum" AS ENUM('BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM')`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "kyc_requirement_level" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "kyc_requirement_level" TYPE "public"."user_profiles_kyc_requirement_level_enum" USING "kyc_requirement_level"::"text"::"public"."user_profiles_kyc_requirement_level_enum"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "kyc_requirement_level" SET DEFAULT 'BASIC'`);
        await queryRunner.query(`DROP TYPE "public"."user_profiles_kycrequirementlevel_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "kyc_requirement_level" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "kyc_data" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "identity_verified" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "address_verified" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "financial_verified" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "business_verified" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "background_check_completed" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "compliance_score" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "registrationNumber" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "registrationExpiry" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "insurancePolicy" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "insuranceExpiry" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD CONSTRAINT "UQ_06e11d5ca528baa2288ac10c6c5" UNIQUE ("contactEmail")`);
        await queryRunner.query(`ALTER TYPE "public"."tenant_kyc_status_enum" RENAME TO "tenant_kyc_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tenants_kycstatus_enum" AS ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'INCOMPLETE')`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "kycStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "kycStatus" TYPE "public"."tenants_kycstatus_enum" USING "kycStatus"::"text"::"public"."tenants_kycstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "kycStatus" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."tenant_kyc_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "kycStatus" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "kycData" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "kycNotes"`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "kycNotes" character varying`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "onboardingStep" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "tenants"."onboardingStep" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "drivers"."experience" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "drivers"."driverNotes" IS NULL`);
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "hoursOfService" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "hoursOfService" SET DEFAULT '{"breaks":[],"drivingHours":0,"onDutyHours":0,"offDutyHours":0}'`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d6ee2d4bf901675877bb94977c"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c665cbd04804c0de36c2019de5"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'CARGO_OWNER', 'CARGO_RECEIVER', 'TRUCK_OWNER', 'DRIVER', 'AGENT', 'LENDER', 'BROKER', 'FLEET_MANAGER', 'FLEET_DISPATCHER', 'FLEET_ACCOUNTANT', 'FLEET_SAFETY_OFFICER')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CARGO_OWNER'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "user_sessions"."session_id" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "user_sessions"."user_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "ip_address"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "ip_address" inet`);
        await queryRunner.query(`COMMENT ON COLUMN "user_sessions"."user_agent" IS NULL`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "last_activity"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "last_activity" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "expires_at" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "started_at"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "started_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`COMMENT ON COLUMN "user_sessions"."tenant_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_system" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "action"`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "action" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."parent_subscription_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "price_per_credit" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."price_per_credit" IS NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "price_per_credit" SET DEFAULT '0.15'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "total_credits" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."total_credits" IS NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "credits_per_ton_tenant" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."credits_per_ton_tenant" IS NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "credits_per_ton_tenant" SET DEFAULT '2'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "credits_per_ton_truck_owner" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."credits_per_ton_truck_owner" IS NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "credits_per_ton_truck_owner" SET DEFAULT '5'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "credit_cost_per_partner" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."credit_cost_per_partner" IS NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "available_slots" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."available_slots" IS NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "features" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "limits" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "display_order" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" ALTER COLUMN "payment_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_accounts"."user_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "revenue_from_partner_sales" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_accounts"."revenue_from_partner_sales" IS NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "total_partners_sold" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_accounts"."total_partners_sold" IS NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "credits_allocated_to_partners" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_accounts"."credits_allocated_to_partners" IS NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "revenue_from_marketplace_sales" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "total_credits_sold_marketplace" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "total_marketplace_transactions" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_transactions"."user_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."credit_transactions_type_enum" AS ENUM('SUBSCRIPTION_GRANT', 'PURCHASE', 'CONSUMPTION', 'REFUND', 'BONUS', 'EXPIRY', 'ADJUSTMENT')`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD "type" "public"."credit_transactions_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ALTER COLUMN "metadata" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "tenant_subscriptions"."user_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."tenant_subscriptions_status_enum" AS ENUM('active', 'cancelled', 'expired', 'suspended', 'trial')`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD "status" "public"."tenant_subscriptions_status_enum" NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP COLUMN "billing_cycle"`);
        await queryRunner.query(`CREATE TYPE "public"."tenant_subscriptions_billing_cycle_enum" AS ENUM('monthly', 'yearly')`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD "billing_cycle" "public"."tenant_subscriptions_billing_cycle_enum" NOT NULL DEFAULT 'monthly'`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ALTER COLUMN "auto_renew" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ALTER COLUMN "metadata" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ALTER COLUMN "verified" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "notes" character varying`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "action"`);
        await queryRunner.query(`CREATE TYPE "public"."tenant_kyc_audit_log_action_enum" AS ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'INCOMPLETE', 'UNDER_REVIEW', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'NOTES_UPDATED')`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "action" "public"."tenant_kyc_audit_log_action_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "notes" character varying`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ALTER COLUMN "metadata" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" DROP CONSTRAINT IF EXISTS "system_health_logs_pkey"`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ADD CONSTRAINT "PK_48ac00277cf6992c147dab10e7d" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" DROP COLUMN "service"`);
        await queryRunner.query(`CREATE TYPE "public"."system_health_logs_service_enum" AS ENUM('DATABASE', 'API', 'CACHE', 'EMAIL', 'STORAGE', 'PAYMENT', 'SERVER')`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ADD "service" "public"."system_health_logs_service_enum" NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."system_health_logs_status_enum" RENAME TO "system_health_logs_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."system_health_logs_status_enum" AS ENUM('HEALTHY', 'DEGRADED', 'DOWN')`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "status" TYPE "public"."system_health_logs_status_enum" USING "status"::"text"::"public"."system_health_logs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."system_health_logs_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "metric_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "metric_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "metric_value" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "threshold_value" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" DROP COLUMN "severity"`);
        await queryRunner.query(`DROP TYPE "public"."system_health_logs_severity_enum"`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ADD "severity" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "metadata" DROP DEFAULT`);
        await queryRunner.query(`COMMENT ON COLUMN "system_health_logs"."timestamp" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."event_type" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."severity" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."user_id" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."tenant_id" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."ip_address" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."user_agent" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."details" IS NULL`);
        await queryRunner.query(`ALTER TABLE "security_events" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "security_events" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_797841712968aa775af0cb0b54"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_13c6c844995d9cc303e7e05087"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_9b2e0e69131e085736edccaec5"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_db8d3f73a58b39fc0c14302840"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_entitytype_enum" RENAME TO "notifications_entitytype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_entitytype_enum" AS ENUM('USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP', 'COMPANY', 'TENANT', 'SYSTEM', 'DOCUMENT', 'PAYMENT', 'EXPENSE', 'LOAN', 'AUCTION')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "entityType" TYPE "public"."notifications_entitytype_enum" USING "entityType"::"text"::"public"."notifications_entitytype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_entitytype_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_notificationtype_enum" RENAME TO "notifications_notificationtype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_notificationtype_enum" AS ENUM('SYSTEM_MAINTENANCE', 'SYSTEM_UPDATE', 'SYSTEM_ERROR', 'USER_WELCOME', 'USER_VERIFICATION', 'USER_PASSWORD_RESET', 'USER_ACCOUNT_LOCKED', 'DRIVER_ASSIGNMENT', 'DRIVER_TRIP_START', 'DRIVER_TRIP_END', 'DRIVER_ALERT', 'DRIVER_DOCUMENT_EXPIRY', 'DRIVER_SAFETY_ALERT', 'DRIVER_FATIGUE_WARNING', 'VEHICLE_MAINTENANCE_DUE', 'VEHICLE_INSPECTION_DUE', 'VEHICLE_INSURANCE_EXPIRY', 'VEHICLE_REGISTRATION_EXPIRY', 'VEHICLE_BREAKDOWN', 'CARGO_PICKUP_REMINDER', 'CARGO_DELIVERY_UPDATE', 'CARGO_DELAY', 'CARGO_DAMAGE', 'CARGO_CUSTOMS_UPDATE', 'TRIP_CREATED', 'TRIP_STARTED', 'TRIP_COMPLETED', 'TRIP_CANCELLED', 'TRIP_DELAY', 'TRIP_ROUTE_CHANGE', 'TRIP_UPDATE', 'TRIP_STATUS', 'PAYMENT_RECEIVED', 'PAYMENT_DUE', 'PAYMENT_OVERDUE', 'INVOICE_GENERATED', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'PAYMENT', 'LICENSE_EXPIRY', 'CERTIFICATION_EXPIRY', 'INSURANCE_EXPIRY', 'PERMIT_EXPIRY', 'AUDIT_DUE', 'VIOLATION_ALERT', 'CONTRACT_EXPIRY', 'AGREEMENT_UPDATE', 'POLICY_CHANGE', 'NEW_FEATURE', 'EMERGENCY_ALERT', 'ACCIDENT_REPORT', 'WEATHER_WARNING', 'ROAD_CLOSURE', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'AUCTION_BID_RECEIVED', 'AUCTION_WON', 'AUCTION_LOST', 'SMART_MATCH_SELECTED', 'LOAN_REQUESTED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_DISBURSED', 'LOAN_REPAYMENT_RECEIVED', 'LOAN_OVERDUE', 'LENDER_PAID_ON_BEHALF', 'PAYMENT_REMINDER', 'TRUCK_OWNER_PAYMENT_RECEIVED', 'GENERAL', 'REMINDER', 'ALERT', 'INFO')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "notificationType" TYPE "public"."notifications_notificationtype_enum" USING "notificationType"::"text"::"public"."notifications_notificationtype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_notificationtype_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_category_enum" RENAME TO "notifications_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_category_enum" AS ENUM('SYSTEM', 'USER', 'DRIVER', 'VEHICLE', 'CARGO', 'TRIP', 'TRIP_STATUS', 'FINANCIAL', 'COMPLIANCE', 'BUSINESS', 'EMERGENCY', 'GENERAL', 'SAFETY', 'PERFORMANCE', 'MAINTENANCE', 'MARKETING', 'LOAN', 'AUCTION')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "category" TYPE "public"."notifications_category_enum" USING "category"::"text"::"public"."notifications_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_category_enum_old"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "sender_role"`);
        await queryRunner.query(`CREATE TYPE "public"."messages_sender_role_enum" AS ENUM('DRIVER', 'SHIPPER', 'CARGO_OWNER', 'TRUCK_OWNER', 'DISPATCH', 'SYSTEM')`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "sender_role" "public"."messages_sender_role_enum" NOT NULL DEFAULT 'SYSTEM'`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TYPE "public"."maintenance_type_enum" RENAME TO "maintenance_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."maintenance_logs_type_enum" AS ENUM('ROUTINE', 'REPAIR', 'EMERGENCY', 'INSPECTION', 'FAULT_REPORT')`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "type" TYPE "public"."maintenance_logs_type_enum" USING "type"::"text"::"public"."maintenance_logs_type_enum"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "type" SET DEFAULT 'ROUTINE'`);
        await queryRunner.query(`DROP TYPE "public"."maintenance_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."maintenance_status_enum" RENAME TO "maintenance_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."maintenance_logs_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "status" TYPE "public"."maintenance_logs_status_enum" USING "status"::"text"::"public"."maintenance_logs_status_enum"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."maintenance_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "cost" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "loan_terms" DROP CONSTRAINT IF EXISTS "UQ_loan_terms_loan_request_id"`);
        await queryRunner.query(`ALTER TYPE "public"."approval_mode_enum" RENAME TO "approval_mode_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lending_policy_system_config_approval_mode_enum" AS ENUM('manual', 'automatic', 'hybrid')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "approval_mode" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "approval_mode" TYPE "public"."lending_policy_system_config_approval_mode_enum" USING "approval_mode"::"text"::"public"."lending_policy_system_config_approval_mode_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "approval_mode" SET DEFAULT 'hybrid'`);
        await queryRunner.query(`DROP TYPE "public"."approval_mode_enum_old"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "max_concurrent_loans" SET DEFAULT '5'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "total_exposure_limit" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "max_portfolio_utilization" SET DEFAULT '80'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "cooldown_period_days" SET DEFAULT '30'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "default_interest_rate" SET DEFAULT '15'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "default_advance_percentage" SET DEFAULT '70'`);
        await queryRunner.query(`ALTER TYPE "public"."compliance_level_enum" RENAME TO "compliance_level_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lending_policy_system_config_compliance_level_enum" AS ENUM('basic', 'standard', 'strict', 'regulatory')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "compliance_level" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "compliance_level" TYPE "public"."lending_policy_system_config_compliance_level_enum" USING "compliance_level"::"text"::"public"."lending_policy_system_config_compliance_level_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "compliance_level" SET DEFAULT 'standard'`);
        await queryRunner.query(`DROP TYPE "public"."compliance_level_enum_old"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "audit_trail_enabled" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" DROP COLUMN "business_type"`);
        await queryRunner.query(`CREATE TYPE "public"."lending_policy_loan_limits_business_type_enum" AS ENUM('individual', 'sme', 'corporation', 'cooperative')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ADD "business_type" "public"."lending_policy_loan_limits_business_type_enum" NOT NULL DEFAULT 'individual'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "credit_score_requirement" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "collateral_requirement" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "max_utilization" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "priority" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "priority" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."risk_factor_enum" RENAME TO "risk_factor_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lending_policy_risk_assessment_factor_enum" AS ENUM('credit_score', 'payment_history', 'debt_to_income', 'business_age', 'industry_risk', 'collateral_value', 'cash_flow', 'market_conditions')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "factor" TYPE "public"."lending_policy_risk_assessment_factor_enum" USING "factor"::"text"::"public"."lending_policy_risk_assessment_factor_enum"`);
        await queryRunner.query(`DROP TYPE "public"."risk_factor_enum_old"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "priority" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "priority" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."repayment_frequency_enum" RENAME TO "repayment_frequency_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lending_policy_repayment_frequency_enum" AS ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "frequency" TYPE "public"."lending_policy_repayment_frequency_enum" USING "frequency"::"text"::"public"."lending_policy_repayment_frequency_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "frequency" SET DEFAULT 'monthly'`);
        await queryRunner.query(`DROP TYPE "public"."repayment_frequency_enum_old"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "frequency" SET DEFAULT 'monthly'`);
        await queryRunner.query(`ALTER TYPE "public"."penalty_type_enum" RENAME TO "penalty_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lending_policy_repayment_late_fee_type_enum" AS ENUM('fixed_amount', 'percentage', 'compound_interest')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "late_fee_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "late_fee_type" TYPE "public"."lending_policy_repayment_late_fee_type_enum" USING "late_fee_type"::"text"::"public"."lending_policy_repayment_late_fee_type_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "late_fee_type" SET DEFAULT 'fixed_amount'`);
        await queryRunner.query(`DROP TYPE "public"."penalty_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "priority" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "priority" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" DROP COLUMN "risk_level"`);
        await queryRunner.query(`CREATE TYPE "public"."lending_policy_interest_rates_risk_level_enum" AS ENUM('low', 'medium', 'high', 'critical')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ADD "risk_level" "public"."lending_policy_interest_rates_risk_level_enum" NOT NULL DEFAULT 'medium'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ALTER COLUMN "priority" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ALTER COLUMN "priority" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."eligibility_category_enum" RENAME TO "eligibility_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lending_policy_eligibility_criteria_category_enum" AS ENUM('credit_score', 'business_age', 'revenue', 'collateral', 'guarantor', 'documents', 'industry', 'location')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" ALTER COLUMN "category" TYPE "public"."lending_policy_eligibility_criteria_category_enum" USING "category"::"text"::"public"."lending_policy_eligibility_criteria_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."eligibility_category_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."comparison_operator_enum" RENAME TO "comparison_operator_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lending_policy_eligibility_criteria_operator_enum" AS ENUM('greater_than', 'less_than', 'equal_to', 'greater_than_or_equal', 'less_than_or_equal', 'between', 'in', 'not_in')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" ALTER COLUMN "operator" TYPE "public"."lending_policy_eligibility_criteria_operator_enum" USING "operator"::"text"::"public"."lending_policy_eligibility_criteria_operator_enum"`);
        await queryRunner.query(`DROP TYPE "public"."comparison_operator_enum_old"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."cargo_category_enum" RENAME TO "cargo_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lending_policy_cargo_types_cargo_category_enum" AS ENUM('general', 'fragile', 'hazardous', 'refrigerated', 'liquid', 'oversized', 'valuable', 'perishable', 'chemicals', 'machinery')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "cargo_category" TYPE "public"."lending_policy_cargo_types_cargo_category_enum" USING "cargo_category"::"text"::"public"."lending_policy_cargo_types_cargo_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cargo_category_enum_old"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "cargo_category" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "cargo_type" DROP NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."risk_level_enum" RENAME TO "risk_level_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lending_policy_cargo_types_risk_level_enum" AS ENUM('low', 'medium', 'high', 'critical')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "risk_level" TYPE "public"."lending_policy_cargo_types_risk_level_enum" USING "risk_level"::"text"::"public"."lending_policy_cargo_types_risk_level_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "risk_level" SET DEFAULT 'medium'`);
        await queryRunner.query(`DROP TYPE "public"."risk_level_enum_old"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "risk_level" SET DEFAULT 'medium'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "insurance_required" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "priority" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "priority" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lender_policies" ALTER COLUMN "advance_percentage" SET DEFAULT '0.7'`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "UQ_7c69728b0eee8df90aa28cb3aaf"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "claimNumber"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "claimNumber" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "UQ_7c69728b0eee8df90aa28cb3aaf" UNIQUE ("claimNumber")`);
        await queryRunner.query(`ALTER TYPE "public"."insurance_claims_claimtype_enum" RENAME TO "insurance_claims_claimtype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."insurance_claims_claimtype_enum" AS ENUM('collision', 'cargo_damage', 'theft', 'weather', 'liability', 'medical', 'roadside', 'other')`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "claimType" TYPE "public"."insurance_claims_claimtype_enum" USING "claimType"::"text"::"public"."insurance_claims_claimtype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."insurance_claims_claimtype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "paidAmount" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "paidAmount" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TYPE "public"."insurance_claims_status_enum" RENAME TO "insurance_claims_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."insurance_claims_status_enum" AS ENUM('pending', 'investigating', 'approved', 'denied', 'closed', 'under_review')`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "status" TYPE "public"."insurance_claims_status_enum" USING "status"::"text"::"public"."insurance_claims_status_enum"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."insurance_claims_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "location" json`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP CONSTRAINT IF EXISTS "UQ_baa50eb26aac0be1b692c080fbf"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "policyNumber"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "policyNumber" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD CONSTRAINT "UQ_baa50eb26aac0be1b692c080fbf" UNIQUE ("policyNumber")`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "insuranceCompany"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "insuranceCompany" character varying NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."insurance_policies_policytype_enum" RENAME TO "insurance_policies_policytype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."insurance_policies_policytype_enum" AS ENUM('liability', 'collision', 'comprehensive', 'cargo', 'uninsured_motorist', 'roadside', 'medical')`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ALTER COLUMN "policyType" TYPE "public"."insurance_policies_policytype_enum" USING "policyType"::"text"::"public"."insurance_policies_policytype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."insurance_policies_policytype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ALTER COLUMN "deductible" TYPE numeric(15,2)`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ALTER COLUMN "balance" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ALTER COLUMN "total_credits" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ALTER COLUMN "total_debits" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ALTER COLUMN "status" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ALTER COLUMN "metadata" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TYPE "public"."fuel_wallet_transaction_type" RENAME TO "fuel_wallet_transaction_type_old"`);
        await queryRunner.query(`CREATE TYPE "public"."fuel_wallet_transactions_type_enum" AS ENUM('CREDIT', 'DEBIT')`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" ALTER COLUMN "type" TYPE "public"."fuel_wallet_transactions_type_enum" USING "type"::"text"::"public"."fuel_wallet_transactions_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."fuel_wallet_transaction_type_old"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" ALTER COLUMN "metadata" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "category" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "category" SET DEFAULT 'general'`);
        await queryRunner.query(`COMMENT ON COLUMN "email_templates"."template_variables" IS NULL`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "template_variables" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."driver_fuel_advance_status_enum" RENAME TO "driver_fuel_advance_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."driver_fuel_advances_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'RECONCILED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ALTER COLUMN "status" TYPE "public"."driver_fuel_advances_status_enum" USING "status"::"text"::"public"."driver_fuel_advances_status_enum"`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."driver_fuel_advance_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ALTER COLUMN "metadata" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" DROP COLUMN "rule_type"`);
        await queryRunner.query(`CREATE TYPE "public"."credit_pricing_rules_rule_type_enum" AS ENUM('weight', 'distance', 'time', 'flat')`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ADD "rule_type" "public"."credit_pricing_rules_rule_type_enum" NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."unit" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."credit_cost" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."plan_id" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."tenant_id" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."min_value" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."max_value" IS NULL`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ALTER COLUMN "priority" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."priority" IS NULL`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ALTER COLUMN "discount_percentage" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ALTER COLUMN "display_order" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "unique_tenant_marketplace"`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_marketplace_settings"."min_purchase_amount" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_marketplace_settings"."max_purchase_amount" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_marketplace_settings"."price_per_credit" IS NULL`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ALTER COLUMN "price_per_credit" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ALTER COLUMN "is_enabled" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_marketplace_settings"."is_enabled" IS NULL`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ALTER COLUMN "settings_metadata" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "recipients_count" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "sent_count" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "failed_count" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "status" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "bulk_email_logs"."status" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "bulk_email_logs"."metadata" IS NULL`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ALTER COLUMN "is_suspicious" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "UQ_7c69728b0eee8df90aa28cb3aaf"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "claimNumber"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "claimNumber" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "UQ_7c69728b0eee8df90aa28cb3aaf" UNIQUE ("claimNumber")`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "location" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP CONSTRAINT IF EXISTS "UQ_baa50eb26aac0be1b692c080fbf"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "policyNumber"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "policyNumber" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD CONSTRAINT "UQ_baa50eb26aac0be1b692c080fbf" UNIQUE ("policyNumber")`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "insuranceCompany"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "insuranceCompany" character varying(100) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_37b11c00133f4561aa6980ca33" ON "user_profiles" ("kyc_requirement_level") `);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_d6ee2d4bf901675877bb94977c" ON "users" ("role", "status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c665cbd04804c0de36c2019de5" ON "users" ("tenantId", "email", "role") WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_dbc81ff542b1b3366bae195f2a" ON "user_sessions" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_e9658e959c490b0a634dfc5478" ON "user_sessions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_aad80a27f0a425bfc3f092a732" ON "permissions" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_686d1ea5af1256411104b26548" ON "subscription_plans" ("is_active", "display_order") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0ebf9b0f0cbd7b2fb5b62e3fac" ON "subscription_plans" ("slug") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3e51a39cdc9a809c529b1535f7" ON "subscription_payments" ("invoice_number") `);
        await queryRunner.query(`CREATE INDEX "IDX_173289b1de8485fbb852ff08fa" ON "subscription_payments" ("payment_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e1265f24538173a087762a9745" ON "subscription_payments" ("subscription_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_e9e4079e4a9bc1ddeb3452b7f6" ON "credit_accounts" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5c28e3be70b859f2f9a99c3a5c" ON "credit_accounts" ("next_refresh_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_22fb71850b9ff42bd211569c81" ON "credit_accounts" ("current_balance") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_595ba72b7adb92ee80c0837694" ON "credit_accounts" ("tenant_id", "user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9ac41a5292ef4d8356a86be30c" ON "credit_transactions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2c0395713680ab5eb6c8d001d0" ON "credit_transactions" ("expires_at") WHERE expires_at IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_c1b2afb65de0f9494f2981e131" ON "credit_transactions" ("reference_type", "reference_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8ecced8d9f776030ab2060f3f2" ON "credit_transactions" ("type", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4a5574cb41935313243a5eae7" ON "credit_transactions" ("credit_account_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_51367f4601eb1a60444512646d" ON "credit_transactions" ("tenant_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_b79fb41debf9b4f464db5fd565" ON "tenant_subscriptions" ("current_period_end") `);
        await queryRunner.query(`CREATE INDEX "IDX_05f0369a57a0c7c0bdaebe0a40" ON "tenant_subscriptions" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c59c97d5c1343951e044c137f0" ON "tenant_subscriptions" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bd3a27c92d65df4ccc89ffa3a8" ON "tenant_kyc_documents" ("verified") `);
        await queryRunner.query(`CREATE INDEX "IDX_ff7f7505116709a5fc37955422" ON "tenant_kyc_documents" ("documentType") `);
        await queryRunner.query(`CREATE INDEX "IDX_9ccc21465f0cc832c821d48a4b" ON "tenant_kyc_documents" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3c410bba0742f62a0d29b9eb7d" ON "tenant_kyc_audit_log" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_3bd81217db13f966e5509f559a" ON "tenant_kyc_audit_log" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_808e971782408664b9c7698a9d" ON "tenant_kyc_audit_log" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_59d0580779f1111eafa7438a96" ON "system_settings" ("is_public") WHERE is_public = true`);
        await queryRunner.query(`CREATE INDEX "IDX_797d199fff9037e5b231dc4ffb" ON "system_settings" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_7567faf52e0f0da34dbab2daf3" ON "security_events" ("severity", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_ac0419c594360d319a6a453591" ON "security_events" ("event_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_63fea9549fcb8977a3c0abd783" ON "security_events" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d1891b273f5c77638d2149a9f0" ON "security_events" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d86aa84090327c9a94aee62e18" ON "security_events" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c0dfddafd5d9d49593930be293" ON "security_events" ("severity") `);
        await queryRunner.query(`CREATE INDEX "IDX_db8d3f73a58b39fc0c14302840" ON "notifications" ("category", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_13c6c844995d9cc303e7e05087" ON "notifications" ("notificationType", "priority") `);
        await queryRunner.query(`CREATE INDEX "IDX_797841712968aa775af0cb0b54" ON "notifications" ("entityType", "entityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9b2e0e69131e085736edccaec5" ON "notifications" ("notificationType", "priority", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_7a0a6e2a61cf2f91c80a1c6701" ON "notification_preferences" ("tenant_id", "notification_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_9c3e6cc717b4f6dc1b0260030f" ON "notification_preferences" ("tenant_id", "user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_93eb201c7a9603e415301e69a0" ON "messages" ("is_read") `);
        await queryRunner.query(`CREATE INDEX "IDX_0777b63da90c27d6ed993dc60b" ON "messages" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_bb3af7f695d50083e6523290d4" ON "messages" ("thread_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9d6c96fc3270ba756ae1e1e20b" ON "messages" ("sender_id", "recipient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_469b81bb95497287c259fa5628" ON "maintenance_logs" ("truckId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_ccf071140daa090281ed389288" ON "maintenance_logs" ("tenantId", "truckId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3bf04f0b74badf9ad6f7bbc010" ON "loan_terms" ("lender_id", "computed_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_116c853dd79fad5ec4f3200809" ON "loan_terms" ("loan_request_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e315e889a7c4d15e733070b95f" ON "lending_policy_system_config" ("lender_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_583ca0d5b2d68c75108227af9c" ON "lending_policy_loan_limits" ("business_type", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_813270e00e2d415496bb82419a" ON "lending_policy_loan_limits" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_e7276e088808d17c3350b9b3f5" ON "lending_policy_risk_assessment" ("factor", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_6be27131d692a211fda9b877a4" ON "lending_policy_risk_assessment" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_e76fdb341655fca56beef59750" ON "lending_policy_repayment" ("frequency", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_d7cbd8189238705b3d8ed1db66" ON "lending_policy_repayment" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_6bcdd18e09cde925d9927e72ae" ON "lending_policy_interest_rates" ("risk_level", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_b039730036806258874142386e" ON "lending_policy_interest_rates" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_d85cc00ebf68d5db0073b5bd62" ON "lending_policy_eligibility_criteria" ("category", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_f2cc1127ccebde810e3a4f798c" ON "lending_policy_eligibility_criteria" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_dd355d444598693fc3bf82fea8" ON "lending_policy_cargo_types" ("cargo_category", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_1f5409092a6270aa78f5ef090b" ON "lending_policy_cargo_types" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_7c69728b0eee8df90aa28cb3aa" ON "insurance_claims" ("claimNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_ef0233f5751c8f5bb838dcc9c5" ON "insurance_claims" ("policyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_58b6d392b802763fda1b8cdd21" ON "insurance_claims" ("truckId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0f1bdfd84b52e5650828ee105d" ON "insurance_claims" ("reportedDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a368689710b119486785bf8cc" ON "insurance_claims" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_baa50eb26aac0be1b692c080fb" ON "insurance_policies" ("policyNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_acda968d16da059e4f09824655" ON "insurance_policies" ("truckId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e18ea109a1f68c3868b032a089" ON "insurance_policies" ("insuranceCompany") `);
        await queryRunner.query(`CREATE INDEX "IDX_f3c89f740731a501a18912bd0b" ON "insurance_policies" ("startDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_b23aa47a8f12016a210e5ac33c" ON "insurance_policies" ("endDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_1592f9cf82406fbce791f0f19a" ON "insurance_policies" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_6e2b6bf8bb5605165c05fc9a71" ON "insurance_renewals" ("renewalNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_febfac3b7bf38da9b119fa050a" ON "insurance_renewals" ("policyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4443a0125e443faf35976c0d07" ON "insurance_renewals" ("truckId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0768b1b477d6f9e590fc86aadd" ON "insurance_renewals" ("currentPolicyEndDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_842fba233d89f76938fdcb1cd0" ON "insurance_renewals" ("renewalDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_626bd18a1c31262c92de2ea7fc" ON "fuel_wallets" ("tenant_id", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_1fd8e9227c063c682884b93134" ON "fuel_wallets" ("tenant_id", "owner_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2e99675306663490ddfe9b8240" ON "fuel_wallets" ("tenant_id", "truck_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bc11f2da1320a870676faa8fed" ON "fuel_wallets" ("tenant_id", "driver_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d0f9a2a260ee0f538c19d7c2a9" ON "fuel_wallet_transactions" ("tenant_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_5a2ef9676a68d2dd52b59d72b0" ON "fuel_wallet_transactions" ("tenant_id", "type") `);
        await queryRunner.query(`CREATE INDEX "IDX_dbc00de019adde78acb4c7750d" ON "fuel_wallet_transactions" ("tenant_id", "wallet_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e6a291fa1f367d1580ebd3ff41" ON "feature_credit_costs" ("is_active") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8b1e30132e1b27cbb9cc63055e" ON "feature_credit_costs" ("feature_code") `);
        await queryRunner.query(`CREATE INDEX "IDX_ea1e8001e18da625271cb36faf" ON "driver_fuel_advances" ("tenant_id", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a17042a7646c9c2a6d3ccef22" ON "driver_fuel_advances" ("tenant_id", "trip_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a43ae68351096e8568a06382f1" ON "driver_fuel_advances" ("tenant_id", "driver_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d997cf3d01e7778b2986194d50" ON "credit_pricing_rules" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_97352a82a3e20c23bd7df1ad3a" ON "credit_pricing_rules" ("plan_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_558fbfc6d3ed76397f133aa835" ON "credit_pricing_rules" ("rule_type", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_01b16a9f40838c61df9d8f2397" ON "credit_packages" ("is_active", "display_order") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a292c4dedc54c3610173796da" ON "activity_logs" ("is_suspicious") WHERE is_suspicious = true`);
        await queryRunner.query(`CREATE INDEX "IDX_1fa31efc2a0bc0b517b9f7225d" ON "activity_logs" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_aa8dcbb39c06587a1cf834da38" ON "activity_logs" ("resource", "resource_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_879e2d305a025dadfe9929c47d" ON "activity_logs" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_d54f841fa5478e4734590d4403" ON "activity_logs" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8facef03fbe2ee514e7fe7fe14" ON "notification_preferences" ("userId", "channel") `);
        await queryRunner.query(`CREATE INDEX "IDX_90d452c90494da1080c16b52c1" ON "notification_preferences" ("userId", "category") `);
        await queryRunner.query(`CREATE INDEX "IDX_a2e2691f8172b07d81e0d1e347" ON "notification_preferences" ("tenantId", "userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8e5c713517ab7a21ff3e863ca9" ON "insurance_claims" ("tenantId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_85a9f10e2000f5b9346c385a98" ON "insurance_claims" ("policyId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_390732a304351ba893fb459bbb" ON "insurance_policies" ("tenantId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_8ba9f8f6f24babb4e5a4380198" ON "insurance_policies" ("truckId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trucks" ADD CONSTRAINT "FK_8c4c103d41f1f81a82506ed7504" FOREIGN KEY ("currentDriverId") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loads" ADD CONSTRAINT "FK_f7e8115cc0ad9befebb3a666f4c" FOREIGN KEY ("assignedTruckId") REFERENCES "trucks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loads" ADD CONSTRAINT "FK_20cae08ac027e8f02fa76440b1f" FOREIGN KEY ("assignedCarrierId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "FK_1d942b6fc3eeefb988291fb1286" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "FK_b23ab6a57668ecca2e2398287ea" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "FK_05cf99c180d170ed758f03a80fe" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_kyc_documents" ADD CONSTRAINT "FK_f0d33db611c87e2bca1f9f7edf6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_kyc_documents" ADD CONSTRAINT "FK_1b8ced93a14a57a3a8cf5553440" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_kyc_documents" ADD CONSTRAINT "FK_d1eb93b1634018ae411173943b6" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_kyc_audit_log" ADD CONSTRAINT "FK_e1d131cc51fb6cdb698da6daba2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_kyc_audit_log" ADD CONSTRAINT "FK_d5b619ad0cef9a8dc2666d4cb6f" FOREIGN KEY ("user_profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_kyc_audit_log" ADD CONSTRAINT "FK_52c650b77259d2495b15b67769f" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" ADD CONSTRAINT "FK_3d76b7ca2d964925a54ad9fd516" FOREIGN KEY ("subscription_id") REFERENCES "tenant_subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" ADD CONSTRAINT "FK_173289b1de8485fbb852ff08fa8" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ADD CONSTRAINT "FK_872ba75a97257de9a4bf8557ffa" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ADD CONSTRAINT "FK_e9e4079e4a9bc1ddeb3452b7f69" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD CONSTRAINT "FK_c2694a0c5f7cbf8d96bc43273be" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD CONSTRAINT "FK_c8bc6d59f7c92922a2c691548d7" FOREIGN KEY ("credit_account_id") REFERENCES "credit_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD CONSTRAINT "FK_77840254310a94486bc1773735f" FOREIGN KEY ("subscription_id") REFERENCES "tenant_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD CONSTRAINT "FK_cec145f863cf10a14ecd9f47090" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "FK_c59c97d5c1343951e044c137f02" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "FK_cb2ac3bd398220d534c92db8b2e" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD CONSTRAINT "FK_9ccc21465f0cc832c821d48a4b0" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD CONSTRAINT "FK_0f6ffb96f893d9f75b205882c62" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD CONSTRAINT "FK_099ab4bc9a89e3d40c12875d155" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD CONSTRAINT "FK_808e971782408664b9c7698a9dd" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD CONSTRAINT "FK_b1a4f3a3fb4892c7d23c1270726" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD CONSTRAINT "FK_301c531938f84c39fa5019e7465" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_events" ADD CONSTRAINT "FK_d1891b273f5c77638d2149a9f0d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_events" ADD CONSTRAINT "FK_63fea9549fcb8977a3c0abd7833" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_e907e614e2cc6216ac076eb75e5" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_64c90edc7310c6be7c10c96f675" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_logs" ADD CONSTRAINT "FK_fe6690289c5e319b2ac0d809d72" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_logs" ADD CONSTRAINT "FK_f803d5e1bd85942b24ee4248701" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ADD CONSTRAINT "FK_2b96fafe15b3ff0c0c3eb41851e" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ADD CONSTRAINT "FK_2abbdd7df627b46588df86e4fc1" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loan_terms" ADD CONSTRAINT "FK_116c853dd79fad5ec4f32008091" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ADD CONSTRAINT "FK_e315e889a7c4d15e733070b95f0" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ADD CONSTRAINT "FK_b7516ddeff9ac0bca90c9c33d08" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ADD CONSTRAINT "FK_a1217463c9cc7516dcf007ce6d9" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ADD CONSTRAINT "FK_42f6baf1f6be3f5a29711e1a57a" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ADD CONSTRAINT "FK_93ae61fd5e91923a15c598b8685" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" ADD CONSTRAINT "FK_5bc4e26a401efdc294a48efdf9d" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ADD CONSTRAINT "FK_e4124ffc2ef9eb6564ec1962915" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_58b6d392b802763fda1b8cdd21d" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ADD CONSTRAINT "FK_e52f696cd5ffc8d3ef96797494a" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ADD CONSTRAINT "FK_eea5888de16d9fec2461723f294" FOREIGN KEY ("truck_id") REFERENCES "trucks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" ADD CONSTRAINT "FK_0adf3fef543d81a563c948f6c2a" FOREIGN KEY ("wallet_id") REFERENCES "fuel_wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" ADD CONSTRAINT "FK_9f1c742be605b50e4979187eb47" FOREIGN KEY ("fuel_log_id") REFERENCES "fuel_logs"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fuel_budgets" ADD CONSTRAINT "FK_fc3274d6f51a80da8bf46fca1bf" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fuel_budgets" ADD CONSTRAINT "FK_6aed29ce3bd375ef016a3873b21" FOREIGN KEY ("truck_id") REFERENCES "trucks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ADD CONSTRAINT "FK_f64cd8a026b9982470f57f479e0" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ADD CONSTRAINT "FK_81fd596a616bb36f9172eb2481a" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ADD CONSTRAINT "FK_70202c19a5a9040c02f1c38c182" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ADD CONSTRAINT "FK_97352a82a3e20c23bd7df1ad3ad" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ADD CONSTRAINT "FK_d997cf3d01e7778b2986194d50f" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ADD CONSTRAINT "FK_5ac1ba7d95a8826a6cfb5011b21" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ADD CONSTRAINT "FK_3bc8be1900291afb8b56ab05b8b" FOREIGN KEY ("tenant_admin_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cargo_owner_analytics" ADD CONSTRAINT "FK_7bb26828f77527d3ff1a88d05b1" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cargo_owner_analytics" ADD CONSTRAINT "FK_9bca7a9dbc4e481c745b4f3285f" FOREIGN KEY ("cargo_owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cargo_owner_analytics" ADD CONSTRAINT "FK_6e200f546c62dd34839d181598e" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ADD CONSTRAINT "FK_7cb8ee9bd09df8d4fcaf012d906" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ADD CONSTRAINT "FK_75fde5dd9def7c599a714d67f6b" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ADD CONSTRAINT "FK_c2a3057ae61dbd0cf6caf27a5c1" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analytics_insights" ADD CONSTRAINT "FK_db208a678e94f8c8f37fe3816b1" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analytics_insights" ADD CONSTRAINT "FK_66f4e94935a0c84ef10772ec3d2" FOREIGN KEY ("cargo_owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_d54f841fa5478e4734590d44036" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_b70c44e8b00757584a393225593" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_b3403e8b519a383776f6c693cc9" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "multi_modal_shipments" ADD CONSTRAINT "FK_013e3043db9d06f9854d4bb17d4" FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "multi_modal_legs" ADD CONSTRAINT "FK_3b0f09ebc541d9513e8afab1e32" FOREIGN KEY ("shipmentId") REFERENCES "multi_modal_shipments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_47ae4807b3ed676f608660b8dfa" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_d4e396c5a1c8de48961bdf349a2" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_42c8e0e8ee2e6953e607e7c2daa" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD CONSTRAINT "FK_32881c13a51d3576a0222a6ebde" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD CONSTRAINT "FK_bf04611ec3fbf4d71b9f8515d43" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_inheritance" ADD CONSTRAINT "FK_1a5a1be0ff83033579522b0e4e5" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_inheritance" ADD CONSTRAINT "FK_c118ebf755f0edce9d609279d02" FOREIGN KEY ("inherits_from_role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role_inheritance" DROP CONSTRAINT IF EXISTS "FK_c118ebf755f0edce9d609279d02"`);
        await queryRunner.query(`ALTER TABLE "role_inheritance" DROP CONSTRAINT IF EXISTS "FK_1a5a1be0ff83033579522b0e4e5"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP CONSTRAINT IF EXISTS "FK_bf04611ec3fbf4d71b9f8515d43"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP CONSTRAINT IF EXISTS "FK_32881c13a51d3576a0222a6ebde"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "FK_42c8e0e8ee2e6953e607e7c2daa"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "FK_d4e396c5a1c8de48961bdf349a2"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "FK_47ae4807b3ed676f608660b8dfa"`);
        await queryRunner.query(`ALTER TABLE "multi_modal_legs" DROP CONSTRAINT IF EXISTS "FK_3b0f09ebc541d9513e8afab1e32"`);
        await queryRunner.query(`ALTER TABLE "multi_modal_shipments" DROP CONSTRAINT IF EXISTS "FK_013e3043db9d06f9854d4bb17d4"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT IF EXISTS "FK_b3403e8b519a383776f6c693cc9"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT IF EXISTS "FK_b70c44e8b00757584a393225593"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "FK_d54f841fa5478e4734590d44036"`);
        await queryRunner.query(`ALTER TABLE "analytics_insights" DROP CONSTRAINT IF EXISTS "FK_66f4e94935a0c84ef10772ec3d2"`);
        await queryRunner.query(`ALTER TABLE "analytics_insights" DROP CONSTRAINT IF EXISTS "FK_db208a678e94f8c8f37fe3816b1"`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" DROP CONSTRAINT IF EXISTS "FK_c2a3057ae61dbd0cf6caf27a5c1"`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" DROP CONSTRAINT IF EXISTS "FK_75fde5dd9def7c599a714d67f6b"`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" DROP CONSTRAINT IF EXISTS "FK_7cb8ee9bd09df8d4fcaf012d906"`);
        await queryRunner.query(`ALTER TABLE "cargo_owner_analytics" DROP CONSTRAINT IF EXISTS "FK_6e200f546c62dd34839d181598e"`);
        await queryRunner.query(`ALTER TABLE "cargo_owner_analytics" DROP CONSTRAINT IF EXISTS "FK_9bca7a9dbc4e481c745b4f3285f"`);
        await queryRunner.query(`ALTER TABLE "cargo_owner_analytics" DROP CONSTRAINT IF EXISTS "FK_7bb26828f77527d3ff1a88d05b1"`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "FK_3bc8be1900291afb8b56ab05b8b"`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" DROP CONSTRAINT IF EXISTS "FK_5ac1ba7d95a8826a6cfb5011b21"`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" DROP CONSTRAINT IF EXISTS "FK_d997cf3d01e7778b2986194d50f"`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" DROP CONSTRAINT IF EXISTS "FK_97352a82a3e20c23bd7df1ad3ad"`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" DROP CONSTRAINT IF EXISTS "FK_70202c19a5a9040c02f1c38c182"`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" DROP CONSTRAINT IF EXISTS "FK_81fd596a616bb36f9172eb2481a"`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" DROP CONSTRAINT IF EXISTS "FK_f64cd8a026b9982470f57f479e0"`);
        await queryRunner.query(`ALTER TABLE "fuel_budgets" DROP CONSTRAINT IF EXISTS "FK_6aed29ce3bd375ef016a3873b21"`);
        await queryRunner.query(`ALTER TABLE "fuel_budgets" DROP CONSTRAINT IF EXISTS "FK_fc3274d6f51a80da8bf46fca1bf"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" DROP CONSTRAINT IF EXISTS "FK_9f1c742be605b50e4979187eb47"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" DROP CONSTRAINT IF EXISTS "FK_0adf3fef543d81a563c948f6c2a"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" DROP CONSTRAINT IF EXISTS "FK_eea5888de16d9fec2461723f294"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" DROP CONSTRAINT IF EXISTS "FK_e52f696cd5ffc8d3ef96797494a"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "FK_58b6d392b802763fda1b8cdd21d"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" DROP CONSTRAINT IF EXISTS "FK_e4124ffc2ef9eb6564ec1962915"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" DROP CONSTRAINT IF EXISTS "FK_5bc4e26a401efdc294a48efdf9d"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" DROP CONSTRAINT IF EXISTS "FK_93ae61fd5e91923a15c598b8685"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" DROP CONSTRAINT IF EXISTS "FK_42f6baf1f6be3f5a29711e1a57a"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" DROP CONSTRAINT IF EXISTS "FK_a1217463c9cc7516dcf007ce6d9"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" DROP CONSTRAINT IF EXISTS "FK_b7516ddeff9ac0bca90c9c33d08"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" DROP CONSTRAINT IF EXISTS "FK_e315e889a7c4d15e733070b95f0"`);
        await queryRunner.query(`ALTER TABLE "loan_terms" DROP CONSTRAINT IF EXISTS "FK_116c853dd79fad5ec4f32008091"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" DROP CONSTRAINT IF EXISTS "FK_2abbdd7df627b46588df86e4fc1"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" DROP CONSTRAINT IF EXISTS "FK_2b96fafe15b3ff0c0c3eb41851e"`);
        await queryRunner.query(`ALTER TABLE "notification_logs" DROP CONSTRAINT IF EXISTS "FK_f803d5e1bd85942b24ee4248701"`);
        await queryRunner.query(`ALTER TABLE "notification_logs" DROP CONSTRAINT IF EXISTS "FK_fe6690289c5e319b2ac0d809d72"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT IF EXISTS "FK_64c90edc7310c6be7c10c96f675"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT IF EXISTS "FK_e907e614e2cc6216ac076eb75e5"`);
        await queryRunner.query(`ALTER TABLE "security_events" DROP CONSTRAINT IF EXISTS "FK_63fea9549fcb8977a3c0abd7833"`);
        await queryRunner.query(`ALTER TABLE "security_events" DROP CONSTRAINT IF EXISTS "FK_d1891b273f5c77638d2149a9f0d"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP CONSTRAINT IF EXISTS "FK_301c531938f84c39fa5019e7465"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP CONSTRAINT IF EXISTS "FK_b1a4f3a3fb4892c7d23c1270726"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP CONSTRAINT IF EXISTS "FK_808e971782408664b9c7698a9dd"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP CONSTRAINT IF EXISTS "FK_099ab4bc9a89e3d40c12875d155"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP CONSTRAINT IF EXISTS "FK_0f6ffb96f893d9f75b205882c62"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP CONSTRAINT IF EXISTS "FK_9ccc21465f0cc832c821d48a4b0"`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT IF EXISTS "FK_cb2ac3bd398220d534c92db8b2e"`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT IF EXISTS "FK_c59c97d5c1343951e044c137f02"`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "FK_cec145f863cf10a14ecd9f47090"`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "FK_77840254310a94486bc1773735f"`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "FK_c8bc6d59f7c92922a2c691548d7"`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "FK_c2694a0c5f7cbf8d96bc43273be"`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "FK_e9e4079e4a9bc1ddeb3452b7f69"`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" DROP CONSTRAINT IF EXISTS "FK_872ba75a97257de9a4bf8557ffa"`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" DROP CONSTRAINT IF EXISTS "FK_173289b1de8485fbb852ff08fa8"`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" DROP CONSTRAINT IF EXISTS "FK_3d76b7ca2d964925a54ad9fd516"`);
        await queryRunner.query(`ALTER TABLE "user_kyc_audit_log" DROP CONSTRAINT IF EXISTS "FK_52c650b77259d2495b15b67769f"`);
        await queryRunner.query(`ALTER TABLE "user_kyc_audit_log" DROP CONSTRAINT IF EXISTS "FK_d5b619ad0cef9a8dc2666d4cb6f"`);
        await queryRunner.query(`ALTER TABLE "user_kyc_audit_log" DROP CONSTRAINT IF EXISTS "FK_e1d131cc51fb6cdb698da6daba2"`);
        await queryRunner.query(`ALTER TABLE "user_kyc_documents" DROP CONSTRAINT IF EXISTS "FK_d1eb93b1634018ae411173943b6"`);
        await queryRunner.query(`ALTER TABLE "user_kyc_documents" DROP CONSTRAINT IF EXISTS "FK_1b8ced93a14a57a3a8cf5553440"`);
        await queryRunner.query(`ALTER TABLE "user_kyc_documents" DROP CONSTRAINT IF EXISTS "FK_f0d33db611c87e2bca1f9f7edf6"`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" DROP CONSTRAINT IF EXISTS "FK_05cf99c180d170ed758f03a80fe"`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" DROP CONSTRAINT IF EXISTS "FK_b23ab6a57668ecca2e2398287ea"`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" DROP CONSTRAINT IF EXISTS "FK_1d942b6fc3eeefb988291fb1286"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "FK_e9658e959c490b0a634dfc54783"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP CONSTRAINT IF EXISTS "FK_20cae08ac027e8f02fa76440b1f"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP CONSTRAINT IF EXISTS "FK_f7e8115cc0ad9befebb3a666f4c"`);
        await queryRunner.query(`ALTER TABLE "trucks" DROP CONSTRAINT IF EXISTS "FK_8c4c103d41f1f81a82506ed7504"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "FK_8481388d6325e752cd4d7e26c6d"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8ba9f8f6f24babb4e5a4380198"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_390732a304351ba893fb459bbb"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_85a9f10e2000f5b9346c385a98"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8e5c713517ab7a21ff3e863ca9"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a2e2691f8172b07d81e0d1e347"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_90d452c90494da1080c16b52c1"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8facef03fbe2ee514e7fe7fe14"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d54f841fa5478e4734590d4403"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_879e2d305a025dadfe9929c47d"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_aa8dcbb39c06587a1cf834da38"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1fa31efc2a0bc0b517b9f7225d"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6a292c4dedc54c3610173796da"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_01b16a9f40838c61df9d8f2397"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_558fbfc6d3ed76397f133aa835"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_97352a82a3e20c23bd7df1ad3a"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d997cf3d01e7778b2986194d50"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a43ae68351096e8568a06382f1"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6a17042a7646c9c2a6d3ccef22"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ea1e8001e18da625271cb36faf"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8b1e30132e1b27cbb9cc63055e"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e6a291fa1f367d1580ebd3ff41"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_dbc00de019adde78acb4c7750d"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_5a2ef9676a68d2dd52b59d72b0"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d0f9a2a260ee0f538c19d7c2a9"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_bc11f2da1320a870676faa8fed"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_2e99675306663490ddfe9b8240"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1fd8e9227c063c682884b93134"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_626bd18a1c31262c92de2ea7fc"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_842fba233d89f76938fdcb1cd0"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_0768b1b477d6f9e590fc86aadd"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_4443a0125e443faf35976c0d07"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_febfac3b7bf38da9b119fa050a"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6e2b6bf8bb5605165c05fc9a71"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1592f9cf82406fbce791f0f19a"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_b23aa47a8f12016a210e5ac33c"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f3c89f740731a501a18912bd0b"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e18ea109a1f68c3868b032a089"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_acda968d16da059e4f09824655"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_baa50eb26aac0be1b692c080fb"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6a368689710b119486785bf8cc"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_0f1bdfd84b52e5650828ee105d"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_58b6d392b802763fda1b8cdd21"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ef0233f5751c8f5bb838dcc9c5"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_7c69728b0eee8df90aa28cb3aa"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1f5409092a6270aa78f5ef090b"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_dd355d444598693fc3bf82fea8"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f2cc1127ccebde810e3a4f798c"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d85cc00ebf68d5db0073b5bd62"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_b039730036806258874142386e"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6bcdd18e09cde925d9927e72ae"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d7cbd8189238705b3d8ed1db66"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e76fdb341655fca56beef59750"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6be27131d692a211fda9b877a4"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e7276e088808d17c3350b9b3f5"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_813270e00e2d415496bb82419a"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_583ca0d5b2d68c75108227af9c"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e315e889a7c4d15e733070b95f"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_116c853dd79fad5ec4f3200809"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_3bf04f0b74badf9ad6f7bbc010"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ccf071140daa090281ed389288"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_469b81bb95497287c259fa5628"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_9d6c96fc3270ba756ae1e1e20b"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_bb3af7f695d50083e6523290d4"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_0777b63da90c27d6ed993dc60b"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_93eb201c7a9603e415301e69a0"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_9c3e6cc717b4f6dc1b0260030f"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_7a0a6e2a61cf2f91c80a1c6701"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_9b2e0e69131e085736edccaec5"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_797841712968aa775af0cb0b54"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_13c6c844995d9cc303e7e05087"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_db8d3f73a58b39fc0c14302840"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c0dfddafd5d9d49593930be293"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d86aa84090327c9a94aee62e18"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d1891b273f5c77638d2149a9f0"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_63fea9549fcb8977a3c0abd783"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ac0419c594360d319a6a453591"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_7567faf52e0f0da34dbab2daf3"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_797d199fff9037e5b231dc4ffb"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_59d0580779f1111eafa7438a96"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_808e971782408664b9c7698a9d"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_3bd81217db13f966e5509f559a"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_3c410bba0742f62a0d29b9eb7d"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_9ccc21465f0cc832c821d48a4b"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ff7f7505116709a5fc37955422"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_bd3a27c92d65df4ccc89ffa3a8"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c59c97d5c1343951e044c137f0"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_05f0369a57a0c7c0bdaebe0a40"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_b79fb41debf9b4f464db5fd565"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_51367f4601eb1a60444512646d"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f4a5574cb41935313243a5eae7"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8ecced8d9f776030ab2060f3f2"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c1b2afb65de0f9494f2981e131"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_2c0395713680ab5eb6c8d001d0"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_9ac41a5292ef4d8356a86be30c"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_595ba72b7adb92ee80c0837694"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_22fb71850b9ff42bd211569c81"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_5c28e3be70b859f2f9a99c3a5c"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e9e4079e4a9bc1ddeb3452b7f6"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e1265f24538173a087762a9745"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_173289b1de8485fbb852ff08fa"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_3e51a39cdc9a809c529b1535f7"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_0ebf9b0f0cbd7b2fb5b62e3fac"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_686d1ea5af1256411104b26548"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_aad80a27f0a425bfc3f092a732"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e9658e959c490b0a634dfc5478"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_dbc81ff542b1b3366bae195f2a"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c665cbd04804c0de36c2019de5"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d6ee2d4bf901675877bb94977c"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_37b11c00133f4561aa6980ca33"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "insuranceCompany"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "insuranceCompany" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP CONSTRAINT IF EXISTS "UQ_baa50eb26aac0be1b692c080fbf"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "policyNumber"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "policyNumber" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD CONSTRAINT "UQ_baa50eb26aac0be1b692c080fbf" UNIQUE ("policyNumber")`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "location" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "UQ_7c69728b0eee8df90aa28cb3aaf"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "claimNumber"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "claimNumber" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "UQ_7c69728b0eee8df90aa28cb3aaf" UNIQUE ("claimNumber")`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ALTER COLUMN "is_suspicious" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "bulk_email_logs"."metadata" IS 'Additional metadata like filters, segments, etc.'`);
        await queryRunner.query(`COMMENT ON COLUMN "bulk_email_logs"."status" IS 'Status: pending, sending, sent, failed, scheduled'`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "status" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "failed_count" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "sent_count" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ALTER COLUMN "recipients_count" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ALTER COLUMN "settings_metadata" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_marketplace_settings"."is_enabled" IS 'Whether the marketplace is currently accepting purchases'`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ALTER COLUMN "is_enabled" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ALTER COLUMN "price_per_credit" SET DEFAULT 1.00`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_marketplace_settings"."price_per_credit" IS 'Price per credit in the tenant currency'`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_marketplace_settings"."max_purchase_amount" IS 'Maximum credits per transaction (NULL = unlimited)'`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_marketplace_settings"."min_purchase_amount" IS 'Minimum credits a truck owner must purchase'`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ADD CONSTRAINT "unique_tenant_marketplace" UNIQUE ("tenant_id")`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ALTER COLUMN "display_order" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ALTER COLUMN "discount_percentage" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."priority" IS 'Higher priority rules are evaluated first'`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ALTER COLUMN "priority" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."max_value" IS 'Maximum value for tiered pricing (null = no maximum)'`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."min_value" IS 'Minimum value for tiered pricing (null = no minimum)'`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."tenant_id" IS 'If set, rule applies only to specific tenant (highest priority)'`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."plan_id" IS 'If set, rule applies only to specific subscription plan'`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."credit_cost" IS 'Cost in credits per unit'`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_pricing_rules"."unit" IS 'Unit of measurement: ton, km, hour, trip'`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" DROP COLUMN "rule_type"`);
        await queryRunner.query(`DROP TYPE "public"."credit_pricing_rules_rule_type_enum"`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ADD "rule_type" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ADD "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ADD "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ALTER COLUMN "metadata" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."driver_fuel_advance_status_enum_old" AS ENUM('APPROVED', 'PENDING', 'RECONCILED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ALTER COLUMN "status" TYPE "public"."driver_fuel_advance_status_enum_old" USING "status"::"text"::"public"."driver_fuel_advance_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "driver_fuel_advances" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."driver_fuel_advances_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."driver_fuel_advance_status_enum_old" RENAME TO "driver_fuel_advance_status_enum"`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "template_variables" SET DEFAULT '[]'`);
        await queryRunner.query(`COMMENT ON COLUMN "email_templates"."template_variables" IS 'JSON array of variable names used in the template (e.g., ["tenantName", "email"])'`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "email_templates" ALTER COLUMN "category" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" ADD "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" ALTER COLUMN "metadata" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."fuel_wallet_transaction_type_old" AS ENUM('CREDIT', 'DEBIT')`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" ALTER COLUMN "type" TYPE "public"."fuel_wallet_transaction_type_old" USING "type"::"text"::"public"."fuel_wallet_transaction_type_old"`);
        await queryRunner.query(`DROP TYPE "public"."fuel_wallet_transactions_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."fuel_wallet_transaction_type_old" RENAME TO "fuel_wallet_transaction_type"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ADD "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ADD "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ALTER COLUMN "metadata" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ALTER COLUMN "status" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ALTER COLUMN "total_debits" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ALTER COLUMN "total_credits" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fuel_wallets" ALTER COLUMN "balance" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ALTER COLUMN "deductible" TYPE numeric(10,2)`);
        await queryRunner.query(`CREATE TYPE "public"."insurance_policies_policytype_enum_old" AS ENUM('cargo', 'collision', 'commercial', 'comprehensive', 'full_coverage', 'liability', 'medical_payments', 'rental_reimbursement', 'roadside_assistance', 'uninsured_motorist')`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ALTER COLUMN "policyType" TYPE "public"."insurance_policies_policytype_enum_old" USING "policyType"::"text"::"public"."insurance_policies_policytype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."insurance_policies_policytype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."insurance_policies_policytype_enum_old" RENAME TO "insurance_policies_policytype_enum"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "insuranceCompany"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "insuranceCompany" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP CONSTRAINT IF EXISTS "UQ_baa50eb26aac0be1b692c080fbf"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "policyNumber"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "policyNumber" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD CONSTRAINT "UQ_baa50eb26aac0be1b692c080fbf" UNIQUE ("policyNumber")`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "location" character varying(255)`);
        await queryRunner.query(`CREATE TYPE "public"."insurance_claims_status_enum_old" AS ENUM('approved', 'closed', 'denied', 'investigating', 'pending', 'settlement_pending', 'under_review')`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "status" TYPE "public"."insurance_claims_status_enum_old" USING "status"::"text"::"public"."insurance_claims_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."insurance_claims_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."insurance_claims_status_enum_old" RENAME TO "insurance_claims_status_enum"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "paidAmount" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "paidAmount" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."insurance_claims_claimtype_enum_old" AS ENUM('cargo_damage', 'cargo_theft', 'collision', 'fire', 'flood', 'liability', 'mechanical_breakdown', 'medical', 'other', 'roadside_assistance', 'theft', 'vandalism', 'weather_damage')`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "claimType" TYPE "public"."insurance_claims_claimtype_enum_old" USING "claimType"::"text"::"public"."insurance_claims_claimtype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."insurance_claims_claimtype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."insurance_claims_claimtype_enum_old" RENAME TO "insurance_claims_claimtype_enum"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP CONSTRAINT IF EXISTS "UQ_7c69728b0eee8df90aa28cb3aaf"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "claimNumber"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "claimNumber" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "UQ_7c69728b0eee8df90aa28cb3aaf" UNIQUE ("claimNumber")`);
        await queryRunner.query(`ALTER TABLE "lender_policies" ALTER COLUMN "advance_percentage" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "priority" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "priority" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "insurance_required" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "risk_level" DROP DEFAULT`);
        await queryRunner.query(`CREATE TYPE "public"."risk_level_enum_old" AS ENUM('critical', 'high', 'low', 'medium')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "risk_level" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "risk_level" TYPE "public"."risk_level_enum_old" USING "risk_level"::"text"::"public"."risk_level_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."lending_policy_cargo_types_risk_level_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."risk_level_enum_old" RENAME TO "risk_level_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "cargo_type" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "cargo_category" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."cargo_category_enum_old" AS ENUM('chemicals', 'fragile', 'general', 'hazardous', 'liquid', 'machinery', 'oversized', 'perishable', 'refrigerated', 'valuable')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "cargo_category" TYPE "public"."cargo_category_enum_old" USING "cargo_category"::"text"::"public"."cargo_category_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."lending_policy_cargo_types_cargo_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."cargo_category_enum_old" RENAME TO "cargo_category_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE TYPE "public"."comparison_operator_enum_old" AS ENUM('between', 'equal_to', 'greater_than', 'greater_than_or_equal', 'in', 'less_than', 'less_than_or_equal', 'not_in')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" ALTER COLUMN "operator" TYPE "public"."comparison_operator_enum_old" USING "operator"::"text"::"public"."comparison_operator_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."lending_policy_eligibility_criteria_operator_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."comparison_operator_enum_old" RENAME TO "comparison_operator_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."eligibility_category_enum_old" AS ENUM('business_age', 'collateral', 'credit_score', 'documents', 'guarantor', 'industry', 'location', 'revenue')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" ALTER COLUMN "category" TYPE "public"."eligibility_category_enum_old" USING "category"::"text"::"public"."eligibility_category_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."lending_policy_eligibility_criteria_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."eligibility_category_enum_old" RENAME TO "eligibility_category_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ALTER COLUMN "priority" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ALTER COLUMN "priority" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" DROP COLUMN "risk_level"`);
        await queryRunner.query(`DROP TYPE "public"."lending_policy_interest_rates_risk_level_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ADD "risk_level" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "priority" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "priority" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."penalty_type_enum_old" AS ENUM('compound_interest', 'fixed_amount', 'percentage')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "late_fee_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "late_fee_type" TYPE "public"."penalty_type_enum_old" USING "late_fee_type"::"text"::"public"."penalty_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "late_fee_type" SET DEFAULT 'fixed_amount'`);
        await queryRunner.query(`DROP TYPE "public"."lending_policy_repayment_late_fee_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."penalty_type_enum_old" RENAME TO "penalty_type_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "frequency" DROP DEFAULT`);
        await queryRunner.query(`CREATE TYPE "public"."repayment_frequency_enum_old" AS ENUM('annually', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'weekly')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "frequency" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ALTER COLUMN "frequency" TYPE "public"."repayment_frequency_enum_old" USING "frequency"::"text"::"public"."repayment_frequency_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."lending_policy_repayment_frequency_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."repayment_frequency_enum_old" RENAME TO "repayment_frequency_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "priority" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "priority" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."risk_factor_enum_old" AS ENUM('business_age', 'cash_flow', 'collateral_value', 'credit_score', 'debt_to_income', 'industry_risk', 'market_conditions', 'payment_history')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "factor" TYPE "public"."risk_factor_enum_old" USING "factor"::"text"::"public"."risk_factor_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."lending_policy_risk_assessment_factor_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."risk_factor_enum_old" RENAME TO "risk_factor_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "priority" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "priority" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "max_utilization" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "collateral_requirement" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ALTER COLUMN "credit_score_requirement" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" DROP COLUMN "business_type"`);
        await queryRunner.query(`DROP TYPE "public"."lending_policy_loan_limits_business_type_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ADD "business_type" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "audit_trail_enabled" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."compliance_level_enum_old" AS ENUM('basic', 'regulatory', 'standard', 'strict')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "compliance_level" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "compliance_level" TYPE "public"."compliance_level_enum_old" USING "compliance_level"::"text"::"public"."compliance_level_enum_old"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "compliance_level" SET DEFAULT 'standard'`);
        await queryRunner.query(`DROP TYPE "public"."lending_policy_system_config_compliance_level_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."compliance_level_enum_old" RENAME TO "compliance_level_enum"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "default_advance_percentage" SET DEFAULT 70.0`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "default_interest_rate" SET DEFAULT 15.0`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "cooldown_period_days" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "max_portfolio_utilization" SET DEFAULT 80.0`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "total_exposure_limit" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "max_concurrent_loans" DROP DEFAULT`);
        await queryRunner.query(`CREATE TYPE "public"."approval_mode_enum_old" AS ENUM('automatic', 'hybrid', 'manual')`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "approval_mode" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "approval_mode" TYPE "public"."approval_mode_enum_old" USING "approval_mode"::"text"::"public"."approval_mode_enum_old"`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ALTER COLUMN "approval_mode" SET DEFAULT 'hybrid'`);
        await queryRunner.query(`DROP TYPE "public"."lending_policy_system_config_approval_mode_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."approval_mode_enum_old" RENAME TO "approval_mode_enum"`);
        await queryRunner.query(`ALTER TABLE "loan_terms" ADD CONSTRAINT "UQ_loan_terms_loan_request_id" UNIQUE ("loan_request_id")`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ADD "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ADD "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "cost" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."maintenance_status_enum_old" AS ENUM('CANCELLED', 'COMPLETED', 'IN_PROGRESS', 'PENDING')`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "status" TYPE "public"."maintenance_status_enum_old" USING "status"::"text"::"public"."maintenance_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."maintenance_logs_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."maintenance_status_enum_old" RENAME TO "maintenance_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."maintenance_type_enum_old" AS ENUM('EMERGENCY', 'FAULT_REPORT', 'INSPECTION', 'REPAIR', 'ROUTINE')`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "type" TYPE "public"."maintenance_type_enum_old" USING "type"::"text"::"public"."maintenance_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "maintenance_logs" ALTER COLUMN "type" SET DEFAULT 'ROUTINE'`);
        await queryRunner.query(`DROP TYPE "public"."maintenance_logs_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."maintenance_type_enum_old" RENAME TO "maintenance_type_enum"`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "sender_role"`);
        await queryRunner.query(`DROP TYPE "public"."messages_sender_role_enum"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "sender_role" character varying(50) NOT NULL DEFAULT 'SYSTEM'`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_category_enum_old" AS ENUM('BUSINESS', 'CARGO', 'COMPLIANCE', 'DRIVER', 'EMERGENCY', 'FINANCIAL', 'GENERAL', 'MAINTENANCE', 'MARKETING', 'PERFORMANCE', 'SAFETY', 'SYSTEM', 'TRIP', 'TRIP_STATUS', 'USER', 'VEHICLE')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "category" TYPE "public"."notifications_category_enum_old" USING "category"::"text"::"public"."notifications_category_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_category_enum_old" RENAME TO "notifications_category_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_notificationtype_enum_old" AS ENUM('ACCIDENT_REPORT', 'AGREEMENT_UPDATE', 'ALERT', 'AUDIT_DUE', 'CARGO_CUSTOMS_UPDATE', 'CARGO_DAMAGE', 'CARGO_DELAY', 'CARGO_DELIVERY_UPDATE', 'CARGO_PICKUP_REMINDER', 'CERTIFICATION_EXPIRY', 'CONTRACT_EXPIRY', 'DOCUMENT_REJECTED', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DRIVER_ALERT', 'DRIVER_ASSIGNMENT', 'DRIVER_DOCUMENT_EXPIRY', 'DRIVER_FATIGUE_WARNING', 'DRIVER_SAFETY_ALERT', 'DRIVER_TRIP_END', 'DRIVER_TRIP_START', 'EMERGENCY_ALERT', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'GENERAL', 'INFO', 'INSURANCE_EXPIRY', 'INVOICE_GENERATED', 'LICENSE_EXPIRY', 'NEW_FEATURE', 'PAYMENT', 'PAYMENT_DUE', 'PAYMENT_OVERDUE', 'PAYMENT_RECEIVED', 'PERMIT_EXPIRY', 'POLICY_CHANGE', 'REMINDER', 'ROAD_CLOSURE', 'SYSTEM_ERROR', 'SYSTEM_MAINTENANCE', 'SYSTEM_UPDATE', 'TRIP_CANCELLED', 'TRIP_COMPLETED', 'TRIP_CREATED', 'TRIP_DELAY', 'TRIP_ROUTE_CHANGE', 'TRIP_STARTED', 'TRIP_STATUS', 'TRIP_UPDATE', 'USER_ACCOUNT_LOCKED', 'USER_PASSWORD_RESET', 'USER_VERIFICATION', 'USER_WELCOME', 'VEHICLE_BREAKDOWN', 'VEHICLE_INSPECTION_DUE', 'VEHICLE_INSURANCE_EXPIRY', 'VEHICLE_MAINTENANCE_DUE', 'VEHICLE_REGISTRATION_EXPIRY', 'VIOLATION_ALERT', 'WEATHER_WARNING')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "notificationType" TYPE "public"."notifications_notificationtype_enum_old" USING "notificationType"::"text"::"public"."notifications_notificationtype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_notificationtype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_notificationtype_enum_old" RENAME TO "notifications_notificationtype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_entitytype_enum_old" AS ENUM('CARGO', 'COMPANY', 'DOCUMENT', 'DRIVER', 'EXPENSE', 'PAYMENT', 'SYSTEM', 'TENANT', 'TRIP', 'TRUCK', 'USER')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "entityType" TYPE "public"."notifications_entitytype_enum_old" USING "entityType"::"text"::"public"."notifications_entitytype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_entitytype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_entitytype_enum_old" RENAME TO "notifications_entitytype_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_db8d3f73a58b39fc0c14302840" ON "notifications" ("category", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_9b2e0e69131e085736edccaec5" ON "notifications" ("notificationType", "priority", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_13c6c844995d9cc303e7e05087" ON "notifications" ("notificationType", "priority") `);
        await queryRunner.query(`CREATE INDEX "IDX_797841712968aa775af0cb0b54" ON "notifications" ("entityType", "entityId") `);
        await queryRunner.query(`ALTER TABLE "security_events" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "security_events" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."details" IS 'Additional event details in JSON format'`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."user_agent" IS 'User agent string from the request'`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."ip_address" IS 'IP address from which the event originated'`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."tenant_id" IS 'Tenant associated with the security event (nullable)'`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."user_id" IS 'User associated with the security event (nullable)'`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."severity" IS 'Severity level: low, medium, high, critical'`);
        await queryRunner.query(`COMMENT ON COLUMN "security_events"."event_type" IS 'Type of security event: failed_login, permission_escalation, unusual_access, session_hijack'`);
        await queryRunner.query(`COMMENT ON COLUMN "system_health_logs"."timestamp" IS 'Timestamp when the metric was recorded'`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "metadata" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" DROP COLUMN "severity"`);
        await queryRunner.query(`CREATE TYPE "public"."system_health_logs_severity_enum" AS ENUM('critical', 'high', 'low', 'medium')`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ADD "severity" "public"."system_health_logs_severity_enum"`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "threshold_value" SET DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "metric_value" SET DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "metric_name" SET DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "metric_type" SET DEFAULT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."system_health_logs_status_enum_old" AS ENUM('CRITICAL', 'DEGRADED', 'HEALTHY', 'UNHEALTHY')`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ALTER COLUMN "status" TYPE "public"."system_health_logs_status_enum_old" USING "status"::"text"::"public"."system_health_logs_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."system_health_logs_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."system_health_logs_status_enum_old" RENAME TO "system_health_logs_status_enum"`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" DROP COLUMN "service"`);
        await queryRunner.query(`DROP TYPE "public"."system_health_logs_service_enum"`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ADD "service" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" DROP CONSTRAINT IF EXISTS "PK_48ac00277cf6992c147dab10e7d"`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ADD CONSTRAINT "system_health_logs_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ALTER COLUMN "metadata" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "action"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_kyc_audit_log_action_enum"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "action" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ALTER COLUMN "verified" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ALTER COLUMN "metadata" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ALTER COLUMN "auto_renew" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP COLUMN "billing_cycle"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_subscriptions_billing_cycle_enum"`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD "billing_cycle" character varying(20) NOT NULL DEFAULT 'monthly'`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_subscriptions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD "status" character varying(50) NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`COMMENT ON COLUMN "tenant_subscriptions"."user_id" IS 'ID of the tenant admin who purchased the subscription'`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ALTER COLUMN "metadata" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."credit_transactions_type_enum"`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD "type" character varying(50) NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_transactions"."user_id" IS 'User ID for user-level credit transactions (NULL for tenant-level transactions)'`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "total_marketplace_transactions" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "total_credits_sold_marketplace" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "revenue_from_marketplace_sales" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_accounts"."credits_allocated_to_partners" IS 'Total credits allocated/reserved for partner plans'`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "credits_allocated_to_partners" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_accounts"."total_partners_sold" IS 'Number of partner plan subscriptions sold'`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "total_partners_sold" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_accounts"."revenue_from_partner_sales" IS 'Total revenue earned from selling partner plans to truck owners'`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ALTER COLUMN "revenue_from_partner_sales" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "credit_accounts"."user_id" IS 'ID of the user for user-level credit accounts (NULL for tenant-level accounts)'`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" ALTER COLUMN "payment_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "display_order" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "limits" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "features" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."available_slots" IS 'Number of partners who can purchase this plan (e.g., 4 slots)'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "available_slots" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."credit_cost_per_partner" IS 'Credits required per partner slot (e.g., 1000 credits per partner)'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "credit_cost_per_partner" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "credits_per_ton_truck_owner" SET DEFAULT 5.0`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."credits_per_ton_truck_owner" IS 'Credits deducted from truck owner per ton of cargo'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "credits_per_ton_truck_owner" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "credits_per_ton_tenant" SET DEFAULT 2.0`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."credits_per_ton_tenant" IS 'Credits deducted from tenant per ton of cargo'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "credits_per_ton_tenant" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."total_credits" IS 'Maximum credits tenant can purchase (-1 for unlimited)'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "total_credits" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "price_per_credit" SET DEFAULT 0.15`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."price_per_credit" IS 'Price tenant pays system admin per credit (wholesale price)'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "price_per_credit" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscription_plans"."parent_subscription_id" IS 'Reference to parent subscription if this is a partner plan created by tenant admin'`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "action"`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "action" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_system" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "user_sessions"."tenant_id" IS 'Tenant context for this session'`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "started_at"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "last_activity"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "last_activity" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`COMMENT ON COLUMN "user_sessions"."user_agent" IS 'User agent string from the browser'`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "ip_address"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "ip_address" character varying(45)`);
        await queryRunner.query(`COMMENT ON COLUMN "user_sessions"."user_id" IS 'User who owns this session'`);
        await queryRunner.query(`COMMENT ON COLUMN "user_sessions"."session_id" IS 'Unique session identifier'`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('ADMIN', 'AGENT', 'BROKER', 'CARGO_OWNER', 'CARGO_RECEIVER', 'DRIVER', 'LENDER', 'SUPER_ADMIN', 'TENANT_ADMIN', 'TRUCK_OWNER')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CARGO_OWNER'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c665cbd04804c0de36c2019de5" ON "users" ("tenantId", "email", "role") WHERE (deleted_at IS NULL)`);
        await queryRunner.query(`CREATE INDEX "IDX_d6ee2d4bf901675877bb94977c" ON "users" ("role", "status") `);
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "hoursOfService" SET DEFAULT '{"breaks": [], "onDutyHours": 0, "drivingHours": 0, "offDutyHours": 0}'`);
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "hoursOfService" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "drivers"."driverNotes" IS 'Additional notes about the driver'`);
        await queryRunner.query(`COMMENT ON COLUMN "drivers"."experience" IS 'Years of driving experience'`);
        await queryRunner.query(`COMMENT ON COLUMN "tenants"."onboardingStep" IS 'Current step in the onboarding process (1-5)'`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "onboardingStep" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "kycNotes"`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "kycNotes" text`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "kycData" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "kycStatus" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."tenant_kyc_status_enum_old" AS ENUM('APPROVED', 'INCOMPLETE', 'PENDING', 'REJECTED', 'SUBMITTED', 'UNDER_REVIEW')`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "kycStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "kycStatus" TYPE "public"."tenant_kyc_status_enum_old" USING "kycStatus"::"text"::"public"."tenant_kyc_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "kycStatus" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."tenants_kycstatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."tenant_kyc_status_enum_old" RENAME TO "tenant_kyc_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT IF EXISTS "UQ_06e11d5ca528baa2288ac10c6c5"`);
        await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "insuranceExpiry" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "insurancePolicy" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "registrationExpiry" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "registrationNumber" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "compliance_score" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "background_check_completed" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "business_verified" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "financial_verified" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "address_verified" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "identity_verified" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "kyc_data" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "kyc_requirement_level" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."user_profiles_kycrequirementlevel_enum_old" AS ENUM('BASIC', 'ENHANCED', 'PREMIUM', 'STANDARD')`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "kyc_requirement_level" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "kyc_requirement_level" TYPE "public"."user_profiles_kycrequirementlevel_enum_old" USING "kyc_requirement_level"::"text"::"public"."user_profiles_kycrequirementlevel_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "kyc_requirement_level" SET DEFAULT 'BASIC'`);
        await queryRunner.query(`DROP TYPE "public"."user_profiles_kyc_requirement_level_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_profiles_kycrequirementlevel_enum_old" RENAME TO "user_profiles_kycrequirementlevel_enum"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "UQ_8481388d6325e752cd4d7e26c6d"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "PK_25d24010f53bb80b78e412c9656"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "PK_178199805b901ccd220ab7740ec" PRIMARY KEY ("role_id")`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "PK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP COLUMN "role_id"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "createdBy"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "agentEmail"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "agentPhone"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "agentName"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "conditions"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "exclusions"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "coverageDetails"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "monthlyPremium"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "assignedTo"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "createdBy"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "settlementNotes"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "settlementDate"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "faultDescription"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "isFault"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "witnessStatement"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "witnessPhone"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "witnessName"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "policeReportNumber"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "photos"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "denialReason"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "investigationNotes"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "adjusterNotes"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "adjusterEmail"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "adjusterPhone"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "adjusterName"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "priority"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "frequency"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "quietHours"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "timezone"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "language"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "deviceToken"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "emailAddress"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "inAppEnabled"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "pushEnabled"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "smsEnabled"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "emailEnabled"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "isEnabled"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "channel"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" DROP COLUMN "plan_multipliers"`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" DROP COLUMN "base_cost"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "totalClaimsAmount"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "claimsCount"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "nextPaymentDate"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "lastPaymentDate"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "paymentMethod"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "agent"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "coverageTypes"`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" DROP COLUMN "premium"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "appeal"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "settlement"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "timeline"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "repairEstimates"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "policeReport"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "witnesses"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "adjuster"`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" DROP COLUMN "truckId"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "created_at"`);
        await queryRunner.query(`COMMENT ON COLUMN "notification_preferences"."settings" IS 'Additional settings like frequency, thresholds, etc.'`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "settings"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "phone_number"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "email_address"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "is_enabled"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "enabled_channels"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "notification_type"`);
        await queryRunner.query(`DROP TYPE "public"."notification_preferences_notification_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "performedBy"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "newStatus"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_kyc_audit_log_newstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "oldStatus"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_kyc_audit_log_oldstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "verifiedAt"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "verifiedBy"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "uploadedBy"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "mimeType"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "fileSize"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "filePath"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "documentName"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "documentType"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_kyc_documents_documenttype_enum"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "device_info"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD "granted_by" uuid`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD "granted_at" TIMESTAMP DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD "role" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "totalClaimsAmount" numeric(15,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "claimsCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "nextPaymentDate" date`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "lastPaymentDate" date`);
        await queryRunner.query(`CREATE TYPE "public"."insurance_policies_paymentmethod_enum" AS ENUM('annually', 'lump_sum', 'monthly', 'quarterly')`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "paymentMethod" "public"."insurance_policies_paymentmethod_enum" NOT NULL DEFAULT 'monthly'`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "agent" json`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "coverageTypes" text`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "premium" numeric(15,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "appeal" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "settlement" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "timeline" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "repairEstimates" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "policeReport" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "witnesses" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "notes" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "adjuster" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "truckId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD "security_relevant" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ADD "is_popular" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ADD "slug" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ADD CONSTRAINT "credit_packages_slug_key" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" ADD "credit_cost" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "createdBy" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "agentEmail" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "agentPhone" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "agentName" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "conditions" json`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "exclusions" json`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "coverageDetails" json`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD "monthlyPremium" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "assignedTo" uuid`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "createdBy" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "settlementNotes" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "settlementDate" date`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "faultDescription" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "isFault" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "witnessStatement" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "witnessPhone" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "witnessName" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "policeReportNumber" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "photos" json`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "denialReason" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "investigationNotes" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "adjusterNotes" text`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "adjusterEmail" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "adjusterPhone" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD "adjusterName" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "priority" jsonb`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "frequency" jsonb`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "quietHours" jsonb`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "timezone" character varying(10) NOT NULL DEFAULT 'UTC'`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "language" character varying(10) NOT NULL DEFAULT 'en'`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "deviceToken" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "phoneNumber" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "emailAddress" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "inAppEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "pushEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "smsEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "emailEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "isEnabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`CREATE TYPE "public"."notification_preferences_channel_enum" AS ENUM('email', 'in_app', 'push', 'sms')`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "channel" "public"."notification_preferences_channel_enum" NOT NULL DEFAULT 'email'`);
        await queryRunner.query(`CREATE TYPE "public"."notification_preferences_category_enum" AS ENUM('maintenance', 'marketing', 'payment', 'performance', 'safety', 'system', 'trip_status')`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "category" "public"."notification_preferences_category_enum" NOT NULL DEFAULT 'system'`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_health_logs" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "performed_by" uuid`);
        await queryRunner.query(`CREATE TYPE "public"."kyc_status_enum" AS ENUM('APPROVED', 'INCOMPLETE', 'PENDING', 'REJECTED', 'SUBMITTED', 'UNDER_REVIEW')`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "new_status" "public"."kyc_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."kyc_status_enum" AS ENUM('APPROVED', 'INCOMPLETE', 'PENDING', 'REJECTED', 'SUBMITTED', 'UNDER_REVIEW')`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "old_status" "public"."kyc_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD "tenant_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "verified_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "verified_by" uuid`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "uploaded_by" uuid`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "mime_type" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "file_size" bigint`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "file_path" character varying(500) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "document_name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "document_type" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD "tenant_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD "calculation_details" jsonb DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "is_marketplace_plan" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD "is_popular" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "permissions_name_key" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "onboarding_completed_at" TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."onboarding_step_enum" AS ENUM('COMPLETED', 'STEP_1_BRANDING', 'STEP_2_KYC', 'STEP_3_PLAN', 'STEP_4_CONFIG')`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "onboarding_step" "public"."onboarding_step_enum" DEFAULT 'STEP_1_BRANDING'`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "kyc_reviewed_by" uuid`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "kyc_notes" text`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "kyc_verified_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "kyc_submitted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "kyc_data" jsonb DEFAULT '{}'`);
        await queryRunner.query(`CREATE TYPE "public"."kyc_status_enum" AS ENUM('APPROVED', 'INCOMPLETE', 'PENDING', 'REJECTED', 'SUBMITTED', 'UNDER_REVIEW')`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "kyc_status" "public"."kyc_status_enum" DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "last_health_check" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "health_score" integer DEFAULT '100'`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "REL_6ca9503d77ae39b4b5a6cc3ba8" UNIQUE ("user_id")`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c118ebf755f0edce9d609279d0"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1a5a1be0ff83033579522b0e4e"`);
        await queryRunner.query(`DROP TABLE "role_inheritance"`);
        await queryRunner.query(`DROP TABLE "multi_modal_legs"`);
        await queryRunner.query(`DROP TYPE "public"."multi_modal_legs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."multi_modal_legs_mode_enum"`);
        await queryRunner.query(`DROP TABLE "multi_modal_shipments"`);
        await queryRunner.query(`DROP TYPE "public"."multi_modal_shipments_status_enum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d6988ec6a7ed344657de8b7e0e"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_34c3d35482c852a5b1994720c8"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_2e736b729859342dec27976bc8"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_388821de26f6747a5e8170f8d8"`);
        await queryRunner.query(`DROP TABLE "analytics_insights"`);
        await queryRunner.query(`DROP TYPE "public"."analytics_insights_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."analytics_insights_insight_type_enum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_af7d535aea2fc3ca1eb561ad30"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a3de91fac75e0f8c03a52af32a"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c7ea716d05f5325c4130a6867e"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_38cc58643129eb7b03ea8cb6e5"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_98b2a588d40bd09bbf3437b9b0"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_195490440ff2eace58959bbe1c"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6e200f546c62dd34839d181598"`);
        await queryRunner.query(`DROP TABLE "cargo_owner_analytics"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d91caab5b970b8866f63765d30"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_8697e3af559e7fa64541e43e06"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f88a03adcc9e90f99ca260ebaa"`);
        await queryRunner.query(`DROP TABLE "epods"`);
        await queryRunner.query(`DROP TYPE "public"."epods_status_enum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_0d100cf8bbd893a0469deb488d"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_5ce2b1aebad387c1afe3a41343"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_48e45ac17b4e397bc55d22c153"`);
        await queryRunner.query(`DROP TABLE "fuel_budgets"`);
        await queryRunner.query(`DROP TYPE "public"."fuel_budgets_status_enum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1af373960050ecb35914150112"`);
        await queryRunner.query(`DROP TABLE "kyc_role_requirements"`);
        await queryRunner.query(`DROP TYPE "public"."kyc_role_requirements_requirement_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."kyc_role_requirements_role_enum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_7ca4ed34a4206249d7092751bc"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a95cd3c455317ef9fd18f95050"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_5f4c893f2ee8263e346dfa1bf8"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f803d5e1bd85942b24ee424870"`);
        await queryRunner.query(`DROP TABLE "notification_logs"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_notification_type_enum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e1d131cc51fb6cdb698da6daba"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d5b619ad0cef9a8dc2666d4cb6"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_08e2c9330c96799fbbcc471190"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ed69c699355cfd7536cab85e11"`);
        await queryRunner.query(`DROP TABLE "user_kyc_audit_log"`);
        await queryRunner.query(`DROP TYPE "public"."user_kyc_audit_log_action_enum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f0d33db611c87e2bca1f9f7edf"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1b8ced93a14a57a3a8cf555344"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_d9fe14eea34dd7d7a8f2e16331"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_bdb69f93aceaa2c078ed604651"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e4cdc64b38672f20cd6ed6a1d3"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e929f0bed4987cb835b89e31b7"`);
        await queryRunner.query(`DROP TABLE "user_kyc_documents"`);
        await queryRunner.query(`DROP TYPE "public"."user_kyc_documents_document_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_kyc_documents_document_type_enum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1d942b6fc3eeefb988291fb128"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_85a618dede80136ba35a03b6a4"`);
        await queryRunner.query(`DROP TABLE "user_permission_overrides"`);
        await queryRunner.query(`COMMENT ON TABLE "role_permissions" IS 'Maps permissions to roles'`);
        await queryRunner.query(`COMMENT ON TABLE "activity_logs" IS 'Tracks user activities and system events with security context (Enhanced Phase 1)'`);
        await queryRunner.query(`COMMENT ON TABLE "broker_disputes" IS 'Manages disputes between brokers, cargo owners, and transporters'`);
        await queryRunner.query(`COMMENT ON TABLE "broker_transporter_performance" IS 'Tracks transporter reliability, on-time delivery, and performance metrics'`);
        await queryRunner.query(`COMMENT ON TABLE "broker_multi_stop_loads" IS 'Manages loads with multiple pickup/delivery stops with route optimization'`);
        await queryRunner.query(`COMMENT ON TABLE "broker_transporter_credit" IS 'Credit management and payment terms for transporters'`);
        await queryRunner.query(`COMMENT ON TABLE "broker_market_intelligence" IS 'Real-time market rates and pricing intelligence for routes'`);
        await queryRunner.query(`COMMENT ON TABLE "broker_match_recommendations" IS 'AI-powered load-to-transporter matching recommendations'`);
        await queryRunner.query(`COMMENT ON TABLE "bulk_email_logs" IS 'Tracks bulk email campaigns sent through the system'`);
        await queryRunner.query(`COMMENT ON TABLE "credit_marketplace_settings" IS 'Configuration for tenant admin credit marketplace where truck owners can purchase custom credit amounts'`);
        await queryRunner.query(`COMMENT ON TABLE "credit_pricing_rules" IS 'Defines dynamic pricing rules for credit consumption based on various factors'`);
        await queryRunner.query(`COMMENT ON TABLE "email_templates" IS 'Stores reusable email templates for the bulk email system'`);
        await queryRunner.query(`COMMENT ON TABLE "escrow_accounts" IS 'Handles escrow payments for loads with automatic and manual release triggers'`);
        await queryRunner.query(`COMMENT ON TABLE "insurance_verifications" IS 'Tracks insurance and compliance verification for transporters'`);
        await queryRunner.query(`COMMENT ON TABLE "security_events" IS 'Tracks security-related events across the platform (Phase 1)'`);
        await queryRunner.query(`COMMENT ON TABLE "system_health_logs" IS 'Stores system health metrics and logs for monitoring (Phase 1)'`);
        await queryRunner.query(`COMMENT ON TABLE "tenant_kyc_audit_log" IS 'Audit trail for all KYC-related actions'`);
        await queryRunner.query(`COMMENT ON TABLE "tenant_kyc_documents" IS 'Stores uploaded KYC documents for tenants'`);
        await queryRunner.query(`COMMENT ON TABLE "permissions" IS 'Stores all available system permissions'`);
        await queryRunner.query(`COMMENT ON TABLE "user_sessions" IS 'Tracks active user sessions for security monitoring (Phase 1)'`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_permission_id_key" UNIQUE ("role", "permission_id")`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD CONSTRAINT "UQ_system_settings_category_key" UNIQUE ("category", "key")`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ADD CONSTRAINT "uq_credit_accounts_tenant_user" UNIQUE ("tenant_id", "user_id")`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "permissions_resource_action_key" UNIQUE ("resource", "action")`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ADD CONSTRAINT "positive_price" CHECK ((price_per_credit > (0)::numeric))`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ADD CONSTRAINT "max_greater_than_min" CHECK (((max_purchase_amount IS NULL) OR (max_purchase_amount >= min_purchase_amount)))`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ADD CONSTRAINT "positive_max_purchase" CHECK (((max_purchase_amount IS NULL) OR (max_purchase_amount > 0)))`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ADD CONSTRAINT "positive_min_purchase" CHECK ((min_purchase_amount > 0))`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ADD CONSTRAINT "chk_valid_discount" CHECK (((discount_percentage >= 0) AND (discount_percentage <= 100)))`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ADD CONSTRAINT "chk_positive_price" CHECK ((price > (0)::numeric))`);
        await queryRunner.query(`ALTER TABLE "credit_packages" ADD CONSTRAINT "chk_positive_credits" CHECK ((credits > 0))`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ADD CONSTRAINT "chk_valid_rule_type" CHECK (((rule_type)::text = ANY ((ARRAY['weight'::character varying, 'distance'::character varying, 'time'::character varying, 'flat'::character varying])::text[])))`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ADD CONSTRAINT "chk_positive_cost" CHECK ((credit_cost >= (0)::numeric))`);
        await queryRunner.query(`ALTER TABLE "feature_credit_costs" ADD CONSTRAINT "chk_positive_cost" CHECK ((credit_cost >= (0)::numeric))`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "chk_billing_cycle" CHECK (((billing_cycle)::text = ANY ((ARRAY['monthly'::character varying, 'yearly'::character varying])::text[])))`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "chk_subscription_status" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'suspended'::character varying, 'trial'::character varying])::text[])))`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD CONSTRAINT "chk_transaction_type" CHECK (((type)::text = ANY ((ARRAY['SUBSCRIPTION_GRANT'::character varying, 'PURCHASE'::character varying, 'CONSUMPTION'::character varying, 'REFUND'::character varying, 'BONUS'::character varying, 'EXPIRY'::character varying, 'ADJUSTMENT'::character varying])::text[])))`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ADD CONSTRAINT "chk_positive_bonus_credits" CHECK ((bonus_credits >= 0))`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ADD CONSTRAINT "chk_positive_purchased_credits" CHECK ((purchased_credits >= 0))`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ADD CONSTRAINT "chk_positive_subscription_credits" CHECK ((subscription_credits >= 0))`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ADD CONSTRAINT "chk_positive_balance" CHECK ((current_balance >= 0))`);
        await queryRunner.query(`CREATE INDEX "idx_role_permissions_permission" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`CREATE INDEX "idx_role_permissions_role" ON "role_permissions" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_1592f9cf82406fbce791f0f19a" ON "insurance_policies" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a368689710b119486785bf8cc" ON "insurance_claims" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_rate_limits_tenant_createdAt" ON "rate_limits" ("tenantId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_rate_limits_tenant_endpoint_createdAt" ON "rate_limits" ("tenantId", "endpoint", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_activity_logs_security_created" ON "activity_logs" ("created_at", "security_relevant") WHERE (security_relevant = true)`);
        await queryRunner.query(`CREATE INDEX "idx_activity_logs_security_relevant" ON "activity_logs" ("security_relevant") WHERE (security_relevant = true)`);
        await queryRunner.query(`CREATE INDEX "idx_activity_logs_suspicious" ON "activity_logs" ("is_suspicious") WHERE (is_suspicious = true)`);
        await queryRunner.query(`CREATE INDEX "idx_activity_logs_created_at" ON "activity_logs" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_activity_logs_resource" ON "activity_logs" ("resource", "resource_id") `);
        await queryRunner.query(`CREATE INDEX "idx_activity_logs_action" ON "activity_logs" ("action") `);
        await queryRunner.query(`CREATE INDEX "idx_activity_logs_user_id" ON "activity_logs" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_disputes_tenant_created" ON "broker_disputes" ("tenantId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_disputes_trip_status" ON "broker_disputes" ("tripId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_disputes_load_status" ON "broker_disputes" ("loadId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_disputes_broker_status" ON "broker_disputes" ("brokerId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_transporter_performance_transporter_calculated" ON "broker_transporter_performance" ("transporterId", "calculatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_transporter_performance_broker_transporter" ON "broker_transporter_performance" ("brokerId", "transporterId") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_multi_stop_loads_broker_load" ON "broker_multi_stop_loads" ("brokerId", "loadId") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_transporter_credit_transporter_status" ON "broker_transporter_credit" ("transporterId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_transporter_credit_broker_transporter" ON "broker_transporter_credit" ("brokerId", "transporterId") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_market_intelligence_route_type" ON "broker_market_intelligence" ("rateType", "route") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_market_intelligence_broker_created" ON "broker_market_intelligence" ("brokerId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_market_intelligence_broker_route" ON "broker_market_intelligence" ("brokerId", "route") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_match_recommendations_transporter_status" ON "broker_match_recommendations" ("transporterId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_match_recommendations_broker_status" ON "broker_match_recommendations" ("brokerId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_broker_match_recommendations_broker_load" ON "broker_match_recommendations" ("brokerId", "loadId") `);
        await queryRunner.query(`CREATE INDEX "idx_bulk_email_logs_created_by" ON "bulk_email_logs" ("created_by") `);
        await queryRunner.query(`CREATE INDEX "idx_bulk_email_logs_created_at" ON "bulk_email_logs" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_bulk_email_logs_status" ON "bulk_email_logs" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_bulk_email_logs_template" ON "bulk_email_logs" ("template_id") `);
        await queryRunner.query(`CREATE INDEX "idx_bulk_email_logs_tenant" ON "bulk_email_logs" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_marketplace_enabled" ON "credit_marketplace_settings" ("is_enabled") WHERE (is_enabled = true)`);
        await queryRunner.query(`CREATE INDEX "idx_marketplace_tenant" ON "credit_marketplace_settings" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_packages_slug" ON "credit_packages" ("slug") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_packages_active" ON "credit_packages" ("is_active", "display_order") `);
        await queryRunner.query(`CREATE INDEX "idx_pricing_rules_priority" ON "credit_pricing_rules" ("priority") `);
        await queryRunner.query(`CREATE INDEX "idx_pricing_rules_tenant" ON "credit_pricing_rules" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_pricing_rules_plan" ON "credit_pricing_rules" ("plan_id") `);
        await queryRunner.query(`CREATE INDEX "idx_pricing_rules_type" ON "credit_pricing_rules" ("rule_type", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_dfa_tenant_status" ON "driver_fuel_advances" ("tenant_id", "status") `);
        await queryRunner.query(`CREATE INDEX "idx_dfa_tenant_trip" ON "driver_fuel_advances" ("tenant_id", "trip_id") `);
        await queryRunner.query(`CREATE INDEX "idx_dfa_tenant_driver" ON "driver_fuel_advances" ("tenant_id", "driver_id") `);
        await queryRunner.query(`CREATE INDEX "idx_email_templates_name" ON "email_templates" ("name") `);
        await queryRunner.query(`CREATE INDEX "idx_email_templates_active" ON "email_templates" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_email_templates_category" ON "email_templates" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_escrow_accounts_tenant_created" ON "escrow_accounts" ("tenantId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_escrow_accounts_trip_status" ON "escrow_accounts" ("tripId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_escrow_accounts_load_status" ON "escrow_accounts" ("loadId", "status") `);
        await queryRunner.query(`CREATE INDEX "idx_feature_credit_costs_active" ON "feature_credit_costs" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_feature_credit_costs_code" ON "feature_credit_costs" ("feature_code") `);
        await queryRunner.query(`CREATE INDEX "idx_fwt_wallet" ON "fuel_wallet_transactions" ("tenant_id", "wallet_id") `);
        await queryRunner.query(`CREATE INDEX "idx_fw_tenant_driver" ON "fuel_wallets" ("tenant_id", "driver_id") `);
        await queryRunner.query(`CREATE INDEX "idx_fw_tenant_owner" ON "fuel_wallets" ("tenant_id", "owner_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_baa50eb26aac0be1b692c080fb" ON "insurance_policies" ("policyNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_8ba9f8f6f24babb4e5a4380198" ON "insurance_policies" ("truckId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_390732a304351ba893fb459bbb" ON "insurance_policies" ("status", "tenantId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7c69728b0eee8df90aa28cb3aa" ON "insurance_claims" ("claimNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_85a9f10e2000f5b9346c385a98" ON "insurance_claims" ("policyId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_8e5c713517ab7a21ff3e863ca9" ON "insurance_claims" ("status", "tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_insurance_verifications_tenant_created" ON "insurance_verifications" ("tenantId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_insurance_verifications_load_type" ON "insurance_verifications" ("loadId", "verificationType") `);
        await queryRunner.query(`CREATE INDEX "IDX_insurance_verifications_transporter_status" ON "insurance_verifications" ("transporterId", "status") `);
        await queryRunner.query(`CREATE INDEX "idx_lpct_cargo_category_active" ON "lending_policy_cargo_types" ("is_active", "cargo_category") `);
        await queryRunner.query(`CREATE INDEX "idx_lpct_lender_active" ON "lending_policy_cargo_types" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_cargo_types_cargo_type" ON "lending_policy_cargo_types" ("cargo_type") `);
        await queryRunner.query(`CREATE INDEX "idx_cargo_types_lender" ON "lending_policy_cargo_types" ("lender_id") `);
        await queryRunner.query(`CREATE INDEX "idx_lpec_category_active" ON "lending_policy_eligibility_criteria" ("category", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_lpec_lender_active" ON "lending_policy_eligibility_criteria" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_lpir_risk_active" ON "lending_policy_interest_rates" ("risk_level", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_lpir_lender_active" ON "lending_policy_interest_rates" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_interest_rates_active" ON "lending_policy_interest_rates" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_interest_rates_lender" ON "lending_policy_interest_rates" ("lender_id") `);
        await queryRunner.query(`CREATE INDEX "idx_lpr_frequency_active" ON "lending_policy_repayment" ("frequency", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_lpr_lender_active" ON "lending_policy_repayment" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_repayment_lender" ON "lending_policy_repayment" ("lender_id") `);
        await queryRunner.query(`CREATE INDEX "idx_lpra_factor_active" ON "lending_policy_risk_assessment" ("factor", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_lpra_lender_active" ON "lending_policy_risk_assessment" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_risk_assessment_lender" ON "lending_policy_risk_assessment" ("lender_id") `);
        await queryRunner.query(`CREATE INDEX "idx_lpll_business_type_active" ON "lending_policy_loan_limits" ("business_type", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_lpll_lender_active" ON "lending_policy_loan_limits" ("lender_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_loan_limits_business_type" ON "lending_policy_loan_limits" ("business_type") `);
        await queryRunner.query(`CREATE INDEX "idx_loan_limits_lender" ON "lending_policy_loan_limits" ("lender_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_lpsc_lender_id" ON "lending_policy_system_config" ("lender_id") `);
        await queryRunner.query(`CREATE INDEX "idx_system_config_lender" ON "lending_policy_system_config" ("lender_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_loan_terms_lender_id_computed_at" ON "loan_terms" ("lender_id", "computed_at") `);
        await queryRunner.query(`CREATE INDEX "idx_ml_truck_status" ON "maintenance_logs" ("truckId", "status") `);
        await queryRunner.query(`CREATE INDEX "idx_ml_tenant_truck" ON "maintenance_logs" ("tenantId", "truckId") `);
        await queryRunner.query(`CREATE INDEX "IDX_messages_is_read" ON "messages" ("is_read") `);
        await queryRunner.query(`CREATE INDEX "IDX_messages_created_at" ON "messages" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_messages_thread_id" ON "messages" ("thread_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_messages_sender_recipient" ON "messages" ("sender_id", "recipient_id") `);
        await queryRunner.query(`CREATE INDEX "idx_messages_tenant_id" ON "messages" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_messages_is_read" ON "messages" ("is_read") `);
        await queryRunner.query(`CREATE INDEX "idx_messages_created_at" ON "messages" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_messages_thread_id" ON "messages" ("thread_id") `);
        await queryRunner.query(`CREATE INDEX "idx_messages_sender_recipient" ON "messages" ("sender_id", "recipient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a2e2691f8172b07d81e0d1e347" ON "notification_preferences" ("tenantId", "userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_90d452c90494da1080c16b52c1" ON "notification_preferences" ("userId", "category") `);
        await queryRunner.query(`CREATE INDEX "IDX_8facef03fbe2ee514e7fe7fe14" ON "notification_preferences" ("userId", "channel") `);
        await queryRunner.query(`CREATE INDEX "idx_security_events_severity_created" ON "security_events" ("severity", "created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_security_events_event_type" ON "security_events" ("event_type") `);
        await queryRunner.query(`CREATE INDEX "idx_security_events_tenant_id" ON "security_events" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_security_events_user_id" ON "security_events" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_security_events_created_at" ON "security_events" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_security_events_severity" ON "security_events" ("severity") `);
        await queryRunner.query(`CREATE INDEX "idx_system_health_service_timestamp" ON "system_health_logs" ("service", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_system_health_timestamp" ON "system_health_logs" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_system_health_logs_service_timestamp" ON "system_health_logs" ("service", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_system_health_logs_status" ON "system_health_logs" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_system_health_logs_timestamp" ON "system_health_logs" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_system_health_logs_service" ON "system_health_logs" ("service") `);
        await queryRunner.query(`CREATE INDEX "IDX_system_settings_is_public" ON "system_settings" ("is_public") WHERE (is_public = true)`);
        await queryRunner.query(`CREATE INDEX "IDX_system_settings_category" ON "system_settings" ("category") `);
        await queryRunner.query(`CREATE INDEX "idx_tenant_kyc_audit_log_created_at" ON "tenant_kyc_audit_log" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_tenant_kyc_audit_log_tenant_id" ON "tenant_kyc_audit_log" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_tenant_kyc_documents_verified" ON "tenant_kyc_documents" ("verified") `);
        await queryRunner.query(`CREATE INDEX "idx_tenant_kyc_documents_type" ON "tenant_kyc_documents" ("document_type") `);
        await queryRunner.query(`CREATE INDEX "idx_tenant_kyc_documents_tenant_id" ON "tenant_kyc_documents" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_tenant_subscriptions_user_id" ON "tenant_subscriptions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_tenant_subscriptions_period" ON "tenant_subscriptions" ("current_period_end") `);
        await queryRunner.query(`CREATE INDEX "idx_tenant_subscriptions_status" ON "tenant_subscriptions" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_tenant_subscriptions_tenant" ON "tenant_subscriptions" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_transactions_user_id" ON "credit_transactions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_transactions_reference" ON "credit_transactions" ("reference_type", "reference_id") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_transactions_type" ON "credit_transactions" ("type", "created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_transactions_account" ON "credit_transactions" ("credit_account_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_transactions_tenant" ON "credit_transactions" ("tenant_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_accounts_partners_sold" ON "credit_accounts" ("total_partners_sold") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_accounts_revenue" ON "credit_accounts" ("revenue_from_partner_sales") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_credit_accounts_tenant_user" ON "credit_accounts" ("tenant_id", "user_id") WHERE (user_id IS NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "idx_credit_accounts_user_id" ON "credit_accounts" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_accounts_refresh" ON "credit_accounts" ("next_refresh_date") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_accounts_balance" ON "credit_accounts" ("current_balance") `);
        await queryRunner.query(`CREATE INDEX "idx_credit_accounts_tenant" ON "credit_accounts" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_subscription_payments_invoice" ON "subscription_payments" ("invoice_number") `);
        await queryRunner.query(`CREATE INDEX "idx_subscription_payments_payment" ON "subscription_payments" ("payment_id") `);
        await queryRunner.query(`CREATE INDEX "idx_subscription_payments_subscription" ON "subscription_payments" ("subscription_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_subscription_plans_parent_subscription_id" ON "subscription_plans" ("parent_subscription_id") `);
        await queryRunner.query(`CREATE INDEX "idx_subscription_plans_credits_per_ton" ON "subscription_plans" ("credits_per_ton_tenant", "credits_per_ton_truck_owner") `);
        await queryRunner.query(`CREATE INDEX "idx_subscription_plans_price_per_credit" ON "subscription_plans" ("price_per_credit") `);
        await queryRunner.query(`CREATE INDEX "idx_subscription_plans_active" ON "subscription_plans" ("is_active", "display_order") `);
        await queryRunner.query(`CREATE INDEX "idx_subscription_plans_slug" ON "subscription_plans" ("slug") `);
        await queryRunner.query(`CREATE INDEX "idx_permissions_name" ON "permissions" ("name") `);
        await queryRunner.query(`CREATE INDEX "idx_permissions_action" ON "permissions" ("action") `);
        await queryRunner.query(`CREATE INDEX "idx_permissions_resource" ON "permissions" ("resource") `);
        await queryRunner.query(`CREATE INDEX "idx_user_sessions_last_activity" ON "user_sessions" ("last_activity") `);
        await queryRunner.query(`CREATE INDEX "idx_user_sessions_expires_at" ON "user_sessions" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "idx_user_sessions_tenant_id" ON "user_sessions" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_tenant_email_role" ON "users" ("tenantId", "email", "role") WHERE (deleted_at IS NULL)`);
        await queryRunner.query(`CREATE INDEX "idx_tenants_kyc_submitted_at" ON "tenants" ("kyc_submitted_at") `);
        await queryRunner.query(`CREATE INDEX "idx_tenants_kyc_status" ON "tenants" ("kyc_status") `);
        await queryRunner.query(`CREATE INDEX "idx_tenants_last_health_check" ON "tenants" ("last_health_check") `);
        await queryRunner.query(`CREATE INDEX "idx_tenants_health_score" ON "tenants" ("health_score") `);
        await queryRunner.query(`CREATE INDEX "idx_tenants_onboarding_step" ON "tenants" ("onboardingStep") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_profiles_kyc_requirement_level" ON "user_profiles" ("kyc_requirement_level") `);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_58b6d392b802763fda1b8cdd21d" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "fk_activity_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "broker_disputes" ADD CONSTRAINT "FK_broker_disputes_broker" FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "broker_disputes" ADD CONSTRAINT "FK_broker_disputes_raised_by" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "broker_disputes" ADD CONSTRAINT "FK_broker_disputes_disputed_with" FOREIGN KEY ("disputedWithId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "broker_disputes" ADD CONSTRAINT "FK_broker_disputes_mediator" FOREIGN KEY ("mediatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "broker_disputes" ADD CONSTRAINT "FK_broker_disputes_load" FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "broker_disputes" ADD CONSTRAINT "FK_broker_disputes_trip" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "broker_disputes" ADD CONSTRAINT "FK_broker_disputes_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ADD CONSTRAINT "bulk_email_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ADD CONSTRAINT "bulk_email_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bulk_email_logs" ADD CONSTRAINT "bulk_email_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ADD CONSTRAINT "credit_marketplace_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_marketplace_settings" ADD CONSTRAINT "credit_marketplace_settings_tenant_admin_user_id_fkey" FOREIGN KEY ("tenant_admin_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ADD CONSTRAINT "credit_pricing_rules_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_pricing_rules" ADD CONSTRAINT "credit_pricing_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" ADD CONSTRAINT "FK_escrow_accounts_broker" FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" ADD CONSTRAINT "FK_escrow_accounts_payer" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" ADD CONSTRAINT "FK_escrow_accounts_payee" FOREIGN KEY ("payeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" ADD CONSTRAINT "FK_escrow_accounts_load" FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" ADD CONSTRAINT "FK_escrow_accounts_trip" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrow_accounts" ADD CONSTRAINT "FK_escrow_accounts_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fuel_wallet_transactions" ADD CONSTRAINT "fuel_wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "fuel_wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD CONSTRAINT "FK_32881c13a51d3576a0222a6ebde" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_policies" ADD CONSTRAINT "FK_bf04611ec3fbf4d71b9f8515d43" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_47ae4807b3ed676f608660b8dfa" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_d4e396c5a1c8de48961bdf349a2" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_claims" ADD CONSTRAINT "FK_42c8e0e8ee2e6953e607e7c2daa" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_verifications" ADD CONSTRAINT "FK_insurance_verifications_broker" FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_verifications" ADD CONSTRAINT "FK_insurance_verifications_transporter" FOREIGN KEY ("transporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_verifications" ADD CONSTRAINT "FK_insurance_verifications_load" FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance_verifications" ADD CONSTRAINT "FK_insurance_verifications_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_cargo_types" ADD CONSTRAINT "lending_policy_cargo_types_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_eligibility_criteria" ADD CONSTRAINT "lending_policy_eligibility_criteria_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_interest_rates" ADD CONSTRAINT "lending_policy_interest_rates_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_repayment" ADD CONSTRAINT "lending_policy_repayment_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_risk_assessment" ADD CONSTRAINT "lending_policy_risk_assessment_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_loan_limits" ADD CONSTRAINT "lending_policy_loan_limits_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lending_policy_system_config" ADD CONSTRAINT "lending_policy_system_config_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "lenders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loan_terms" ADD CONSTRAINT "FK_loan_terms_loan_request" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_b70c44e8b00757584a393225593" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_b3403e8b519a383776f6c693cc9" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "security_events" ADD CONSTRAINT "fk_security_events_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD CONSTRAINT "FK_system_settings_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD CONSTRAINT "tenant_kyc_audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_audit_log" ADD CONSTRAINT "tenant_kyc_audit_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD CONSTRAINT "tenant_kyc_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD CONSTRAINT "tenant_kyc_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_kyc_documents" ADD CONSTRAINT "tenant_kyc_documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "fk_tenant_subscriptions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD CONSTRAINT "fk_credit_transactions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_credit_account_id_fkey" FOREIGN KEY ("credit_account_id") REFERENCES "credit_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "tenant_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ADD CONSTRAINT "fk_credit_accounts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "tenant_subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_parent_subscription_id_fkey" FOREIGN KEY ("parent_subscription_id") REFERENCES "tenant_subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "fk_user_sessions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD CONSTRAINT "tenants_kyc_reviewed_by_fkey" FOREIGN KEY ("kyc_reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
