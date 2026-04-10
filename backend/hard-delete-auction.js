require('dotenv').config();
const { DataSource } = require('typeorm');

const d = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const LOAD_ID = '55387648-0bdd-4b59-8687-0178d36241d4';

async function hardDelete() {
    await d.initialize();
    
    try {
        console.log(`\nPermanently deleting auction for load: ${LOAD_ID}\n`);
        
        // Hard delete the auction
        const result = await d.query('DELETE FROM auctions WHERE "loadId" = $1 RETURNING id', [LOAD_ID]);
        
        if (result.length > 0) {
            console.log(`✅ Auction permanently deleted!`);
            console.log(`   Auction ID: ${result[0].id}\n`);
            console.log('You can now create a new auction for this load.\n');
        } else {
            console.log('❌ No auction found to delete\n');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await d.destroy();
    }
}

hardDelete().catch(console.error);
