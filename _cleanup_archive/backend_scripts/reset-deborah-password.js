/**
 * Reset Deborah's password to Admin@123
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetDeborahPassword() {
    console.log('🔧 Resetting password for deborahrutagengwa.admin@urutix.com...\n');

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

        // Hash the new password
        const newPassword = 'Admin@123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        console.log('🔐 Password hashed successfully');

        // Update the user's password
        const updateResult = await client.query(`
            UPDATE users 
            SET 
                "passwordHash" = $1,
                "updatedAt" = NOW(),
                "loginAttempts" = 0,
                "lockedUntil" = NULL
            WHERE email = 'deborahrutagengwa.admin@urutix.com'
        `, [hashedPassword]);

        if (updateResult.rowCount > 0) {
            console.log('✅ Password updated successfully');
            console.log(`✅ New password: ${newPassword}`);
            
            // Verify the update
            const verifyResult = await client.query(`
                SELECT email, "passwordHash", "updatedAt"
                FROM users 
                WHERE email = 'deborahrutagengwa.admin@urutix.com'
            `);

            if (verifyResult.rows.length > 0) {
                const user = verifyResult.rows[0];
                console.log('📊 Verification:');
                console.log(`   Email: ${user.email}`);
                console.log(`   Password Hash Length: ${user.passwordHash.length}`);
                console.log(`   Updated At: ${user.updatedAt}`);
                console.log(`   Hash starts with $2b$: ${user.passwordHash.startsWith('$2b$')}`);
            }
        } else {
            console.log('❌ No user found to update');
        }

        await client.end();
        console.log('\n🎉 Password reset complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
    }
}

resetDeborahPassword();