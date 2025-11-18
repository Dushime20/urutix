#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_DATABASE || 'urutix',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
};

async function checkAndUpdateUserStatus() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔍 Checking driver user status...');
    
    // Check current status
    const userResult = await pool.query(
      'SELECT id, email, role, status, "tenantId" FROM users WHERE email = $1',
      ['driver.test@example.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('Current user:', user);
    
    // Update status to ACTIVE if not already
    if (user.status !== 'ACTIVE') {
      console.log('🔄 Updating user status to ACTIVE...');
      
      await pool.query(
        'UPDATE users SET status = $1, "updatedAt" = NOW() WHERE id = $2',
        ['ACTIVE', user.id]
      );
      
      console.log('✅ User status updated to ACTIVE');
      
      // Verify the update
      const updatedResult = await pool.query(
        'SELECT id, email, role, status FROM users WHERE id = $1',
        [user.id]
      );
      console.log('Updated user:', updatedResult.rows[0]);
    } else {
      console.log('✅ User is already ACTIVE');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndUpdateUserStatus();
