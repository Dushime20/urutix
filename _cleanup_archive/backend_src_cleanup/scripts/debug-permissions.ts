
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

// Simple .env parser
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !process.env[key.trim()]) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}


const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'urutix_database',
    entities: [User], // We only need User for this check
    synchronize: false,
});

async function debugUsers() {
    try {
        console.log('Connecting to database...');
        await AppDataSource.initialize();
        console.log('Connected.');

        const userRepo = AppDataSource.getRepository(User);

        console.log('Querying for admin users...');
        const users = await userRepo.createQueryBuilder('user')
            .where('user.email = :email OR user.email = :email2', {
                email: 'urutixv@gmail.com',
                email2: 'admin@urutix.com'
            })
            .getMany();

        console.log('Found users:');
        users.forEach(user => {
            console.log(`- Email: ${user.email}`);
            console.log(`  Role: ${user.role} (Type: ${typeof user.role})`);
            console.log(`  TenantId: ${user.tenantId}`);
            console.log(`  Status: ${user.status}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

debugUsers();
