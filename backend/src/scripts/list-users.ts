import { Client } from 'pg';

async function run(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, email, "role", "status", "tenantId", "createdAt" FROM users WHERE deleted_at IS NULL ORDER BY "createdAt" DESC LIMIT 100',
    );
    // Print concise table
    console.table(result.rows);
  } catch (err: any) {
    console.error('❌ Error listing users:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}

run().catch(console.error);
