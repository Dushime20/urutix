const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const featureCosts = [
  // Core Features
  {
    feature_code: 'LOAD_POST',
    feature_name: 'Post a Load',
    description: 'Create and publish a new load listing',
    base_cost: 5,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'LOAD_EDIT',
    feature_name: 'Edit Load',
    description: 'Modify an existing load listing',
    base_cost: 2,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'LOAD_DELETE',
    feature_name: 'Delete Load',
    description: 'Remove a load listing',
    base_cost: 0,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 1.0 },
  },

  // Matching & Discovery
  {
    feature_code: 'TRUCK_MATCH_BASIC',
    feature_name: 'Basic Truck Matching',
    description: 'Find available trucks using basic criteria',
    base_cost: 3,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'TRUCK_MATCH_AI',
    feature_name: 'AI-Powered Truck Matching',
    description: 'Advanced AI matching with optimization',
    base_cost: 10,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'LOAD_SEARCH',
    feature_name: 'Load Search',
    description: 'Search and filter available loads',
    base_cost: 1,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },

  // Route & Optimization
  {
    feature_code: 'ROUTE_OPTIMIZATION',
    feature_name: 'Route Optimization',
    description: 'Optimize delivery routes for efficiency',
    base_cost: 10,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'MULTI_STOP_ROUTE',
    feature_name: 'Multi-Stop Route Planning',
    description: 'Plan routes with multiple pickup/delivery points',
    base_cost: 15,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'ROUTE_TRACKING',
    feature_name: 'Real-Time Route Tracking',
    description: 'Track vehicle location and route progress',
    base_cost: 5,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },

  // Documents
  {
    feature_code: 'DOCUMENT_GENERATE',
    feature_name: 'Generate Document',
    description: 'Auto-generate shipping documents',
    base_cost: 2,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'DOCUMENT_SIGN',
    feature_name: 'Digital Signature',
    description: 'Sign documents electronically',
    base_cost: 3,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'CONTRACT_TEMPLATE',
    feature_name: 'Contract from Template',
    description: 'Generate contract from template',
    base_cost: 5,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },

  // Communications
  {
    feature_code: 'SMS_NOTIFICATION',
    feature_name: 'SMS Notification',
    description: 'Send SMS notification to user',
    base_cost: 1,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'EMAIL_NOTIFICATION',
    feature_name: 'Email Notification',
    description: 'Send email notification',
    base_cost: 0,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 1.0 },
  },
  {
    feature_code: 'PUSH_NOTIFICATION',
    feature_name: 'Push Notification',
    description: 'Send mobile push notification',
    base_cost: 0,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 1.0 },
  },

  // AI Features
  {
    feature_code: 'PRICE_SUGGESTION',
    feature_name: 'AI Price Suggestion',
    description: 'Get AI-powered pricing recommendations',
    base_cost: 15,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'DEMAND_FORECAST',
    feature_name: 'Demand Forecasting',
    description: 'Predict future demand patterns',
    base_cost: 20,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'RISK_ASSESSMENT',
    feature_name: 'Risk Assessment',
    description: 'Analyze and assess shipment risks',
    base_cost: 10,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },

  // Analytics
  {
    feature_code: 'BASIC_REPORT',
    feature_name: 'Basic Report',
    description: 'Generate basic analytics report',
    base_cost: 5,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'ADVANCED_ANALYTICS',
    feature_name: 'Advanced Analytics',
    description: 'Access advanced analytics dashboard',
    base_cost: 20,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'CUSTOM_REPORT',
    feature_name: 'Custom Report',
    description: 'Generate custom analytics report',
    base_cost: 30,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },

  // Broker Features
  {
    feature_code: 'BROKER_COMMISSION_CALC',
    feature_name: 'Broker Commission Calculation',
    description: 'Calculate broker commissions',
    base_cost: 5,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'BROKER_PERFORMANCE',
    feature_name: 'Broker Performance Report',
    description: 'Generate broker performance analytics',
    base_cost: 10,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },

  // Insurance
  {
    feature_code: 'INSURANCE_QUOTE',
    feature_name: 'Insurance Quote',
    description: 'Get insurance quote for shipment',
    base_cost: 10,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
  {
    feature_code: 'CLAIM_PROCESSING',
    feature_name: 'Insurance Claim Processing',
    description: 'Process insurance claim',
    base_cost: 15,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },

  // API Access
  {
    feature_code: 'API_CALL',
    feature_name: 'API Call',
    description: 'External API call (10 calls = 1 credit)',
    base_cost: 0.1,
    plan_multipliers: { starter: 1.0, professional: 1.0, enterprise: 0.8 },
  },
];

async function seedFeatureCreditCosts() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding feature credit costs...\n');

    let created = 0;
    let skipped = 0;

    for (const feature of featureCosts) {
      // Check if feature already exists
      const existingFeature = await client.query(
        'SELECT id FROM feature_credit_costs WHERE feature_code = $1',
        [feature.feature_code]
      );

      if (existingFeature.rows.length > 0) {
        console.log(`⏭️  Feature "${feature.feature_code}" already exists, skipping...`);
        skipped++;
        continue;
      }

      // Insert feature
      const result = await client.query(
        `INSERT INTO feature_credit_costs 
        (feature_code, feature_name, description, base_cost, plan_multipliers, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          feature.feature_code,
          feature.feature_name,
          feature.description,
          feature.base_cost,
          JSON.stringify(feature.plan_multipliers),
          true,
        ]
      );

      console.log(`✅ ${feature.feature_name} (${feature.feature_code})`);
      console.log(`   - Base Cost: ${feature.base_cost} credits`);
      console.log(`   - Enterprise Cost: ${Math.ceil(feature.base_cost * feature.plan_multipliers.enterprise)} credits\n`);
      created++;
    }

    console.log('✨ Feature credit costs seeded successfully!\n');
    console.log(`📊 Summary: ${created} created, ${skipped} skipped\n`);

    // Display summary by category
    const summary = await client.query(
      'SELECT feature_code, feature_name, base_cost FROM feature_credit_costs ORDER BY base_cost DESC, feature_name'
    );

    console.log('📊 Feature Credit Costs Summary:');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('Feature                              | Code                    | Cost');
    console.log('═══════════════════════════════════════════════════════════════════');
    summary.rows.forEach((feature) => {
      const cost = feature.base_cost === 0 ? 'FREE' : `${feature.base_cost} credits`;
      console.log(
        `${feature.feature_name.padEnd(36)} | ${feature.feature_code.padEnd(23)} | ${cost}`
      );
    });
    console.log('═══════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding feature credit costs:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed function
seedFeatureCreditCosts()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
