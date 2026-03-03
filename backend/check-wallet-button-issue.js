const { Client } = require('pg');
require('dotenv').config();

async function checkWalletButtonIssue() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'),
        database: process.env.DB_NAME || 'urutix',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Check if owner_id column exists
        console.log('📊 Checking fuel_wallets table structure...');
        const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'fuel_wallets'
            ORDER BY ordinal_position;
        `);
        
        console.log('\nFuel Wallets Table Columns:');
        console.table(columnsResult.rows);
        
        const hasOwnerId = columnsResult.rows.some(col => col.column_name === 'owner_id');
        
        if (!hasOwnerId) {
            console.log('\n❌ ISSUE FOUND: owner_id column is missing!');
            console.log('   This is why the button might not work properly.');
            console.log('\n🔧 FIX: Run the migration:');
            console.log('   node run-fuel-wallet-owner-migration.js');
        } else {
            console.log('\n✅ owner_id column exists');
        }

        // Check if there are any wallets
        console.log('\n📊 Checking existing wallets...');
        const walletsResult = await client.query(`
            SELECT id, tenant_id, driver_id, truck_id, owner_id, balance, status
            FROM fuel_wallets
            LIMIT 5;
        `);
        
        if (walletsResult.rows.length === 0) {
            console.log('ℹ️  No wallets found in database');
            console.log('   Wallets will be created automatically when users access the page');
        } else {
            console.log(`\n✅ Found ${walletsResult.rows.length} wallet(s):`);
            console.table(walletsResult.rows);
        }

        // Check if there are truck owners
        console.log('\n📊 Checking truck owners...');
        const ownersResult = await client.query(`
            SELECT u.id, u.email, u.role, COUNT(t.id) as truck_count
            FROM users u
            LEFT JOIN trucks t ON t."ownerId" = u.id
            WHERE u.role = 'TRUCK_OWNER'
            GROUP BY u.id, u.email, u.role
            LIMIT 5;
        `);
        
        if (ownersResult.rows.length === 0) {
            console.log('⚠️  No truck owners found');
            console.log('   Make sure you are logged in as a truck owner to see the button');
        } else {
            console.log(`\n✅ Found ${ownersResult.rows.length} truck owner(s):`);
            console.table(ownersResult.rows);
        }

        console.log('\n📝 Summary:');
        console.log('─────────────────────────────────────────');
        if (!hasOwnerId) {
            console.log('❌ Migration needed: owner_id column missing');
            console.log('   Run: node run-fuel-wallet-owner-migration.js');
        } else {
            console.log('✅ Database structure is correct');
        }
        
        if (ownersResult.rows.length === 0) {
            console.log('⚠️  No truck owners found in database');
            console.log('   Create a truck owner user or login as one');
        } else {
            console.log('✅ Truck owners exist in database');
        }
        
        console.log('\n🎯 To see the "Add to Wallet" button:');
        console.log('   1. Run migration if needed');
        console.log('   2. Restart backend server');
        console.log('   3. Login as a truck owner');
        console.log('   4. Navigate to Fuel Wallets page');
        console.log('   5. Button should appear next to wallet balance');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

checkWalletButtonIssue()
    .then(() => {
        console.log('\n✅ Check complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
