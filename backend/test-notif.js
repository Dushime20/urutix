const { DataSource } = require('typeorm');
require('dotenv').config();

const myDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'urutix',
    entities: [__dirname + '/dist/**/*.entity.js'],
});

myDataSource.initialize().then(async () => {
    const notifications = await myDataSource.query('SELECT id, title, "recipientId", "tenantId", status, category, channels, "createdAt" FROM notifications ORDER BY "createdAt" DESC LIMIT 5');
    console.log(JSON.stringify(notifications, null, 2));
    process.exit(0);
}).catch(console.error);
