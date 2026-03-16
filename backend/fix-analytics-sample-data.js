/**
 * Fix Analytics Sample Data Population
 * 
 * Creates sample analytics data that references existing loads instead of generating random UUIDs
 */

const { Client } = require('pg');
require('dotenv').config();

async function fixAnalyticsSampleData() {
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

    // First, clear existing analytics data to avoid conflicts
    console.log('🧹 Clearing existing analytics data...');
    await client.query('DELETE FROM analytics_insights');
    await client.query('DELETE FROM cargo_owner_analytics');
    console.log('✅ Cleared existing analytics data');

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
      
      // Get a tenant to use
      const tenantResult = await client.query('SELECT id FROM tenants LIMIT 1');
      if (tenantResult.rows.length === 0) {
        throw new Error('No tenants found in database. Please create a tenant first.');
      }
      tenantId = tenantResult.rows[0].id;
      
      // Create a sample cargo owner
      const createUserResult = await client.query(`
        INSERT INTO users (id, "tenantId", email, "passwordHash", role, "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          $1,
          'sample.cargoowner@urutix.com',
          '$2b$10$sample.hash.for.testing.purposes.only',
          'CARGO_OWNER',
          NOW(),
          NOW()
        )
        RETURNING id, "tenantId"
      `, [tenantId]);
      
      cargoOwnerId = createUserResult.rows[0].id;
      tenantId = createUserResult.rows[0].tenantId;
      console.log('✅ Created sample cargo owner:', cargoOwnerId);
    } else {
      cargoOwnerId = userResult.rows[0].id;
      tenantId = userResult.rows[0].tenantId;
      console.log('✅ Using existing cargo owner:', cargoOwnerId);
    }

    // Check if we have existing loads to reference
    const existingLoadsResult = await client.query(`
      SELECT id, "tenantId", locations, "cargoType", weight, 
             "loadValue", "createdAt", status
      FROM loads 
      WHERE "tenantId" = $1 
      LIMIT 20
    `, [tenantId]);

    let loadsToReference = existingLoadsResult.rows;
    
    console.log(`✅ Found ${loadsToReference.length} existing loads to reference`);
    
    // If we have very few loads, we'll still generate analytics data
    // but we'll create more diverse sample data

    // Now generate analytics data referencing real loads
    console.log('\n📊 Generating Analytics Data with Real Load References...');
    console.log('=======================================================');

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

    const carriers = ['FastTrack Logistics', 'Swift Transport', 'Reliable Cargo', 'Express Delivery', 'Prime Movers'];

    let insertedCount = 0;
    
    // Generate analytics data for each load (or create synthetic data if few loads)
    const minRecords = 30; // Ensure we have enough data for meaningful analytics
    const recordsToGenerate = Math.max(loadsToReference.length, minRecords);
    
    for (let i = 0; i < recordsToGenerate; i++) {
      try {
        // Use existing load data if available, otherwise generate synthetic data
        let loadId, originCity, destinationCity, cargoType, cargoWeightKg, loadValue, bookingDate;
        
        if (i < loadsToReference.length) {
          // Use real load data
          const load = loadsToReference[i];
          loadId = load.id;
          cargoType = load.cargoType || 'General Cargo';
          cargoWeightKg = load.weight || (Math.floor(Math.random() * 9500) + 500);
          loadValue = load.loadValue || (Math.floor(Math.random() * 500000) + 50000);
          bookingDate = load.createdAt || new Date();
          
          // Extract cities from locations JSONB if available
          if (load.locations && Array.isArray(load.locations) && load.locations.length >= 2) {
            const pickup = load.locations.find(loc => loc.type === 'pickup') || load.locations[0];
            const delivery = load.locations.find(loc => loc.type === 'delivery') || load.locations[1];
            originCity = pickup?.address?.city || cities[Math.floor(Math.random() * cities.length)].name;
            destinationCity = delivery?.address?.city || cities[Math.floor(Math.random() * cities.length)].name;
          } else {
            // Fallback to random cities
            originCity = cities[Math.floor(Math.random() * cities.length)].name;
            destinationCity = cities[Math.floor(Math.random() * cities.length)].name;
          }
        } else {
          // Generate synthetic data for additional records
          loadId = null; // Will be handled as synthetic data
          const origin = cities[Math.floor(Math.random() * cities.length)];
          const destination = cities[Math.floor(Math.random() * cities.length)];
          originCity = origin.name;
          destinationCity = destination.name;
          cargoType = ['Electronics', 'Food Products', 'Textiles', 'Machinery', 'Raw Materials', 'Consumer Goods'][Math.floor(Math.random() * 6)];
          cargoWeightKg = Math.floor(Math.random() * 9500) + 500;
          loadValue = Math.floor(Math.random() * 500000) + 50000;
          bookingDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
        }
        
        // Ensure origin and destination are different
        if (originCity === destinationCity) {
          destinationCity = cities[Math.floor(Math.random() * cities.length)].name;
        }
        
        // Calculate distance (simplified - between 100-800 km)
        const distanceKm = Math.floor(Math.random() * 700) + 100;
        
        // Calculate cost based on distance and weight with some randomness
        const baseCostPerKm = 50 + Math.random() * 30; // 50-80 NGN per km
        const baseCostPerKg = 5 + Math.random() * 10; // 5-15 NGN per kg
        const totalCost = Math.floor((distanceKm * baseCostPerKm) + (cargoWeightKg * baseCostPerKg));
        
        // Calculate derived metrics
        const costPerKm = totalCost / distanceKm;
        const costPerKg = totalCost / cargoWeightKg;
        
        // Random delivery performance
        const onTimeDelivery = Math.random() > 0.2; // 80% on-time rate
        const estimatedTransitHours = Math.floor(distanceKm / 50) + Math.floor(Math.random() * 12);
        const actualTransitHours = onTimeDelivery ? 
          estimatedTransitHours + Math.floor(Math.random() * 6) : 
          estimatedTransitHours + Math.floor(Math.random() * 24) + 6;
        
        // Determine season based on load creation date
        const month = new Date(bookingDate).getMonth();
        let season;
        if (month >= 2 && month <= 4) season = 'dry';
        else if (month >= 5 && month <= 10) season = 'rainy';
        else season = 'harmattan';
        
        // Calculate profit margin (simplified)
        const estimatedRevenue = loadValue || (totalCost * (1.1 + Math.random() * 0.3));
        const profitMargin = ((estimatedRevenue - totalCost) / estimatedRevenue) * 100;

        // Generate route hash
        const routeHash = `${originCity.toLowerCase().replace(/\s+/g, '_')}_to_${destinationCity.toLowerCase().replace(/\s+/g, '_')}`;
        
        // For now, use NULL for carrier_id since we don't have a carriers table
        // In a real implementation, this would reference actual carrier records
        const carrierId = null; // Will be NULL in database

        await client.query(`
          INSERT INTO cargo_owner_analytics (
            id, tenant_id, cargo_owner_id, load_id, route_hash,
            origin_city, destination_city, cargo_type, cargo_weight_kg, 
            distance_km, total_cost, cost_per_km, cost_per_kg, 
            carrier_id, booking_date, planned_transit_hours, actual_transit_hours, 
            on_time_delivery, season, profit_margin, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
          )
        `, [
          tenantId, cargoOwnerId, loadId, routeHash,
          originCity, destinationCity, cargoType, cargoWeightKg, 
          distanceKm, totalCost, Math.round(costPerKm * 100) / 100, Math.round(costPerKg * 100) / 100,
          carrierId, bookingDate, estimatedTransitHours, actualTransitHours, 
          onTimeDelivery, season, Math.round(profitMargin * 100) / 100
        ]);
        
        insertedCount++;
      } catch (error) {
        console.error(`Failed to insert analytics record ${insertedCount + 1}:`, error.message);
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
    console.log(`Referenced Loads: ${loadsToReference.length}`);
    console.log(`Generated Records: ${recordsToGenerate}`);
    console.log(`Analytics Records: ${insertedCount}`);
    console.log(`Insights: ${insightsInserted}`);
    console.log(`Date Range: Based on existing load dates`);

    console.log('\n🎉 Analytics sample data population complete!');
    console.log('💡 You can now test the analytics endpoints with real data.');

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

fixAnalyticsSampleData();