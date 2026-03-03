const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const creditPackages = [
  {
    name: '100 Credits',
    credits: 100,
    price: 15.00,
    discount_percentage: 0,
    is_active: true,
    display_order: 1,
  },
  {
    name: '500 Credits',
    credits: 500,
    price: 60.00,
    discount_percentage: 20,
    is_active: true,
    display_order: 2,
  },
  {
    name: '1,000 Credits',
    credits: 1000,
    price: 100.00,
    discount_percentage: 33,
    is_active: true,
    display_order: 3,
  },
  {
    name: '5,000 Credits',
    credits: 5000,
    price: 400.00,
    discount_percentage: 47,
    is_active: true,
    display_order: 4,
  },
];

async function seedCreditPackages() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding credit packages...\n');

    for (const pkg of creditPackages) {
      // Check if package already exists
      const existingPkg = await client.query(
        'SELECT id FROM credit_packages WHERE credits = $1',
        [pkg.credits]
      );

      if (existingPkg.rows.length > 0) {
        console.log(`⏭️  Package "${pkg.name}" already exists, skipping...`);
        continue;
      }

      // Calculate price per credit
      const pricePerCredit = (pkg.price / pkg.credits).toFixed(4);
      const baseRate = 0.15; // 15¢ per credit
      const savings = ((pkg.credits * baseRate) - pkg.price).toFixed(2);

      // Insert package
      const result = await client.query(
        `INSERT INTO credit_packages 
        (name, credits, price, discount_percentage, is_active, display_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          pkg.name,
          pkg.credits,
          pkg.price,
          pkg.discount_percentage,
          pkg.is_active,
          pkg.display_order,
        ]
      );

      console.log(`✅ Created package: ${pkg.name}`);
      console.log(`   - Price: $${pkg.price}`);
      console.log(`   - Per Credit: $${pricePerCredit}`);
      console.log(`   - Discount: ${pkg.discount_percentage}%`);
      console.log(`   - Savings: $${savings}`);
      console.log(`   - ID: ${result.rows[0].id}\n`);
    }

    console.log('✨ Credit packages seeded successfully!\n');

    // Display summary
    const summary = await client.query(
      'SELECT name, credits, price, discount_percentage FROM credit_packages ORDER BY display_order'
    );

    console.log('📊 Summary of Credit Packages:');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('Package          | Credits | Price    | Per Credit | Discount');
    console.log('═══════════════════════════════════════════════════════════════════');
    summary.rows.forEach((pkg) => {
      const perCredit = (pkg.price / pkg.credits).toFixed(4);
      console.log(
        `${pkg.name.padEnd(16)} | ${pkg.credits.toString().padEnd(7)} | $${pkg.price.toString().padEnd(7)} | $${perCredit.padEnd(9)} | ${pkg.discount_percentage}%`
      );
    });
    console.log('═══════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding credit packages:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed function
seedCreditPackages()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
