// Test the controller logic directly
const { DataSource } = require('typeorm');
const { NotificationPreference } = require('./dist/entities/notification-preference.entity');

async function testControllerLogic() {
  try {
    console.log('🔧 Setting up database connection...');
    
    const dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'postgres',
      password: '123',
      database: 'urutix',
      entities: ['dist/entities/*.entity.js'],
      synchronize: false,
    });

    await dataSource.initialize();
    console.log('✅ Database connected');

    const preferenceRepository = dataSource.getRepository('NotificationPreference');
    
    const tenantId = 'b7d244e3-9a1a-4686-a22f-3fe18468500e';
    const userId = undefined; // TENANT_ADMIN, so no user ID
    
    console.log('\n🔍 Testing repository query...');
    
    // This is the exact query from the controller
    const preferences = await preferenceRepository.find({
      where: {
        tenantId,
        userId,
      },
      order: { notificationType: 'ASC' },
    });

    console.log('✅ Query successful!');
    console.log('Preferences found:', preferences.length);
    
    preferences.forEach(pref => {
      console.log(`  ${pref.notificationType}: ${pref.enabledChannels}`);
    });
    
    await dataSource.destroy();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testControllerLogic();