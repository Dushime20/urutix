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

async function check() {
    await d.initialize();
    
    try {
        console.log(`\nChecking load: ${LOAD_ID}\n`);
        
        // Check if load exists
        const load = await d.query('SELECT * FROM loads WHERE id = $1', [LOAD_ID]);
        console.log('Load exists:', load.length > 0);
        if (load.length > 0) {
            console.log('Load status:', load[0].status);
            console.log('Load owner:', load[0].cargoOwnerId || load[0].cargo_owner_id);
        }
        
        // Check for any auction (including soft-deleted)
        const auctions = await d.query('SELECT * FROM auctions WHERE "loadId" = $1', [LOAD_ID]);
        console.log('\nAuctions found:', auctions.length);
        if (auctions.length > 0) {
            auctions.forEach(a => {
                console.log('\nAuction:', {
                    id: a.id,
                    status: a.status,
                    deleted: a.deleted_at ? 'YES' : 'NO',
                    created: a.createdAt
                });
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await d.destroy();
    }
}

check().catch(console.error);
