const { Client } = require('pg');
require('dotenv').config();

async function checkUsersTable() {
    const client = new Client({
        host: '127.0.0.1', port: 5433, user: 'postgres', password: '123', database: 'urutix'
    });
    
    try {
        await client.connect();
        const result = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        console.log('Users table columns:', result.rows.map(r => r.column_name).join(', '));
        await client.end();
    } catch (error) {
        console.error('Error:', error.message);
        await client.end();
    }
}

checkUsersTable();