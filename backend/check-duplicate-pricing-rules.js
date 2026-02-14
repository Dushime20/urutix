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

async function checkDuplicatePricingRules() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Get all pricing rules
    const allRules = await AppDataSource.query(`
      SELECT 
        id,
        rule_name as "ruleName",
        rule_type as "ruleType",
        unit,
        credit_cost as "creditCost",
        is_active as "isActive",
        priority,
        created_at as "createdAt"
      FROM credit_pricing_rules
      ORDER BY created_at ASC
    `);

    console.log(`\n📊 Total pricing rules: ${allRules.length}`);

    // Group by rule characteristics to find duplicates
    const ruleGroups = {};
    
    allRules.forEach(rule => {
      const key = `${rule.ruleType}-${rule.unit}-${rule.creditCost}`;
      if (!ruleGroups[key]) {
        ruleGroups[key] = [];
      }
      ruleGroups[key].push(rule);
    });

    // Find duplicates
    const duplicates = Object.entries(ruleGroups).filter(([_, rules]) => rules.length > 1);

    if (duplicates.length === 0) {
      console.log('\n✅ No duplicate pricing rules found!');
    } else {
      console.log(`\n⚠️  Found ${duplicates.length} groups of duplicate rules:\n`);
      
      duplicates.forEach(([key, rules]) => {
        console.log(`\n🔄 Duplicate group: ${key}`);
        console.log(`   Count: ${rules.length} rules`);
        rules.forEach((rule, index) => {
          console.log(`   ${index + 1}. ID: ${rule.id.substring(0, 8)}... | Name: "${rule.ruleName}" | Active: ${rule.isActive} | Created: ${rule.createdAt.toISOString().split('T')[0]}`);
        });
      });

      // Suggest cleanup
      console.log('\n\n💡 Cleanup Suggestions:');
      duplicates.forEach(([key, rules]) => {
        const activeRules = rules.filter(r => r.isActive);
        const inactiveRules = rules.filter(r => !r.isActive);
        
        console.log(`\n   ${key}:`);
        if (activeRules.length > 1) {
          console.log(`   ⚠️  Multiple active rules (${activeRules.length}) - Keep only one active`);
          console.log(`   Suggested: Keep newest, deactivate others`);
        }
        if (inactiveRules.length > 0) {
          console.log(`   🗑️  ${inactiveRules.length} inactive duplicate(s) can be deleted`);
          inactiveRules.forEach(rule => {
            console.log(`      DELETE FROM credit_pricing_rules WHERE id = '${rule.id}';`);
          });
        }
      });
    }

    // Show active rules summary
    const activeRules = allRules.filter(r => r.isActive);
    console.log(`\n\n📋 Active Rules Summary (${activeRules.length} active):`);
    activeRules.forEach(rule => {
      console.log(`   • ${rule.ruleName}: ${rule.creditCost} credits per ${rule.unit} (${rule.ruleType})`);
    });

    await AppDataSource.destroy();
    console.log('\n✅ Check complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

checkDuplicatePricingRules();
