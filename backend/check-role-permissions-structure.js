const { DataSource } = require('typeorm');
require('dotenv').config();

async function checkStructure() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'urutix',
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        
        console.log('📋 role_permissions table structure:');
        const columns = await dataSource.query(
            `SELECT column_name, data_type, is_nullable 
             FROM information_schema.columns 
             WHERE table_name = 'role_permissions' 
             ORDER BY ordinal_position`
        );
        console.table(columns);

        console.log('\n📋 roles table structure:');
        const roleColumns = await dataSource.query(
            `SELECT column_name, data_type, is_nullable 
             FROM information_schema.columns 
             WHERE table_name = 'roles' 
             ORDER BY ordinal_position`
        );
        console.table(roleColumns);

        await dataSource.destroy();
    } catch (error) {
        console.error('Error:', error.message);
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

checkStructure();
