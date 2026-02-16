import { DataSource, Brackets } from 'typeorm';
import { Trip } from '../entities/trip.entity';

async function debugQuery() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: '127.0.0.1',
        port: 5432,
        username: 'postgres',
        password: '123',
        database: 'uruti',
        entities: ['src/entities/**/*.entity.ts'],
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Database connected');

        const tripRepo = dataSource.getRepository(Trip);

        const tenantId = 'b7d244e3-9a1a-4686-a22f-3fe18468500e';
        const userId = '9a947709-71b8-476e-b94f-92bf4a0f29e5';

        console.log(`🔍 Testing Query with:\nTenantId: ${tenantId}\nUserId: ${userId}`);

        const queryBuilder = tripRepo.createQueryBuilder('trip')
            .leftJoinAndSelect('trip.truck', 'truck')
            .leftJoinAndSelect('trip.driver', 'driver')
            .leftJoinAndSelect('trip.load', 'load')
            .leftJoinAndSelect('trip.pickupLocation', 'pickupLocation')
            .leftJoinAndSelect('trip.deliveryLocation', 'deliveryLocation')
            .withDeleted()
            .where(
                new Brackets((qb) => {
                    qb.where('trip.tenantId = :tenantId', { tenantId });

                    if (userId) {
                        qb.orWhere('truck.ownerId = :userId', { userId });
                        qb.orWhere('driver.userId = :userId', { userId });
                    }
                }),
            );

        const sql = queryBuilder.getSql();
        const params = queryBuilder.getParameters();
        console.log('👉 Generated SQL:', sql);
        console.log('👉 Params:', params);

        const trips = await queryBuilder.getMany();
        console.log(`📋 Found ${trips.length} Trips`);

        trips.forEach(t => {
            console.log(`   - Trip ${t.tripNumber}: Tenant=${t.tenantId}, TruckOwner=${t.truck?.ownerId}, DriverUser=${t.driver?.userId}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await dataSource.destroy();
    }
}

debugQuery();
