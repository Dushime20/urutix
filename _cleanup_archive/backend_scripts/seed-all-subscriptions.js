/**
 * Master Subscription Seed Script
 * 
 * Seeds all subscription-related data:
 * 1. Subscription Plans
 * 2. Credit Packages
 * 3. Feature Credit Costs
 * 
 * Run: node seed-all-subscriptions.js
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function seedSubscriptionPlans() {
  console.log('\n📦 Seeding Subscription Plans...');
  
  const plans = [
    {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small businesses getting started',
      price_monthly: 29.99,
      price_yearly: 299.99,
      included_credits: 100,
      features: JSON.stringify([
        'Up to 5 trucks',
        'Basic route planning',
        '100 credits/month',
        'Email support',
        'Mobile app access',
      ]),
      display_order: 1,
      is_active: true,
    },
    {
      name: 'Professional',
      slug: 'professional',
      description: 'For growing businesses with advanced needs',
      price_monthly: 99.99,
      price_yearly: 999.99,
      included_credits: 500,
      features: JSON.stringify([
        'Up to 25 trucks',
        'Advanced route optimization',
        '500 credits/month',
        'Priority support',
        'API access',
        'Custom reports',
        'Real-time tracking',
      ]),
      display_order: 2,
      is_active: true,
      is_popular: true,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For large fleets with custom requirements',
      price_monthly: 299.99,
      price_yearly: 2999.99,
      included_credits: 2000,
      features: JSON.stringify([
        'Unlimited trucks',
        'AI-powered optimization',
        '2000 credits/month',
        '24/7 dedicated support',
        'Full API access',
        'Custom integrations',
        'Advanced analytics',
        'White-label options',
      ]),
      display_order: 3,
      is_active: true,
    },
  ];

  for (const plan of plans) {
    try {
      await client.query(
        `INSERT INTO subscription_plans 
        (name, slug, description, price_monthly, price_yearly, included_credits, features, display_order, is_active, is_popular)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price_monthly = EXCLUDED.price_monthly,
          price_yearly = EXCLUDED.price_yearly,
          included_credits = EXCLUDED.included_credits,
          features = EXCLUDED.features,
          display_order = EXCLUDED.display_order,
          is_active = EXCLUDED.is_active,
          is_popular = EXCLUDED.is_popular`,
        [
          plan.name,
          plan.slug,
          plan.description,
          plan.price_monthly,
          plan.price_yearly,
          plan.included_credits,
          plan.features,
          plan.display_order,
          plan.is_active,
          plan.is_popular || false,
        ]
      );
      console.log(`  ✅ ${plan.name} plan seeded`);
    } catch (error) {
      console.error(`  ❌ Error seeding ${plan.name}:`, error.message);
    }
  }
}

async function seedCreditPackages() {
  console.log('\n💳 Seeding Credit Packages...');
  
  const packages = [
    {
      name: 'Starter Pack',
      slug: 'starter-pack',
      credits: 100,
      price: 9.99,
      discount_percentage: 0,
      description: 'Perfect for occasional use',
      is_active: true,
      display_order: 1,
    },
    {
      name: 'Value Pack',
      slug: 'value-pack',
      credits: 500,
      price: 44.99,
      discount_percentage: 10,
      description: 'Best value for regular users',
      is_active: true,
      is_popular: true,
      display_order: 2,
    },
    {
      name: 'Pro Pack',
      slug: 'pro-pack',
      credits: 1000,
      price: 79.99,
      discount_percentage: 20,
      description: 'For power users',
      is_active: true,
      display_order: 3,
    },
    {
      name: 'Enterprise Pack',
      slug: 'enterprise-pack',
      credits: 5000,
      price: 349.99,
      discount_percentage: 30,
      description: 'Maximum credits for large operations',
      is_active: true,
      display_order: 4,
    },
  ];

  for (const pkg of packages) {
    try {
      await client.query(
        `INSERT INTO credit_packages 
        (name, slug, credits, price, discount_percentage, description, is_active, is_popular, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          credits = EXCLUDED.credits,
          price = EXCLUDED.price,
          discount_percentage = EXCLUDED.discount_percentage,
          description = EXCLUDED.description,
          is_active = EXCLUDED.is_active,
          is_popular = EXCLUDED.is_popular,
          display_order = EXCLUDED.display_order`,
        [
          pkg.name,
          pkg.slug,
          pkg.credits,
          pkg.price,
          pkg.discount_percentage,
          pkg.description,
          pkg.is_active,
          pkg.is_popular || false,
          pkg.display_order,
        ]
      );
      console.log(`  ✅ ${pkg.name} seeded`);
    } catch (error) {
      console.error(`  ❌ Error seeding ${pkg.name}:`, error.message);
    }
  }
}

async function seedFeatureCreditCosts() {
  console.log('\n⚙️  Seeding Feature Credit Costs...');
  
  const features = [
    {
      feature_code: 'route:create',
      feature_name: 'Create Route',
      credit_cost: 5,
      description: 'Cost to create a new route',
      is_active: true,
    },
    {
      feature_code: 'route:optimize',
      feature_name: 'Optimize Route',
      credit_cost: 10,
      description: 'Cost to optimize an existing route',
      is_active: true,
    },
    {
      feature_code: 'load:match',
      feature_name: 'Match Load',
      credit_cost: 3,
      description: 'Cost to match a load with available trucks',
      is_active: true,
    },
    {
      feature_code: 'load:create',
      feature_name: 'Create Load',
      credit_cost: 2,
      description: 'Cost to create a new load',
      is_active: true,
    },
    {
      feature_code: 'tracking:realtime',
      feature_name: 'Real-time Tracking',
      credit_cost: 1,
      description: 'Cost per hour of real-time tracking',
      is_active: true,
    },
    {
      feature_code: 'analytics:report',
      feature_name: 'Generate Analytics Report',
      credit_cost: 15,
      description: 'Cost to generate detailed analytics report',
      is_active: true,
    },
    {
      feature_code: 'notification:sms',
      feature_name: 'SMS Notification',
      credit_cost: 1,
      description: 'Cost per SMS notification sent',
      is_active: true,
    },
    {
      feature_code: 'notification:push',
      feature_name: 'Push Notification',
      credit_cost: 0.5,
      description: 'Cost per push notification sent',
      is_active: true,
    },
    {
      feature_code: 'ai:prediction',
      feature_name: 'AI Prediction',
      credit_cost: 20,
      description: 'Cost for AI-powered predictions',
      is_active: true,
    },
    {
      feature_code: 'export:data',
      feature_name: 'Export Data',
      credit_cost: 5,
      description: 'Cost to export data to CSV/Excel',
      is_active: true,
    },
  ];

  for (const feature of features) {
    try {
      await client.query(
        `INSERT INTO feature_credit_costs 
        (feature_code, feature_name, credit_cost, description, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (feature_code) DO UPDATE SET
          feature_name = EXCLUDED.feature_name,
          credit_cost = EXCLUDED.credit_cost,
          description = EXCLUDED.description,
          is_active = EXCLUDED.is_active`,
        [
          feature.feature_code,
          feature.feature_name,
          feature.credit_cost,
          feature.description,
          feature.is_active,
        ]
      );
      console.log(`  ✅ ${feature.feature_name} (${feature.credit_cost} credits) seeded`);
    } catch (error) {
      console.error(`  ❌ Error seeding ${feature.feature_name}:`, error.message);
    }
  }
}

async function main() {
  console.log('🌱 Starting Subscription System Seed...\n');
  console.log('Database:', process.env.DATABASE_URL?.split('@')[1] || 'Not configured');
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Seed in order
    await seedSubscriptionPlans();
    await seedCreditPackages();
    await seedFeatureCreditCosts();

    console.log('\n✨ Subscription seed completed successfully!\n');
    
    // Display summary
    const plansCount = await client.query('SELECT COUNT(*) FROM subscription_plans WHERE is_active = true');
    const packagesCount = await client.query('SELECT COUNT(*) FROM credit_packages WHERE is_active = true');
    const featuresCount = await client.query('SELECT COUNT(*) FROM feature_credit_costs WHERE is_active = true');
    
    console.log('📊 Summary:');
    console.log(`  - Subscription Plans: ${plansCount.rows[0].count}`);
    console.log(`  - Credit Packages: ${packagesCount.rows[0].count}`);
    console.log(`  - Feature Costs: ${featuresCount.rows[0].count}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Database connection closed\n');
  }
}

main();
