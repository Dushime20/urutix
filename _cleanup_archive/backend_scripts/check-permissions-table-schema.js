const { DataSource } = require('typeorm');
require('dotenv').config();

async function checkSchema() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'urutix',
    });

    await dataSource.initialize();
    
    const cols = await dataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'permissions' 
        ORDER BY ordinal_position
    `);
    
    console.log('Permissions table columns:');
    cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    
    await dataSource.destroy();
}

checkSchema().catch(console.error);
