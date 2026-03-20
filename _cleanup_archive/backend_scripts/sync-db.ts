import { DataSource } from 'typeorm';
import { databaseConfig } from './src/config/database.config';
import * as dotenv from 'dotenv';
dotenv.config();

const myConfig = { ...databaseConfig, synchronize: true };
const dataSource = new DataSource(myConfig as any);

async function synchronizeDb() {
    try {
        await dataSource.initialize();
        console.log('Database schema synchronized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error synchronizing database:', error);
        process.exit(1);
    }
}

synchronizeDb();
