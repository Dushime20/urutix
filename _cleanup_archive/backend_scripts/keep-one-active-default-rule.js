const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix_db',
  synchronize: false,
  logging: false,
});

async function keepOneActiveDefaultRule() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Get all active default weight-based rules
    const activeDefaults = await AppDataSource.query(`
      SELECT 
        id,
        rule_name,
        created_at
      FROM credit_pricing_rules
      WHERE rule_type = 'weight' 
        AND unit = 'ton' 
        AND credit_cost = 5.00
        AND is_active = true
        AND rule_name LIKE '%default%'
      ORDER BY created_at DESC
    `);

    console.log(`\n📊 Found ${activeDefaults.length} active default rules`);

    if (activeDefaults.length > 1) {
      // Keep the newest, deactivate the rest
      const keepRule = activeDefaults[0];
      const deactivateRules = activeDefaults.slice(1);

      console.log(`\n✅ Keeping newest rule: ${keepRule.rule_name}`);
      console.log(`   ID: ${keepRule.id}`);
      console.log(`   Created: ${keepRule.created_at}`);

      for (const rule of deactivateRules) {
        await AppDataSource.query(
          `UPDATE credit_pricing_rules SET is_active = false WHERE id = $1`,
          [rule.id]
        );
        console.log(`\n⚠️  Deactivated duplicate: ${rule.rule_name}`);
        console.log(`   ID: ${rule.id}`);
        console.log(`   Created: ${rule.created_at}`);
      }
    } else if (activeDefaults.length === 1) {
      console.log('\n✅ Only one active default rule found - no action needed');
    } else {
      console.log('\n⚠️  No active default rules found!');
    }

    // Show final active rules
    const finalActive = await AppDataSource.query(`
      SELECT 
        rule_name,
        rule_type,
        unit,
        credit_cost,
        priority
      FROM credit_pricing_rules
      WHERE is_active = true
      ORDER BY priority DESC, created_at DESC
    `);

    console.log(`\n\n📋 Final Active Pricing Rules (${finalActive.length}):`);
    finalActive.forEach(rule => {
      console.log(`   • ${rule.rule_name}: ${rule.credit_cost} credits per ${rule.unit} (${rule.rule_type})`);
    });

    await AppDataSource.destroy();
    console.log('\n✅ Complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

keepOneActiveDefaultRule();
