import { Client } from 'pg';

async function seed() {
    const client = new Client({
        connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix',
    });

    await client.connect();

    try {
        const adminEmail = 'isdeborah47@gmail.com';
        const userRes = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);

        if (userRes.rows.length === 0) {
            console.error(`User ${adminEmail} not found`);
            return;
        }

        const admin = userRes.rows[0];
        const tenantId = admin.tenant_id || admin.tenantId;

        console.log(`Injecting credits for Tenant: ${tenantId}`);

        const accRes = await client.query('SELECT * FROM credit_accounts WHERE "tenant_id" = $1 AND "user_id" IS NULL', [tenantId]);

        if (accRes.rows.length === 0) {
            await client.query(
                'INSERT INTO credit_accounts ("id", "tenant_id", "current_balance", "subscription_credits", "purchased_credits", "bonus_credits", "lifetime_earned", "lifetime_spent", "created_at", "updated_at") VALUES (gen_random_uuid(), $1, 5000, 0, 5000, 0, 5000, 0, NOW(), NOW())',
                [tenantId]
            );
            console.log('Created new account with 5000 credits');
        } else {
            await client.query(
                'UPDATE credit_accounts SET "current_balance" = "current_balance" + 5000, "purchased_credits" = "purchased_credits" + 5000, "updated_at" = NOW() WHERE id = $1',
                [accRes.rows[0].id]
            );
            console.log('Updated existing account with +5000 credits');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

seed();
