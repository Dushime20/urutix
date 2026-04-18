// Script to create lending policy tables
const { Client } = require('pg');
require('dotenv').config();

async function createTables() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Create lending_policy_interest_rates table
    console.log('Creating lending_policy_interest_rates table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lending_policy_interest_rates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        risk_level VARCHAR(50) NOT NULL,
        base_rate DECIMAL(5,2) NOT NULL,
        min_rate DECIMAL(5,2) NOT NULL,
        max_rate DECIMAL(5,2) NOT NULL,
        adjustment_factors JSONB,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_interest_rates_lender ON lending_policy_interest_rates(lender_id);
      CREATE INDEX IF NOT EXISTS idx_interest_rates_active ON lending_policy_interest_rates(is_active);
    `);
    console.log('✅ lending_policy_interest_rates created\n');

    // Create lending_policy_loan_limits table
    console.log('Creating lending_policy_loan_limits table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lending_policy_loan_limits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        business_type VARCHAR(50) NOT NULL,
        min_amount DECIMAL(15,2) NOT NULL,
        max_amount DECIMAL(15,2) NOT NULL,
        credit_score_requirement INTEGER,
        collateral_requirement DECIMAL(5,2),
        max_utilization DECIMAL(5,2),
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_loan_limits_lender ON lending_policy_loan_limits(lender_id);
      CREATE INDEX IF NOT EXISTS idx_loan_limits_business_type ON lending_policy_loan_limits(business_type);
    `);
    console.log('✅ lending_policy_loan_limits created\n');

    // Create lending_policy_eligibility table
    console.log('Creating lending_policy_eligibility table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lending_policy_eligibility (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        requirement TEXT NOT NULL,
        minimum_value DECIMAL(15,2),
        maximum_value DECIMAL(15,2),
        is_required BOOLEAN DEFAULT false,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_eligibility_lender ON lending_policy_eligibility(lender_id);
      CREATE INDEX IF NOT EXISTS idx_eligibility_category ON lending_policy_eligibility(category);
    `);
    console.log('✅ lending_policy_eligibility created\n');

    // Create lending_policy_risk_assessment table
    console.log('Creating lending_policy_risk_assessment table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lending_policy_risk_assessment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
        factor VARCHAR(255) NOT NULL,
        weight DECIMAL(5,2) NOT NULL,
        scoring_criteria JSONB NOT NULL,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_risk_assessment_lender ON lending_policy_risk_assessment(lender_id);
    `);
    console.log('✅ lending_policy_risk_assessment created\n');

    // Create lending_policy_repayment table
    console.log('Creating lending_policy_repayment table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lending_policy_repayment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        frequency VARCHAR(50) NOT NULL,
        grace_period INTEGER NOT NULL,
        late_fee DECIMAL(15,2) NOT NULL,
        penalty_rate DECIMAL(5,2) NOT NULL,
        max_extensions INTEGER NOT NULL,
        default_threshold INTEGER NOT NULL,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_repayment_lender ON lending_policy_repayment(lender_id);
    `);
    console.log('✅ lending_policy_repayment created\n');

    // Create lending_policy_cargo_types table
    console.log('Creating lending_policy_cargo_types table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lending_policy_cargo_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
        cargo_type VARCHAR(255) NOT NULL,
        risk_level VARCHAR(50) NOT NULL,
        risk_multiplier DECIMAL(5,2) NOT NULL,
        max_loan_amount DECIMAL(15,2) NOT NULL,
        insurance_required BOOLEAN DEFAULT false,
        special_conditions JSONB,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cargo_types_lender ON lending_policy_cargo_types(lender_id);
      CREATE INDEX IF NOT EXISTS idx_cargo_types_cargo_type ON lending_policy_cargo_types(cargo_type);
    `);
    console.log('✅ lending_policy_cargo_types created\n');

    // Create lending_policy_system_config table
    console.log('Creating lending_policy_system_config table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lending_policy_system_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE UNIQUE,
        name VARCHAR(255) NOT NULL,
        auto_approval_limit DECIMAL(15,2) NOT NULL,
        manual_review_threshold DECIMAL(15,2) NOT NULL,
        max_concurrent_loans INTEGER NOT NULL,
        total_exposure_limit DECIMAL(15,2),
        cooldown_period INTEGER NOT NULL,
        compliance_mode BOOLEAN DEFAULT true,
        audit_trail BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_system_config_lender ON lending_policy_system_config(lender_id);
    `);
    console.log('✅ lending_policy_system_config created\n');

    console.log('✅ All lending policy tables created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

createTables();
