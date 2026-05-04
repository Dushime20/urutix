
require('dotenv').config();
const { DataSource } = require('typeorm');

const d = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || process.env.DB_DATABASE
});

d.initialize().then(async () => {
    console.log('--- Database KPI Diagnosis ---');
    
    const totalUsers = await d.query('SELECT COUNT(*) FROM users');
    console.log('Total Users (all):', totalUsers[0].count);
    
    const totalActiveUsers = await d.query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
    console.log('Total Active Users (not soft-deleted):', totalActiveUsers[0].count);

    const usersByTenant = await d.query(`
        SELECT "tenantId", COUNT(*) as count 
        FROM users 
        WHERE deleted_at IS NULL 
        GROUP BY "tenantId"
    `);
    console.log('\nUsers per Tenant (Active):');
    usersByTenant.forEach(t => console.log(`Tenant ${t.tenantId}: ${t.count} users`));

    const usersByRole = await d.query(`
        SELECT role, COUNT(*) as count 
        FROM users 
        WHERE deleted_at IS NULL 
        GROUP BY role
    `);
    console.log('\nUsers per Role (Active):');
    usersByRole.forEach(r => console.log(`${r.role}: ${r.count}`));

    const superAdmins = await d.query(`
        SELECT email, "tenantId" 
        FROM users 
        WHERE role = 'SUPER_ADMIN' AND deleted_at IS NULL
    `);
    console.log('\nSuper Admins:');
    superAdmins.forEach(s => console.log(`Email: ${s.email}, Tenant: ${s.tenantId}`));

}).catch(err => {
    console.error('Error connecting to DB:', err);
}).finally(() => d.destroy());
