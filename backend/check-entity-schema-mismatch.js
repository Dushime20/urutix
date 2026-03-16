/**
 * Check Entity Schema Mismatch
 * Compare entity columns with database columns
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function checkEntitySchemaMismatch() {
    console.log('🔍 Checking entity schema mismatch...\n');

    const pool = new Pool({
        host: '127.0.0.1',
        port: 5433,
        database: 'urutix',
        user: 'postgres',
        password: '123',
    });

    try {
        // Get database columns
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'tenants' 
            ORDER BY ordinal_position
        `);
        
        const dbColumns = result.rows.map(row => row.column_name);
        console.log('📋 Database columns:', dbColumns.length);
        
        // Read entity file
        const entityPath = path.join(__dirname, 'src/entities/tenant.entity.ts');
        const entityContent = fs.readFileSync(entityPath, 'utf8');
        
        // Extract @Column decorators (simple regex)
        const columnMatches = entityContent.match(/@Column\([^)]*\)\s*(\w+):/g);
        const entityColumns = [];
        
        if (columnMatches) {
            columnMatches.forEach(match => {
                const columnName = match.match(/(\w+):$/)[1];
                entityColumns.push(columnName);
            });
        }
        
        // Also check for special columns
        const specialColumns = ['id', 'createdAt', 'updatedAt', 'deletedAt'];
        entityColumns.push(...specialColumns);
        
        console.log('📋 Entity columns:', entityColumns.length);
        
        // Find mismatches
        const missingInDb = entityColumns.filter(col => !dbColumns.includes(col) && col !== 'deletedAt' && !dbColumns.includes('deleted_at'));
        const extraInDb = dbColumns.filter(col => !entityColumns.includes(col) && col !== 'deleted_at');
        
        console.log('\n❌ Columns in entity but missing in database:');
        missingInDb.forEach(col => console.log(`  - ${col}`));
        
        console.log('\n➕ Columns in database but not in entity:');
        extraInDb.forEach(col => console.log(`  - ${col}`));
        
        // Check for snake_case vs camelCase issues
        console.log('\n🐍 Potential snake_case vs camelCase issues:');
        entityColumns.forEach(entityCol => {
            const snakeCase = entityCol.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (dbColumns.includes(snakeCase) && !dbColumns.includes(entityCol)) {
                console.log(`  - Entity: ${entityCol} -> DB: ${snakeCase}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkEntitySchemaMismatch();