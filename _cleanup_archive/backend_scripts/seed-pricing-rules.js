/**
 * Seed Credit Pricing Rules
 * Creates default pricing rules for weight-based credit consumption
 */

const { Client } = require('pg');
require('dotenv').config();

async function seedPricingRules() {
  console.log('🌱 Seeding Credit Pricing Rules...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const rules = [
      {
        rule_name: 'Weight-based pricing (default)',
        rule_type: 'weight',
        unit: 'ton',
        credit_cost: 5.00,
        plan_id: null,
        tenant_id: null,
        min_value: null,
        max_value: null,
        is_active: true,
        priority: 0,
        description: 'Default rate: 5 credits per ton of cargo',
      },
      // Example: Tiered pricing (disabled by default)
      {
        rule_name: 'Weight tier 1 (0-10 tons)',
        rule_type: 'weight',
        unit: 'ton',
        credit_cost: 5.00,
        plan_id: null,
        tenant_id: null,
        min_value: 0,
        max_value: 10,
        is_active: false,
        priority: 1,
        description: 'First 10 tons at standard rate',
      },
      {
        rule_name: 'Weight tier 2 (10-50 tons)',
        rule_type: 'weight',
        unit: 'ton',
        credit_cost: 4.00,
        plan_id: null,
        tenant_id: null,
        min_value: 10,
        max_value: 50,
        is_active: false,
        priority: 1,
        description: '10-50 tons at discounted rate (20% off)',
      },
      {
        rule_name: 'Weight tier 3 (50+ tons)',
        rule_type: 'weight',
        unit: 'ton',
        credit_cost: 3.00,
        plan_id: null,
        tenant_id: null,
        min_value: 50,
        max_value: null,
        is_active: false,
        priority: 1,
        description: 'Over 50 tons at bulk rate (40% off)',
      },
      // Example: Distance-based pricing (for future use)
      {
        rule_name: 'Distance-based pricing',
        rule_type: 'distance',
        unit: 'km',
        credit_cost: 0.50,
        plan_id: null,
        tenant_id: null,
        min_value: null,
        max_value: null,
        is_active: false,
        priority: 0,
        description: '0.5 credits per kilometer',
      },
      // Example: Flat rate per trip
      {
        rule_name: 'Flat rate per trip',
        rule_type: 'flat',
        unit: 'trip',
        credit_cost: 10.00,
        plan_id: null,
        tenant_id: null,
        min_value: null,
        max_value: null,
        is_active: false,
        priority: 0,
        description: 'Fixed 10 credits per trip',
      },
    ];

    console.log('📋 Creating pricing rules...\n');

    for (const rule of rules) {
      try {
        await client.query(
          `INSERT INTO credit_pricing_rules 
          (rule_name, rule_type, unit, credit_cost, plan_id, tenant_id, 
           min_value, max_value, is_active, priority)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING`,
          [
            rule.rule_name,
            rule.rule_type,
            rule.unit,
            rule.credit_cost,
            rule.plan_id,
            rule.tenant_id,
            rule.min_value,
            rule.max_value,
            rule.is_active,
            rule.priority,
          ]
        );

        const status = rule.is_active ? '✅ Active' : '⏸️  Inactive';
        console.log(`  ${status} ${rule.rule_name}`);
        console.log(`     Rate: ${rule.credit_cost} credits/${rule.unit}`);
        if (rule.min_value !== null || rule.max_value !== null) {
          const range = `${rule.min_value || '0'}-${rule.max_value || '∞'}`;
          console.log(`     Range: ${range} ${rule.unit}`);
        }
        console.log(`     ${rule.description}`);
        console.log('');
      } catch (error) {
        console.error(`  ❌ Error seeding ${rule.rule_name}:`, error.message);
      }
    }

    console.log('='.repeat(60));
    console.log('✨ Pricing rules seeded successfully!\n');

    // Display summary
    const activeRules = await client.query(
      'SELECT rule_type, COUNT(*) as count FROM credit_pricing_rules WHERE is_active = true GROUP BY rule_type'
    );
    const totalRules = await client.query('SELECT COUNT(*) FROM credit_pricing_rules');

    console.log('📊 Summary:');
    console.log(`  Total Rules: ${totalRules.rows[0].count}`);
    console.log('  Active Rules by Type:');
    activeRules.rows.forEach(row => {
      console.log(`    - ${row.rule_type}: ${row.count}`);
    });
    console.log('');

    console.log('💡 Next Steps:');
    console.log('  1. The default weight-based rule (5 credits/ton) is now active');
    console.log('  2. Enable tiered pricing by updating is_active = true for tier rules');
    console.log('  3. Create plan-specific or tenant-specific rules as needed');
    console.log('  4. Test with: npm run test:pricing');
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

seedPricingRules();
