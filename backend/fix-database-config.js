/**
 * Fix database config to add CreditMarketplaceSettings and FeatureCreditCost entities
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src', 'config', 'database.config.ts');

// Read the file
let content = fs.readFileSync(configPath, 'utf8');

// Check if entities are already in the array
const hasInArray = content.match(/^\s+CreditMarketplaceSettings,/m) && content.match(/^\s+FeatureCreditCost,/m);

if (hasInArray) {
  console.log('✓ Entities already added to database config entities array');
  process.exit(0);
}

// Add the entities after SubscriptionPayment in both places
const oldPattern = /(\s+SubscriptionPayment,)\n(\s+\/\/ RBAC entities)/g;
const newPattern = `$1
    CreditMarketplaceSettings,
    FeatureCreditCost,
$2`;

const newContent = content.replace(oldPattern, newPattern);

if (newContent === content) {
  console.error('✗ Failed to find pattern to replace');
  console.error('  Looking for: SubscriptionPayment, followed by // RBAC entities');
  process.exit(1);
}

// Write back
fs.writeFileSync(configPath, newContent, 'utf8');

console.log('✓ Added CreditMarketplaceSettings and FeatureCreditCost to database config');
console.log('✓ Updated both main and test configurations');
console.log('\nPlease restart your backend server for changes to take effect.');

