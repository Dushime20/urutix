import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';

async function cleanupExpiredTokens() {
  console.log('🧹 Cleaning up expired and revoked refresh tokens...');

  const dataSource = new DataSource({
    ...databaseConfig,
    synchronize: false,
    logging: false,
  } as any);

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Count tokens before cleanup
    const countBeforeQuery = `
      SELECT COUNT(*) as total_tokens,
             COUNT(CASE WHEN "expiresAt" < NOW() THEN 1 END) as expired_tokens,
             COUNT(CASE WHEN revoked = true THEN 1 END) as revoked_tokens
      FROM refresh_tokens
    `;

    const countBefore = await dataSource.query(countBeforeQuery);
    console.log('📊 Tokens before cleanup:', countBefore[0]);

    // Delete expired and revoked tokens
    const deleteQuery = `
      DELETE FROM refresh_tokens 
      WHERE "expiresAt" < NOW() 
         OR revoked = true
    `;

    const result = await dataSource.query(deleteQuery);
    console.log('🗑️ Deleted tokens:', result);

    // Count tokens after cleanup
    const countAfterQuery = `
      SELECT COUNT(*) as remaining_tokens
      FROM refresh_tokens
    `;

    const countAfter = await dataSource.query(countAfterQuery);
    console.log('📊 Tokens after cleanup:', countAfter[0]);

    console.log('✅ Token cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error cleaning up tokens:', error);
  } finally {
    await dataSource.destroy();
  }
}

cleanupExpiredTokens().catch(console.error);
