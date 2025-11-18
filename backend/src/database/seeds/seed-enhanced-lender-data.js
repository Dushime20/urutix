const { Pool } = require('pg');

// Database configuration - prefer environment variables so seeds run against configured DB
const dbConfig = {
  user: process.env.DB_USERNAME || process.env.PGUSER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'urutix',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5433', 10),
};

async function seedEnhancedLenderData() {
  console.log('🎯 Starting Enhanced Lender Module Database Seeding...\n');
  
  const pool = new Pool(dbConfig);
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Step 1: Use existing tenants
    console.log('🏢 Getting existing tenants...');
    const tenants = await pool.query('SELECT id FROM tenants WHERE "isActive" = true LIMIT 8');
    let tenantIds = tenants.rows.map(t => t.id);
    
    // If we have fewer than 8 tenants, repeat them to ensure we have enough for 8 borrowers
    while (tenantIds.length < 8) {
      tenantIds = tenantIds.concat(tenants.rows.map(t => t.id));
    }
    tenantIds = tenantIds.slice(0, 8); // Take only 8
    
    console.log(`✅ Using ${tenantIds.length} tenant assignments for borrowers\n`);
    
    // Step 2: Create enhanced lenders
    console.log('🏦 Creating enhanced lenders...');
    
    // First check if these lenders already exist
    const existingLenders = await pool.query(`
      SELECT name FROM lenders 
      WHERE name IN ('Alpha Capital Lending', 'Beta Finance Solutions', 'Gamma Investment Group')
    `);
    
    if (existingLenders.rows.length === 0) {
      const lendersResult = await pool.query(`
        INSERT INTO lenders (
          name, contact_email, status, api_key_hash, metadata
        ) VALUES 
        (
          'Alpha Capital Lending',
          'contact@alphacapital.com',
          'active',
          '$2b$10$rQJ9K.mZvBxY3wF2nP8L7uXtG4qV1sH6jR2eW9cA5mN7pL3kJ8dF0',
          '{"phone": "+1-555-0101", "address": "123 Financial District, New York, NY 10005", "business_type": "financial_services", "registration_number": "ACL-2024-001", "min_loan_amount": 1000.00, "max_loan_amount": 50000.00, "interest_rate_min": 0.0850, "interest_rate_max": 0.1500, "max_loan_term": 24, "credit_score_requirement": 650, "total_capital": 1000000.00, "available_capital": 750000.00}'
        ),
        (
          'Beta Finance Solutions',
          'info@betafinance.com',
          'active',
          '$2b$10$sT8M5.nVwCyZ4xG3qP9M8vYuR5hS7kL9mW4eQ6rN8oP2kJ7dG1H0',
          '{"phone": "+1-555-0202", "address": "456 Business Avenue, Chicago, IL 60601", "business_type": "lending_institution", "registration_number": "BFS-2024-002", "min_loan_amount": 5000.00, "max_loan_amount": 100000.00, "interest_rate_min": 0.0600, "interest_rate_max": 0.1200, "max_loan_term": 36, "credit_score_requirement": 600, "total_capital": 2000000.00, "available_capital": 1500000.00}'
        ),
        (
          'Gamma Investment Group',
          'loans@gammainvest.com',
          'active',
          '$2b$10$uV9N6.oXxDzA5yH4rQ0O9wZvS6iT8lM0nX5fR7sP9oQ3kL8eH2I1',
          '{"phone": "+1-555-0303", "address": "789 Investment Plaza, San Francisco, CA 94105", "business_type": "investment_fund", "registration_number": "GIG-2024-003", "min_loan_amount": 10000.00, "max_loan_amount": 250000.00, "interest_rate_min": 0.0500, "interest_rate_max": 0.1000, "max_loan_term": 48, "credit_score_requirement": 700, "total_capital": 5000000.00, "available_capital": 3750000.00}'
        )
        RETURNING id, name
      `);
      console.log(`✅ Created ${lendersResult.rows.length} new lenders\n`);
    } else {
      console.log(`✅ Using ${existingLenders.rows.length} existing lenders\n`);
    }
    
    // Step 3: Create lender policies
    console.log('📋 Creating lender policies...');
    const policiesResult = await pool.query(`
      INSERT INTO lender_policies (
        lender_id, interest_rate, repayment_term_days, max_advance_per_trip, 
        max_exposure, advance_percentage
      ) 
      SELECT 
        id,
        (metadata->>'interest_rate_min')::numeric,
        30,
        (metadata->>'max_loan_amount')::numeric,
        (metadata->>'total_capital')::numeric * 0.5,
        0.70
      FROM lenders
      WHERE name IN ('Alpha Capital Lending', 'Beta Finance Solutions', 'Gamma Investment Group')
        AND id NOT IN (SELECT DISTINCT lender_id FROM lender_policies)
      RETURNING id
    `);
    console.log(`✅ Created ${policiesResult.rows.length} lender policies\n`);
    
    // Step 4: Create loan requests
    console.log('💰 Creating loan requests...');
    
    // Get existing loads and trips
    const loadsResult = await pool.query('SELECT id FROM loads LIMIT 2');
    const tripsResult = await pool.query('SELECT id FROM trips LIMIT 1');
    const usersResult = await pool.query('SELECT id FROM users WHERE role = \'CARGO_OWNER\' LIMIT 1');
    
    if (loadsResult.rows.length > 0 && tripsResult.rows.length > 0 && usersResult.rows.length > 0) {
      const lendersResult = await pool.query('SELECT id FROM lenders LIMIT 3');
      
      const loanRequests = [
        {
          tenant_id: tenantIds[0],
          cargo_id: loadsResult.rows[0].id,
          trip_id: tripsResult.rows[0].id,
          lender_id: lendersResult.rows[0]?.id,
          requested_amount: 5000.00,
          status: 'pending',
          idempotency_key: 'loan-req-001',
          created_by: usersResult.rows[0].id
        },
        {
          tenant_id: tenantIds[1],
          cargo_id: loadsResult.rows[1]?.id || loadsResult.rows[0].id,
          trip_id: tripsResult.rows[0].id,
          lender_id: lendersResult.rows[1]?.id,
          requested_amount: 7500.00,
          status: 'approved',
          approved_amount: 7000.00,
          idempotency_key: 'loan-req-002',
          created_by: usersResult.rows[0].id
        }
      ];
      
      for (const loanRequest of loanRequests) {
        await pool.query(`
          INSERT INTO loan_requests (
            tenant_id, cargo_id, trip_id, lender_id, requested_amount, 
            approved_amount, status, idempotency_key, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (idempotency_key) DO NOTHING
        `, [
          loanRequest.tenant_id, loanRequest.cargo_id, loanRequest.trip_id, 
          loanRequest.lender_id, loanRequest.requested_amount, 
          loanRequest.approved_amount, loanRequest.status, 
          loanRequest.idempotency_key, loanRequest.created_by
        ]);
      }
      console.log(`✅ Created ${loanRequests.length} loan requests\n`);
    } else {
      console.log('⚠️  Skipping loan requests - missing required data (loads, trips, or users)\n');
    }
    
    // Step 6: Create disbursements and repayments for disbursed loans
    const disbursedLoans = await pool.query(`
      SELECT id, approved_amount
      FROM loan_requests 
      WHERE status = 'disbursed' 
      LIMIT 6
    `);
    
    console.log('💰 Creating loan disbursements...');
    let disbursementsCount = 0;
    for (const loan of disbursedLoans.rows) {
      try {
        await pool.query(`
          INSERT INTO loan_disbursements (
            loan_request_id, amount, disbursement_method, 
            disbursement_date, status, external_txn_ref,
            beneficiaries, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          loan.id,
          loan.approved_amount,
          'bank_transfer',
          new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          'disbursed',
          `TXN-${Date.now()}-${disbursementsCount}`,
          JSON.stringify([]),
          JSON.stringify({ processing_time: '24h', fee: loan.approved_amount * 0.01 })
        ]);
        disbursementsCount++;
      } catch (error) {
        console.log(`⚠️ Skipped disbursement: ${error.message.substring(0, 50)}...`);
      }
    }
    console.log(`✅ Created ${disbursementsCount} disbursements\n`);
    
    console.log('💸 Creating loan repayments...');
    let repaymentsCount = 0;
    for (const loan of disbursedLoans.rows.slice(0, 4)) {
      try {
        const repaymentAmount = loan.approved_amount * 0.3;
        const interestPortion = repaymentAmount * 0.2;
        const principalPortion = repaymentAmount * 0.8;
        
        await pool.query(`
          INSERT INTO loan_repayments (
            loan_request_id, amount, interest_paid, principal_paid,
            repayment_date, external_txn_ref, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          loan.id,
          repaymentAmount,
          interestPortion,
          principalPortion,
          new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
          `RPMT-${Date.now()}-${repaymentsCount}`,
          JSON.stringify({ payment_method: 'bank_transfer', early_payment: false })
        ]);
        repaymentsCount++;
      } catch (error) {
        console.log(`⚠️ Skipped repayment: ${error.message.substring(0, 50)}...`);
      }
    }
    console.log(`✅ Created ${repaymentsCount} repayments\n`);
    
    // Verification
    console.log('🔍 Verifying seeded data...\n');
    const verification = await pool.query(`
      SELECT 'LENDERS' as table_name, COUNT(*) as count FROM lenders
      UNION ALL
      SELECT 'LENDER_POLICIES', COUNT(*) FROM lender_policies
      UNION ALL
      SELECT 'LOAN_REQUESTS', COUNT(*) FROM loan_requests
      UNION ALL
      SELECT 'LOAN_DISBURSEMENTS', COUNT(*) FROM loan_disbursements
      UNION ALL
      SELECT 'LOAN_REPAYMENTS', COUNT(*) FROM loan_repayments
    `);
    
    console.log('📋 Enhanced Data Verification Results:');
    console.log('┌─────────────────────┬───────┐');
    console.log('│ Table               │ Count │');
    console.log('├─────────────────────┼───────┤');
    verification.rows.forEach(row => {
      console.log(`│ ${row.table_name.padEnd(19)} │ ${row.count.toString().padStart(5)} │`);
    });
    console.log('└─────────────────────┴───────┘\n');
    
    // Show sample lenders
    const lendersSample = await pool.query(`
      SELECT id, name, contact_email, status, metadata
      FROM lenders 
      WHERE name IN ('Alpha Capital Lending', 'Beta Finance Solutions', 'Gamma Investment Group')
      ORDER BY name
    `);
    
    console.log('💡 Enhanced Lender Information:');
    lendersSample.rows.forEach((lender, index) => {
      const metadata = lender.metadata || {};
      console.log(`\n${index + 1}. ${lender.name}`);
      console.log(`   📧 Email: ${lender.contact_email}`);
      console.log(`   📊 Status: ${lender.status}`);
      console.log(`   💰 Loan Range: $${Number(metadata.min_loan_amount || 0).toLocaleString()} - $${Number(metadata.max_loan_amount || 0).toLocaleString()}`);
      console.log(`   🏦 Capital: $${Number(metadata.available_capital || 0).toLocaleString()} / $${Number(metadata.total_capital || 0).toLocaleString()}`);
      console.log(`   🆔 ID: ${lender.id}`);
    });
    
    console.log('\n🚀 Enhanced Lending System Ready!');
    console.log('\n📖 Test these enhanced endpoints:');
    console.log('   • GET /api/lending/lenders/{lenderId}/loan-requests');
    console.log('   • GET /api/lending/lenders/{lenderId}/active-loans');
    console.log('   • GET /api/lending/lenders/{lenderId}/disbursements');
    console.log('   • GET /api/lending/lenders/{lenderId}/repayments');
    console.log('   • GET /api/lending/lenders/{lenderId}/borrowers');
    console.log('   • GET /api/lending/lenders/{lenderId}/portfolio/summary');
    console.log('   • GET /api/lending/lenders/{lenderId}/analytics');
    console.log('   • GET /api/lending/lenders/{lenderId}/trends');
    
    console.log('\n💡 Use these Lender IDs for testing:');
    lendersSample.rows.forEach((lender, index) => {
      console.log(`   ${index + 1}. ${lender.name}: ${lender.id}`);
    });
    
  } catch (error) {
    console.error('❌ Enhanced seeding failed:', error.message);
    console.error('📝 Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed.');
  }
}

seedEnhancedLenderData();
