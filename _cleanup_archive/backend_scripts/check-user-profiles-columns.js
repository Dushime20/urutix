const { Client } = require('pg');
require('dotenv').config();

async function checkUserProfilesSchema() {
    const client = new Client({
        host: '127.0.0.1',
        port: 5433,
        user: 'postgres',
        password: '123',
        database: 'urutix',
    });

    try {
        await client.connect();
        console.log('Checking user_profiles table schema...');
        
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_profiles' 
            ORDER BY ordinal_position
        `);
        
        console.log('User_profiles table columns:');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });
        
        await client.end();
    } catch (error) {
        console.error('Error:', error.message);
        await client.end();
    }
}

checkUserProfilesSchema();