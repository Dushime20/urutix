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
    const n = await d.query('SELECT title, "recipientId", "tenantId", status, category, is_read as "isRead", "createdAt" FROM notifications ORDER BY "createdAt" DESC LIMIT 1');
    console.log("LAST NOTIFICATION:");
    console.log(JSON.stringify(n, null, 2));
    
    if (n.length > 0) {
        const u = await d.query('SELECT id, email, "tenantId" FROM users WHERE id = ', [n[0].recipientId]);
        console.log("RECIPIENT USER:");
        console.log(JSON.stringify(u, null, 2));
    }
}).catch(console.error).finally(() => process.exit());
