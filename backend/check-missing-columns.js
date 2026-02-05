const { Client } = require('pg');
require('dotenv').config();

async function checkMissingColumns() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log(`📊 Database: ${process.env.DB_NAME || 'urutix'} on port ${process.env.DB_PORT || 5432}`);
    console.log('');

    // Get all columns from loads table
    const result = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'loads'
    `);

    const existingColumns = result.rows.map(row => row.column_name);

    // Expected columns from the entity
    const expectedColumns = [
      'id', 'tenantId', 'cargoOwnerId', 'receiverId', 'brokerId',
      'brokerCommissionRate', 'brokerCommissionAmount', 'reference',
      'title', 'description', 'weight', 'volume',
      'loadType', 'equipmentType', 'cargoType', 'visibility',
      'unitsRequired', 'locations', 'origin', 'destination',
      'pickupWindow', 'deliveryWindow', 'pickupDate', 'deliveryDate',
      'status', 'loadValue', 'offeredPrice', 'currencyCode',
      'pricing', 'paymentTerms', 'invitedCarriers',
      'isFragile', 'isHazardous', 'requiresRefrigeration',
      'contactInfo', 'autoMatchEnabled', 'matchingCriteria',
      'publishedAt', 'assignedTruckId', 'assignedCarrierId',
      'rating', 'viewCount',
      'length', 'width', 'height', 'stackableHeight', 'isStackable',
      'temperatureMin', 'temperatureMax', 'requiresHumidityControl',
      'requiresForklift', 'requiresCrane', 'requiresLoadingDock',
      'loadingTimeEstimate', 'unloadingTimeEstimate',
      'hazmatClass', 'hazmatNumber', 'urgencyLevel',
      'isTimeCritical', 'maxTransitTime',
      'packagingType', 'numberOfPieces', 'numberOfPallets',
      'requiresGpsMonitoring', 'requiresTemperatureMonitoring',
      'insuranceValue', 'requiresLowClearanceRoute',
      'maxClearanceHeight', 'requiresEscortVehicle',
      'specialHandlingInstructions', 'loadingInstructions',
      'unloadingInstructions', 'emergencyContactInfo',
      'truckRequirements', 'carrierPreferences', 'costPreferences',
      'requiresPreShipmentInspection', 'requiresDeliveryInspection',
      'requiresPhotographicDocumentation',
      'metadata',
      'createdAt', 'updatedAt', 'deleted_at'
    ];

    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));

    console.log('🔍 Missing Columns Analysis:');
    console.log('─'.repeat(80));
    console.log(`Total expected columns: ${expectedColumns.length}`);
    console.log(`Total existing columns: ${existingColumns.length}`);
    console.log(`Missing columns: ${missingColumns.length}`);
    console.log('');

    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:');
      missingColumns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col}`);
      });
      console.log('');
      console.log('📝 Action needed: Create a migration to add these columns');
    } else {
      console.log('✅ All expected columns exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkMissingColumns();
