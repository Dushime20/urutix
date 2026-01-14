const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'urutix',
});

async function seedBrokerUsers() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Get a tenant ID (use the first available tenant)
    const tenantResult = await client.query('SELECT id FROM tenants LIMIT 1');
    if (tenantResult.rows.length === 0) {
      console.error('No tenants found. Please create a tenant first.');
      return;
    }
    const tenantId = tenantResult.rows[0].id;

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Broker users to seed
    const brokers = [
      {
        id: '1a4c09d0-e660-4788-a803-38ee1e2c26bd',
        email: 'urutibroker@gmail.com',
        phone: '0794716442',
        firstName: 'John',
        lastName: 'Broker',
        role: 'BROKER',
        status: 'ACTIVE'
      },
      {
        id: '2b5d19e1-f771-5899-b914-49ff2f3d37ce',
        email: 'broker2@urutix.com',
        phone: '0794716443',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'BROKER',
        status: 'ACTIVE'
      },
      {
        id: '3c6e29f2-0882-4900-9025-50003040e48d',
        email: 'broker3@urutix.com',
        phone: '0794716444',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'BROKER',
        status: 'ACTIVE'
      }
    ];

    for (const broker of brokers) {
      // Check if user already exists
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [broker.email]);
      
      if (existingUser.rows.length > 0) {
        console.log(`Broker ${broker.email} already exists, updating role...`);
        await client.query(
          'UPDATE users SET role = $1 WHERE email = $2',
          ['BROKER', broker.email]
        );
      } else {
        console.log(`Creating broker: ${broker.email}`);
        await client.query(`
          INSERT INTO users (
            id, "tenantId", email, phone, "passwordHash", role, status, 
            "createdAt", "updatedAt", "totalCommissionEarned"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), 0)
        `, [
          broker.id,
          tenantId,
          broker.email,
          broker.phone,
          hashedPassword,
          broker.role,
          broker.status
        ]);
      }
    }

    console.log('✅ Broker users seeded successfully!');
    console.log('Login credentials:');
    brokers.forEach(broker => {
      console.log(`- ${broker.email} / password123`);
    });

  } catch (error) {
    console.error('Error seeding broker users:', error);
  } finally {
    await client.end();
  }
}

seedBrokerUsers();