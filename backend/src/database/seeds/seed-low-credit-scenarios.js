#!/usr/bin/env node

/**
 * ⚡ LOW CREDIT SCENARIO SEEDER
 * 
 * This script creates truck owners with low balances to test the 
 * "Low Credit Partner" notification system.
 */

const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix_database',
    user: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
});

function generateUUID() {
    return uuidv4();
}

async function getOrCreateTenant() {
    const result = await pool.query(
        'SELECT id FROM tenants WHERE subdomain = $1 LIMIT 1',
        ['isimbiruti']
    );

    if (result.rows.length > 0) {
        return result.rows[0].id;
    }

    const tenantId = generateUUID();
    await pool.query(`
    INSERT INTO tenants (id, name, subdomain, "isActive", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, NOW(), NOW())
  `, [tenantId, 'Deborah Ruta', 'isimbiruti', true]);

    return tenantId;
}

async function createLowCreditUser(email, companyName, balance, tenantId) {
    const names = companyName.split(' ');
    const firstName = names[0] || 'Truck';
    const lastName = names[1] || 'Owner';

    // 1. Get or Create User
    let userId;
    const userRes = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND "tenantId" = $2 AND role = $3',
        [email, tenantId, 'TRUCK_OWNER']
    );

    if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
        await pool.query(
            'UPDATE users SET status = $1, "updatedAt" = NOW() WHERE id = $2',
            ['ACTIVE', userId]
        );
    } else {
        userId = generateUUID();
        const passwordHash = await bcrypt.hash('test123', 10);
        await pool.query(`
            INSERT INTO users (
                id, email, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [userId, email, passwordHash, 'TRUCK_OWNER', 'ACTIVE', tenantId]);
    }

    // 2. Get or Create Profile
    const profileRes = await pool.query('SELECT id FROM user_profiles WHERE "userId" = $1', [userId]);
    if (profileRes.rows.length > 0) {
        await pool.query(`
            UPDATE user_profiles 
            SET "companyName" = $1, "firstName" = $2, "lastName" = $3, "updatedAt" = NOW() 
            WHERE "userId" = $4
        `, [companyName, firstName, lastName, userId]);
    } else {
        await pool.query(`
            INSERT INTO user_profiles (
                id, "userId", "tenantId", "companyName", "firstName", "lastName", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [generateUUID(), userId, tenantId, companyName, firstName, lastName]);
    }

    // 3. Get or Create Credit Account
    const accountRes = await pool.query(
        'SELECT id FROM credit_accounts WHERE user_id = $1 AND tenant_id = $2',
        [userId, tenantId]
    );

    if (accountRes.rows.length > 0) {
        await pool.query(`
            UPDATE credit_accounts 
            SET current_balance = $1, updated_at = NOW() 
            WHERE user_id = $2 AND tenant_id = $3
        `, [balance, userId, tenantId]);
    } else {
        await pool.query(`
            INSERT INTO credit_accounts (
                id, tenant_id, user_id, current_balance, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [generateUUID(), tenantId, userId, balance]);
    }

    console.log(`✅ User: ${email} | Company: ${companyName} | Balance: ${balance} TRX`);
    return userId;
}

async function seedLowCredits() {
    console.log('⚡ Starting Low Credit Scenario Seeding...\n');

    try {
        const tenantId = await getOrCreateTenant();
        console.log(`🏢 Tenant: Deborah Ruta (${tenantId})\n`);

        // Scenario 1: Critical (Very Low)
        await createLowCreditUser(
            'risk.partner1@isimbiruti.com',
            'Rapid Logistics Ltd',
            240,
            tenantId
        );

        // Scenario 2: Low (Warning)
        await createLowCreditUser(
            'risk.partner2@isimbiruti.com',
            'East Africa Haulers',
            1200,
            tenantId
        );

        // Scenario 3: Near Threshold
        await createLowCreditUser(
            'risk.partner3@isimbiruti.com',
            'Mombasa Road Movers',
            4500,
            tenantId
        );

        // Scenario 4: Healthy (Should not appear in low credit list)
        await createLowCreditUser(
            'healthy.partner@isimbiruti.com',
            'Sunshine Trucking',
            25000,
            tenantId
        );

        console.log('\n🎉 Seed completed! You can now test the notification triggers.');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        await pool.end();
    }
}

seedLowCredits();
