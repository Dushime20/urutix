const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected');

    const res = await client.query(`
      UPDATE drivers 
      SET 
        "safetyScore" = 98.5, 
        "onTimeDeliveryRate" = 96.2, 
        rating = 4.8,
        "totalTrips" = 42,
        "totalEarnings" = 12500.50
      WHERE email = 'urutidriver@gmail.com'
    `);
    console.log('Updated driver stats for urutidriver@gmail.com');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

check();
