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

async function cleanupDuplicatePricingRules() {
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

    console.log(`\n📊 Total pricing rules before cleanup: ${allRules.length}`);

    // Group by rule characteristics
    const ruleGroups = {};
    
    allRules.forEach(rule => {
      const key = `${rule.ruleType}-${rule.unit}-${rule.creditCost}`;
      if (!ruleGroups[key]) {
        ruleGroups[key] = [];
      }
      ruleGroups[key].push(rule);
    });

    let deletedCount = 0;
    let deactivatedCount = 0;

    // Process each group
    for (const [key, rules] of Object.entries(ruleGroups)) {
      if (rules.length > 1) {
        console.log(`\n🔄 Processing duplicate group: ${key} (${rules.length} rules)`);
        
        // Sort by created date (newest first)
        rules.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Keep the newest rule
        const keepRule = rules[0];
        const duplicates = rules.slice(1);
        
        console.log(`   ✅ Keeping: ${keepRule.id.substring(0, 8)}... (${keepRule.ruleName}) - Created: ${keepRule.createdAt.toISOString().split('T')[0]}`);
        
        // Handle duplicates
        for (const duplicate of duplicates) {
          if (duplicate.isActive) {
            // Deactivate active duplicates
            await AppDataSource.query(
              `UPDATE credit_pricing_rules SET is_active = false WHERE id = $1`,
              [duplicate.id]
            );
            console.log(`   ⚠️  Deactivated: ${duplicate.id.substring(0, 8)}... (was active)`);
            deactivatedCount++;
          } else {
            // Delete inactive duplicates
            await AppDataSource.query(
              `DELETE FROM credit_pricing_rules WHERE id = $1`,
              [duplicate.id]
            );
            console.log(`   🗑️  Deleted: ${duplicate.id.substring(0, 8)}... (was inactive)`);
            deletedCount++;
          }
        }
      }
    }

    // Get final count
    const finalRules = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM credit_pricing_rules
    `);

    console.log(`\n\n✅ Cleanup Complete!`);
    console.log(`   📊 Rules before: ${allRules.length}`);
    console.log(`   📊 Rules after: ${finalRules[0].count}`);
    console.log(`   🗑️  Deleted: ${deletedCount} inactive duplicates`);
    console.log(`   ⚠️  Deactivated: ${deactivatedCount} active duplicates`);

    // Show remaining active rules
    const activeRules = await AppDataSource.query(`
      SELECT 
        rule_name as "ruleName",
        rule_type as "ruleType",
        unit,
        credit_cost as "creditCost"
      FROM credit_pricing_rules
      WHERE is_active = true
      ORDER BY priority DESC, created_at DESC
    `);

    console.log(`\n📋 Active Rules After Cleanup (${activeRules.length}):`);
    activeRules.forEach(rule => {
      console.log(`   • ${rule.ruleName}: ${rule.creditCost} credits per ${rule.unit} (${rule.ruleType})`);
    });

    await AppDataSource.destroy();

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

cleanupDuplicatePricingRules();
