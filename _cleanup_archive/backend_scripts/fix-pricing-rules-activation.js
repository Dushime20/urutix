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

async function fixPricingRulesActivation() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Activate the default weight-based rule (1 ton = 5 credits)
    const result = await AppDataSource.query(`
      UPDATE credit_pricing_rules 
      SET is_active = true 
      WHERE rule_type = 'weight' 
        AND unit = 'ton' 
        AND credit_cost = 5.00
        AND rule_name LIKE '%default%'
      RETURNING id, rule_name, is_active
    `);

    if (result.length > 0) {
      console.log('\n✅ Activated default weight-based pricing rule:');
      result.forEach(rule => {
        console.log(`   • ${rule.rule_name} (ID: ${rule.id ? rule.id.substring(0, 8) : 'unknown'}...)`);
      });
    } else {
      // If no default rule found, activate the first weight-based 5 credit rule
      const fallback = await AppDataSource.query(`
        UPDATE credit_pricing_rules 
        SET is_active = true 
        WHERE rule_type = 'weight' 
          AND unit = 'ton' 
          AND credit_cost = 5.00
        RETURNING id, rule_name, is_active
        LIMIT 1
      `);
      
      if (fallback.length > 0) {
        console.log('\n✅ Activated weight-based pricing rule:');
        fallback.forEach(rule => {
          console.log(`   • ${rule.rule_name} (ID: ${rule.id ? rule.id.substring(0, 8) : 'unknown'}...)`);
        });
      }
    }

    // Show all active rules
    const activeRules = await AppDataSource.query(`
      SELECT 
        id,
        rule_name as "ruleName",
        rule_type as "ruleType",
        unit,
        credit_cost as "creditCost",
        is_active as "isActive",
        priority
      FROM credit_pricing_rules
      WHERE is_active = true
      ORDER BY priority DESC, created_at DESC
    `);

    console.log(`\n📋 Active Pricing Rules (${activeRules.length}):`);
    if (activeRules.length === 0) {
      console.log('   ⚠️  No active rules found!');
    } else {
      activeRules.forEach(rule => {
        console.log(`   • ${rule.ruleName}: ${rule.creditCost} credits per ${rule.unit} (${rule.ruleType})`);
      });
    }

    // Show all rules
    const allRules = await AppDataSource.query(`
      SELECT 
        id,
        rule_name as "ruleName",
        rule_type as "ruleType",
        unit,
        credit_cost as "creditCost",
        is_active as "isActive",
        priority
      FROM credit_pricing_rules
      ORDER BY is_active DESC, priority DESC, created_at DESC
    `);

    console.log(`\n📊 All Pricing Rules (${allRules.length} total):`);
    allRules.forEach(rule => {
      const status = rule.isActive ? '✅ ACTIVE' : '⚪ Inactive';
      console.log(`   ${status} | ${rule.ruleName}: ${rule.creditCost} credits per ${rule.unit}`);
    });

    await AppDataSource.destroy();
    console.log('\n✅ Fix complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

fixPricingRulesActivation();
