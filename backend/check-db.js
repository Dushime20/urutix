require('dotenv').config();
const { DataSource } = require('typeorm');
const d = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});
d.initialize().then(async () => {
    const r = await d.query('SELECT title, "recipientId", "tenantId", count(*) as total FROM notifications GROUP BY title, "recipientId", "tenantId" ORDER BY total DESC LIMIT 5');
    console.log(JSON.stringify(r, null, 2));
}).catch(console.error).finally(() => process.exit());
