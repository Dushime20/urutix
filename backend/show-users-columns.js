const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix_db'
});

dataSource.initialize().then(async () => {
  console.log('\n=== USERS TABLE COLUMNS ===\n');
  
  const result = await dataSource.query(`
    SELECT 
      column_name, 
      data_type, 
      character_maximum_length,
      is_nullable, 
      column_default 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position
  `);
  
  console.log('Column Name'.padEnd(35) + 'Data Type'.padEnd(25) + 'Nullable'.padEnd(12) + 'Default');
  console.log('-'.repeat(100));
  
  result.forEach(col => {
    const dataType = col.character_maximum_length 
      ? `${col.data_type}(${col.character_maximum_length})`
      : col.data_type;
    console.log(
      col.column_name.padEnd(35) + 
      dataType.padEnd(25) + 
      col.is_nullable.padEnd(12) + 
      (col.column_default || 'NULL')
    );
  });
  
  console.log('\nTotal columns:', result.length);
  
  await dataSource.destroy();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
