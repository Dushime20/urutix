/**
 * Populate Sample Analytics Data
 * 
 * Creates sample analytics data for testing the analytics system
 */

const { Client } = require('pg');
require('dotenv').config();

async function populateSampleData() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get a cargo owner user
    const userResult = await client.query(`
      SELECT id, "tenantId" 
      FROM users 
      WHERE role = 'CARGO_OWNER' 
      LIMIT 1
    `);

    let cargoOwnerId, tenantId;
    
    if (userResult.rows.length === 0) {
      console.log('No CARGO_OWNER found, creating sample user...');
      
      // Create a sample cargo owner
      const createUserResult = await client.query(`
        INSERT INTO users (id, "tenantId", email, "passwordHash", role, "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          '00000000-0000-0000-0000-000000000001',
          'sample.cargoowner@urutix.com',
          '$2b$10$sample.hash.for.testing.purposes.only',
          'CARGO_OWNER',
          NOW(),
          NOW()
        )
        RETURNING id, "tenantId"
      `);
      
      cargoOwnerId = createUserResult.rows[0].id;
      tenantId = createUserResult.rows[0].tenantId;
      console.log('✅ Created sample cargo owner:', cargoOwnerId);
    } else {
      cargoOwnerId = userResult.rows[0].id;
      tenantId = userResult.rows[0].tenantId;
      console.log('✅ Using existing cargo owner:', cargoOwnerId);
    }

    // Generate sample analytics data
    console.log('\n📊 Generating Sample Analytics Data...');
    console.log('=====================================');

    const sampleData = [];
    const cities = [
      { name: 'Lagos', state: 'Lagos' },
      { name: 'Abuja', state: 'FCT' },
      { name: 'Kano', state: 'Kano' },
      { name: 'Port Harcourt', state: 'Rivers' },
      { name: 'Ibadan', state: 'Oyo' },
      { name: 'Kaduna', state: 'Kaduna' },
      { name: 'Benin City', state: 'Edo' },
      { name: 'Jos', state: 'Plateau' }
    ];

    const cargoTypes = ['Electronics', 'Food Products', 'Textiles', 'Machinery', 'Raw Materials', 'Consumer Goods'];
    const carriers = ['FastTrack Logistics', 'Swift Transport', 'Reliable Cargo', 'Express Delivery', 'Prime Movers'];

    // Generate 50 sample records over the last 6 months
    for (let i = 0; i < 50; i++) {
      const origin = cities[Math.floor(Math.random() * cities.length)];
      const destination = cities[Math.floor(Math.random() * cities.length)];
      
      // Ensure origin and destination are different
      if (origin.name === destination.name) continue;

      const cargoType = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
      const carrier = carriers[Math.floor(Math.random() * carriers.length)];
      
      // Random date within last 6 months
      const bookingDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
      
      // Calculate distance (simplified - between 100-800 km)
      const distanceKm = Math.floor(Math.random() * 700) + 100;
      
      // Calculate weight (between 500kg - 10,000kg)
      const cargoWeightKg = Math.floor(Math.random() * 9500) + 500;
      
      // Calculate cost based on distance and weight with some randomness
      const baseCostPerKm = 50 + Math.random() * 30; // 50-80 NGN per km
      const baseCostPerKg = 5 + Math.random() * 10; // 5-15 NGN per kg
      const totalCost = Math.floor((distanceKm * baseCostPerKm) + (cargoWeightKg * baseCostPerKg));
      
      // Calculate derived metrics
      const costPerKm = totalCost / distanceKm;
      const costPerKg = totalCost / cargoWeightKg;
      
      // Random delivery performance
      const onTimeDelivery = Math.random() > 0.2; // 80% on-time rate
      const estimatedTransitHours = Math.floor(distanceKm / 50) + Math.floor(Math.random() * 12); // ~50km/h + random delay
      const actualTransitHours = onTimeDelivery ? 
        estimatedTransitHours + Math.floor(Math.random() * 6) : 
        estimatedTransitHours + Math.floor(Math.random() * 24) + 6;
      
      // Determine season
      const month = bookingDate.getMonth();
      let season;
      if (month >= 2 && month <= 4) season = 'dry';
      else if (month >= 5 && month <= 10) season = 'rainy';
      else season = 'harmattan';
      
      // Calculate profit margin (simplified)
      const estimatedRevenue = totalCost * (1.1 + Math.random() * 0.3); // 10-40% markup
      const profitMargin = ((estimatedRevenue - totalCost) / estimatedRevenue) * 100;

      sampleData.push({
        tenantId,
        cargoOwnerId,
        loadId: null, // We'll generate UUIDs in the query
        routeHash: `${origin.name.toLowerCase().replace(' ', '_')}_to_${destination.name.toLowerCase().replace(' ', '_')}`,
        originCity: origin.name,
        originState: origin.state,
        destinationCity: destination.name,
        destinationState: destination.state,
        cargoType,
        cargoWeightKg,
        distanceKm,
        totalCost,
        costPerKm: Math.round(costPerKm * 100) / 100,
        costPerKg: Math.round(costPerKg * 100) / 100,
        carrierId: carrier,
        bookingDate,
        estimatedTransitHours,
        actualTransitHours,
        onTimeDelivery,
        season,
        profitMargin: Math.round(profitMargin * 100) / 100,
      });
    }

    // Insert sample data
    let insertedCount = 0;
    for (const data of sampleData) {
      try {
        await client.query(`
          INSERT INTO cargo_owner_analytics (
            id, tenant_id, cargo_owner_id, load_id, route_hash,
            origin_city, destination_city, cargo_type, cargo_weight_kg, 
            distance_km, total_cost, cost_per_km, cost_per_kg, 
            carrier_id, booking_date, planned_transit_hours, actual_transit_hours, 
            on_time_delivery, season, profit_margin, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, gen_random_uuid(), $3,
            $4, $5, $6, $7, $8, $9, $10, $11,
            gen_random_uuid(), $12, $13, $14, $15, $16, $17, NOW(), NOW()
          )
        `, [
          data.tenantId, data.cargoOwnerId, data.routeHash,
          data.originCity, data.destinationCity, data.cargoType, data.cargoWeightKg, 
          data.distanceKm, data.totalCost, data.costPerKm, data.costPerKg,
          data.bookingDate, data.estimatedTransitHours, data.actualTransitHours, 
          data.onTimeDelivery, data.season, data.profitMargin
        ]);
        
        insertedCount++;
      } catch (error) {
        console.error(`Failed to insert record ${insertedCount + 1}:`, error.message);
      }
    }

    console.log(`✅ Inserted ${insertedCount} analytics records`);

    // Generate some sample insights
    console.log('\n🧠 Generating Sample Insights...');
    console.log('=================================');

    const sampleInsights = [
      {
        insightType: 'cost_optimization',
        title: 'High-Cost Route Identified',
        description: 'Lagos to Abuja route shows 25% higher costs than market average. Consider alternative carriers or route optimization.',
        confidenceScore: 0.85,
        potentialImpact: JSON.stringify({
          costSavings: 150000,
          currency: 'NGN'
        }),
        recommendations: JSON.stringify([
          {
            action: 'Negotiate better rates with current carrier',
            priority: 'high',
            effort: 'medium',
            timeline: '2 weeks',
            steps: ['Contact carrier account manager', 'Present volume data', 'Negotiate bulk discount']
          }
        ]),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        insightType: 'carrier_recommendation',
        title: 'Carrier Performance Analysis',
        description: 'Swift Transport shows 95% on-time delivery rate and 15% lower costs for Electronics shipments.',
        confidenceScore: 0.92,
        potentialImpact: JSON.stringify({
          costSavings: 75000,
          timeReduction: 4,
          currency: 'NGN'
        }),
        recommendations: JSON.stringify([
          {
            action: 'Increase allocation to Swift Transport for Electronics',
            priority: 'medium',
            effort: 'low',
            timeline: 'Immediate',
            steps: ['Contact Swift Transport', 'Verify capacity', 'Update preferred carrier list']
          }
        ]),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      }
    ];

    let insightsInserted = 0;
    for (const insight of sampleInsights) {
      try {
        await client.query(`
          INSERT INTO analytics_insights (
            id, tenant_id, cargo_owner_id, insight_type, title, description,
            confidence_score, potential_impact, recommendations, status,
            expires_at, metadata, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, '{}', NOW(), NOW()
          )
        `, [
          tenantId, cargoOwnerId, insight.insightType, insight.title, insight.description,
          insight.confidenceScore, insight.potentialImpact, insight.recommendations, insight.expiresAt
        ]);
        
        insightsInserted++;
      } catch (error) {
        console.error(`Failed to insert insight ${insightsInserted + 1}:`, error.message);
      }
    }

    console.log(`✅ Inserted ${insightsInserted} sample insights`);

    // Display summary
    console.log('\n📊 Sample Data Summary:');
    console.log('=======================');
    console.log(`Cargo Owner ID: ${cargoOwnerId}`);
    console.log(`Tenant ID: ${tenantId}`);
    console.log(`Analytics Records: ${insertedCount}`);
    console.log(`Insights: ${insightsInserted}`);
    console.log(`Date Range: Last 6 months`);
    console.log(`Cities: ${cities.map(c => c.name).join(', ')}`);
    console.log(`Cargo Types: ${cargoTypes.join(', ')}`);

    console.log('\n🎉 Sample data population complete!');
    console.log('💡 You can now test the analytics endpoints with real data.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

populateSampleData();