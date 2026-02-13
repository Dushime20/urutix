const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const subscriptionPlans = [
  {
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for small fleet operators getting started with digital logistics management',
    price_monthly: 99.00,
    price_yearly: 990.00, // 2 months free
    included_credits: 500,
    features: {
      maxTrucks: 5,
      maxUsers: 10,
      maxDrivers: 10,
      maxLoadsPerMonth: 50,
      aiMatching: false,
      advancedAnalytics: false,
      brokerManagement: false,
      insuranceTracking: true,
      apiAccess: false,
      whiteLabel: false,
      customIntegrations: false,
      prioritySupport: false,
      dedicatedSupport: false,
      multiRegion: false,
    },
    limits: {
      storageGB: 5,
      apiCallsPerMinute: 60,
      smsPerMonth: 100,
      emailsPerMonth: 1000,
    },
    is_active: true,
    display_order: 1,
  },
  {
    name: 'Professional',
    slug: 'professional',
    description: 'Ideal for growing businesses that need advanced features and higher limits',
    price_monthly: 299.00,
    price_yearly: 2990.00, // 2 months free
    included_credits: 2000,
    features: {
      maxTrucks: 25,
      maxUsers: 50,
      maxDrivers: 50,
      maxLoadsPerMonth: 200,
      aiMatching: true,
      advancedAnalytics: true,
      brokerManagement: true,
      insuranceTracking: true,
      apiAccess: false,
      whiteLabel: false,
      customIntegrations: false,
      prioritySupport: true,
      dedicatedSupport: false,
      multiRegion: false,
    },
    limits: {
      storageGB: 50,
      apiCallsPerMinute: 300,
      smsPerMonth: 500,
      emailsPerMonth: 5000,
    },
    is_active: true,
    display_order: 2,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Complete solution for large operations with unlimited resources and premium support',
    price_monthly: 999.00,
    price_yearly: 9990.00, // 2 months free
    included_credits: 10000,
    features: {
      maxTrucks: null, // unlimited
      maxUsers: null, // unlimited
      maxDrivers: null, // unlimited
      maxLoadsPerMonth: null, // unlimited
      aiMatching: true,
      advancedAnalytics: true,
      brokerManagement: true,
      insuranceTracking: true,
      apiAccess: true,
      whiteLabel: true,
      customIntegrations: true,
      prioritySupport: true,
      dedicatedSupport: true,
      multiRegion: true,
    },
    limits: {
      storageGB: 500,
      apiCallsPerMinute: 1000,
      smsPerMonth: 2000,
      emailsPerMonth: 20000,
    },
    is_active: true,
    display_order: 3,
  },
];

async function seedSubscriptionPlans() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding subscription plans...\n');

    for (const plan of subscriptionPlans) {
      // Check if plan already exists
      const existingPlan = await client.query(
        'SELECT id FROM subscription_plans WHERE slug = $1',
        [plan.slug]
      );

      if (existingPlan.rows.length > 0) {
        console.log(`⏭️  Plan "${plan.name}" already exists, skipping...`);
        continue;
      }

      // Insert plan
      const result = await client.query(
        `INSERT INTO subscription_plans 
        (name, slug, description, price_monthly, price_yearly, included_credits, features, limits, is_active, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          plan.name,
          plan.slug,
          plan.description,
          plan.price_monthly,
          plan.price_yearly,
          plan.included_credits,
          JSON.stringify(plan.features),
          JSON.stringify(plan.limits),
          plan.is_active,
          plan.display_order,
        ]
      );

      console.log(`✅ Created plan: ${plan.name} (${plan.slug})`);
      console.log(`   - Monthly: $${plan.price_monthly}`);
      console.log(`   - Yearly: $${plan.price_yearly}`);
      console.log(`   - Credits: ${plan.included_credits}/month`);
      console.log(`   - ID: ${result.rows[0].id}\n`);
    }

    console.log('✨ Subscription plans seeded successfully!\n');

    // Display summary
    const summary = await client.query(
      'SELECT name, slug, price_monthly, included_credits FROM subscription_plans ORDER BY display_order'
    );

    console.log('📊 Summary of Subscription Plans:');
    console.log('═══════════════════════════════════════════════════════════');
    summary.rows.forEach((plan) => {
      console.log(`${plan.name.padEnd(15)} | $${plan.price_monthly.toString().padEnd(6)} | ${plan.included_credits} credits`);
    });
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed function
seedSubscriptionPlans()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
