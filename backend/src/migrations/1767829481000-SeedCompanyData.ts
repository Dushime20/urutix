import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedCompanyData1767829481000 implements MigrationInterface {
    name = 'SeedCompanyData1767829481000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure pgcrypto extension is enabled for password hashing
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

        const companies = [
            {
                name: 'Uruti-X Default',
                subdomain: 'default',
                type: 'ENTERPRISE',
                status: 'ACTIVE',
                description: 'Default system tenant for Uruti-X platform',
                contactEmail: 'admin@uruti-x.com',
                contactPhone: '+254-700-000-000',
                address: 'Tech Hub, Nairobi',
                city: 'Nairobi',
                state: 'Nairobi County',
                country: 'Kenya',
            },
            {
                name: 'Kenya Transport Solutions',
                subdomain: 'kts',
                type: 'ENTERPRISE',
                status: 'ACTIVE',
                description: 'Leading logistics and transport company in East Africa',
                contactEmail: 'info@kts.co.ke',
                contactPhone: '+254-720-111-222',
                address: 'Mombasa Road, Industrial Area',
                city: 'Nairobi',
                state: 'Nairobi County',
                country: 'Kenya',
            },
            {
                name: 'SafariLink Cargo',
                subdomain: 'safarilink',
                type: 'SMALL_BUSINESS',
                status: 'ACTIVE',
                description: 'Reliable cargo transport across Kenya and Tanzania',
                contactEmail: 'contact@safarilink.com',
                contactPhone: '+254-733-444-555',
                address: 'Airport North Road',
                city: 'Nairobi',
                state: 'Nairobi County',
                country: 'Kenya',
            },
        ];

        for (const company of companies) {
            // Uniqueness check by subdomain
            const existing = await queryRunner.query(
                `SELECT id FROM tenants WHERE subdomain = '${company.subdomain}'`
            );

            let tenantId: string;

            if (existing.length > 0) {
                tenantId = existing[0].id;
            } else {
                const result = await queryRunner.query(`
                    INSERT INTO tenants (
                        id, name, subdomain, type, status, description,
                        "contactEmail", "contactPhone", address, city, state, country,
                        "isActive", "createdAt", "updatedAt"
                    ) VALUES (
                        uuid_generate_v4(), '${company.name}', '${company.subdomain}', '${company.type}',
                        '${company.status}', '${company.description}', '${company.contactEmail}',
                        '${company.contactPhone}', '${company.address}', '${company.city}',
                        '${company.state}', '${company.country}', true, NOW(), NOW()
                    ) RETURNING id
                `);
                tenantId = result[0].id;
            }

            // Users logic (simplified for demonstration, adding 1 admin per company)
            const users = [
                {
                    email: company.contactEmail,
                    phone: company.contactPhone.replace(/-/g, ''),
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'TENANT_ADMIN'
                }
            ];

            for (const user of users) {
                const existingUser = await queryRunner.query(
                    `SELECT id FROM users WHERE email = '${user.email}'`
                );

                if (existingUser.length === 0) {
                    const userResult = await queryRunner.query(`
                        INSERT INTO users (
                            id, email, phone, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt"
                        ) VALUES (
                            uuid_generate_v4(), '${user.email}', '${user.phone}', 
                            crypt('test123', gen_salt('bf')), '${user.role}', 'ACTIVE', 
                            '${tenantId}', NOW(), NOW()
                        ) RETURNING id
                    `);
                    const userId = userResult[0].id;

                    await queryRunner.query(`
                        INSERT INTO user_profiles (
                            id, "userId", "tenantId", "firstName", "lastName", "companyName", "createdAt", "updatedAt"
                        ) VALUES (
                            uuid_generate_v4(), '${userId}', '${tenantId}', '${user.firstName}', '${user.lastName}', '${company.name}', NOW(), NOW()
                        )
                    `);
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // We don't delete seed data in down migrations typically to avoid data loss
    }
}
