/**
 * Check Deborah's password
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkDeborahPassword() {
    console.log('🔍 Checking password for deborahrutagengwa.admin@urutix.com...\n');

    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5433,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123',
        database: process.env.DB_NAME || 'urutix',
    });

    try {
        await client.connect();
        console.log('✅ Database connected');

        // Check user password
        const userResult = await client.query(`
            SELECT id, email, "passwordHash", role, status, "createdAt"
            FROM users 
            WHERE email = 'deborahrutagengwa.admin@urutix.com'
        `);

        if (userResult.rows.length === 0) {
            console.log('❌ User not found!');
            return;
        }

        const user = userResult.rows[0];
        console.log('📊 User Details:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Password Hash: ${user.passwordHash ? 'EXISTS' : 'NULL'}`);
        console.log(`   Password Length: ${user.passwordHash ? user.passwordHash.length : 0}`);

        // Check if password starts with bcrypt hash
        if (user.passwordHash && user.passwordHash.startsWith('$2b$')) {
            console.log('✅ Password appears to be properly hashed with bcrypt');
        } else if (user.passwordHash) {
            console.log('❌ Password does not appear to be bcrypt hashed');
        } else {
            console.log('❌ No password set for user');
        }

        await client.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
    }
}

checkDeborahPassword();