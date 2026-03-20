import { DataSource } from 'typeorm';
import { Load } from '../entities/load.entity';

async function showLoadLocations() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123',
        database: process.env.DB_NAME || 'uruti',
        entities: ['src/entities/**/*.entity.ts'],
        synchronize: false,
    });

    await dataSource.initialize();

    const loadRepo = dataSource.getRepository(Load);

    // Get the most recently updated load
    const load = await loadRepo.findOne({
        where: {},
        order: { updatedAt: 'DESC' },
    });

    if (load) {
        console.log('=== LOAD LOCATION DATA ===');
        console.log(`Load ID: ${load.id}`);
        console.log(`Title: ${load.title}`);

        console.log('\n--- Origin (JSONB Column) ---');
        console.log(JSON.stringify(load.origin, null, 2));

        console.log('\n--- Destination (JSONB Column) ---');
        console.log(JSON.stringify(load.destination, null, 2));

        console.log('\n--- Locations Array (JSONB Column) ---');
        console.log(JSON.stringify(load.locations, null, 2));
    } else {
        console.log('No loads found.');
    }

    await dataSource.destroy();
}

showLoadLocations();
