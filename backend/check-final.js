require('dotenv').config();
const { DataSource } = require('typeorm');
const d = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'urutix'
});
d.initialize().then(async () => {
    const cargoOwners = await d.query("SELECT id, email, role, \"tenantId\" FROM users WHERE role = 'CARGO_OWNER' AND status = 'ACTIVE'");
    const lastNotifications = await d.query('SELECT title, "recipientId", "tenantId", status, category, is_read as "isRead", "createdAt" FROM notifications ORDER BY "createdAt" DESC LIMIT 5');
    
    console.log("CARGO OWNERS:");
    console.log(JSON.stringify(cargoOwners, null, 2));
    console.log("RECENT NOTIFICATIONS:");
    console.log(JSON.stringify(lastNotifications, null, 2));
}).catch(console.error).finally(() => process.exit());
