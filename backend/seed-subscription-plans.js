const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const defaultPlans = [
  {
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for small fleets getting started with digital logistics',
    price_monthly: 49.99,
    price_yearly: 499.99,
    included_credits: 100,
    features: {
      maxTrucks: 5,
      maxUsers: 3,
      maxDrivers: 5,
      maxLoadsPerMonth: 50,
      aiMatching: false,
      advancedAnalytics: false,
      brokerManagement: false,
      insuranceTracking: true,
      apiAccess: false,
      prioritySupport: false
    },
    limits: {
      storageGB: 5,
      apiCallsPerMinute: 10,
      smsPerMonth: 100,
      emailsPerMonth: 500
    },
    is_active: true,
    is_popular: false,
    display_order: 1
  },
  {
    name: 'Professional',
    slug: 'professional',
    description: 'Advanced features for growing logistics operations',
    price_monthly: 149.99,
    price_yearly: 1499.99,
    included_credits: 500,
    features: {
      maxTrucks: 25,
      maxUsers: 10,
      maxDrivers: 25,
      maxLoadsPerMonth: 500,
      aiMatching: true,
      advancedAnalytics: true,
      brokerManagement: true,
      insuranceTracking: true,
      apiAccess: true,
      prioritySupport: true
    },
    limits: {
      storageGB: 50,
      apiCallsPerMinute: 100,
      smsPerMonth: 1000,
      emailsPerMonth: 5000
    },
    is_active: true,
    is_popular: true,
    display_order: 2
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Complete solution for large-scale logistics operations',
    price_monthly: 499.99,
    price_yearly: 4999.99,
    included_credits: 2000,
    features: {
      maxTrucks: -1, // unlimited
      maxUsers: -1,
      maxDrivers: -1,
      maxLoadsPerMonth: -1,
      aiMatching: true,
      advancedAnalytics: true,
      brokerManagement: true,
      insuranceTracking: true,
      apiAccess: true,
      whiteLabel: true,
      customIntegrations: true,
      prioritySupport: true,
      dedicatedSupport: true,
      multiRegion: true
    },
    limits: {
      storageGB: -1, // unlimited
      apiCallsPerMinute: -1,
      smsPerMonth: -1,
      emailsPerMonth: -1
    },
    is_active: true,
    is_popular: false,
    display_order: 3
  }
];

async function seedPlans() {
  try {
    console.log('Seeding subscription plans...');
    
    for (const plan of defaultPlans) {
      // Check if plan already exists
      const existing = await pool.query(
        'SELECT id FROM subscription_plans WHERE slug = $1',
        [plan.slug]
      );
      
      if (existing.rows.length > 0) {
        console.log(`⏭️  Plan "${plan.name}" already exists, skipping...`);
        continue;
      }
      
      // Insert plan
      await pool.query(`
        INSERT INTO subscription_plans (
          name, slug, description, price_monthly, price_yearly,
          included_credits, features, limits, is_active, is_popular, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        plan.name,
        plan.slug,
        plan.description,
        plan.price_monthly,
        plan.price_yearly,
        plan.included_credits,
        JSON.stringify(plan.features),
        JSON.stringify(plan.limits),
        plan.is_active,
        plan.is_popular,
        plan.display_order
      ]);
      
      console.log(`✅ Created plan: ${plan.name}`);
    }
    
    // Show final count
    const count = await pool.query('SELECT COUNT(*) FROM subscription_plans');
    console.log(`\n✅ Total plans in database: ${count.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

seedPlans();
