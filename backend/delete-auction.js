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

const LOAD_ID = process.argv[2]; // Pass load ID as argument

async function deleteAuction() {
    await d.initialize();
    
    try {
        if (!LOAD_ID) {
            console.log('\n=== ALL AUCTIONS ===\n');
            const auctions = await d.query(`
                SELECT a.id, a."loadId", a.status, a."auctionType", a."auctionStart", a."auctionEnd",
                       l.origin, l.destination, l."cargoType"
                FROM auctions a
                LEFT JOIN loads l ON a."loadId" = l.id
                WHERE a.deleted_at IS NULL
                ORDER BY a."createdAt" DESC
            `);
            
            if (auctions.length === 0) {
                console.log('No auctions found\n');
            } else {
                auctions.forEach(a => {
                    console.log(`Auction ID: ${a.id}`);
                    console.log(`Load ID: ${a.loadId}`);
                    console.log(`Status: ${a.status}`);
                    console.log(`Type: ${a.auctionType}`);
                    console.log(`Route: ${a.origin || 'N/A'} → ${a.destination || 'N/A'}`);
                    console.log(`Cargo: ${a.cargoType || 'N/A'}`);
                    console.log(`Start: ${a.auctionStart}`);
                    console.log(`End: ${a.auctionEnd}\n`);
                });
            }
            
            console.log('Usage: node delete-auction.js <load-id>');
            console.log('Example: node delete-auction.js 55387648-0bdd-4b59-8687-0178d36241d4\n');
        } else {
            console.log(`\nDeleting auction for load: ${LOAD_ID}\n`);
            
            // Check if auction exists
            const existing = await d.query(`
                SELECT id, status FROM auctions WHERE "loadId" = $1 AND deleted_at IS NULL
            `, [LOAD_ID]);
            
            if (existing.length === 0) {
                console.log('❌ No auction found for this load\n');
            } else {
                // Soft delete the auction
                await d.query(`
                    UPDATE auctions 
                    SET deleted_at = NOW() 
                    WHERE "loadId" = $1 AND deleted_at IS NULL
                `, [LOAD_ID]);
                
                console.log(`✅ Auction deleted successfully!`);
                console.log(`   Auction ID: ${existing[0].id}`);
                console.log(`   Status: ${existing[0].status}\n`);
                console.log('You can now create a new auction for this load.\n');
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await d.destroy();
    }
}

deleteAuction().catch(console.error);
